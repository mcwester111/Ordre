"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SubPageHeader from "@/components/SubPageHeader";
import Footer from "@/components/Footer";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [ready, setReady] = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const showPassTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showConfirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const makeEyeToggle = (
    visible: boolean,
    setVisible: (v: boolean) => void,
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  ) => ({
    onClick: () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (visible) { setVisible(false); }
      else { setVisible(true); timerRef.current = setTimeout(() => setVisible(false), 2000); }
    },
    icon: visible ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ),
    color: visible ? "rgba(200,170,110,0.65)" : "rgba(200,170,110,0.32)",
  });

  // Supabase exchanges the token from the URL hash automatically on mount.
  // We wait for the PASSWORD_RECOVERY event before showing the form.
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!password || !confirm) {
      setErrorMsg("Please enter and confirm your new password.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("The passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("done");
      setTimeout(() => router.push("/"), 1800);
    }
  };

  const mLabel: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-jost)",
    fontWeight: 600,
    fontSize: "0.44rem",
    letterSpacing: "0.26em",
    textTransform: "uppercase",
    color: "rgba(200,170,110,0.52)",
    marginBottom: "0.35rem",
    textAlign: "center",
  };
  const mInput: React.CSSProperties = {
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
  };

  const CARD_W = 340;
  const CARD_H = Math.round(CARD_W / 0.8);

  return (
    <main className="relative min-h-screen flex flex-col">
      <SubPageHeader />

      <div className="flex-1 flex items-center justify-center px-6"
        style={{ paddingTop: "2rem", paddingBottom: "5rem" }}>

        <div style={{
          width: "min(340px, 85vw)",
          height: `${CARD_H}px`,
          margin: "0 auto",
          backgroundImage: "url('/japanese-paper.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          position: "relative",
          transform: "translateX(-2px)",
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "2.4rem 2.2rem",
            boxSizing: "border-box",
            textAlign: "center",
            gap: "1.4rem",
          }}>

            {status === "done" ? (
              <p style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "1rem",
                fontWeight: 600,
                fontStyle: "italic",
                color: "rgba(200,170,110,0.82)",
                lineHeight: 1.7,
              }}>
                Password updated.<br />Signing you in...
              </p>
            ) : !ready ? (
              <p style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "0.9rem",
                fontStyle: "italic",
                color: "rgba(200,170,110,0.5)",
              }}>
                Verifying your link...
              </p>
            ) : (
              <>
                <p style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "1.45rem",
                  fontWeight: 600,
                  fontStyle: "italic",
                  color: "rgba(235,220,195,0.92)",
                  lineHeight: 1.15,
                }}>
                  Set a new password.
                </p>

                <div style={{ height: 1, width: "100%", background: "linear-gradient(to right, transparent, rgba(200,170,110,0.22), transparent)" }} />

                <form onSubmit={handleSubmit} noValidate style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <div>
                    <label style={mLabel}>New password</label>
                    {(() => { const t = makeEyeToggle(showPass, setShowPass, showPassTimer); return (
                    <div style={{ position: "relative" }}>
                      <input type={showPass ? "text" : "password"} autoComplete="new-password" autoFocus
                        value={password} onChange={e => { setPassword(e.target.value); setErrorMsg(""); }}
                        style={{ ...mInput, paddingRight: "1.2rem", paddingLeft: "1.2rem", boxSizing: "border-box" }} />
                      <button type="button" onClick={t.onClick} aria-label={showPass ? "Hide password" : "Show password"}
                        style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: "0.2rem", cursor: "pointer", color: t.color, transition: "color 0.2s", lineHeight: 0 }}>
                        {t.icon}
                      </button>
                    </div>
                    ); })()}
                  </div>
                  <div>
                    <label style={mLabel}>Confirm password</label>
                    {(() => { const t = makeEyeToggle(showConfirm, setShowConfirm, showConfirmTimer); return (
                    <div style={{ position: "relative" }}>
                      <input type={showConfirm ? "text" : "password"} autoComplete="new-password"
                        value={confirm} onChange={e => { setConfirm(e.target.value); setErrorMsg(""); }}
                        style={{ ...mInput, paddingRight: "1.2rem", paddingLeft: "1.2rem", boxSizing: "border-box" }} />
                      <button type="button" onClick={t.onClick} aria-label={showConfirm ? "Hide password" : "Show password"}
                        style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: "0.2rem", cursor: "pointer", color: t.color, transition: "color 0.2s", lineHeight: 0 }}>
                        {t.icon}
                      </button>
                    </div>
                    ); })()}
                  </div>

                  {(status === "error" || errorMsg) && (
                    <p style={{
                      fontFamily: "var(--font-cormorant)",
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      fontStyle: "italic",
                      color: "rgba(220,170,130,0.85)",
                      textAlign: "center",
                      lineHeight: 1.55,
                    }}>
                      {errorMsg}
                    </p>
                  )}

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
                    {status === "loading" ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
