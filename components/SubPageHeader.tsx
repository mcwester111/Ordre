"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadAvatarFromSupabase, loadAvatarFromCache } from "@/lib/profile";
import { SYMBOLS, SymbolSvg } from "@/lib/avatar-symbols";
import ProfilePanel from "@/components/ProfilePanel";

const NAV_ITEMS = [
  { label: "ORDRE",     href: "/"          },
  { label: "ABOUT",     href: "/about"     },
  { label: "CURATIONS", href: "/curations" },
] as const;

const navLink = (active: boolean, dark: boolean) => ({
  fontFamily: "var(--font-jost)",
  fontSize: "0.55rem",
  letterSpacing: "0.25em",
  textTransform: "uppercase" as const,
  color: dark
    ? (active ? "rgba(235,220,195,0.92)" : "rgba(200,185,160,0.5)")
    : (active ? "rgba(26,18,10,0.85)"    : "rgba(26,18,10,0.5)"),
  textDecoration: "none",
  borderBottom: active
    ? `1px solid ${dark ? "rgba(200,170,110,0.4)" : "rgba(26,18,10,0.4)"}`
    : "none",
  padding: active ? "0.55rem 0.3rem 0.35rem" : "0.55rem 0.3rem",
});

export default function SubPageHeader({ darkMode = false }: { darkMode?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarSymbolId, setAvatarSymbolId] = useState<string>(() => loadAvatarFromCache()?.symbol ?? "none");
  const [avatarLabel, setAvatarLabel] = useState<string>(() => loadAvatarFromCache()?.label ?? "");
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserName(user?.user_metadata?.name ?? user?.email ?? null);
      if (user) {
        loadAvatarFromSupabase().then(av => {
          if (av) { setAvatarSymbolId(av.symbol); setAvatarLabel(av.label); }
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setUserName(user?.user_metadata?.name ?? user?.email ?? null);
      if (user) {
        loadAvatarFromSupabase().then(av => {
          if (av) { setAvatarSymbolId(av.symbol); setAvatarLabel(av.label); }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const inkColor = darkMode ? "rgba(235,220,195,0.85)" : "rgba(26,18,10,0.8)";
  const inkMuted = darkMode ? "rgba(200,185,160,0.5)" : "rgba(26,18,10,0.5)";
  const borderColor = darkMode ? "rgba(235,220,195,0.7)" : "rgba(26,18,10,0.75)";

  const sym = SYMBOLS.find(s => s.id === avatarSymbolId);
  const labelText = avatarLabel && avatarLabel !== "name" && avatarLabel !== "none"
    ? avatarLabel
    : avatarLabel === "name"
    ? userName?.split(" ")[0] ?? null
    : null;

  return (
    <>
      {showProfile && (
        <ProfilePanel
          userProfile={null}
          onClose={() => setShowProfile(false)}
          onRefineAesthetic={() => setShowProfile(false)}
          onNotesChange={() => {}}
          onAvatarChange={(symbol, label) => { setAvatarSymbolId(symbol); setAvatarLabel(label); }}
        />
      )}

      <header className="relative w-full" style={{ height: "96px", zIndex: 20, position: "relative" }}>

        {/* Nav — top left */}
        <nav
          className="absolute flex items-center gap-8"
          style={{ top: "1.25rem", left: "2rem" }}
        >
          {NAV_ITEMS.map(({ label, href }) => (
            <Link key={label} href={href} style={navLink(pathname === href, darkMode)}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Brand mark — centred */}
        <div
          className="absolute flex flex-col items-center"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          <Image
            src="/swan-logo.png"
            alt="Ordre"
            width={48}
            height={35}
            placeholder="empty"
            style={{
              objectFit: "contain", width: "48px", height: "auto", display: "block",
              filter: darkMode ? "invert(1) brightness(0.75)" : "none",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/webfont3e.png"
            alt="ORDRE"
            style={{
              width: "160px", height: "auto", display: "block", marginTop: "0.35rem",
              filter: darkMode ? "invert(1) brightness(0.7)" : "none",
            }}
          />
        </div>

        {/* Auth — top right */}
        <div className="absolute flex items-center" style={{ top: "1.25rem", right: "2rem" }}>
          {userName ? (
            <button
              onClick={() => setShowProfile(true)}
              style={{
                background: "none",
                border: "none",
                padding: "0.35rem",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                opacity: 0.7,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
              aria-label="Open profile"
            >
              {sym ? (
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: darkMode ? "rgba(30,20,10,0.85)" : "#fff",
                  boxShadow: `0 0 0 1px ${borderColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <SymbolSvg symbol={sym} size={22} color={inkColor} />
                </div>
              ) : (
                <span style={{
                  fontFamily: "var(--font-jost)",
                  fontSize: "0.55rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: inkMuted,
                }}>
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
              {sym && labelText && (
                <span style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.06em",
                  paddingLeft: "0.3em",
                  color: darkMode ? "rgba(235,220,195,0.95)" : "rgba(26,18,10,0.95)",
                  lineHeight: 1,
                  textAlign: "center" as const,
                  display: "block",
                }}>
                  {labelText}
                </span>
              )}
            </button>
          ) : (
            <a href="/sign-in" style={{
              fontFamily: "var(--font-jost)",
              fontSize: "0.55rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: inkMuted,
              textDecoration: "none",
              padding: "0.55rem 0.3rem",
            }}>
              SIGN IN
            </a>
          )}
        </div>

      </header>
    </>
  );
}
