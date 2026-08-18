"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SubPageHeader from "@/components/SubPageHeader";
import Footer from "@/components/Footer";

export default function SignOutPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  };

  const CARD_W = 340;
  const CARD_H = Math.round(CARD_W / 0.8);

  return (
    <main className="relative min-h-screen flex flex-col">
      <SubPageHeader />

      <div className="absolute top-0 bottom-0 left-0 w-px z-10"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(110,80,40,0.12) 20%, rgba(110,80,40,0.12) 80%, transparent)" }} />
      <div className="absolute top-0 bottom-0 right-0 w-px z-10"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(110,80,40,0.12) 20%, rgba(110,80,40,0.12) 80%, transparent)" }} />

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
            gap: "2rem",
          }}>

            <p style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "1.55rem",
              fontWeight: 600,
              fontStyle: "italic",
              color: "rgba(235,220,195,0.92)",
              letterSpacing: "0.01em",
              lineHeight: 1.15,
              userSelect: "none",
              cursor: "default",
            }}>
              Until next time.
            </p>

            <div style={{
              height: "1px",
              width: "100%",
              background: "linear-gradient(to right, transparent, rgba(200,170,110,0.22), transparent)",
            }} />

            <button
              onClick={handleSignOut}
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
                color: "rgba(235,220,195,0.78)",
                cursor: "pointer",
                transition: "border-color 0.3s ease, color 0.3s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(200,170,110,0.65)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(235,220,195,1)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(200,170,110,0.35)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(235,220,195,0.78)";
              }}
            >
              Sign Out
            </button>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
