"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmedModal() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("confirmed") === "true") setConfirmed(true);
  }, []);

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
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "rgba(14,11,8,0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "fadeInOverlay 0.4s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(340px, 85vw)",
          padding: "2.6rem 2.4rem 2.8rem",
          backgroundColor: "#0e0b08",
          border: "1px solid rgba(200,170,110,0.12)",
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

        {/* Swan mark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/swan-logo.png"
          alt=""
          aria-hidden="true"
          style={{ width: 38, height: "auto", margin: "0 auto 1.6rem", display: "block", opacity: 0.65 }}
        />

        <div style={{
          width: 32,
          height: "1px",
          background: "rgba(200,170,110,0.22)",
          margin: "0 auto 1.8rem",
        }} />

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
          You may now access your account.
        </p>

        <a
          href="/curator"
          style={{
            display: "inline-block",
            fontFamily: "var(--font-jost)",
            fontSize: "0.44rem",
            fontWeight: 600,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(235,220,195,0.78)",
            border: "1px solid rgba(200,170,110,0.32)",
            padding: "0.7rem 2rem",
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
          Access Account
        </a>
      </div>
    </div>
  );
}
