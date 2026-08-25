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

      <style jsx>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #f7f9f8;
          padding: 1rem;
        }
        .auth-card {
          background: white;
          padding: 2.5rem 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          width: 100%;
          max-width: 420px;
        }
        h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        .auth-subtitle {
          color: #6e7a73;
          text-align: center;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #3b4540;
        }
        .form-input {
          padding: 0.75rem 1rem;
          border: 1px solid #dfe7df;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: #23a677;
        }
        .alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        }
        .alert.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .alert.success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .auth-switch {
          margin-top: 1.5rem;
          text-align: center;
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
