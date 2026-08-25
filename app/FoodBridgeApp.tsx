"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  Database,
  FileCheck2,
  HeartHandshake,
  History,
  Home,
  Leaf,
  LockKeyhole,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  PackageCheck,
  Play,
  QrCode,
  RefreshCw,
  Route,
  ScanLine,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRoundCheck,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RoleKey = "provider" | "ngo" | "volunteer" | "recipient" | "admin";
type ViewKey = "live" | "matching" | "pickup" | "impact" | "governance" | "tools";

type Scenario = {
  step: number;
  served: number;
  prediction: number;
  lower: number;
  upper: number;
  donation: number;
  reserved: number;
  collected: number;
  pickup: "unassigned" | "assigned" | "travelling" | "collected";
  status: string;
};

const initialScenario: Scenario = {
  step: 0,
  served: 360,
  prediction: 58,
  lower: 49,
  upper: 68,
  donation: 0,
  reserved: 0,
  collected: 0,
  pickup: "unassigned",
  status: "Service active",
};

const roleOptions: Array<{
  key: RoleKey;
  label: string;
  name: string;
  icon: typeof Building2;
}> = [
  { key: "provider", label: "Provider", name: "Aarav", icon: Building2 },
  { key: "ngo", label: "NGO", name: "Meera", icon: HeartHandshake },
  { key: "volunteer", label: "Volunteer", name: "Kabir", icon: Truck },
  { key: "recipient", label: "Recipient", name: "RCP-8F21", icon: UserRoundCheck },
  { key: "admin", label: "Admin", name: "Ira", icon: ShieldCheck },
];

const workflowTools = [
  ["Public impact snapshot", "impact"],
  ["Fictional demo sign-in", "governance"],
  ["Provider dashboard", "live"],
  ["Create / edit food batch", "live"],
  ["Live service tracker", "live"],
  ["AI prediction detail", "live"],
  ["Open recovery opportunity", "live"],
  ["NGO opportunity feed", "matching"],
  ["Recipient matching", "matching"],
  ["Reservation / partial claim", "matching"],
  ["Reservation waitlist", "matching"],
  ["Volunteer pickup board", "pickup"],
  ["Offline route optimiser", "pickup"],
  ["Live pickup timeline", "pickup"],
  ["QR / OTP verification", "pickup"],
  ["Discrepancy report", "governance"],
  ["Notifications centre", "live"],
  ["Impact analytics", "impact"],
  ["Reports / export", "impact"],
  ["Admin governance", "governance"],
  ["Append-only audit ledger", "governance"],
  ["Failure-state simulator", "tools"],
] as const;

const timelineData = [
  { minute: "12:05", actual: 72, baseline: 68 },
  { minute: "12:20", actual: 142, baseline: 136 },
  { minute: "12:35", actual: 231, baseline: 216 },
  { minute: "12:50", actual: 310, baseline: 298 },
  { minute: "13:05", actual: 360, baseline: 365 },
  { minute: "13:20", actual: 412, baseline: 402 },
];

const impactData = [
  { week: "W1", portions: 92 },
  { week: "W2", portions: 148 },
  { week: "W3", portions: 214 },
  { week: "W4", portions: 286 },
  { week: "W5", portions: 358 },
  { week: "W6", portions: 438 },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 20_000 },
  },
});

function useConnectivity() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(window.navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

function BackendState({ online }: { online: boolean }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const query = useQuery({
    queryKey: ["backend-health", apiBase],
    queryFn: async () => {
      if (!apiBase) return { mode: "embedded", status: "ready" };
      const response = await fetch(`${apiBase}/health`);
      if (!response.ok) throw new Error("Backend unavailable");
      return { mode: "live-api", ...(await response.json()) };
    },
  });
  const isLive = online && !query.isError;
  return (
    <div
      className={`connectivity ${isLive ? "is-online" : "is-offline"}`}
      role="status"
      aria-live="polite"
    >
      {isLive ? <Wifi size={15} /> : <WifiOff size={15} />}
      <span>
        {!online
          ? "Offline fallback"
          : query.data?.mode === "live-api"
            ? "API connected"
            : "Embedded demo"}
      </span>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <Leaf size={19} strokeWidth={2.6} />
    </div>
  );
}

function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "blue" | "neutral" }) {
  return <span className={`status-pill status-${tone}`}>{children}</span>;
}

