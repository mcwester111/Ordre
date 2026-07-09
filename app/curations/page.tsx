"use client";

import Image from "next/image";
import SubPageHeader from "@/components/SubPageHeader";
import Footer from "@/components/Footer";

/* ── Tokens: dark (on japanese paper) ── */
const D = {
  ink:    "rgba(235,220,195,0.92)",
  muted:  "rgba(210,195,168,0.60)",
  dim:    "rgba(200,185,155,0.36)",
  line:   "rgba(200,170,110,0.18)",
  gold:   "#C8A96E",
  goldDim:"rgba(200,170,110,0.32)",
};

/* ── Tokens: light (on parchment) ── */
const L = {
  ink:    "#1A120A",
  muted:  "rgba(26,18,10,0.65)",
  gold:   "rgba(100,65,15,0.88)",
  goldDim:"rgba(100,65,15,0.22)",
};

const PX = "clamp(1.5rem, 5vw, 4rem)";

export default function CurationsPage() {
  return (
    <main className="relative min-h-screen flex flex-col">

      <SubPageHeader />

      {/* ════════════════════
          HERO — dark paper
      ════════════════════ */}
      <section style={{
        position: "relative",
        minHeight: "95vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/japanese-paper.png')",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        textAlign: "center",
        padding: `5rem ${PX} 7rem`,
        margin: "1.5rem 0",
      }}>
        <div style={{ maxWidth: "460px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Swan crest */}
          <div style={{
            width: "52px", height: "52px",
            borderRadius: "50%",
            border: `1px solid ${D.line}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "2.2rem",
          }}>
            <Image src="/swan-logo.png" alt="Ordre" width={28} height={20}
              style={{ objectFit: "contain", filter: "invert(1) brightness(0.75)" }} />
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
            fontWeight: 400,
            letterSpacing: "0.2em",
            color: D.ink,
            textTransform: "uppercase",
            lineHeight: 1,
            marginBottom: "2rem",
            userSelect: "none",
          }}>
            The Curations
          </h1>

          {/* Gold line */}
          <div style={{ width: "48px", height: "1px", background: D.goldDim, marginBottom: "2rem" }} />

          {/* Tagline */}
          <p style={{
            fontFamily: "var(--font-jost)",
            fontSize: "0.46rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: D.muted,
            lineHeight: 2.2,
            userSelect: "none",
            textAlign: "center",
          }}>
            Each wardrobe is a private commission.
            <br />Each edit, a considered act.
          </p>

          {/* Coming soon */}
          <div style={{ marginTop: "2.8rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "28px", height: "1px", background: D.goldDim }} />
            <p style={{
              fontFamily: "var(--font-jost)",
              fontSize: "0.4rem",
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              color: D.goldDim,
              userSelect: "none",
            }}>
              Coming Soon
            </p>
            <div style={{ width: "28px", height: "1px", background: D.goldDim }} />
          </div>

        </div>
      </section>

      {/* ════════════════════
          COMING SOON — parchment
      ════════════════════ */}
      <section style={{
        padding: `5rem ${PX} 7rem`,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.4rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <div style={{ width: "48px", height: "1px", background: L.goldDim }} />
          <p style={{
            fontFamily: "var(--font-jost)",
            fontSize: "0.42rem",
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            color: L.gold,
          }}>
            Coming Soon
          </p>
          <div style={{ width: "48px", height: "1px", background: L.goldDim }} />
        </div>
        <p style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
          fontStyle: "italic",
          color: L.muted,
          lineHeight: 1.65,
          maxWidth: "480px",
        }}>
          The curations are being prepared.
          <br />They will be ready for you shortly.
        </p>
      </section>

      <Footer />
    </main>
  );
}
