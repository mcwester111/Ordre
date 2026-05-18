"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signalSplashDone } from "@/lib/splash-signal";

export default function SplashScreen() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">(
    pathname !== "/" ? "gone" : "visible"
  );

  useEffect(() => {
    // Only show the splash on the home page.
    if (pathname !== "/") {
      signalSplashDone();
      return;
    }
    const fadeTimer   = setTimeout(() => setPhase("fading"), 4200);
    // Signal the landing page as the splash fade is ~80% through (~230ms into
    // the 280ms transition) so the swan begins emerging while the splash is
    // still dissolving — a natural overlap rather than a blank-parchment gap.
    const signalTimer = setTimeout(signalSplashDone, 4430);
    const goneTimer   = setTimeout(() => setPhase("gone"), 5200);
    return () => { clearTimeout(fadeTimer); clearTimeout(signalTimer); clearTimeout(goneTimer); };
  }, [pathname]);

  if (phase === "gone") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#EDE8DC",
        opacity: phase === "fading" ? 0 : 1,
        transition: phase === "fading" ? "opacity 0.28s ease-in" : "none",
        pointerEvents: phase === "fading" ? "none" : "all",
      }}
    >
      <p
        style={{
          fontFamily: "Zyntro, serif",
          fontSize: "clamp(0.7rem, 1.4vw, 1rem)",
          fontWeight: 400,
          color: "#1A120A",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          animation: "waiting-flash 2.4s ease-in-out infinite",
        }}
      >
        ORDRE.
      </p>

      <style>{`
        @keyframes waiting-flash {
          0%   { opacity: 1; }
          50%  { opacity: 0.08; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