function LiveMap() {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    async function renderMap() {
      if (!mapNode.current || mapInstance.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapNode.current) return;
      const map = L.map(mapNode.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      }).setView([22.5726, 88.3639], 13);
      mapInstance.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      const points: Array<[[number, number], string, string]> = [
        [[22.5726, 88.3639], "Greenfield College Canteen", "#f7b748"],
        [[22.5862, 88.3714], "Udaan Community Kitchen", "#65d4a6"],
        [[22.5582, 88.351], "Sahara Meal Collective", "#8ad0f2"],
      ];
      points.forEach(([position, label, color]) => {
        L.circleMarker(position, {
          radius: 9,
          color: "#f7f4ea",
          weight: 3,
          fillColor: color,
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip(label, { direction: "top" });
      });
      L.polyline(points.map(([position]) => position), {
        color: "#65d4a6",
        dashArray: "7 8",
        weight: 3,
      }).addTo(map);
      setTimeout(() => map.invalidateSize(), 100);
    }
    renderMap();
    return () => {
      cancelled = true;
      const map = mapInstance.current as { remove?: () => void } | null;
      map?.remove?.();
      mapInstance.current = null;
    };
  }, []);

  return (
    <div className="map-shell">
      <div className="map-grid" aria-hidden="true" />
      <div ref={mapNode} className="leaflet-map" aria-label="Offline-capable route map with fictional approximate locations" />
      <div className="map-legend">
        <MapPin size={14} />
        Approximate fictional zones only
      </div>
    </div>
  );
}

function ScenarioControl({
  scenario,
  onStep,
  onReset,
}: {
  scenario: Scenario;
  onStep: () => void;
  onReset: () => void;
}) {
  const actions = [
    "Record 22 served",
    "Refresh AI prediction",
    "Open 58-portion recovery",
    "Reserve 40 portions",
    "Reserve remaining 18",
    "Assign volunteer",
    "Start collection",
    "Verify 40 with OTP",
    "Review impact",
  ];
  return (
    <section className="simulator-card" aria-labelledby="simulator-heading">
      <div>
        <div className="eyebrow light">Evaluator walkthrough</div>
        <h2 id="simulator-heading">Run the live rescue story</h2>
        <p>One click advances a reproducible fictional college-to-community recovery flow.</p>
      </div>
      <div className="simulator-progress" aria-label={`Scenario step ${scenario.step} of 9`}>
        {actions.map((_, index) => (
          <span key={index} className={index < scenario.step ? "done" : index === scenario.step ? "active" : ""} />
        ))}
      </div>
      <div className="simulator-actions">
        <button className="button button-lime" onClick={onStep} data-testid="advance-simulator">
          {scenario.step >= actions.length ? "Replay scenario" : actions[scenario.step]}
          {scenario.step >= actions.length ? <RefreshCw size={17} /> : <Play size={17} fill="currentColor" />}
        </button>
        {scenario.step > 0 && (
          <button className="button button-ghost-light" onClick={onReset} aria-label="Reset simulator">
            <RefreshCw size={17} />
          </button>
        )}
      </div>
      <div className="simulator-note">
        <Database size={14} />
        Synthetic demonstration transaction • no real food or people
      </div>
    </section>
  );
}

