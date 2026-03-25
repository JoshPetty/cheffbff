"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push(redirectTo); router.refresh(); }
  }

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <Link href="/" style={styles.logoRow}>
          <div style={styles.logoBox}>🍳</div>
          <span style={styles.brand}>ChefBFF</span>
        </Link>

        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.sub}>
          No account?{" "}
          <Link href="/auth/signup" style={styles.link}>Sign up free</Link>
        </p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <input style={styles.input} type="email" required autoComplete="email"
              placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input style={styles.input} type="password" required autoComplete="current-password"
              placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} />
          </Field>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={styles.label}>{label}</div>
      {children}
    </div>
  );
}

const styles = {
  bg: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f9e8 0%, #e8f7f0 50%, #e8f4fd 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "32px 16px", fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    background: "#fff", borderRadius: 20, padding: "40px 36px",
    width: "100%", maxWidth: 420,
    boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
  },
  logoRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, marginBottom: 28, textDecoration: "none",
  } as React.CSSProperties,
  logoBox: {
    width: 40, height: 40, borderRadius: 10, fontSize: 18,
    background: "linear-gradient(135deg, #86C540, #5DC2D1)",
    display: "flex", alignItems: "center", justifyContent: "center",
  } as React.CSSProperties,
  brand: {
    fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif",
    background: "linear-gradient(135deg, #86C540, #5DC2D1)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  } as React.CSSProperties,
  heading: { fontSize: 22, fontWeight: 600, color: "#111827", textAlign: "center" as const, marginBottom: 4 },
  sub: { fontSize: 13, color: "#9ca3af", textAlign: "center" as const, marginBottom: 28 },
  link: { color: "#86C540", fontWeight: 500, textDecoration: "none" },
  label: { fontSize: 12, fontWeight: 600, color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 6 },
  input: {
    width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10,
    padding: "12px 14px", fontSize: 14, color: "#111827",
    outline: "none", background: "#fafafa", fontFamily: "inherit",
    boxSizing: "border-box" as const,
  },
  btn: {
    width: "100%", padding: 13, border: "none", borderRadius: 10,
    background: "linear-gradient(135deg, #86C540, #5DC2D1)",
    color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
    marginTop: 8, fontFamily: "inherit",
  },
  error: {
    padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca",
    borderLeft: "4px solid #ef4444", borderRadius: 8,
    fontSize: 13, color: "#dc2626", marginBottom: 16,
  },
} as const;