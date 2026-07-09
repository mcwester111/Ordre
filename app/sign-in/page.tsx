"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SubPageHeader from "@/components/SubPageHeader";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
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
    if (!createTos) {
      setCreateError("Please accept the Terms and Privacy Policy.");
      return;
    }
    setCreateStatus("loading");
    const { error } = await supabase.auth.signUp({
      email: createEmail,
      password: createPass,
      options: {
        data: { name: `${createFirst.trim()} ${createLast.trim()}` },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
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
    fontSize: "0.42rem",
    letterSpacing: "0.24em",
    textTransform: "uppercase",
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
        input#create-pass2 { cursor: default !important; caret-color: rgba(200,170,110,0.7); }
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
                <label htmlFor="email" className="cursor-default" style={{
                  display: "block",
                  fontFamily: "var(--font-jost)",
                  fontWeight: 600,
                  fontSize: "0.44rem",
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
                <label htmlFor="password" className="cursor-default" style={{
                  display: "block",
                  fontFamily: "var(--font-jost)",
                  fontWeight: 600,
                  fontSize: "0.44rem",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "rgba(200,170,110,0.52)",
                  marginBottom: "0.35rem",
                }}>
                  Password
                </label>
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
                    padding: "0.35rem 0",
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 600,
                    textAlign: "center",
                    fontSize: "0.9rem",
                    letterSpacing: "0.03em",
                    color: "rgba(235,220,195,0.88)",
                    outline: "none",
                    cursor: "default",
                  }}
                />
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
                    padding: 0,
                    paddingBottom: "1px",
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    fontStyle: "italic",
                    color: "rgba(200,170,110,0.42)",
                    textDecoration: "none",
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
                  fontSize: "0.46rem",
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
              fontWeight: 600,
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
                  padding: 0,
                  paddingBottom: "1px",
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  fontStyle: "italic",
                  color: "rgba(200,170,110,0.62)",
                  letterSpacing: "0.03em",
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
                  padding: "2px 4px",
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
                      fontSize: "0.44rem",
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
                      fontSize: "0.46rem",
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
              width: "min(348px, 88vw)",
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
                  padding: "2px 4px",
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
                <p style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  fontStyle: "italic",
                  color: "rgba(200,170,110,0.72)",
                  lineHeight: 1.7,
                  padding: "1.2rem 0",
                }}>
                  Welcome to Ordre.<br />Check your inbox to confirm your email.
                </p>
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
                    <input id="create-pass" type="password" autoComplete="new-password"
                      value={createPass} onChange={e => setCreatePass(e.target.value)} style={mInput} />
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label htmlFor="create-pass2" style={mLabel}>Re-enter Password</label>
                    <input id="create-pass2" type="password" autoComplete="new-password"
                      value={createPass2} onChange={e => setCreatePass2(e.target.value)} style={mInput} />
                  </div>

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
                      Send me Ordre dispatches — new curations and private invitations.
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
                      fontSize: "0.46rem",
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
