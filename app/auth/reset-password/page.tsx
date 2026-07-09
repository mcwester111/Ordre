"use client";

import { useState, useEffect } from "react";
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
                    <input
                      type="password"
                      autoComplete="new-password"
                      autoFocus
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrorMsg(""); }}
                      style={mInput}
                    />
                  </div>
                  <div>
                    <label style={mLabel}>Confirm password</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setErrorMsg(""); }}
                      style={mInput}
                    />
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
