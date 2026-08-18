"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAllUserData, hasStoredData } from "@/lib/user-data";
import { createClient } from "@/lib/supabase/client";

const INK = "#1A120A";
const MUTED = "rgba(26,18,10,0.62)";
const LINE = "rgba(100,65,15,0.22)";

export default function DataControls() {
  const router = useRouter();
  const [stored, setStored] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStored(hasStoredData());
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsSignedIn(!!user));
  }, []);

  const handleDelete = async () => {
    setBusy(true);
    await deleteAllUserData();
    setBusy(false);
    setConfirming(false);
    setDone(true);
    setStored(false);
    if (isSignedIn) {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <section
      style={{
        maxWidth: 620,
        width: "100%",
        margin: "0 auto",
        padding: "0 1.5rem",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
          fontWeight: 400,
          letterSpacing: "0.04em",
          color: INK,
          marginBottom: "1.1rem",
        }}
      >
        Your Data
      </h2>

      <div
        style={{
          fontFamily: "var(--font-jost)",
          fontSize: "0.82rem",
          lineHeight: 1.85,
          color: MUTED,
          letterSpacing: "0.01em",
        }}
      >
        <p style={{ marginBottom: "0.9rem" }}>
          For guests, your aesthetic profile is saved in this browser so the
          curator can remember your taste between visits — it lives only on your
          device. For account holders, your aesthetic profile, stylist notes,
          and conversation history are stored on our servers and sync across
          devices.
        </p>
        <p style={{ marginBottom: "0.9rem" }}>
          When you send a message, image, or document, it is transmitted to our
          AI provider (Anthropic) to generate the curator&apos;s reply. The provider
          may retain inputs for a limited period under its own policies, and
          Ordre cannot delete data from the provider on your behalf.
        </p>
        <p style={{ marginBottom: "0.9rem" }}>
          To prevent abuse, our server uses the IP address of each request to
          enforce rate limits. It is not stored long-term by Ordre and is not
          linked to your profile.
        </p>
        <p>
          You can remove what Ordre has saved for you at any time using the
          control below. For guests, this clears your saved profile from this
          browser. For account holders, this permanently deletes your account
          and all associated data from our servers.
        </p>
      </div>

      <div style={{ height: 1, background: LINE, margin: "1.8rem 0" }} />

      {done ? (
        <p
          style={{
            fontFamily: "var(--font-cormorant)",
            fontStyle: "italic",
            fontSize: "1rem",
            color: "rgba(100,65,15,0.8)",
          }}
        >
          {isSignedIn
            ? "Your account and all associated data have been permanently deleted."
            : "Your saved profile has been removed from this browser."}
        </p>
      ) : !confirming ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", alignItems: "flex-start" }}>
          <button
            onClick={() => setConfirming(true)}
            disabled={!stored}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.65rem",
              fontFamily: "var(--font-jost)",
              fontWeight: 600,
              fontSize: "0.66rem",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#F5F0E8",
              background: stored ? "#1A120A" : "rgba(26,18,10,0.28)",
              border: "none",
              padding: "0.95rem 2rem",
              cursor: stored ? "pointer" : "default",
              opacity: stored ? 1 : 0.55,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => { if (stored) e.currentTarget.style.background = "#2C1E0F"; }}
            onMouseLeave={(e) => { if (stored) e.currentTarget.style.background = "#1A120A"; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            Delete my data
          </button>
          {!stored && (
            <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.62rem", letterSpacing: "0.06em", color: "rgba(26,18,10,0.4)" }}>
              No stored data found in this browser.
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
          <p
            style={{
              fontFamily: "var(--font-cormorant)",
              fontStyle: "italic",
              fontSize: "1rem",
              color: INK,
              lineHeight: 1.6,
            }}
          >
            {isSignedIn
              ? "This permanently deletes your account, aesthetic profile, and conversation history. It cannot be undone."
              : "This permanently removes your saved aesthetic profile from this browser. It cannot be undone."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handleDelete}
              disabled={busy}
              style={{
                fontFamily: "var(--font-jost)",
                fontSize: "0.6rem",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "#F5F0E8",
                background: INK,
                border: `1px solid ${INK}`,
                padding: "0.7rem 1.4rem",
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? "Deleting…" : isSignedIn ? "Yes, delete my account" : "Yes, delete my profile"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={busy}
              style={{
                fontFamily: "var(--font-jost)",
                fontSize: "0.6rem",
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: MUTED,
                background: "transparent",
                border: "1px solid rgba(26,18,10,0.2)",
                padding: "0.7rem 1.4rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
