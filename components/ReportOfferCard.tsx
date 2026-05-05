"use client";

import { useState } from "react";

type Props = {
  onGenerate: () => Promise<void>;
};

export default function ReportOfferCard({ onGenerate }: Props) {
  const [state, setState] = useState<"idle" | "generating" | "done" | "error">(
    "idle"
  );

  const handleClick = async () => {
    setState("generating");
    try {
      await onGenerate();
      setState("done");
    } catch {
      setState("error");
    }
  };

  const C = {
    gold: "rgba(201,168,76,1)",
    goldMid: "rgba(201,168,76,0.7)",
    goldDim: "rgba(201,168,76,0.35)",
    goldFaint: "rgba(201,168,76,0.08)",
    cream: "#f0e6d0",
    dim: "rgba(200,185,162,0.55)",
  };

  return (
    <div
      style={{
        margin: "1.5rem 0 0.5rem",
        padding: "1.75rem 2rem",
        border: `1px solid ${C.goldDim}`,
        background: C.goldFaint,
        maxWidth: 440,
      }}
    >
      {/* Top ornament */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            flex: 1,
            height: 1,
            background: `linear-gradient(to right, transparent, ${C.goldDim})`,
          }}
        />
        <span style={{ color: C.goldMid, fontSize: "0.6rem" }}>✦</span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: `linear-gradient(to left, transparent, ${C.goldDim})`,
          }}
        />
      </div>

      {/* Heading */}
      <p
        style={{
          fontFamily: "var(--font-cormorant)",
          fontStyle: "italic",
          fontSize: "1.15rem",
          color: C.cream,
          marginBottom: "0.5rem",
          lineHeight: 1.4,
        }}
      >
        Your style report is ready to compile.
      </p>

      {/* Description */}
      <p
        style={{
          fontFamily: "var(--font-jost)",
          fontSize: "0.62rem",
          letterSpacing: "0.04em",
          lineHeight: 1.65,
          color: C.dim,
          marginBottom: "1.5rem",
        }}
      >
        A personal document — your colour palette, wardrobe combinations, and
        brand directory across luxury, mid-luxury and affordable tiers.
      </p>

      {/* Button */}
      <button
        onClick={handleClick}
        disabled={state === "generating" || state === "done"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          background: "none",
          border: `1px solid ${state === "done" ? C.goldDim : C.goldMid}`,
          padding: "0.6rem 1.25rem",
          cursor:
            state === "generating" || state === "done" ? "default" : "pointer",
          opacity: state === "done" ? 0.5 : 1,
          transition: "all 0.3s",
        }}
      >
        {state === "generating" ? (
          <>
            <SpinnerIcon />
            <span
              style={{
                fontFamily: "var(--font-jost)",
                fontSize: "0.62rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: C.goldMid,
              }}
            >
              Compiling…
            </span>
          </>
        ) : state === "done" ? (
          <span
            style={{
              fontFamily: "var(--font-jost)",
              fontSize: "0.62rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: C.goldDim,
            }}
          >
            Downloaded ✓
          </span>
        ) : state === "error" ? (
          <span
            style={{
              fontFamily: "var(--font-jost)",
              fontSize: "0.62rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(220,80,60,0.8)",
            }}
          >
            Something went wrong — try again
          </span>
        ) : (
          <>
            <DownloadIcon />
            <span
              style={{
                fontFamily: "var(--font-jost)",
                fontSize: "0.62rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: C.gold,
              }}
            >
              Generate My Style Report
            </span>
          </>
        )}
      </button>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(201,168,76,0.9)"
      strokeWidth="1.5"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(201,168,76,0.7)"
      strokeWidth="2"
      style={{ animation: "spin 0.9s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
