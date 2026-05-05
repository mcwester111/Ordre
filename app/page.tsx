"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">

      {/* Feather photo background */}
      <Image
        src="/feathers1.png"
        alt=""
        fill
        priority
        className="object-cover object-center"
        style={{ zIndex: 0 }}
      />

      {/* Shimmer sweep — strictly behind content (z:1 vs content z:10) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 1,
          overflow: "hidden",
          /* Fade shimmer out in the centre where text lives */
          maskImage: "radial-gradient(ellipse 55% 60% at 50% 50%, transparent 30%, black 65%)",
          WebkitMaskImage: "radial-gradient(ellipse 55% 60% at 50% 50%, transparent 30%, black 65%)",
        }}
      >
        <div style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "60%",
          transform: "skewX(-12deg)",
          background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.32) 50%, rgba(255,255,255,0.18) 70%, transparent 100%)",
          animation: "feather-shimmer 15s ease-in-out infinite",
        }} />
      </div>

      {/* Dark vignette overlay — deepens centre so text is legible */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 1,
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(4,3,2,0.52) 0%, rgba(4,3,2,0.75) 100%)",
        }}
      />

      {/* Edge vignette for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 1,
          background:
            "linear-gradient(to bottom, rgba(4,3,2,0.45) 0%, transparent 20%, transparent 80%, rgba(4,3,2,0.55) 100%)",
        }}
      />

      {/* Eyebrow — pinned to top */}
      <div className="absolute top-8 left-0 right-0 z-10 flex flex-col items-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <p className="font-sans text-[0.65rem] tracking-[0.4em] uppercase"
          style={{ color: "rgba(201,168,76,0.7)" }}>
          Fashion Intelligence
        </p>
        <p style={{
          fontFamily: "var(--font-cormorant)",
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: "0.85rem",
          letterSpacing: "0.12em",
          color: "rgba(201,168,76,0.85)",
          marginTop: "0.25rem",
        }}>
          by Madeleine Claire
        </p>
      </div>

      {/* Horizontal gold rules */}
      <div className="absolute top-0 left-0 right-0 h-px z-10"
        style={{ background: "linear-gradient(to right, transparent, rgba(201,168,76,0.5) 20%, rgba(201,168,76,0.5) 80%, transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px z-10"
        style={{ background: "linear-gradient(to right, transparent, rgba(201,168,76,0.5) 20%, rgba(201,168,76,0.5) 80%, transparent)" }} />
      {/* Vertical gold rules */}
      <div className="absolute top-0 bottom-0 left-0 w-px z-10"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.28) 20%, rgba(201,168,76,0.28) 80%, transparent)" }} />
      <div className="absolute top-0 bottom-0 right-0 w-px z-10"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.28) 20%, rgba(201,168,76,0.28) 80%, transparent)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">


        {/* Top ornament */}
        <div className="flex items-center gap-3 mb-6 w-96 max-w-full animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,168,76,0.5))" }} />
          <span style={{ color: "rgba(201,168,76,0.8)", fontSize: 11 }}>✦</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(201,168,76,0.5))" }} />
        </div>

        {/* Logotype */}
        <div className="relative w-full" style={{ overflow: "visible" }}>
        <h1
          className="leading-none animate-fade-in text-center w-full"
          style={{
            fontFamily: "Zyntro, serif",
            fontSize: "clamp(5rem, 16vw, 14rem)",
            fontWeight: 400,
            fontVariant: "normal",
            fontFeatureSettings: "'smcp' 0, 'c2sc' 0",
            color: "#f0e6d0",
            animationDelay: "0.3s",
            textShadow: "0 2px 40px rgba(0,0,0,0.8)",
            letterSpacing: "0.02em",
          }}
        >
          ORDRE<span style={{ fontSize: "0.45em", verticalAlign: "baseline" }}>.</span>
        </h1>
        </div>

        {/* Bottom ornament */}
        <div className="flex items-center gap-3 mt-6 mb-6 w-96 max-w-full animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(201,168,76,0.5))" }} />
          <span style={{ color: "rgba(201,168,76,0.8)", fontSize: 11 }}>✦</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(201,168,76,0.5))" }} />
        </div>

        {/* Tagline */}
        <p
          className="font-serif mb-5 animate-fade-in"
          style={{
            color: "#e8d5a0",
            animationDelay: "0.5s",
            textShadow: "0 1px 20px rgba(0,0,0,0.6)",
            fontSize: "clamp(1.5rem, 2.8vw, 2.1rem)",
          }}
        >
          Your aesthetic, articulated.
        </p>

        {/* Description */}
        <p
          className="font-sans font-light text-sm tracking-wide max-w-xs mb-14 leading-relaxed animate-fade-in"
          style={{ color: "rgba(220,205,180,0.65)", animationDelay: "0.65s" }}
        >
          Describe a feeling. Share a reference.<br />
          Receive a style direction that is precisely,<br />
          unmistakably yours.
        </p>

        {/* CTA */}
        <Link
          href="/curator"
          className="group relative inline-flex items-center gap-3 animate-fade-in"
          style={{ animationDelay: "0.8s" }}
        >
          {/* Resting state — light gold fill + subtle border */}
          <span className="absolute inset-0 transition-all duration-500"
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.45)",
            }} />
          {/* Hover state — stronger fill + glow */}
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
            style={{
              background: "rgba(201,168,76,0.18)",
              border: "1px solid rgba(201,168,76,0.9)",
            }} />
          <span className="relative px-8 py-3 tracking-[0.3em] uppercase transition-colors duration-300 text-center"
            style={{
              fontFamily: "Zyntro, sans-serif",
              fontSize: "0.75rem",
              fontWeight: 400,
              color: "rgba(201,168,76,0.9)",
            }}>
            Begin Your Curation
          </span>
        </Link>

      </div>
    </main>
  );
}