function LiveView({
  scenario,
  onAdvance,
}: {
  scenario: Scenario;
  onAdvance: () => void;
}) {
  const physical = 500 - scenario.served - scenario.collected;
  const available = Math.max(0, scenario.donation - scenario.reserved - scenario.collected);
  const reservedNow = scenario.reserved;
  const progress = Math.min(100, Math.round((scenario.served / 500) * 100));
  return (
    <>
      <section className="hero-grid">
        <article className="batch-card" data-testid="live-batch-card">
          <div className="batch-card-top">
            <div>
              <div className="eyebrow">Live meal service</div>
              <h1>Vegetable pulao <span>with dal</span></h1>
              <div className="meta-line">
                <span><Building2 size={14} /> Greenfield College Canteen</span>
                <span><Clock3 size={14} /> Collection by 14:40</span>
              </div>
            </div>
            <StatusPill tone={scenario.donation ? "amber" : "green"}>
              <Activity size={13} />
              {scenario.status}
            </StatusPill>
          </div>

          <div className="inventory-equation" aria-label="Live inventory equation">
            <div>
              <small>Prepared</small>
              <strong>500</strong>
            </div>
            <span>−</span>
            <div>
              <small>Served</small>
              <strong data-testid="served-count">{scenario.served}</strong>
            </div>
            <span>−</span>
            <div>
              <small>Collected</small>
              <strong>{scenario.collected}</strong>
            </div>
            <span>=</span>
            <div className="result">
              <small>Physical remaining</small>
              <strong>{physical}</strong>
            </div>
          </div>

          <div className="service-progress">
            <div className="progress-label">
              <span>{progress}% of prepared portions served</span>
              <span>Updated now</span>
            </div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          </div>

          <div className="batch-footer">
            <div className="mini-metric">
              <span className="metric-dot amber" />
              <div><small>Donation allocation</small><strong>{scenario.donation || "Not open"}</strong></div>
            </div>
            <div className="mini-metric">
              <span className="metric-dot blue" />
              <div><small>Reserved now</small><strong>{reservedNow}</strong></div>
            </div>
            <div className="mini-metric">
              <span className="metric-dot green" />
              <div><small>Available to claim</small><strong>{available}</strong></div>
            </div>
          </div>
        </article>

        <article className="prediction-card" data-testid="prediction-card">
          <div className="card-heading">
            <span className="icon-tile"><Bot size={19} /></span>
            <div>
              <div className="eyebrow">AI decision support</div>
              <h2>Surplus likely</h2>
            </div>
            <StatusPill tone="blue">v1.0</StatusPill>
          </div>
          <div className="prediction-number">
            <strong>{scenario.prediction}</strong>
            <span>portions<br />central estimate</span>
          </div>
          <div className="confidence-range">
            <div className="range-label"><span>{scenario.lower}</span><span>Likely range</span><span>{scenario.upper}</span></div>
            <div className="range-track"><span /></div>
          </div>
          <ul className="factor-list">
            <li><Zap size={14} /> Live serving rate <b>highest influence</b></li>
            <li><Users size={14} /> Actual attendance below plan</li>
            <li><History size={14} /> Historical lunch demand</li>
          </ul>
          <div className="model-proof">
            <CheckCircle2 size={15} />
            <span>Held-out synthetic evaluation: MAE 5.987 portions, R² 0.8711</span>
          </div>
          <p className="fine-print">Guidance only. The provider remains responsible for food-safety checks and donation approval.</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="chart-card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Live service velocity</div>
              <h2>Prediction tightens as service progresses</h2>
            </div>
            <button className="text-button">Prediction detail <ChevronRight size={15} /></button>
          </div>
          <div className="chart-wrap" aria-label="Actual and baseline portions served chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 12, right: 5, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#23a677" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#23a677" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 5" stroke="#dfe7df" vertical={false} />
                <XAxis dataKey="minute" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6e7a73" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6e7a73" }} />
                <Tooltip />
                <Area type="monotone" dataKey="baseline" stroke="#aab6af" fill="none" strokeDasharray="5 5" strokeWidth={2} />
                <Area type="monotone" dataKey="actual" stroke="#14825f" fill="url(#actualFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend"><span><i className="solid" /> Actual served</span><span><i className="dashed" /> Expected pace</span></div>
        </article>

        <article className="action-card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">Recovery action</div>
              <h2>{scenario.donation ? "Opportunity is live" : "Act before surplus becomes waste"}</h2>
            </div>
            <Clock3 size={20} />
          </div>
          <div className="window-countdown">
            <span>Safe collection window</span>
            <strong>01:17:42</strong>
          </div>
          <div className="safety-checks">
            <span><Check size={14} /> Handling declaration</span>
            <span><Check size={14} /> Storage method logged</span>
            <span><Check size={14} /> Allergen notice added</span>
          </div>
          <button className="button button-primary full" onClick={onAdvance}>
            {scenario.donation ? "Continue rescue workflow" : "Open recovery opportunity"}
            <ArrowRight size={17} />
          </button>
        </article>
      </section>
    </>
  );
}

