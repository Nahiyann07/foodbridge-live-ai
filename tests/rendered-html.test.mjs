import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the FoodBridge application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>FoodBridge Live AI \| Team 1m1beeys<\/title>/i);
  assert.match(html, /FoodBridge/);
  assert.match(html, /Live AI/);
  assert.match(html, /Synthetic demonstration/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("keeps team identity and privacy requirements in source", async () => {
  const [app, page] = await Promise.all([
    readFile(new URL("../app/FoodBridgeApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(app, /Team 1m1beeys/);
  assert.match(app, /Nahiyan S/);
  assert.match(app, /Priyam Jay Debnath/);
  assert.match(app, /Varun Raj S/);
  assert.match(page, /FoodBridge Live AI/);
  assert.doesNotMatch(app, /@gmail\.com/i);
});
