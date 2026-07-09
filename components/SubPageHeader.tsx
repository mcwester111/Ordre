"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  paddingBottom: active ? "2px" : "0",
});

export default function SubPageHeader({ darkMode = false }: { darkMode?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserName(user?.user_metadata?.name ?? user?.email ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setUserName(user?.user_metadata?.name ?? user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const authColor = darkMode ? "rgba(200,185,160,0.5)" : "rgba(26,18,10,0.5)";

  return (
    <header className="relative w-full" style={{ height: "96px" }}>

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
      <div className="absolute flex items-center gap-4" style={{ top: "1.25rem", right: "2rem" }}>
        {userName ? (
          <>
            <span style={{
              fontFamily: "var(--font-jost)",
              fontSize: "0.55rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: authColor,
            }}>
              {userName.split(" ")[0]}
            </span>
            <button
              onClick={handleSignOut}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontFamily: "var(--font-jost)",
                fontSize: "0.55rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: authColor,
                textDecoration: "none",
              }}
            >
              SIGN OUT
            </button>
          </>
        ) : (
          <a href="/sign-in" style={{
            fontFamily: "var(--font-jost)",
            fontSize: "0.55rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: authColor,
            textDecoration: "none",
          }}>
            SIGN IN
          </a>
        )}
      </div>

    </header>
  );
}
