"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { authStyles as styles } from "../styles";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords don't match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div style={styles.bg}>
        <div style={{ ...styles.card, textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #86C540, #5DC2D1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 24,
          }}>
            ✉️
          </div>
          <h1 style={{ ...styles.heading, marginBottom: 8 }}>Check your inbox</h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 24 }}>
            We sent a confirmation link to<br />
            <strong style={{ color: "#111827" }}>{email}</strong>
          </p>
          <Link href="/auth/login" style={styles.link}>
            ← Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <Link href="/" style={styles.logoRow}>
          <div style={styles.logoBox}>🍳</div>
          <span style={styles.brand}>ChefBFF</span>
        </Link>

        <h1 style={styles.heading}>Create your account</h1>
        <p style={styles.sub}>
          Already cooking?{" "}
          <Link href="/auth/login" style={styles.link}>Sign in</Link>
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <div style={styles.label}>Email</div>
            <input
              style={styles.input}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={styles.label}>Password</div>
            <input
              style={styles.input}
              type="password"
              required
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={styles.label}>Confirm password</div>
            <input
              style={styles.input}
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>
      </div>
    </div>
  );
}