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
import { loadNotesFromSupabase, saveNotesToSupabase, loadAvatarFromSupabase, saveAvatarToSupabase, saveNameToSupabase } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/components/ProfileIntake";
import { buildProfileDescription } from "@/components/ProfileIntake";
import { SYMBOLS, SymbolSvg } from "@/lib/avatar-symbols";

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


const SUBLABEL: React.CSSProperties = {
  fontFamily: "var(--font-jost)",
  fontSize: "0.48rem",
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: MUTED,
};

const NAME_INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.35)",
  border: `1px solid ${LINE}`,
  borderRadius: 9,
  padding: "0.6rem 0.75rem",
  fontFamily: "var(--font-cormorant)",
  fontSize: "1rem",
  color: INK,
  outline: "none",
  boxSizing: "border-box",
};

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
  { key: "loves", label: "Houses, designers & pieces you love", placeholder: "e.g. Remember I love Chanel, The Row, and anything in camel.", rows: 2 },
  { key: "notes", label: "Anything to always keep in mind", placeholder: "e.g. I dress for cold weather most of the year, and I prefer flats.", rows: 2 },
  { key: "avoid", label: "Anything to avoid", placeholder: "e.g. Never suggest fast fashion or visible logos.", rows: 2 },
];

export default function ProfilePanel({
  userProfile,
  onClose,
  onRefineAesthetic,
  onNotesChange,
  onAvatarChange,
}: {
  userProfile: UserProfile | null;
  onClose: () => void;
  onRefineAesthetic: () => void;
  onNotesChange: (notes: AiNotes) => void;
  onAvatarChange?: (symbol: string, label: string) => void;
}) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [notes, setNotes] = useState<AiNotes>(EMPTY_NOTES);
  const [savedFlash, setSavedFlash] = useState(false);
  const [avatarSymbol, setAvatarSymbol] = useState<string>("none");
  const [markLabel, setMarkLabel] = useState<string>("");
  const [editFirst, setEditFirst] = useState<string>("");
  const [editLast, setEditLast] = useState<string>("");
  const [markExpanded, setMarkExpanded] = useState(true);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.name ?? user.email ?? null;
        setUserName(name);
        const parts = name?.trim().split(/\s+/) ?? [];
        setEditFirst(parts[0] ?? "");
        setEditLast(parts.slice(1).join(" "));
        const fromSupabase = await loadNotesFromSupabase();
        if (fromSupabase) setNotes(fromSupabase);
        const avatar = await loadAvatarFromSupabase();
        const defaultInitial = (name?.trim().split(/\s+/)[0] ?? "").charAt(0).toUpperCase();
        if (avatar) {
          setAvatarSymbol(avatar.symbol);
          // If stored label is one of the old enum values, convert to a sensible default
          const stored = avatar.label;
          setMarkLabel(
            stored === "initial" || stored === "" ? (defaultInitial ? defaultInitial + "." : "") :
            stored === "name" || stored === "none" ? (defaultInitial ? defaultInitial + "." : "") :
            stored
          );
          if (avatar.symbol !== "none") setMarkExpanded(false);
        } else {
          setMarkLabel(defaultInitial ? defaultInitial + "." : "");
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

  const persistAvatar = (symbol: string, label: string) => {
    saveAvatarToSupabase({ symbol, label });
    onAvatarChange?.(symbol, label);
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
          padding: "0.65rem 0.75rem",
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

            {/* ── Name ── */}
            <section style={{ marginBottom: "2.6rem" }}>
              <h2 style={LABEL}>Your Name</h2>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <input
                  type="text"
                  value={editFirst}
                  placeholder="First"
                  onChange={e => setEditFirst(e.target.value)}
                  onBlur={() => {
                    const full = `${editFirst.trim()} ${editLast.trim()}`.trim();
                    setUserName(full || null);
                    saveNameToSupabase(editFirst, editLast);
                  }}
                  style={{ ...NAME_INPUT_STYLE, flex: 1 }}
                />
                <input
                  type="text"
                  value={editLast}
                  placeholder="Last"
                  onChange={e => setEditLast(e.target.value)}
                  onBlur={() => {
                    const full = `${editFirst.trim()} ${editLast.trim()}`.trim();
                    setUserName(full || null);
                    saveNameToSupabase(editFirst, editLast);
                  }}
                  style={{ ...NAME_INPUT_STYLE, flex: 1 }}
                />
              </div>
            </section>

            {/* ── Your Mark ── */}
            <section style={{ marginBottom: "2.6rem" }}>
              <h2 style={{ ...LABEL, color: INK, fontSize: "0.6rem", letterSpacing: "0.16em", marginBottom: "1.2rem" }}>
                Your Mark
              </h2>

              {!markExpanded && avatarSymbol !== "none" ? (
                /* Collapsed: single button showing the current mark */
                (() => {
                  const sym = SYMBOLS.find(s => s.id === avatarSymbol)!;
                  const stampLabel = markLabel || null;
                  return (
                    <button
                      onClick={() => setMarkExpanded(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        background: "rgba(255,255,255,0.28)",
                        border: `1px solid ${LINE}`,
                        borderRadius: 40,
                        padding: "0.5rem 1rem 0.5rem 0.6rem",
                        cursor: "pointer",
                        transition: "border-color 0.18s",
                        width: "100%",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(100,65,15,0.35)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = LINE)}
                    >
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: `1px solid rgba(100,65,15,0.3)`,
                        background: "rgba(100,65,15,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <SymbolSvg symbol={sym} size={20} color={GOLD} />
                      </div>
                      <div style={{ textAlign: "left", flex: 1 }}>
                        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: INK, margin: 0 }}>
                          {sym.name}
                        </p>
                        {stampLabel && (
                          <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "0.8rem", color: MUTED, margin: 0, marginTop: "1px" }}>
                            {stampLabel}
                          </p>
                        )}
                      </div>
                      <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.44rem", letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED }}>
                        Change
                      </span>
                    </button>
                  );
                })()
              ) : (
                /* Expanded: prominent stamp + horizontal strip + label toggle */
                <>
                  {/* Current stamp */}
                  {(() => {
                    const sym = SYMBOLS.find(s => s.id === avatarSymbol);
                    const stampLabel = markLabel || null;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.2rem" }}>
                        <div style={{
                          width: 72,
                          height: 72,
                          borderRadius: "50%",
                          border: `1px solid ${sym ? "rgba(100,65,15,0.35)" : LINE}`,
                          background: sym ? "rgba(100,65,15,0.05)" : "rgba(255,255,255,0.28)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "0.5rem",
                        }}>
                          {sym
                            ? <SymbolSvg symbol={sym} size={38} color={GOLD} />
                            : <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.42rem", letterSpacing: "0.18em", paddingLeft: "0.18em", textTransform: "uppercase", color: MUTED }}>none</span>
                          }
                        </div>
                        {stampLabel && (
                          <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "0.88rem", color: INK, letterSpacing: "0.06em", margin: 0 }}>
                            {stampLabel}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Horizontal symbol strip */}
                  <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.4rem", scrollbarWidth: "none" }}>
                    {SYMBOLS.map(sym => {
                      const selected = avatarSymbol === sym.id;
                      return (
                        <button
                          key={sym.id}
                          title={sym.name}
                          onClick={() => {
                            const next = selected ? "none" : sym.id;
                            setAvatarSymbol(next);
                            const defaultInitial = firstName.charAt(0).toUpperCase();
                            const label = markLabel || (defaultInitial ? `${defaultInitial}.` : "");
                            if (label !== markLabel) setMarkLabel(label);
                            persistAvatar(next, label);
                            if (next !== "none") setMarkExpanded(false);
                          }}
                          style={{
                            flexShrink: 0,
                            width: 54,
                            height: 54,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: selected ? "rgba(100,65,15,0.09)" : "rgba(255,255,255,0.28)",
                            border: `1px solid ${selected ? "rgba(100,65,15,0.55)" : LINE}`,
                            cursor: "pointer",
                            transition: "border-color 0.18s, background 0.18s",
                            padding: 0,
                          }}
                        >
                          <SymbolSvg symbol={sym} size={30} color={selected ? GOLD : MUTED} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Mark label input */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", marginTop: "0.9rem" }}>
                    <label style={{ fontFamily: "var(--font-jost)", fontSize: "0.48rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED }}>
                      Your initials
                    </label>
                    <input
                      type="text"
                      value={markLabel}
                      onChange={e => {
                        setMarkLabel(e.target.value);
                        persistAvatar(avatarSymbol, e.target.value);
                      }}
                      placeholder={firstName ? `${firstName.charAt(0).toUpperCase()}.` : "M.W."}
                      maxLength={5}
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "0.9rem",
                        fontStyle: "italic",
                        color: INK,
                        background: "rgba(255,255,255,0.55)",
                        border: `1px solid ${LINE}`,
                        borderRadius: "4px",
                        outline: "none",
                        textAlign: "center",
                        width: "140px",
                        padding: "5px 8px",
                      }}
                    />
                  </div>
                </>
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
                <div>
                  <label htmlFor="note-nickname" style={{ ...LABEL, color: INK, fontSize: "0.6rem", letterSpacing: "0.16em" }}>
                    Nickname
                  </label>
                  <style>{`.nickname-input::placeholder { font-style: italic; opacity: 0.75; }`}</style>
                  <input
                    id="note-nickname"
                    className="nickname-input"
                    value={notes.nickname}
                    placeholder="optional"
                    onChange={(e) => updateField("nickname", e.target.value)}
                    onBlur={() => persist(notes)}
                    style={FIELD_BASE as React.CSSProperties}
                  />
                </div>

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
