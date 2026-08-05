"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmedModal() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("confirmed") === "true") {
      setConfirmed(true);
      const t = setTimeout(() => router.push("/curator"), 3000);
      return () => clearTimeout(t);
    }
  }, [router]);

  const dismiss = useCallback(() => {
    setConfirmed(false);
    router.replace("/", { scroll: false });
  }, [router]);

  if (!confirmed) return null;

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "rgba(18,12,6,0.42)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        animation: "fadeInOverlay 0.4s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(380px, 88vw)",
          padding: "2.6rem 2.6rem 4.5rem",
          marginTop: "4rem",
          backgroundColor: "#0e0b08",
          border: "1px solid rgba(200,170,110,0.14)",
          textAlign: "center",
          position: "relative",
          animation: "slideUpModal 0.35s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1.1rem",
            background: "none",
            border: "none",
            fontFamily: "var(--font-cormorant)",
            fontSize: "1rem",
            color: "rgba(200,170,110,0.35)",
            cursor: "pointer",
            lineHeight: 1,
            padding: "2px 4px",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(200,170,110,0.75)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(200,170,110,0.35)")}
          aria-label="Close"
        >
          ✕
        </button>

        <p style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "1.38rem",
          fontWeight: 600,
          fontStyle: "italic",
          color: "rgba(235,220,195,0.92)",
          lineHeight: 1.25,
          marginBottom: "0.85rem",
          letterSpacing: "0.01em",
        }}>
          Your email has been confirmed.
        </p>

        <p style={{
          fontFamily: "var(--font-jost)",
          fontSize: "0.52rem",
          fontWeight: 400,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(200,170,110,0.52)",
          marginBottom: "2.2rem",
          lineHeight: 2,
        }}>
          You may access your profile.
        </p>

        <a
          href="/curator"
          style={{
            display: "inline-block",
            fontFamily: "var(--font-jost)",
            fontSize: "0.52rem",
            fontWeight: 600,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(235,220,195,0.78)",
            border: "1px solid rgba(200,170,110,0.32)",
            padding: "0.9rem 2.6rem",
            textDecoration: "none",
            transition: "border-color 0.3s ease, color 0.3s ease",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.borderColor = "rgba(200,170,110,0.65)";
            el.style.color = "rgba(235,220,195,1)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.borderColor = "rgba(200,170,110,0.32)";
            el.style.color = "rgba(235,220,195,0.78)";
          }}
        >
          Access Profile
        </a>
      </div>
    </div>
  );
}