function MatchingView({ scenario, onAdvance }: { scenario: Scenario; onAdvance: () => void }) {
  const options = [
    { name: "Udaan Community Kitchen", score: 92, km: 1.7, capacity: 80, color: "#65d4a6", transport: true },
    { name: "Sahara Meal Collective", score: 84, km: 2.1, capacity: 45, color: "#8ad0f2", transport: true },
    { name: "Neighbourhood Support Point", score: 73, km: 2.0, capacity: 25, color: "#f7b748", transport: false },
  ];
  return (
    <section className="split-view">
      <div className="stack">
        <div className="page-heading">
          <div><div className="eyebrow">Transparent matching</div><h1>Best recovery partners</h1></div>
          <StatusPill tone="neutral">Weighted rules • not automated approval</StatusPill>
        </div>
        {options.map((option, index) => (
          <article className={`match-card ${index === 0 ? "recommended" : ""}`} key={option.name}>
            <div className="match-rank" style={{ background: option.color }}>{index + 1}</div>
            <div className="match-copy">
              <div className="match-title">
                <h2>{option.name}</h2>
                {index === 0 && <StatusPill>Recommended</StatusPill>}
              </div>
              <p>{option.km} km away • accepts up to {option.capacity} portions • {option.transport ? "transport ready" : "pickup support needed"}</p>
              <div className="score-factors">
                <span>Distance <b>{Math.round(96 - option.km * 5)}</b></span>
                <span>Capacity <b>{Math.min(100, option.capacity + 20)}</b></span>
                <span>Time fit <b>100</b></span>
                <span>Readiness <b>{option.transport ? 100 : 55}</b></span>
              </div>
            </div>
            <div className="score-ring" style={{ "--score": `${option.score * 3.6}deg` } as React.CSSProperties}>
              <strong>{option.score}</strong><small>/ 100</small>
            </div>
          </article>
        ))}
        <article className="explain-card">
          <Sparkles size={20} />
          <div><b>Why Udaan ranks first</b><p>30% distance + 20% capacity + 20% time fit + 15% dietary fit + 15% pickup readiness. Coordinators can review every factor.</p></div>
        </article>
      </div>
      <div className="stack">
        <LiveMap />
        <article className="reservation-card">
          <div className="section-heading">
            <div><div className="eyebrow">Partial reservation</div><h2>Claim 40 of 58 portions</h2></div>
            <PackageCheck size={22} />
          </div>
          <div className="quantity-row"><span>Portions requested</span><strong>40</strong></div>
          <div className="reservation-breakdown">
            <span><i className="reserve" /> 40 Udaan</span>
            <span><i className="remain" /> 18 still available</span>
          </div>
          <button className="button button-primary full" onClick={onAdvance}>
            {scenario.reserved >= 40 ? "Reservation confirmed" : "Confirm reservation"}
            {scenario.reserved >= 40 ? <CheckCircle2 size={17} /> : <ArrowRight size={17} />}
          </button>
          <p className="fine-print">Atomic update with idempotency key. Simultaneous test claims never exceeded the 58-portion allocation.</p>
        </article>
      </div>
    </section>
  );
}

