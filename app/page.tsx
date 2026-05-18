"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { splashIsDone } from "@/lib/splash-signal";
import Footer from "@/components/Footer";


export default function LandingPage() {
  const swanRef    = useRef<HTMLDivElement>(null);
  const ordreRef   = useRef<HTMLImageElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const ctaRef     = useRef<HTMLDivElement>(null);
  const navRef     = useRef<HTMLElement>(null);

  // Use Web Animations API for explicit control. CSS keyframe animations
  // triggered by React class swaps were either being optimized away or
  // running before the browser painted the initial state. WAAPI gives us
  // direct, guaranteed control over each element's fade-in.
  //
  // All delays below are relative to when the splash screen disappears.
  // We wait for the "splash-done" custom event before starting anything,
  // or skip the wait if the splash already fired (client-side back-nav).
  //
  // The cleanup return is also critical: React 18 Strict Mode (active in dev)
  // runs every effect twice — mount → cleanup → mount again. Without cleanup,
  // ghost animations from the first run interfere with the second.
  useEffect(() => {
    // Gentle ease-in-out — symmetrical ramp so elements drift into existence
    // quietly rather than hesitating then rushing. Feels like candlelight
    // gradually filling a room rather than a reveal.
    const INK = "cubic-bezier(0.4, 0, 0.6, 1)";
    let active: Animation[] = [];

    const runAnimations = () => {
      active.forEach(a => a.cancel());
      active = [];

      const fade = (el: HTMLElement | null, delay: number, duration: number) => {
        if (!el) return;
        active.push(el.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration, delay, fill: "both", easing: INK }
        ));
      };

      // Shared emerge-from-paper effect — latent ink resolving out of the fibres.
      const emerge = (el: HTMLElement | null, delay: number, duration: number) => {
        if (!el) return;
        active.push(el.animate(
          [
            { opacity: 0, filter: "brightness(1.7) contrast(0.3)" },
            { opacity: 1, filter: "brightness(1)   contrast(1)"    },
          ],
          { duration, delay, fill: "both", easing: INK }
        ));
      };

      emerge(swanRef.current,    0,    700);  // swan
      emerge(ordreRef.current,   400, 1600);  // ORDRE
      emerge(taglineRef.current, 1700, 1200); // tagline
      emerge(ctaRef.current,     1700, 1200); // CTA + sign-in
      fade(navRef.current,       2000,  220); // nav
    };

    if (splashIsDone()) {
      // Client-side navigation (e.g. back from a sub-page): show everything
      // instantly — no fading. The splash already ran this session so there's
      // no reveal to perform. The nav especially must appear without animation.
      const show = (el: HTMLElement | null) => {
        if (!el) return;
        el.style.opacity = "1";
        el.style.filter  = "";
      };
      show(swanRef.current);
      show(ordreRef.current);
      show(taglineRef.current);
      show(ctaRef.current);
      show(navRef.current);
    } else {
      // First load: wait for the splash to signal it's gone, then animate.
      window.addEventListener("splash-done", runAnimations, { once: true });
    }

    return () => {
      window.removeEventListener("splash-done", runAnimations);
      active.forEach(a => a.cancel());
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col items-center">

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

      {/* Nav — emerges last. Matches the sub-page split layout exactly:
          ORDRE | ABOUT on the left, CURATIONS | JOURNAL | SIGN IN on the right.
          Start invisible so no flash before WAAPI takes over on first load. */}
      <header ref={navRef}
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-5"
        style={{ opacity: 0 }}>
        <nav className="flex items-center gap-8">
          {([
            { label: "ORDRE",     href: "/"          },
            { label: "ABOUT",     href: "/about"     },
            { label: "CURATIONS", href: "/curations" },
            { label: "JOURNAL",   href: "/journal"   },
          ] as const).map(({ label, href }) => (
            <Link key={label} href={href} style={{
              fontFamily: "var(--font-jost)",
              fontSize: "0.55rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: label === "ORDRE" ? "rgba(26,18,10,0.85)" : "rgba(26,18,10,0.5)",
              textDecoration: "none",
              borderBottom: label === "ORDRE" ? "1px solid rgba(26,18,10,0.4)" : "none",
              paddingBottom: label === "ORDRE" ? "2px" : "0",
            }}>
              {label}
            </Link>
          ))}
        </nav>
        <a href="/sign-in" style={{
          fontFamily: "var(--font-jost)",
          fontSize: "0.55rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(26,18,10,0.5)",
          textDecoration: "none",
        }}>
          SIGN IN
        </a>
      </header>

      {/* Centered content stack: swan + ORDRE, then tagline below.
          Each child has its own ref and opacity animation so they fade in
          independently while sharing the same centered vertical flow. */}
      <div className="flex-1 flex items-center justify-center w-full">
      <div className="relative flex flex-col items-center text-center">
        {/* Swan — emerges first. */}
        <div ref={swanRef}
          style={{ opacity: 0, filter: "brightness(1.7) contrast(0.3)", marginBottom: "1.5rem" }}>
          <Image
            src="/swan-logo.png"
            alt="Ordre"
            width={160}
            height={115}
            placeholder="empty"
            style={{ objectFit: "contain", width: "160px", height: "auto", display: "block", margin: "0 auto" }}
          />
        </div>

        {/* ORDRE — single wordmark that emerges from the paper like latent ink. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={ordreRef}
          src="/webfont3e.png"
          alt="ORDRE"
          style={{
            width: "100%",
            maxWidth: "min(95vw, 900px)",
            height: "auto",
            display: "block",
            // Match animation "from" state so there's no flash before WAAPI takes over.
            opacity: 0,
            filter: "brightness(1.7) contrast(0.3)",
          }}
        />

        {/* Tagline — sits below ORDRE in flow, fades in next */}
        <div ref={taglineRef}
          className="flex flex-col items-center px-6"
          style={{ opacity: 0, filter: "brightness(1.7) contrast(0.3)", marginTop: "2.5rem" }}>
        <p style={{
          fontFamily: "var(--font-jost), sans-serif",
          fontSize: "0.62rem",
          fontWeight: 400,
          color: "rgba(55,38,12,0.78)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          lineHeight: 1.9,
          maxWidth: "440px",
        }}>
          A private atelier for personal styling and curation
        </p>
        </div>

        {/* CTA — emerges third, in flow below the tagline */}
        <div ref={ctaRef}
          className="flex flex-col items-center"
          style={{ opacity: 0, filter: "brightness(1.7) contrast(0.3)", marginTop: "2.75rem" }}>
          <Link
            href="/curator"
            className="group relative inline-flex items-center"
            style={{ borderRadius: "2px" }}
          >
            {/* Soft outer drop shadow — always present, gives the button a quiet
                sit-on-paper presence with no harsh edge. */}
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: "2px",
                boxShadow: "0 8px 22px -10px rgba(35,18,5,0.42), 0 2px 6px -2px rgba(35,18,5,0.18)",
              }}
            />
            {/* Outer candlelight glow — fades in on hover as a warm halo. */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[900ms] ease-out pointer-events-none"
              style={{
                borderRadius: "2px",
                boxShadow: "0 0 42px -2px rgba(190,115,40,0.42), 0 0 90px -10px rgba(165,90,25,0.22), 0 10px 28px -10px rgba(35,18,5,0.45)",
              }}
            />
            {/* Translucent dark base + pressed-lacquer inner shadow. The slight
                translucency lets the parchment whisper through. */}
            <span
              className="absolute inset-0"
              style={{
                background: "rgba(20,12,5,0.86)",
                borderRadius: "2px",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.55), inset 0 -1px 1px rgba(220,170,90,0.06), inset 0 0 0 1px rgba(0,0,0,0.18)",
              }}
            />
            {/* Subtle paper-grain overlay so the surface reads as printed lacquer
                on textured stock rather than flat fill. */}
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "url('/paper.png')",
                backgroundSize: "220%",
                backgroundPosition: "center",
                mixBlendMode: "overlay",
                opacity: 0.32,
                borderRadius: "2px",
              }}
            />
            {/* Candlelight wash — a radial warmth that bleeds in from the center
                on hover, like a candle being brought close to lacquer. */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[900ms] ease-out pointer-events-none"
              style={{
                background: "radial-gradient(130% 220% at center, rgba(200,125,45,0.42), rgba(165,90,25,0.16) 45%, transparent 82%)",
                borderRadius: "2px",
              }}
            />
            <span
              className="relative tracking-[0.34em] uppercase transition-colors duration-700 text-center"
              style={{
                padding: "0.7rem 3.5rem",
                fontFamily: "var(--font-jost)",
                fontSize: "0.56rem",
                fontWeight: 400,
                color: "rgba(245,238,220,0.92)",
              }}
            >
              Begin Your Curation
            </span>
          </Link>
          <a href="/sign-in" style={{
            marginTop: "1.25rem",
            fontFamily: "var(--font-jost)",
            fontSize: "0.5rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(90,60,25,0.65)",
            textDecoration: "none",
            borderBottom: "1px solid rgba(90,60,25,0.35)",
            paddingBottom: "1px",
          }}>
            Already a client? Sign in
          </a>
        </div>
      </div>
      </div>

      <Footer />
    </main>
  );
}
