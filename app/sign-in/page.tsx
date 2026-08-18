"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import SubPageHeader from "@/components/SubPageHeader";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/");
    });
  }, []);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const showPassTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCreatePass, setShowCreatePass]   = useState(false);
  const [showCreatePass2, setShowCreatePass2] = useState(false);
  const showCreatePassTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showCreatePass2Timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus]     = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Forgot password modal state
  const [forgotOpen, setForgotOpen]         = useState(false);
  const [forgotEmail, setForgotEmail]       = useState("");
  const [forgotStatus, setForgotStatus]     = useState<"idle" | "loading" | "sent">("idle");

  // Create account modal state
  const [createOpen, setCreateOpen]     = useState(false);
  const [createFirst, setCreateFirst]   = useState("");
  const [createLast, setCreateLast]     = useState("");
  const [createEmail, setCreateEmail]   = useState("");
  const [createPass, setCreatePass]     = useState("");
  const [createPass2, setCreatePass2]   = useState("");
  const [createTos, setCreateTos]       = useState(false);
  const [createAge, setCreateAge]       = useState(false);
  const [createMkt, setCreateMkt]       = useState(false);
  const [createStatus, setCreateStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [createError, setCreateError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter your email and password.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg("Incorrect email or password.");
      setStatus("error");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotStatus("loading");
    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    // Always show "sent" — don't leak whether the email exists
    setForgotStatus("sent");
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotEmail("");
    setForgotStatus("idle");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createFirst || !createLast || !createEmail || !createPass || !createPass2) {
      setCreateError("Please complete all fields.");
      return;
    }
    if (createPass !== createPass2) {
      setCreateError("The passwords do not match.");
      return;
    }
    if (!createAge) {
      setCreateError("Please confirm you are 18 or older.");
      return;
    }
    if (!createTos) {
      setCreateError("Please accept the Terms and Privacy Policy.");
      return;
    }
    setCreateStatus("loading");
    const { error } = await supabase.auth.signUp({
      email: createEmail,
      password: createPass,
      options: {
        data: { name: `${createFirst.trim()} ${createLast.trim()}`, marketing_opt_in: createMkt, tos_agreed_at: new Date().toISOString(), age_confirmed: true },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/confirm`,
      },
    });
    if (error) {
      setCreateError(error.message);
      setCreateStatus("idle");
    } else {
      setCreateStatus("sent");
    }
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateFirst("");
    setCreateLast("");
    setCreateEmail("");
    setCreatePass("");
    setCreatePass2("");
    setCreateTos(false);
    setCreateMkt(false);
    setCreateStatus("idle");
    setCreateError("");
  };

  // Paper: 1122×1402px → ratio 0.8. Card width 340px → height 425px.
  const CARD_W = 340;
  const CARD_H = Math.round(CARD_W / 0.8);

  // Shared field styles for the create-account modal
  const mLabel: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-jost)",
    fontWeight: 600,
    fontSize: "0.5rem",
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    cursor: "default",
    color: "rgba(200,170,110,0.52)",
    marginBottom: "0.3rem",
    textAlign: "center",
  };
  const mInput: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(200,170,110,0.22)",
    padding: "0.3rem 0",
    fontFamily: "var(--font-cormorant)",
    fontWeight: 600,
    fontSize: "0.88rem",
    letterSpacing: "0.03em",
    color: "rgba(235,220,195,0.88)",
    outline: "none",
    textAlign: "center",
  };

  return (
    <main className="relative min-h-screen flex flex-col">
      <style>{`
        input#email,
        input#password,
        input#forgot-email,
        input#create-first,
        input#create-last,
        input#create-email,
        input#create-pass,
        input#create-pass2 { caret-color: rgba(200,170,110,0.7); }
        label[for="email"], label[for="password"],
        label[for="forgot-email"], label[for="create-first"],
        label[for="create-last"], label[for="create-email"],
        label[for="create-pass"], label[for="create-pass2"] { cursor: default !important; }
        input#email::selection,
        input#password::selection,
        input#forgot-email::selection,
        input#create-first::selection,
        input#create-last::selection,
        input#create-email::selection,
        input#create-pass::selection,
        input#create-pass2::selection {
          background: rgba(200,170,110,0.28);
          color: rgba(235,220,195,0.92);
        }
        input#email:-webkit-autofill,
        input#password:-webkit-autofill,
        input#forgot-email:-webkit-autofill,
        input#create-first:-webkit-autofill,
        input#create-last:-webkit-autofill,
        input#create-email:-webkit-autofill,
        input#create-pass:-webkit-autofill,
        input#create-pass2:-webkit-autofill,
        input#email:-webkit-autofill:focus,
        input#password:-webkit-autofill:focus,
        input#forgot-email:-webkit-autofill:focus,
        input#create-first:-webkit-autofill:focus,
        input#create-last:-webkit-autofill:focus,
        input#create-email:-webkit-autofill:focus,
        input#create-pass:-webkit-autofill:focus,
        input#create-pass2:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px rgba(28,22,14,0.92) inset !important;
          -webkit-text-fill-color: rgba(235,220,195,0.88) !important;
          font-family: var(--font-cormorant) !important;
          font-weight: 600 !important;
          font-size: 0.88rem !important;
          letter-spacing: 0.03em !important;
          border-bottom: 1px solid rgba(200,170,110,0.22) !important;
          outline: none !important;
          caret-color: rgba(200,170,110,0.7);
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
      <SubPageHeader />

      {/* Vertical rules */}
      <div className="absolute top-0 bottom-0 left-0 w-px z-10"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(110,80,40,0.12) 20%, rgba(110,80,40,0.12) 80%, transparent)" }} />
      <div className="absolute top-0 bottom-0 right-0 w-px z-10"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(110,80,40,0.12) 20%, rgba(110,80,40,0.12) 80%, transparent)" }} />

      <div className="flex-1 flex items-center justify-center px-6"
        style={{ paddingTop: "2rem", paddingBottom: "5rem" }}>

        {/* Black paper card */}
        <div style={{
          width: "min(340px, 85vw)",
          height: `${CARD_H}px`,
          margin: "0 auto",
          backgroundImage: "url('/japanese-paper.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          position: "relative",
          flexShrink: 0,
          // The paper PNG's torn shape sits ~6px right-of-center within its own
          // canvas (54px transparent margin left vs 42px right). Scaled to this
          // card that reads as a faint rightward lean, so nudge the whole card
          // ~2px left to visually re-center the black mass.
          transform: "translateX(-2px)",
        }}>

          {/* Content */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "2.4rem 2.2rem 2.8rem",
            boxSizing: "border-box",
            textAlign: "center",
          }}>

            {/* Top: greeting */}
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "1.55rem",
                fontWeight: 600,
                fontStyle: "italic",
                color: "rgba(235,220,195,0.92)",
                letterSpacing: "0.01em",
                lineHeight: 1.15,
                marginBottom: "0.5rem",
                userSelect: "none",
                cursor: "default",
              }}>
                Welcome back.
              </p>
            </div>

            {/* Divider */}
            <div style={{
              height: "1px",
              background: "linear-gradient(to right, transparent, rgba(200,170,110,0.22), transparent)",
            }} />

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.1rem", textAlign: "center", width: "100%" }}>

              {/* Email */}
              <div>
                <label htmlFor="email" style={{ cursor: "default",
                  display: "block",
                  fontFamily: "var(--font-jost)",
                  fontWeight: 600,
                  fontSize: "0.52rem",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "rgba(200,170,110,0.52)",
                  marginBottom: "0.35rem",
                }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={e => { setEmail(e.target.value); setStatus("idle"); }}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(200,170,110,0.22)",
                    padding: "0.35rem 0",
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    letterSpacing: "0.03em",
                    color: "rgba(235,220,195,0.88)",
                    outline: "none",
                    textAlign: "center",
                    cursor: "default",
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" style={{ cursor: "default",
                  display: "block",
                  fontFamily: "var(--font-jost)",
                  fontWeight: 600,
                  fontSize: "0.52rem",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "rgba(200,170,110,0.52)",
                  marginBottom: "0.35rem",
                }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setStatus("idle"); }}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid rgba(200,170,110,0.22)",
                      padding: "0.35rem 1.2rem 0.35rem 1.2rem",
                      fontFamily: "var(--font-cormorant)",
                      fontWeight: 600,
                      textAlign: "center",
                      fontSize: "0.9rem",
                      letterSpacing: "0.03em",
                      color: "rgba(235,220,195,0.88)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    aria-label={showPass ? "Hide password" : "Show password"}
                    onClick={() => {
                      if (showPassTimer.current) clearTimeout(showPassTimer.current);
                      if (showPass) {
                        setShowPass(false);
                      } else {
                        setShowPass(true);
                        showPassTimer.current = setTimeout(() => setShowPass(false), 2000);
                      }
                    }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      padding: "0.2rem",
                      cursor: "pointer",
                      color: showPass ? "rgba(200,170,110,0.65)" : "rgba(200,170,110,0.32)",
                      transition: "color 0.2s",
                      lineHeight: 0,
                    }}
                  >
                    {showPass ? (
                      /* Eye open */
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    ) : (
                      /* Eye closed */
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div style={{ textAlign: "center", marginTop: "-0.4rem" }}>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid rgba(200,170,110,0.25)",
                    padding: "0.5rem 0.3rem 0.02rem",
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 900,
                    fontSize: "0.82rem",
                    fontStyle: "italic",
                    color: "rgba(200,170,110,0.42)",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {status === "error" && (
                <p style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  fontStyle: "italic",
                  color: "rgba(220,170,130,0.85)",
                  textAlign: "center",
                  lineHeight: 1.55,
                  margin: "-0.2rem 0",
                }}>
                  {errorMsg}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "1px solid rgba(200,170,110,0.35)",
                  padding: "0.65rem 1rem",
                  fontFamily: "var(--font-jost)",
                  fontWeight: 600,
                  fontSize: "0.54rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: status === "loading" ? "rgba(200,170,110,0.3)" : "rgba(235,220,195,0.78)",
                  transition: "border-color 0.3s ease, color 0.3s ease",
                  marginTop: "0.2rem",
                }}
                onMouseEnter={e => {
                  if (status !== "loading") {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(200,170,110,0.65)";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(235,220,195,1)";
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(200,170,110,0.35)";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(235,220,195,0.78)";
                }}
              >
                {status === "loading" ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div style={{
              height: "1px",
              background: "linear-gradient(to right, transparent, rgba(200,170,110,0.18), transparent)",
            }} />

            {/* Footer */}
            <p style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 900,
              fontSize: "0.78rem",
              fontStyle: "italic",
              color: "rgba(200,170,110,0.42)",
              textAlign: "center",
              lineHeight: 2,
              letterSpacing: "0.03em",
              userSelect: "none",
            }}>
              New to Ordre?{" "}
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid rgba(200,170,110,0.25)",
                  padding: "0.5rem 0.3rem 0.02rem",
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 900,
                  fontSize: "0.78rem",
                  fontStyle: "italic",
                  color: "rgba(200,170,110,0.62)",
                  letterSpacing: "0.03em",
                  cursor: "pointer",
                }}
              >
                Create an account
              </button>
            </p>

          </div>
        </div>
      </div>

      <Footer />

      {/* ── Forgot Password Modal ── */}
      {forgotOpen && (
        <div
          onClick={closeForgot}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(18,12,6,0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            animation: "fadeInOverlay 0.25s ease both",
          }}
        >
          {/* Modal card */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "min(289px, 72vw)",
              padding: "1.9rem 2.4rem",
              backgroundColor: "#0e0b08",
              border: "1px solid rgba(200,170,110,0.1)",
              position: "relative",
              animation: "slideUpModal 0.3s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              textAlign: "center",
            }}>

              {/* Close */}
              <button
                onClick={closeForgot}
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1.1rem",
                  background: "none",
                  border: "none",
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "1rem",
                  color: "rgba(200,170,110,0.35)",
                  lineHeight: 1,
                  padding: "0.65rem 0.75rem",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(200,170,110,0.75)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(200,170,110,0.35)")}
                aria-label="Close"
              >
                ✕
              </button>

              {forgotStatus === "sent" ? (
                /* Confirmation */
                <p style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  fontStyle: "italic",
                  color: "rgba(200,170,110,0.72)",
                  lineHeight: 1.65,
                  padding: "0.5rem 0",
                }}>
                  If that address is on file,<br />you'll receive a link shortly.
                </p>
              ) : (
                /* Form */
                <form onSubmit={handleForgot} noValidate style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <div>
                    <label htmlFor="forgot-email" style={{
                      display: "block",
                      fontFamily: "var(--font-jost)",
                      fontWeight: 600,
                      fontSize: "0.52rem",
                      letterSpacing: "0.26em",
                      textTransform: "uppercase",
                      color: "rgba(200,170,110,0.52)",
                      marginBottom: "0.35rem",
                      textAlign: "center",
                    }}>
                      Email
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      autoFocus
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid rgba(200,170,110,0.22)",
                        padding: "0.35rem 0",
                        fontFamily: "var(--font-cormorant)",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        letterSpacing: "0.03em",
                        color: "rgba(235,220,195,0.88)",
                        outline: "none",
                        textAlign: "center",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotStatus === "loading"}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "1px solid rgba(200,170,110,0.35)",
                      padding: "0.65rem 1rem",
                      fontFamily: "var(--font-jost)",
                      fontWeight: 600,
                      fontSize: "0.54rem",
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: forgotStatus === "loading" ? "rgba(200,170,110,0.3)" : "rgba(235,220,195,0.78)",
                      transition: "border-color 0.3s ease, color 0.3s ease",
                      marginTop: "0.2rem",
                    }}
                    onMouseEnter={e => {
                      if (forgotStatus !== "loading") {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(200,170,110,0.65)";
                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(235,220,195,1)";
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(200,170,110,0.35)";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(235,220,195,0.78)";
                    }}
                  >
                    {forgotStatus === "loading" ? "Sending…" : "Send Reset Link"}
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Create Account Modal ── */}
      {createOpen && (
        <div
          onClick={closeCreate}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            background: "rgba(18,12,6,0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            animation: "fadeInOverlay 0.25s ease both",
          }}
        >
          {/* Modal card */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: createStatus === "sent" ? "min(300px, 82vw)" : "min(348px, 88vw)",
              maxHeight: "88vh",
              overflowY: "auto",
              padding: "2.2rem 2.2rem",
              backgroundColor: "#0e0b08",
              border: "1px solid rgba(200,170,110,0.1)",
              position: "relative",
              animation: "slideUpModal 0.3s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.1rem",
              textAlign: "center",
            }}>

              {/* Close */}
              <button
                onClick={closeCreate}
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1.1rem",
                  background: "none",
                  border: "none",
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "1rem",
                  color: "rgba(200,170,110,0.35)",
                  lineHeight: 1,
                  padding: "0.65rem 0.75rem",
                  transition: "color 0.2s ease",
                  zIndex: 2,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(200,170,110,0.75)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(200,170,110,0.35)")}
                aria-label="Close"
              >
                ✕
              </button>

              {createStatus === "sent" ? (
                /* Confirmation */
                <>
                  {/* Corner ornaments */}
                  {(["top:0;left:0", "top:0;right:0", "bottom:0;left:0", "bottom:0;right:0"] as const).map((pos, i) => {
                    const [v, h] = pos.split(";");
                    const flipX = h === "right:0";
                    const flipY = v === "bottom:0";
                    return (
                      <svg key={i} viewBox="0 0 28 28" width="22" height="22" fill="none"
                        stroke="rgba(200,170,110,0.45)" strokeWidth="0.9" strokeLinecap="round"
                        style={{
                          position: "absolute",
                          [v.split(":")[0]]: v.split(":")[1],
                          [h.split(":")[0]]: h.split(":")[1],
                          transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
                        }}>
                        <path d="M24 4 C14 4 4 14 4 24" />
                        <path d="M24 4 C26 4 27 2 25 2 C23 2 23 4 24 4" />
                        <path d="M4 24 C4 26 2 27 2 25 C2 23 4 23 4 24" />
                      </svg>
                    );
                  })}
                  <p style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1.15rem",
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: "rgba(200,170,110,0.72)",
                    lineHeight: 1.75,
                    padding: "1.6rem 0.5rem",
                  }}>
                    Welcome to Ordre.<br />Check your inbox to confirm your email.
                  </p>
                </>
              ) : (
                /* Form */
                <form onSubmit={handleCreate} noValidate style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>

                  {/* Heading */}
                  <p style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1.35rem",
                    fontWeight: 600,
                    fontStyle: "italic",
                    color: "rgba(235,220,195,0.92)",
                    lineHeight: 1.1,
                    marginBottom: "0.2rem",
                    userSelect: "none",
                  }}>
                    Create your account.
                  </p>

                  {/* First + Last name */}
                  <div style={{ display: "flex", gap: "0.55rem" }}>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="create-first" style={mLabel}>First Name</label>
                      <input id="create-first" type="text" autoComplete="given-name" autoFocus
                        value={createFirst} onChange={e => setCreateFirst(e.target.value)} style={mInput} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="create-last" style={mLabel}>Last Name</label>
                      <input id="create-last" type="text" autoComplete="family-name"
                        value={createLast} onChange={e => setCreateLast(e.target.value)} style={mInput} />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="create-email" style={mLabel}>Email</label>
                    <input id="create-email" type="email" autoComplete="email"
                      value={createEmail} onChange={e => setCreateEmail(e.target.value)} style={mInput} />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="create-pass" style={mLabel}>Password</label>
                    <div style={{ position: "relative" }}>
                      <input id="create-pass" type={showCreatePass ? "text" : "password"} autoComplete="new-password"
                        value={createPass} onChange={e => setCreatePass(e.target.value)}
                        style={{ ...mInput, paddingRight: "1.2rem", paddingLeft: "1.2rem", boxSizing: "border-box" }} />
                      <button type="button" aria-label={showCreatePass ? "Hide password" : "Show password"}
                        onClick={() => {
                          if (showCreatePassTimer.current) clearTimeout(showCreatePassTimer.current);
                          if (showCreatePass) { setShowCreatePass(false); }
                          else { setShowCreatePass(true); showCreatePassTimer.current = setTimeout(() => setShowCreatePass(false), 2000); }
                        }}
                        style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: "0.2rem", cursor: "pointer", color: showCreatePass ? "rgba(200,170,110,0.65)" : "rgba(200,170,110,0.32)", transition: "color 0.2s", lineHeight: 0 }}>
                        {showCreatePass ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label htmlFor="create-pass2" style={mLabel}>Re-enter Password</label>
                    <div style={{ position: "relative" }}>
                      <input id="create-pass2" type={showCreatePass2 ? "text" : "password"} autoComplete="new-password"
                        value={createPass2} onChange={e => setCreatePass2(e.target.value)}
                        style={{ ...mInput, paddingRight: "1.2rem", paddingLeft: "1.2rem", boxSizing: "border-box" }} />
                      <button type="button" aria-label={showCreatePass2 ? "Hide password" : "Show password"}
                        onClick={() => {
                          if (showCreatePass2Timer.current) clearTimeout(showCreatePass2Timer.current);
                          if (showCreatePass2) { setShowCreatePass2(false); }
                          else { setShowCreatePass2(true); showCreatePass2Timer.current = setTimeout(() => setShowCreatePass2(false), 2000); }
                        }}
                        style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: "0.2rem", cursor: "pointer", color: showCreatePass2 ? "rgba(200,170,110,0.65)" : "rgba(200,170,110,0.32)", transition: "color 0.2s", lineHeight: 0 }}>
                        {showCreatePass2 ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Age confirmation */}
                  <label htmlFor="create-age" style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", textAlign: "left", marginTop: "0.3rem", cursor: "pointer" }}>
                    <button
                      id="create-age"
                      type="button"
                      role="checkbox"
                      aria-checked={createAge}
                      onClick={() => setCreateAge(v => !v)}
                      style={{
                        flexShrink: 0,
                        width: "13px", height: "13px",
                        marginTop: "2px",
                        border: `1px solid rgba(200,170,110,${createAge ? 0.7 : 0.35})`,
                        background: createAge ? "rgba(200,170,110,0.15)" : "transparent",
                        color: "rgba(200,170,110,0.9)",
                        fontSize: "0.55rem",
                        lineHeight: 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "border-color 0.2s ease, background 0.2s ease",
                      }}
                    >
                      {createAge ? "✓" : ""}
                    </button>
                    <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.5rem", letterSpacing: "0.04em", lineHeight: 1.7, color: "rgba(210,195,168,0.6)" }}>
                      I confirm I am 18 years of age or older.
                    </span>
                  </label>

                  {/* Terms + Privacy consent */}
                  <label htmlFor="create-tos" style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", textAlign: "left", marginTop: "0.3rem", cursor: "pointer" }}>
                    <button
                      id="create-tos"
                      type="button"
                      role="checkbox"
                      aria-checked={createTos}
                      onClick={() => setCreateTos(v => !v)}
                      style={{
                        flexShrink: 0,
                        width: "13px", height: "13px",
                        marginTop: "2px",
                        border: `1px solid rgba(200,170,110,${createTos ? 0.7 : 0.35})`,
                        background: createTos ? "rgba(200,170,110,0.15)" : "transparent",
                        color: "rgba(200,170,110,0.9)",
                        fontSize: "0.55rem",
                        lineHeight: 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "border-color 0.2s ease, background 0.2s ease",
                      }}
                    >
                      {createTos ? "✓" : ""}
                    </button>
                    <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.5rem", letterSpacing: "0.04em", lineHeight: 1.7, color: "rgba(210,195,168,0.6)" }}>
                      I agree to the{" "}
                      <a href="/terms" style={{ color: "rgba(200,170,110,0.7)", textDecoration: "none", borderBottom: "1px solid rgba(200,170,110,0.3)" }}>Terms of Service</a>
                      {" "}and{" "}
                      <a href="/privacy" style={{ color: "rgba(200,170,110,0.7)", textDecoration: "none", borderBottom: "1px solid rgba(200,170,110,0.3)" }}>Privacy Policy</a>.
                    </span>
                  </label>

                  {/* Marketing opt-in */}
                  <label htmlFor="create-mkt" style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem", textAlign: "left", cursor: "pointer" }}>
                    <button
                      id="create-mkt"
                      type="button"
                      role="checkbox"
                      aria-checked={createMkt}
                      onClick={() => setCreateMkt(v => !v)}
                      style={{
                        flexShrink: 0,
                        width: "13px", height: "13px",
                        marginTop: "2px",
                        border: `1px solid rgba(200,170,110,${createMkt ? 0.7 : 0.35})`,
                        background: createMkt ? "rgba(200,170,110,0.15)" : "transparent",
                        color: "rgba(200,170,110,0.9)",
                        fontSize: "0.55rem",
                        lineHeight: 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "border-color 0.2s ease, background 0.2s ease",
                      }}
                    >
                      {createMkt ? "✓" : ""}
                    </button>
                    <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.5rem", letterSpacing: "0.04em", lineHeight: 1.7, color: "rgba(210,195,168,0.6)" }}>
                      Send me occasional updates from Ordre.
                    </span>
                  </label>

                  {/* Error */}
                  {createError && (
                    <p style={{
                      fontFamily: "var(--font-cormorant)",
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      fontStyle: "italic",
                      color: "rgba(220,170,130,0.85)",
                      lineHeight: 1.5,
                      margin: "-0.1rem 0",
                    }}>
                      {createError}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={createStatus === "loading"}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "1px solid rgba(200,170,110,0.35)",
                      padding: "0.65rem 1rem",
                      fontFamily: "var(--font-jost)",
                      fontWeight: 600,
                      fontSize: "0.54rem",
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: createStatus === "loading" ? "rgba(200,170,110,0.3)" : "rgba(235,220,195,0.78)",
                      transition: "border-color 0.3s ease, color 0.3s ease",
                      marginTop: "0.3rem",
                    }}
                    onMouseEnter={e => {
                      if (createStatus !== "loading") {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(200,170,110,0.65)";
                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(235,220,195,1)";
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(200,170,110,0.35)";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(235,220,195,0.78)";
                    }}
                  >
                    {createStatus === "loading" ? "Creating…" : "Create Account"}
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </main>
  );
}