function PickupView({ scenario, onAdvance }: { scenario: Scenario; onAdvance: () => void }) {
  const timeline = [
    ["Reservation confirmed", "13:23", true],
    ["Volunteer assigned", "13:27", scenario.pickup !== "unassigned"],
    ["Travelling to provider", "13:31", ["travelling", "collected"].includes(scenario.pickup)],
    ["OTP verified and collected", "Pending", scenario.pickup === "collected"],
  ] as const;
  return (
    <section className="split-view pickup-view">
      <div className="stack">
        <div className="page-heading"><div><div className="eyebrow">Collection coordination</div><h1>Pickup FB-PU-1042</h1></div><StatusPill tone="amber"><Truck size={13} /> {scenario.pickup}</StatusPill></div>
        <LiveMap />
        <article className="route-card">
          <div className="route-point provider-point"><Building2 size={17} /><div><small>Collect from</small><b>Greenfield College Canteen</b><span>Fictional Central Campus Zone</span></div></div>
          <div className="route-line"><span>1.7 km • ≈ 9 min</span></div>
          <div className="route-point ngo-point"><HeartHandshake size={17} /><div><small>Deliver to</small><b>Udaan Community Kitchen</b><span>North Community Zone</span></div></div>
          <div className="offline-route"><Route size={15} /> Local Haversine route fallback ready</div>
        </article>
      </div>
      <div className="stack">
        <article className="timeline-card">
          <div className="section-heading"><div><div className="eyebrow">Privacy-safe timeline</div><h2>Live status</h2></div><Activity size={21} /></div>
          <ol className="pickup-timeline">
            {timeline.map(([label, time, done], index) => (
              <li className={done ? "done" : index === scenario.step - 5 ? "active" : ""} key={label}>
                <span className="timeline-dot">{done ? <Check size={13} /> : index + 1}</span>
                <div><b>{label}</b><small>{done && time === "Pending" ? "13:39" : time}</small></div>
              </li>
            ))}
          </ol>
        </article>
        <article className="verify-card">
          <div className="verify-icon"><ScanLine size={28} /></div>
          <div><div className="eyebrow">One-time verification</div><h2>Confirm handover</h2><p>Demo OTP <b>482916</b> is fictional and expires with the collection window.</p></div>
          <div className="otp-row" aria-label="Demo OTP 482916">
            {"482916".split("").map((digit, index) => <span key={index}>{digit}</span>)}
          </div>
          <button className="button button-primary full" onClick={onAdvance}>
            {scenario.pickup === "collected" ? "40 portions verified" : "Verify and collect 40"}
            {scenario.pickup === "collected" ? <CheckCircle2 size={17} /> : <QrCode size={17} />}
          </button>
          <p className="fine-print"><LockKeyhole size={13} /> Token hashing, expiry, attempt logging, and single-use enforcement run server-side.</p>
        </article>
      </div>
    </section>
  );
}

