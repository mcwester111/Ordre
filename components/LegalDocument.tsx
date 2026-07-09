"use client";

// Shared layout for the long-form legal pages (Terms, Privacy). Keeps both
// documents visually identical and easy to maintain: a single column of
// parchment-coloured prose, Cormorant section headings, Jost body, gold
// hairlines. Content is passed in as a structured array so the page files
// stay readable and the rendering stays consistent.

import React from "react";

const INK = "#1A120A";
const BODY = "rgba(26,18,10,0.74)";
const MUTED = "rgba(26,18,10,0.52)";
const GOLD = "rgba(100,65,15,0.85)";
const GOLD_DIM = "rgba(100,65,15,0.2)";
const LINE = "rgba(100,65,15,0.16)";

const PX = "clamp(1.5rem, 6vw, 3rem)";

// ── Content model ───────────────────────────────────────────────────────────
export type Block =
  | { p: string }            // a paragraph (supports **bold** lead-ins)
  | { sub: string }          // a sub-heading inside a section
  | { list: string[] };      // a bulleted list (each item supports **bold**)

export type Section = {
  title: string;
  blocks: Block[];
};

export type LegalContent = {
  title: string;
  updated: string;          // human-readable "last updated" date
  intro: Block[];           // lead-in paragraphs above the numbered sections
  sections: Section[];
};

// Render **bold** spans inside otherwise-plain legal text.
function rich(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ fontWeight: 600, color: INK }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if ("sub" in b) {
          return (
            <h3
              key={i}
              style={{
                fontFamily: "var(--font-jost)",
                fontSize: "0.62rem",
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: GOLD,
                margin: "1.6rem 0 0.7rem",
              }}
            >
              {b.sub}
            </h3>
          );
        }
        if ("list" in b) {
          return (
            <ul
              key={i}
              style={{
                listStyle: "none",
                margin: "0.4rem 0 1rem",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.55rem",
              }}
            >
              {b.list.map((item, j) => (
                <li
                  key={j}
                  style={{
                    position: "relative",
                    paddingLeft: "1.1rem",
                    fontFamily: "var(--font-jost)",
                    fontSize: "0.82rem",
                    lineHeight: 1.8,
                    color: BODY,
                    letterSpacing: "0.01em",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "0.62em",
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: GOLD_DIM,
                    }}
                  />
                  {rich(item)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={i}
            style={{
              fontFamily: "var(--font-jost)",
              fontSize: "0.82rem",
              lineHeight: 1.95,
              color: BODY,
              letterSpacing: "0.01em",
              margin: "0 0 1rem",
            }}
          >
            {rich(b.p)}
          </p>
        );
      })}
    </>
  );
}

export default function LegalDocument({ content }: { content: LegalContent }) {
  return (
    <article
      style={{
        maxWidth: "720px",
        width: "100%",
        margin: "0 auto",
        padding: `clamp(2.5rem, 7vh, 5rem) ${PX} 5rem`,
      }}
    >
      {/* Title block */}
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(1.7rem, 4.5vw, 2.7rem)",
            fontWeight: 400,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: INK,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {content.title}
        </h1>
        <div
          style={{
            width: "50px",
            height: "1px",
            background: GOLD_DIM,
            margin: "1.5rem auto",
          }}
        />
        <p
          style={{
            fontFamily: "var(--font-jost)",
            fontSize: "0.5rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: MUTED,
            margin: 0,
          }}
        >
          Last updated · {content.updated}
        </p>
      </header>

      {/* Intro */}
      <div style={{ marginBottom: "2.5rem" }}>
        <Blocks blocks={content.intro} />
      </div>

      {/* Numbered sections */}
      {content.sections.map((s, i) => (
        <section key={i} style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-jost)",
                fontSize: "0.6rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: GOLD,
                flexShrink: 0,
                position: "relative",
                top: "-0.15em",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(1.2rem, 2.6vw, 1.55rem)",
                fontWeight: 500,
                letterSpacing: "0.02em",
                color: INK,
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {s.title}
            </h2>
          </div>
          <div style={{ paddingLeft: "0" }}>
            <Blocks blocks={s.blocks} />
          </div>
          {i < content.sections.length - 1 && (
            <div
              style={{
                width: "100%",
                height: "1px",
                background: LINE,
                marginTop: "2.5rem",
              }}
            />
          )}
        </section>
      ))}
    </article>
  );
}
