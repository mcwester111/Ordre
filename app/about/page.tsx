"use client";

import Image from "next/image";
import SubPageHeader from "@/components/SubPageHeader";
import Footer from "@/components/Footer";

const D = {
  ink:    "rgba(235,220,195,0.92)",
  muted:  "rgba(210,195,168,0.60)",
  line:   "rgba(200,170,110,0.18)",
  goldDim:"rgba(200,170,110,0.32)",
};

const L = {
  muted:  "rgba(26,18,10,0.65)",
  gold:   "rgba(100,65,15,0.88)",
  goldDim:"rgba(100,65,15,0.22)",
};

const PX = "clamp(1.5rem, 5vw, 4rem)";

export default function AboutPage() {
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
        padding: `4rem ${PX} 6rem`,
        margin: "1.5rem 0",
      }}>
        <div style={{ maxWidth: "420px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

          <div style={{
            width: "52px", height: "52px",
            border: `1px solid ${D.line}`,
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "2.2rem",
          }}>
            <Image src="/swan-logo.png" alt="Ordre" width={28} height={20} style={{ objectFit: "contain" }} />
          </div>

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
            About Ordre
          </h1>

          <div style={{ width: "50px", height: "1px", background: D.goldDim, marginBottom: "2rem" }} />

          <p style={{
            fontFamily: "var(--font-jost)",
            fontSize: "0.44rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: D.muted,
            lineHeight: 2.2,
            userSelect: "none",
          }}>
            A private atelier for personal styling
            <br />Powered by intelligence. Rooted in taste.
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
          Our story is being written.
          <br />It will be ready for you shortly.
        </p>
      </section>

      <Footer />
    </main>
  );
}
