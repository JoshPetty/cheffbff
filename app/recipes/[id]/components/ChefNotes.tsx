"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChefNotesProps {
  recipe: {
    title: string;
    description: string | null;
    ingredients: string[] | null;
    instructions: string[] | null;
  };
}

const EXAMPLES = [
  "Can I make this vegan?",
  "What can I substitute for butter?",
  "How do I store leftovers?",
];

const MAX_MESSAGES = 10;

export function ChefNotes({ recipe }: ChefNotesProps) {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null); // null = loading
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auth check
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user);
    });
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && loggedIn) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, loggedIn]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking || messages.length >= MAX_MESSAGES) return;

    setInput("");
    setError("");

    const userMsg: Message = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setThinking(true);

    try {
      const res = await fetch("/api/chef-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          recipe: {
            title: recipe.title,
            description: recipe.description,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Chef is unavailable, try again");
      } else {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Chef is unavailable, try again");
    } finally {
      setThinking(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function resetChat() {
    setMessages([]);
    setError("");
    setInput("");
  }

  const reachedLimit = messages.length >= MAX_MESSAGES;

  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #e5e7eb",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      marginTop: "2rem",
    }}>
      {/* ── Toggle header ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.875rem 1.25rem",
          background: open
            ? "linear-gradient(135deg, rgba(134,197,64,0.08), rgba(93,194,209,0.08))"
            : "#fff",
          border: "none", cursor: "pointer",
          borderBottom: open ? "1.5px solid #e5e7eb" : "none",
          transition: "background 0.2s",
        }}
        onMouseEnter={e => {
          if (!open) e.currentTarget.style.background = "rgba(134,197,64,0.04)";
        }}
        onMouseLeave={e => {
          if (!open) e.currentTarget.style.background = "#fff";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span style={{ fontSize: 20 }}>👨‍🍳</span>
          <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111827" }}>
            Ask Chef AI
          </span>
          {messages.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#4a8f15",
              background: "rgba(134,197,64,0.12)",
              padding: "1px 7px", borderRadius: 20,
            }}>
              {messages.filter(m => m.role === "user").length} questions
            </span>
          )}
        </div>
        <span style={{
          fontSize: 18, color: "#9ca3af",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
          lineHeight: 1,
        }}>
          ›
        </span>
      </button>

      {/* ── Panel body ────────────────────────────────────────────────────── */}
      {open && (
        <div>
          {/* Not logged in */}
          {loggedIn === false && (
            <div style={{
              padding: "2rem", textAlign: "center",
            }}>
              <div style={{ fontSize: 36, marginBottom: "0.75rem" }}>🔒</div>
              <p style={{ color: "#374151", fontWeight: 600, margin: "0 0 0.375rem" }}>
                Sign in to chat with Chef AI
              </p>
              <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 1.25rem" }}>
                Get personalized cooking tips for this recipe.
              </p>
              <button
                onClick={() => router.push("/auth/login")}
                style={{
                  padding: "0.5rem 1.25rem", borderRadius: 8, border: "none",
                  background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                  color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}
              >
                Sign in
              </button>
            </div>
          )}

          {/* Loading auth state */}
          {loggedIn === null && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              Loading…
            </div>
          )}

          {/* Chat UI */}
          {loggedIn === true && (
            <div>
              {/* Message area */}
              <div
                ref={scrollRef}
                style={{
                  height: 300, overflowY: "auto",
                  padding: "1rem",
                  display: "flex", flexDirection: "column", gap: "0.625rem",
                }}
              >
                {/* Empty state: example prompts */}
                {messages.length === 0 && !thinking && (
                  <div style={{ margin: "auto 0", paddingTop: "0.5rem" }}>
                    <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginBottom: "0.75rem" }}>
                      Try asking…
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {EXAMPLES.map((ex) => (
                        <button
                          key={ex}
                          onClick={() => send(ex)}
                          style={{
                            padding: "0.5rem 0.875rem",
                            background: "rgba(134,197,64,0.07)",
                            border: "1.5px solid rgba(134,197,64,0.2)",
                            borderRadius: 20, cursor: "pointer",
                            fontSize: 13, color: "#374151", textAlign: "left",
                            transition: "background 0.15s, border-color 0.15s",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "rgba(134,197,64,0.13)";
                            e.currentTarget.style.borderColor = "rgba(134,197,64,0.4)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "rgba(134,197,64,0.07)";
                            e.currentTarget.style.borderColor = "rgba(134,197,64,0.2)";
                          }}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message bubbles */}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    {msg.role === "assistant" && (
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, marginRight: "0.4rem", alignSelf: "flex-end",
                      }}>
                        👨‍🍳
                      </div>
                    )}
                    <div style={{
                      maxWidth: "78%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: msg.role === "user"
                        ? "14px 14px 4px 14px"
                        : "14px 14px 14px 4px",
                      background: msg.role === "user" ? "#86C540" : "#f3f4f6",
                      color: msg.role === "user" ? "#fff" : "#111827",
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Thinking indicator */}
                {thinking && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "0.4rem" }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #86C540, #5DC2D1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13,
                    }}>
                      👨‍🍳
                    </div>
                    <div style={{
                      padding: "0.5rem 0.875rem",
                      background: "#f3f4f6", borderRadius: "14px 14px 14px 4px",
                      fontSize: 13, color: "#6b7280",
                      display: "flex", alignItems: "center", gap: "0.35rem",
                    }}>
                      <span>Chef is thinking</span>
                      <span style={{ display: "inline-flex", gap: 3 }}>
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            style={{
                              width: 5, height: 5, borderRadius: "50%",
                              background: "#86C540", display: "inline-block",
                              animation: `chefDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div style={{
                    padding: "0.5rem 0.75rem",
                    background: "#fef2f2", border: "1px solid #fecaca",
                    borderRadius: 10, fontSize: 13, color: "#dc2626",
                  }}>
                    ⚠ {error}
                  </div>
                )}
              </div>

              {/* Limit reached */}
              {reachedLimit && (
                <div style={{
                  padding: "0.75rem 1rem",
                  borderTop: "1px solid #f3f4f6",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontSize: 13, color: "#6b7280",
                }}>
                  <span>Max questions reached for this session.</span>
                  <button
                    onClick={resetChat}
                    style={{
                      fontSize: 13, fontWeight: 600, color: "#86C540",
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                    }}
                  >
                    Start new chat
                  </button>
                </div>
              )}

              {/* Input row */}
              {!reachedLimit && (
                <div style={{
                  display: "flex", gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  borderTop: "1px solid #f3f4f6",
                }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={thinking}
                    placeholder="Ask anything about this recipe…"
                    style={{
                      flex: 1,
                      padding: "0.5rem 0.75rem",
                      border: "1.5px solid #e5e7eb", borderRadius: 20,
                      fontSize: 13, outline: "none",
                      background: thinking ? "#f9fafb" : "#fff",
                      fontFamily: "inherit",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#86C540")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || thinking}
                    style={{
                      width: 36, height: 36, borderRadius: "50%", border: "none",
                      background: !input.trim() || thinking
                        ? "#e5e7eb"
                        : "linear-gradient(135deg, #86C540, #5DC2D1)",
                      color: !input.trim() || thinking ? "#9ca3af" : "#fff",
                      cursor: !input.trim() || thinking ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, flexShrink: 0,
                      transition: "background 0.2s",
                    }}
                    aria-label="Send"
                  >
                    ↑
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes chefDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </div>
  );
}
