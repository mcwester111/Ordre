"use client";

// The client's Profile, opened from the curator header. Gated by a (local)
// account: signed out → invite to create an account; signed in → a curated
// profile where the client can give the stylist standing direction (preferred
// name, houses they love, things to keep in mind, things to avoid). Those notes
// are persisted and fed into every curator request.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AiNotes, EMPTY_NOTES, saveAiNotes } from "@/lib/account";
import { loadNotesFromSupabase, saveNotesToSupabase, loadAvatarFromSupabase, saveAvatarToSupabase } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/components/ProfileIntake";
import { buildProfileDescription } from "@/components/ProfileIntake";

const INK = "#1A120A";
const BODY = "rgba(26,18,10,0.74)";
const MUTED = "rgba(26,18,10,0.5)";
const GOLD = "rgba(100,65,15,0.85)";
const GOLD_DIM = "rgba(100,65,15,0.22)";
const LINE = "rgba(100,65,15,0.16)";

const LABEL: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-jost)",
  fontSize: "0.56rem",
  fontWeight: 600,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: GOLD,
  marginBottom: "0.5rem",
};

// ── Archetypal symbols ───────────────────────────────────────────────────────
type SymbolDef = { id: string; name: string; paths: React.ReactNode };

const SYMBOLS: SymbolDef[] = [
  {
    id: "crown",
    name: "Crown",
    paths: (
      <>
        <path d="M5 24 L5 13 L10 18 L16 5 L22 18 L27 13 L27 24 Z" strokeLinejoin="round" />
        <line x1="5" y1="27" x2="27" y2="27" />
      </>
    ),
  },
  {
    id: "moon",
    name: "Crescent",
    paths: <path d="M20 6 A11 11 0 1 0 20 26 A9 9 0 1 1 20 6 Z" />,
  },
  {
    id: "bloom",
    name: "Bloom",
    paths: (
      <>
        <ellipse cx="16" cy="10" rx="2.8" ry="5.5" />
        <ellipse cx="16" cy="22" rx="2.8" ry="5.5" />
        <ellipse cx="10" cy="16" rx="5.5" ry="2.8" />
        <ellipse cx="22" cy="16" rx="5.5" ry="2.8" />
        <circle cx="16" cy="16" r="3.2" />
      </>
    ),
  },
  {
    id: "swan",
    name: "Swan",
    paths: (
      <>
        <path d="M8 23 C8 20 11 18 16 18 C21 18 24 20 24 23 C24 26 21 28 16 28 C11 28 8 26 8 23 Z" />
        <path d="M10 21 C7 17 8 11 12 9 C14 8 16 9 16 11 C16 13 14 15 13 18" strokeLinecap="round" />
        <circle cx="13" cy="8" r="2.5" />
        <path d="M11.5 7.5 L9 8" strokeLinecap="round" strokeWidth="1.4" />
      </>
    ),
  },
  {
    id: "feather",
    name: "Feather",
    paths: (
      <>
        <path d="M16 28 C10 22 9 13 13 6 C15 3 19 3 21 6 C23 10 22 19 16 28 Z" strokeLinejoin="round" />
        <line x1="16" y1="28" x2="16" y2="7" strokeWidth="0.8" />
        <path d="M16 12 C18.5 11 20 12.5 20 14.5" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M16 17 C18.5 16 20 17.5 20 19.5" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M16 12 C13.5 11 12 12.5 12 14.5" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M16 17 C13.5 16 12 17.5 12 19.5" strokeWidth="0.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "antler",
    name: "Antler",
    paths: (
      <>
        <line x1="16" y1="28" x2="16" y2="17" strokeLinecap="round" />
        <path d="M16 17 L10 11 L7 5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 11 L8 14" strokeLinecap="round" />
        <path d="M10 11 L13 9" strokeLinecap="round" />
        <path d="M16 17 L22 11 L25 5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 11 L24 14" strokeLinecap="round" />
        <path d="M22 11 L19 9" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "serpent",
    name: "Serpent",
    paths: (
      <>
        <path d="M13 8 C7 8 5 13 8 17 C11 21 17 19 18 23 C19 27 17 30 13 29" strokeLinecap="round" />
        <circle cx="13" cy="6.5" r="2.5" />
        <path d="M11.5 5 L9.5 3" strokeLinecap="round" />
        <path d="M14.5 5 L16.5 3" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "fleur",
    name: "Fleur de Lis",
    paths: (
      <>
        <path d="M16 5 C14 9 13.5 13 16 15 C18.5 13 18 9 16 5 Z" strokeLinejoin="round" />
        <path d="M16 15 C20 13 24 14 23 18 C22 22 18 21 16 17 C14 21 10 22 9 18 C8 14 12 13 16 15 Z" strokeLinejoin="round" />
        <path d="M13.5 24 L13.5 21.5 C13.5 19.5 14.5 18 16 17 C17.5 18 18.5 19.5 18.5 21.5 L18.5 24" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="27" x2="20" y2="27" />
      </>
    ),
  },
  {
    id: "star",
    name: "Star",
    paths: (
      <path
        d="M16 4 L18.5 13.5 L28 16 L18.5 18.5 L16 28 L13.5 18.5 L4 16 L13.5 13.5 Z"
        strokeLinejoin="round"
      />
    ),
  },
  {
    id: "key",
    name: "Key",
    paths: (
      <>
        <circle cx="16" cy="11" r="6" />
        <circle cx="16" cy="11" r="3" />
        <line x1="16" y1="17" x2="16" y2="28" />
        <line x1="16" y1="22" x2="20" y2="22" />
        <line x1="16" y1="25" x2="19" y2="25" />
      </>
    ),
  },
  {
    id: "butterfly",
    name: "Butterfly",
    paths: (
      <>
        <path d="M16 10 C14 4 4 3 5 10 C6 15 11 16 16 18" strokeLinecap="round" />
        <path d="M16 10 C18 4 28 3 27 10 C26 15 21 16 16 18" strokeLinecap="round" />
        <path d="M16 18 C13 20 5 22 6 18 C7 15 12 17 16 18" strokeLinecap="round" />
        <path d="M16 18 C19 20 27 22 26 18 C25 15 20 17 16 18" strokeLinecap="round" />
        <line x1="16" y1="9" x2="16" y2="19" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "eye",
    name: "Eye",
    paths: (
      <>
        <path d="M4 16 Q16 5 28 16 Q16 27 4 16 Z" strokeLinejoin="round" />
        <circle cx="16" cy="16" r="5.5" />
        <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      </>
    ),
  },
  {
    id: "lotus",
    name: "Lotus",
    paths: (
      <>
        <path d="M16 22 C14 18 14 12 16 8 C18 12 18 18 16 22 Z" strokeLinejoin="round" />
        <path d="M16 22 C12 18 7 17 7 12 C10 13 14 17 16 22 Z" strokeLinejoin="round" />
        <path d="M16 22 C20 18 25 17 25 12 C22 13 18 17 16 22 Z" strokeLinejoin="round" />
        <path d="M16 22 C11 22 6 20 7 16 C9 17 13 20 16 22 Z" strokeLinejoin="round" />
        <path d="M16 22 C21 22 26 20 25 16 C23 17 19 20 16 22 Z" strokeLinejoin="round" />
        <line x1="10" y1="25" x2="22" y2="25" />
      </>
    ),
  },
  {
    id: "diamond",
    name: "Diamond",
    paths: (
      <>
        <path d="M16 4 L28 16 L16 28 L4 16 Z" strokeLinejoin="round" />
        <path d="M8 12 L16 4 L24 12" strokeLinejoin="round" strokeWidth="0.7" />
        <line x1="8" y1="12" x2="24" y2="12" strokeWidth="0.7" />
      </>
    ),
  },
  {
    id: "compass",
    name: "Compass",
    paths: (
      <>
        <path
          d="M16 4 L18.5 13.5 L28 16 L18.5 18.5 L16 28 L13.5 18.5 L4 16 L13.5 13.5 Z"
          strokeLinejoin="round"
        />
        <path d="M10.3 10.3 L13.5 13.5 M21.7 10.3 L18.5 13.5 M21.7 21.7 L18.5 18.5 M10.3 21.7 L13.5 18.5" strokeWidth="0.7" />
        <circle cx="16" cy="16" r="2" />
      </>
    ),
  },
];

type AvatarLabel = "name" | "initial" | "none";

function SymbolSvg({
  symbol,
  size,
  color,
}: {
  symbol: SymbolDef;
  size: number;
  color: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.15"
      style={{ color, display: "block" }}
    >
      {symbol.paths}
    </svg>
  );
}

const FIELD_BASE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.35)",
  border: `1px solid ${LINE}`,
  borderRadius: 9,
  padding: "0.7rem 0.85rem",
  fontFamily: "var(--font-inter)",
  fontSize: "0.9rem",
  color: INK,
  outline: "none",
  resize: "none" as const,
  lineHeight: 1.55,
};

type NoteField = {
  key: keyof AiNotes;
  label: string;
  placeholder: string;
  rows: number;
};

const NOTE_FIELDS: NoteField[] = [
  { key: "preferredName", label: "What should we call you?", placeholder: "e.g. Call me Margot", rows: 1 },
  { key: "loves", label: "Houses, designers & pieces you love", placeholder: "e.g. Remember I love Chanel, The Row, and anything in camel.", rows: 2 },
  { key: "notes", label: "Anything to always keep in mind", placeholder: "e.g. I dress for cold weather most of the year, and I prefer flats.", rows: 2 },
  { key: "avoid", label: "Anything to avoid", placeholder: "e.g. Never suggest fast fashion or visible logos.", rows: 2 },
];

export default function ProfilePanel({
  userProfile,
  onClose,
  onRefineAesthetic,
  onNotesChange,
}: {
  userProfile: UserProfile | null;
  onClose: () => void;
  onRefineAesthetic: () => void;
  onNotesChange: (notes: AiNotes) => void;
}) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [notes, setNotes] = useState<AiNotes>(EMPTY_NOTES);
  const [savedFlash, setSavedFlash] = useState(false);
  const [avatarSymbol, setAvatarSymbol] = useState<string>("none");
  const [avatarLabel, setAvatarLabel] = useState<AvatarLabel>("initial");

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.name ?? user.email ?? null);
        const fromSupabase = await loadNotesFromSupabase();
        if (fromSupabase) setNotes(fromSupabase);
        const avatar = await loadAvatarFromSupabase();
        if (avatar) {
          setAvatarSymbol(avatar.symbol);
          setAvatarLabel(avatar.label as AvatarLabel);
        }
      }
      setLoaded(true);
    }
    load();
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);


  const persist = (next: AiNotes) => {
    saveAiNotes(next);           // keep localStorage in sync for guests/speed
    saveNotesToSupabase(next);   // fire-and-forget
    onNotesChange(next);
    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 1800);
  };

  const persistAvatar = (symbol: string, label: AvatarLabel) => {
    saveAvatarToSupabase({ symbol, label });
  };

  const updateField = (key: keyof AiNotes, value: string) =>
    setNotes((n) => ({ ...n, [key]: value }));

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserName(null);
    router.push("/");
    router.refresh();
  };

  const aesthetic = userProfile ? buildProfileDescription(userProfile) : "";
  const firstName = userName?.trim().split(/\s+/)[0] ?? "";

  return (
    <div
      role="dialog"
      aria-label="Your profile"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        // Match the curator's chat background — the Ordre stationery card.
        backgroundColor: "rgb(245,240,232)",
        backgroundImage: "url('/backgroundchat.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        overflowY: "auto",
        animation: "fadeInOverlay 0.3s ease both",
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close profile"
        style={{
          position: "fixed",
          top: "1.2rem",
          right: "1.4rem",
          zIndex: 2,
          background: "none",
          border: "none",
          fontFamily: "var(--font-cormorant)",
          fontSize: "1.5rem",
          lineHeight: 1,
          color: MUTED,
          cursor: "pointer",
          padding: "4px 8px",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = INK)}
        onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
      >
        ✕
      </button>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "clamp(3rem, 9vh, 5.5rem) 1.5rem 4rem" }}>
        {/* Crest */}
        <div style={{ textAlign: "center", marginBottom: "2.4rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/swan-logo.png" alt="Ordre" style={{ width: 52, height: "auto", margin: "0 auto", display: "block" }} />
          <h1
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(1.7rem, 5vw, 2.4rem)",
              fontWeight: 400,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: INK,
              margin: "1.2rem 0 0",
            }}
          >
            Your Profile
          </h1>
          <div style={{ width: 46, height: 1, background: GOLD_DIM, margin: "1.2rem auto 0" }} />
        </div>

        {!loaded ? null : !userName ? (
          // ───────── Signed out: invite to sign in ─────────
          <div style={{ textAlign: "center" }}>
            <p style={{
              fontFamily: "var(--font-jost)",
              fontSize: "0.84rem",
              lineHeight: 1.9,
              color: BODY,
              marginBottom: "2rem",
            }}>
              Sign in to save your aesthetic profile and give your stylist
              standing direction — the houses you love, how to address you,
              and what to keep in mind.
            </p>
            <Link
              href="/sign-in"
              style={{
                fontFamily: "var(--font-jost)",
                fontSize: "0.62rem",
                fontWeight: 600,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "#F5F0E8",
                background: INK,
                borderRadius: 8,
                padding: "0.9rem 1.8rem",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Sign In
            </Link>
          </div>
        ) : (
          // ───────── Signed in: the curated profile ─────────
          <div>
            <p
              style={{
                fontFamily: "var(--font-cormorant)",
                fontStyle: "italic",
                fontSize: "1.25rem",
                color: INK,
                textAlign: "center",
                marginBottom: "2.6rem",
              }}
            >
              {firstName ? `Welcome, ${firstName}.` : "Welcome."}
            </p>

            {/* ── Your Mark ── */}
            <section style={{ marginBottom: "2.6rem" }}>
              <h2 style={{ ...LABEL, color: INK, fontSize: "0.6rem", letterSpacing: "0.16em", marginBottom: "1rem" }}>
                Your Mark
              </h2>

              {/* Stamp preview */}
              {avatarSymbol !== "none" && (() => {
                const sym = SYMBOLS.find((s) => s.id === avatarSymbol);
                const stampLabel =
                  avatarLabel === "name"
                    ? firstName
                    : avatarLabel === "initial"
                    ? firstName.charAt(0).toUpperCase() + "."
                    : null;
                return sym ? (
                  <div style={{ textAlign: "center", marginBottom: "1.4rem" }}>
                    <SymbolSvg symbol={sym} size={52} color={GOLD} />
                    {stampLabel && (
                      <p style={{
                        fontFamily: "var(--font-cormorant)",
                        fontStyle: "italic",
                        fontSize: "0.9rem",
                        color: INK,
                        marginTop: "0.4rem",
                        letterSpacing: "0.06em",
                      }}>
                        {stampLabel}
                      </p>
                    )}
                  </div>
                ) : null;
              })()}

              {/* Symbol grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "0.45rem",
              }}>
                {SYMBOLS.map((sym) => {
                  const selected = avatarSymbol === sym.id;
                  return (
                    <button
                      key={sym.id}
                      title={sym.name}
                      onClick={() => {
                        const next = selected ? "none" : sym.id;
                        setAvatarSymbol(next);
                        persistAvatar(next, avatarLabel);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        aspectRatio: "1",
                        background: selected ? "rgba(100,65,15,0.08)" : "rgba(255,255,255,0.28)",
                        border: `1px solid ${selected ? "rgba(100,65,15,0.55)" : LINE}`,
                        borderRadius: 5,
                        cursor: "pointer",
                        padding: "0.35rem",
                        transition: "border-color 0.18s ease, background 0.18s ease",
                      }}
                    >
                      <SymbolSvg
                        symbol={sym}
                        size={21}
                        color={selected ? GOLD : MUTED}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Label toggle */}
              {avatarSymbol !== "none" && (
                <div style={{ display: "flex", gap: "1.2rem", justifyContent: "center", marginTop: "0.9rem" }}>
                  {(["name", "initial", "none"] as AvatarLabel[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setAvatarLabel(opt);
                        persistAvatar(avatarSymbol, opt);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "0 0 2px",
                        fontFamily: "var(--font-jost)",
                        fontSize: "0.5rem",
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: avatarLabel === opt ? INK : MUTED,
                        borderBottom: `1px solid ${avatarLabel === opt ? GOLD_DIM : "transparent"}`,
                        cursor: "pointer",
                        transition: "color 0.18s ease",
                      }}
                    >
                      {opt === "name" ? "Full Name" : opt === "initial" ? "Initial" : "No Label"}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Aesthetic summary */}
            <section style={{ marginBottom: "2.6rem" }}>
              <h2 style={LABEL}>Your Aesthetic</h2>
              <div
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 10,
                  padding: "1rem 1.1rem",
                  background: "rgba(255,255,255,0.22)",
                }}
              >
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", lineHeight: 1.85, color: BODY, margin: 0 }}>
                  {aesthetic
                    ? aesthetic.replace(/^Client profile — /, "").replace(/\.$/, "")
                    : "You haven't completed your aesthetic profile yet."}
                </p>
                <button
                  onClick={onRefineAesthetic}
                  style={{
                    marginTop: "0.9rem",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontFamily: "var(--font-jost)",
                    fontSize: "0.56rem",
                    fontWeight: 600,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: GOLD,
                    borderBottom: `1px solid ${GOLD_DIM}`,
                    paddingBottom: 2,
                  }}
                >
                  {aesthetic ? "Refine aesthetic" : "Complete aesthetic profile"}
                </button>
              </div>
            </section>

            {/* Notes to the stylist */}
            <section>
              <h2 style={LABEL}>Notes for Your Stylist</h2>
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.74rem", lineHeight: 1.8, color: MUTED, margin: "0 0 1.3rem" }}>
                Anything you tell us here is remembered and considered in every
                conversation with your curator.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
                {NOTE_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label
                      htmlFor={`note-${f.key}`}
                      style={{ ...LABEL, color: INK, fontSize: "0.6rem", letterSpacing: "0.16em" }}
                    >
                      {f.label}
                    </label>
                    {f.rows === 1 ? (
                      <input
                        id={`note-${f.key}`}
                        value={notes[f.key]}
                        placeholder={f.placeholder}
                        onChange={(e) => updateField(f.key, e.target.value)}
                        onBlur={() => persist(notes)}
                        style={FIELD_BASE as React.CSSProperties}
                      />
                    ) : (
                      <textarea
                        id={`note-${f.key}`}
                        value={notes[f.key]}
                        placeholder={f.placeholder}
                        rows={f.rows}
                        onChange={(e) => updateField(f.key, e.target.value)}
                        onBlur={() => persist(notes)}
                        style={FIELD_BASE as React.CSSProperties}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1.1rem", marginTop: "1.6rem" }}>
                <button
                  onClick={() => persist(notes)}
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
                    padding: "0.8rem 1.6rem",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#2C1E0F")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = INK)}
                >
                  Save
                </button>
                <span
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontStyle: "italic",
                    fontSize: "0.95rem",
                    color: GOLD,
                    opacity: savedFlash ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  Saved.
                </span>
              </div>
            </section>

            {/* Footer actions */}
            <div style={{ height: 1, background: LINE, margin: "2.6rem 0 1.5rem" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={handleSignOut}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "var(--font-jost)",
                  fontSize: "0.56rem",
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: MUTED,
                  borderBottom: `1px solid ${GOLD_DIM}`,
                  paddingBottom: 2,
                }}
              >
                Sign out
              </button>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "var(--font-jost)",
                  fontSize: "0.56rem",
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: INK,
                  borderBottom: `1px solid ${GOLD_DIM}`,
                  paddingBottom: 2,
                }}
              >
                Back to curator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
