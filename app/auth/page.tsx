"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Leaf, AlertTriangle, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // The session state change will be picked up by AppShell/Layout
        window.location.href = "/";
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email for the confirmation link.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand" style={{ marginBottom: "2rem", justifyContent: "center" }}>
          <div className="brand-mark">
            <Leaf size={24} strokeWidth={2.6} />
          </div>
          <span style={{ fontSize: "1.5rem" }}><b>FoodBridge</b><em>Live AI</em></span>
        </div>
        
        <h2>{isLogin ? "Sign In" : "Create Account"}</h2>
        <p className="auth-subtitle">
          {isLogin ? "Welcome back to the food recovery network." : "Join the network to track and recover surplus food."}
        </p>

        {error && (
          <div className="alert error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        {message && (
          <div className="alert success">
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          
          <button type="submit" className="button button-primary full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="auth-switch">
          <button onClick={() => setIsLogin(!isLogin)} className="text-button">
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>

      
    </div>
  );
}
