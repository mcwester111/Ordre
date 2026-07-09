"use client";

// Bottom cookie/consent banner. Ordre uses only essential local storage and no
// tracking, so this is a transparency notice with a single Accept action rather
// than a true opt-in/opt-out gate. It:
//   • appears once on first visit (dismissal stored in localStorage),
//   • can be re-opened anytime from the footer "Cookie Preferences" link
//     (which dispatches the `ordre:cookie-preferences` event),
//   • expands to show exactly what is and isn't in use.

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "ordre.cookieConsent.v1";
const REOPEN_EVENT = "ordre:cookie-preferences";

const INK = "#1A120A";
const BODY = "rgba(26,18,10,0.74)";
const MUTED = "rgba(26,18,10,0.5)";
const GOLD = "rgba(100,65,15,0.85)";
const GOLD_DIM = "rgba(100,65,15,0.22)";
const LINE = "rgba(100,65,15,0.16)";

const CATEGORIES: { name: string; body: string; on: boolean }[] = [
  {
    name: "Strictly Necessary",
    body:
      "Your aesthetic profile, kept in this browser’s local storage so the curator remembers your taste. Never used for tracking.",
    on: true,
  },
  {
    name: "Analytics & Performance",
    body: "Ordre does not use any analytics or performance cookies.",
    on: false,
  },
  {
    name: "Advertising & Targeting",
    body: "Ordre does not use advertising cookies and does not sell or share your information.",
    on: false,
  },
];

function MiniSwitch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        position: "relative",
        width: 30,
        height: 16,
        flexShrink: 0,
        borderRadius: 999,
        background: on ? "rgba(26,18,10,0.82)" : "transparent",
        border: `1px solid ${on ? "rgba(26,18,10,0.82)" : "rgba(26,18,10,0.28)"}`,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: on ? "calc(100% - 13px)" : 3,
          transform: "translateY(-50%)",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: on ? "#F5F0E8" : "rgba(26,18,10,0.28)",
        }}
      />
    </span>
  );
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [render, setRender] = useState(false); // kept mounted during slide-out
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let accepted = false;
    try {
      accepted = localStorage.getItem(STORAGE_KEY) === "accepted";
    } catch {
      /* storage unavailable */
    }
    if (!accepted) {
      setRender(true);
      // small delay so it drifts in after first paint (and after the splash)
      const t = setTimeout(() => setShow(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  // Re-open from the footer link.
  useEffect(() => {
    const open = () => {
      setExpanded(false);
      setRender(true);
      requestAnimationFrame(() => setShow(true));
    };
    window.addEventListener(REOPEN_EVENT, open);
    return () => window.removeEventListener(REOPEN_EVENT, open);
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      /* storage unavailable */
    }
    setShow(false);
    setTimeout(() => setRender(false), 420); // after slide-out
  };

  if (!render) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        display: "flex",
        justifyContent: "center",
        padding: "0 clamp(0.75rem, 3vw, 1.5rem) clamp(0.75rem, 3vw, 1.5rem)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          width: "100%",
          maxWidth: 880,
          background: "rgba(244,239,229,0.97)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          border: `1px solid ${GOLD_DIM}`,
          borderRadius: 14,
          boxShadow: "0 18px 50px -22px rgba(40,28,12,0.55)",
          padding: "clamp(1rem, 2.5vw, 1.35rem) clamp(1.1rem, 3vw, 1.6rem)",
          transform: show ? "translateY(0)" : "translateY(140%)",
          opacity: show ? 1 : 0,
          transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease",
        }}
      >
        {/* Top row: message + actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(0.9rem, 3vw, 1.8rem)",
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              flex: "1 1 280px",
              fontFamily: "var(--font-jost)",
              fontSize: "0.78rem",
              lineHeight: 1.7,
              color: BODY,
              letterSpacing: "0.01em",
              margin: 0,
            }}
          >
            Ordre keeps only your aesthetic profile in this browser so the curator
            can remember your taste. No analytics, advertising, or cross-site
            tracking. See our{" "}
            <Link
              href="/privacy"
              style={{ color: GOLD, textDecoration: "none", borderBottom: `1px solid ${GOLD_DIM}` }}
            >
              Privacy Policy
            </Link>
            .
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "1.1rem", flexShrink: 0 }}>
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: "var(--font-jost)",
                fontSize: "0.58rem",
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: MUTED,
                borderBottom: `1px solid ${GOLD_DIM}`,
                paddingBottom: 2,
              }}
            >
              {expanded ? "Hide details" : "Details"}
            </button>

            <button
              onClick={accept}
              style={{
                fontFamily: "var(--font-jost)",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "#F5F0E8",
                background: INK,
                border: "none",
                borderRadius: 8,
                padding: "0.7rem 1.5rem",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2C1E0F")}
              onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
            >
              Accept
            </button>
          </div>
        </div>

        {/* Expandable detail */}
        {expanded && (
          <div style={{ marginTop: "1.1rem", borderTop: `1px solid ${LINE}`, paddingTop: "1.1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              {CATEGORIES.map((c) => (
                <div key={c.name} style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
                  <div style={{ marginTop: 2 }}>
                    <MiniSwitch on={c.on} />
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "0.6rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          fontSize: "1rem",
                          fontWeight: 600,
                          color: INK,
                        }}
                      >
                        {c.name}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-jost)",
                          fontSize: "0.5rem",
                          fontWeight: 600,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: c.on ? GOLD : MUTED,
                        }}
                      >
                        {c.on ? "Always on" : "Not in use"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-jost)",
                        fontSize: "0.72rem",
                        lineHeight: 1.7,
                        color: BODY,
                        margin: "0.2rem 0 0",
                      }}
                    >
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p
              style={{
                fontFamily: "var(--font-jost)",
                fontSize: "0.68rem",
                lineHeight: 1.7,
                color: MUTED,
                margin: "1rem 0 0",
              }}
            >
              Our server also briefly reads each request’s IP address to rate-limit
              and prevent abuse — not a cookie, not stored long-term, not linked to
              your profile. You can erase what’s stored in your browser anytime from
              the{" "}
              <Link
                href="/privacy"
                style={{ color: GOLD, textDecoration: "none", borderBottom: `1px solid ${GOLD_DIM}` }}
              >
                Your Data
              </Link>{" "}
              section of our Privacy Policy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
