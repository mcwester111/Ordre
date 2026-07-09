"use client";

// Root error boundary. Catches unexpected runtime errors in any route and
// presents them in the Ordre register rather than a raw stack trace.

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for observability; replace with a logging service when one exists.
    console.error(error);
  }, [error]);

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center text-center"
      style={{ padding: "2rem" }}
    >
      <Image
        src="/swan-logo.png"
        alt="Ordre"
        width={88}
        height={64}
        style={{ objectFit: "contain", width: "88px", height: "auto", opacity: 0.9 }}
      />

      <p
        style={{
          fontFamily: "var(--font-jost)",
          fontSize: "0.5rem",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "rgba(100,65,15,0.7)",
          marginTop: "2.5rem",
        }}
      >
        Something went awry
      </p>

      <h1
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
          fontWeight: 400,
          fontStyle: "italic",
          color: "#1A120A",
          letterSpacing: "0.02em",
          lineHeight: 1.3,
          margin: "1rem 0 0",
          maxWidth: "30ch",
        }}
      >
        A thread came loose.
      </h1>

      <p
        style={{
          fontFamily: "var(--font-jost)",
          fontSize: "0.8rem",
          lineHeight: 1.9,
          color: "rgba(26,18,10,0.6)",
          marginTop: "1.2rem",
          maxWidth: "40ch",
        }}
      >
        An unexpected error occurred. You can try again, or return home and pick
        up where you left off.
      </p>

      <div
        style={{
          display: "flex",
          gap: "1.75rem",
          marginTop: "2.5rem",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <button
          onClick={reset}
          style={{
            fontFamily: "var(--font-jost)",
            fontSize: "0.55rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(26,18,10,0.85)",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid rgba(26,18,10,0.4)",
            paddingBottom: "2px",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-jost)",
            fontSize: "0.55rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(26,18,10,0.5)",
            textDecoration: "none",
            borderBottom: "1px solid rgba(26,18,10,0.25)",
            paddingBottom: "2px",
          }}
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
