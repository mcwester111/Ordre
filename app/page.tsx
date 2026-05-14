"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center"
    >

{/* Horizontal rules */}
      <div className="absolute top-0 left-0 right-0 h-px z-10"
        style={{ background: "linear-gradient(to right, transparent, rgba(110,80,40,0.3) 20%, rgba(110,80,40,0.3) 80%, transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px z-10"
        style={{ background: "linear-gradient(to right, transparent, rgba(110,80,40,0.3) 20%, rgba(110,80,40,0.3) 80%, transparent)" }} />
      {/* Vertical rules */}
      <div className="absolute top-0 bottom-0 left-0 w-px z-10"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(110,80,40,0.15) 20%, rgba(110,80,40,0.15) 80%, transparent)" }} />
      <div className="absolute top-0 bottom-0 right-0 w-px z-10"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(110,80,40,0.15) 20%, rgba(110,80,40,0.15) 80%, transparent)" }} />


      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">

        {/* Swan logo with raised stamp */}
        <div style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "center", width: "100%" }}>
          <Image
            src="/swan-logo.png"
            alt="Ordre"
            width={370}
            height={370}
            style={{ objectFit: "contain", display: "block", margin: "0 auto", mixBlendMode: "multiply" }}
          />
        </div>

        {/* Logotype */}
        <div className="w-full" style={{ marginBottom: "0.25rem" }}>
          <Image
            src="/embossedfont2.png"
            alt="ORDRE."
            width={2107}
            height={746}
            style={{ width: "100%", height: "auto", maxWidth: "700px", display: "block", margin: "0 auto" }}
          />
        </div>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "var(--font-cormorant)",
            fontStyle: "italic",
            color: "#2C1E0F",
            fontSize: "clamp(1.4rem, 2.6vw, 2rem)",
            marginBottom: "1rem",
          }}
        >
          Your aesthetic, articulated.
        </p>

        {/* Description */}
        <p
          className="font-sans font-light text-sm tracking-wide max-w-xs mb-14 leading-relaxed"
          style={{ color: "rgba(55,35,15,0.5)" }}
        >
          Describe a feeling. Share a reference.<br />
          Receive a style direction that is precisely,<br />
          unmistakably yours.
        </p>

        {/* CTA */}
        <Link
          href="/curator"
          className="group relative inline-flex items-center gap-3"
        >
          <span className="absolute inset-0 transition-all duration-500"
            style={{ background: "#1A120A", border: "1px solid #1A120A" }} />
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
            style={{ background: "#2C1E0F", border: "1px solid #2C1E0F" }} />
          <span className="relative px-10 py-3.5 tracking-[0.3em] uppercase transition-colors duration-300 text-center"
            style={{ fontFamily: "var(--font-jost)", fontSize: "0.6rem", fontWeight: 400, color: "#F5F0E8" }}>
            Begin Your Curation
          </span>
        </Link>

        {/* Sign in */}
        <a href="#" style={{
          marginTop: "1.25rem",
          fontFamily: "var(--font-jost)",
          fontSize: "0.5rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(90,60,25,0.45)",
          textDecoration: "none",
          borderBottom: "1px solid rgba(90,60,25,0.2)",
          paddingBottom: "1px",
        }}>
          Already a client? Sign in
        </a>

      </div>
    </main>
  );
}