function ImpactView({ scenario }: { scenario: Scenario }) {
  const currentPortions = 438 + scenario.collected;
  const kg = (currentPortions * 0.35).toFixed(1);
  const co2 = (Number(kg) * 0.55).toFixed(1);
  return (
    <section className="impact-view">
      <div className="page-heading">
        <div><div className="eyebrow">Measured records + labelled estimates</div><h1>Recovery impact</h1></div>
        <button className="button button-outline"><FileCheck2 size={16} /> Export report</button>
      </div>
      <div className="impact-metrics">
        <article><span className="icon-tile green"><PackageCheck size={20} /></span><small>Recorded portions</small><strong>{currentPortions}</strong><em>+{scenario.collected || 0} in this walkthrough</em></article>
        <article><span className="icon-tile amber"><Leaf size={20} /></span><small>Food recovered</small><strong>{kg} kg</strong><em>Portions × 0.35 kg</em></article>
        <article><span className="icon-tile blue"><Sparkles size={20} /></span><small>Estimated avoided CO₂e</small><strong>{co2} kg</strong><em>Illustrative proxy</em></article>
        <article><span className="icon-tile purple"><CheckCircle2 size={20} /></span><small>Completed pickups</small><strong>{12 + (scenario.collected ? 1 : 0)}</strong><em>89% collection success</em></article>
      </div>
      <div className="impact-grid">
        <article className="chart-card large">
          <div className="section-heading"><div><div className="eyebrow">Six-week synthetic pilot</div><h2>Recorded portions recovered</h2></div><StatusPill>+376%</StatusPill></div>
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={impactData} margin={{ top: 18, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 5" stroke="#dfe7df" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="portions" radius={[8, 8, 2, 2]}>
                  {impactData.map((_, index) => <Cell key={index} fill={index === impactData.length - 1 ? "#23a677" : "#b9ded0"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="method-card">
          <div className="section-heading"><div><div className="eyebrow">Impact integrity</div><h2>How each number is built</h2></div><ClipboardCheck size={21} /></div>
          <div className="method-row"><span>1</span><div><b>Recorded</b><p>Collected quantity comes from an OTP-verified platform event.</p></div></div>
          <div className="method-row"><span>2</span><div><b>Calculated</b><p>Weight uses the provider-entered batch portion weight.</p></div></div>
          <div className="method-row"><span>3</span><div><b>Estimated</b><p>CO₂e uses a 0.55 kg/kg landfill proxy and is not India-specific.</p></div></div>
          <div className="limitation-box"><AlertTriangle size={17} /><span>Synthetic pilot records do not establish real-world impact. A field pilot must validate both operations and proxy choices.</span></div>
        </article>
      </div>
    </section>
  );
}

function GovernanceView() {
  const auditRows = [
    ["13:39:21", "Kabir", "PICKUP_CONFIRMED", "pickup / 1"],
    ["13:31:05", "Kabir", "PICKUP_STATUS_CHANGED", "pickup / 1"],
    ["13:27:44", "Kabir", "PICKUP_ASSIGNED", "reservation / 1"],
    ["13:23:18", "Meera", "RESERVATION_CREATED", "batch / 1"],
    ["13:18:02", "Aarav", "DONATION_OPENED", "batch / 1"],
  ];
  return (
    <section className="governance-view">
      <div className="page-heading"><div><div className="eyebrow">Responsible operations</div><h1>Governance & audit</h1></div><StatusPill><ShieldCheck size={13} /> Controls active</StatusPill></div>
      <div className="governance-grid">
        <article className="control-card">
          <h2>Access controls</h2>
          <div className="role-matrix">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              return <div key={role.key}><span><Icon size={16} /></span><b>{role.label}</b><small>{role.key === "provider" ? "Batches + approvals" : role.key === "ngo" ? "Match + reserve" : role.key === "volunteer" ? "Pickup only" : role.key === "recipient" ? "Own claim only" : "Governance"}</small></div>;
            })}
          </div>
        </article>
        <article className="control-card">
          <h2>Safety guardrails</h2>
          <ul className="guardrail-list">
            <li><CheckCircle2 size={17} /> Physical remaining never becomes negative</li>
            <li><CheckCircle2 size={17} /> Reserved never exceeds donation or stock</li>
            <li><CheckCircle2 size={17} /> Served stock cannot consume a reservation</li>
            <li><CheckCircle2 size={17} /> Collection requires an active reservation</li>
            <li><CheckCircle2 size={17} /> AI never certifies food safety</li>
          </ul>
        </article>
      </div>
      <article className="audit-card">
        <div className="section-heading"><div><div className="eyebrow">Append-only event ledger</div><h2>Recent fictional audit events</h2></div><button className="button button-outline small"><History size={15} /> Full ledger</button></div>
        <div className="audit-table" role="table" aria-label="Recent fictional audit events">
          <div className="audit-header" role="row"><span>Time</span><span>Actor</span><span>Action</span><span>Entity</span></div>
          {auditRows.map((row) => <div className="audit-row" role="row" key={row.join("-")}>{row.map((cell, index) => <span key={index}>{cell}</span>)}</div>)}
        </div>
      </article>
    </section>
  );
}

function ToolsView({ onOpen }: { onOpen: (view: ViewKey) => void }) {
  return (
    <section className="tools-view">
      <div className="page-heading"><div><div className="eyebrow">Complete evaluator access</div><h1>22 prototype workflows</h1></div><StatusPill tone="blue">All directly accessible</StatusPill></div>
      <div className="tool-grid">
        {workflowTools.map(([label, view], index) => (
          <button key={label} onClick={() => onOpen(view as ViewKey)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{label}</b>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
      <article className="failure-card">
        <div><WifiOff size={22} /><div><b>Failure-state simulator</b><p>Core workflow remains demonstrable using embedded state, SQLite, saved models, and local route calculations.</p></div></div>
        <div className="failure-states"><StatusPill tone="neutral">API unavailable</StatusPill><StatusPill tone="neutral">Model fallback</StatusPill><StatusPill tone="neutral">Map offline</StatusPill></div>
      </article>
    </section>
  );
}

function AppShell() {
  const online = useConnectivity();
  const [scenario, setScenario] = useState(initialScenario);
  const [role, setRole] = useState<RoleKey>("provider");
  const [activeView, setActiveView] = useState<ViewKey>("live");
  const [roleMenu, setRoleMenu] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [session, setSession] = useState<any>(null);
  const currentRole = roleOptions.find((item) => item.key === role)!;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) window.location.href = "/auth";
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) window.location.href = "/auth";
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) return null;

  const scenarioAction = useMemo(() => {
    if (scenario.step === 0) return "Service is active";
    if (scenario.step === 1) return "22 portions served";
    if (scenario.step === 2) return "AI prediction refreshed";
    if (scenario.step === 3) return "58-portion opportunity opened";
    if (scenario.step === 4) return "40 portions reserved atomically";
    if (scenario.step === 5) return "Remaining 18 portions reserved";
    if (scenario.step === 6) return "Volunteer assigned";
    if (scenario.step === 7) return "Pickup is travelling";
    if (scenario.step === 8) return "40 portions verified and collected";
    return "Scenario complete";
  }, [scenario.step]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function advance() {
    if (scenario.step >= 9) {
      setScenario(initialScenario);
      notify("Scenario reset");
      return;
    }
    setScenario((current) => {
      const next = { ...current, step: current.step + 1 };
      if (current.step === 0) Object.assign(next, { served: 382, status: "Service active" });
      if (current.step === 1) Object.assign(next, { served: 412, prediction: 58, lower: 49, upper: 68, status: "Surplus likely" });
      if (current.step === 2) Object.assign(next, { donation: 58, status: "Donation available" });
      if (current.step === 3) Object.assign(next, { reserved: 40, status: "Partially reserved" });
      if (current.step === 4) Object.assign(next, { reserved: 58, status: "Fully reserved" });
      if (current.step === 5) Object.assign(next, { pickup: "assigned", status: "Pickup assigned" });
      if (current.step === 6) Object.assign(next, { pickup: "travelling", status: "Collection in progress" });
      if (current.step === 7) Object.assign(next, { pickup: "collected", reserved: 18, collected: 40, status: "40 collected • 18 held" });
      return next;
    });
    notify("Live scenario advanced");
  }

  function openView(view: ViewKey) {
    setActiveView(view);
    setMobileMenu(false);
  }

  async function share() {
    const data = { title: "FoodBridge Live AI", text: "Fictional 58-portion recovery opportunity", url: window.location.href };
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(window.location.href);
      notify("Demo link copied");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenu(true)}><Menu size={21} /></button>
        <button className="brand" onClick={() => openView("live")} aria-label="FoodBridge Live AI home">
          <BrandMark />
          <span><b>FoodBridge</b><em>Live AI</em></span>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {([
            ["live", "Live rescue", Activity],
            ["matching", "Matching", HeartHandshake],
            ["pickup", "Pickup", Truck],
            ["impact", "Impact", BarChart3],
            ["governance", "Governance", ShieldCheck],
          ] as const).map(([key, label, Icon]) => (
            <button className={activeView === key ? "active" : ""} onClick={() => openView(key)} key={key}><Icon size={16} /> {label}</button>
          ))}
        </nav>
        <div className="topbar-actions">
          <BackendState online={online} />
          <button className="icon-button" aria-label="Notifications"><Bell size={19} /><span className="notification-dot" /></button>
          <div className="role-switcher">
            <button onClick={() => setRoleMenu(!roleMenu)} aria-expanded={roleMenu}>
              <span className="avatar">{session?.user?.email?.slice(0, 1).toUpperCase()}</span>
              <span className="role-copy"><small>Viewing as</small><b>{session?.user?.email}</b></span>
              <ChevronRight size={16} className={roleMenu ? "rotated" : ""} />
            </button>
            {roleMenu && (
              <div className="role-menu">
                <button onClick={() => supabase.auth.signOut()}>
                  <span><b>Sign Out</b></span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {mobileMenu && (
        <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="drawer-head"><div className="brand"><BrandMark /><span><b>FoodBridge</b><em>Live AI</em></span></div><button className="icon-button" onClick={() => setMobileMenu(false)} aria-label="Close navigation"><X size={20} /></button></div>
          {(["live", "matching", "pickup", "impact", "governance", "tools"] as ViewKey[]).map((view) => <button key={view} className={activeView === view ? "active" : ""} onClick={() => openView(view)}>{view === "live" ? "Live rescue" : view.charAt(0).toUpperCase() + view.slice(1)}<ChevronRight size={16} /></button>)}
          <div className="drawer-team">Created by <b>NAHIYAN S</b></div>
        </div>
      )}

      <main>
        <div className="context-bar">
          <div><span className="pulse-dot" /> <b>{scenarioAction}</b><small>Batch FB-DEMO-2607 • synthetic demonstration</small></div>
          <div className="context-actions">
            <button onClick={share}><MessageCircle size={15} /> Share safely</button>
            <button onClick={() => openView("tools")}><Settings size={15} /> All workflows</button>
          </div>
        </div>

        <div className="content">
          {activeView === "live" && <LiveView scenario={scenario} onAdvance={advance} />}
          {activeView === "matching" && <MatchingView scenario={scenario} onAdvance={advance} />}
          {activeView === "pickup" && <PickupView scenario={scenario} onAdvance={advance} />}
          {activeView === "impact" && <ImpactView scenario={scenario} />}
          {activeView === "governance" && <GovernanceView />}
          {activeView === "tools" && <ToolsView onOpen={openView} />}
          <ScenarioControl scenario={scenario} onStep={advance} onReset={() => { setScenario(initialScenario); notify("Scenario reset"); }} />
        </div>
      </main>

      <footer>
        <div><BrandMark /><span><b>FoodBridge Live AI</b><small>Created by NAHIYAN S</small></span></div>
        <div className="footer-links"><button onClick={() => openView("governance")}>Responsible AI</button><button onClick={() => openView("tools")}>Workflows</button></div>
      </footer>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {([
          ["live", Home],
          ["matching", Map],
          ["pickup", Truck],
          ["impact", BarChart3],
          ["tools", Menu],
        ] as const).map(([view, Icon]) => <button key={view} className={activeView === view ? "active" : ""} onClick={() => openView(view)}><Icon size={19} /><span>{view === "live" ? "Live" : view}</span></button>)}
      </nav>

      {toast && <div className="toast" role="status"><CheckCircle2 size={17} /> {toast}</div>}
    </div>
  );
}

export function FoodBridgeApp() {
  return <QueryClientProvider client={queryClient}><AppShell /></QueryClientProvider>;
}
