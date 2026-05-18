"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "ORDRE",     href: "/"          },
  { label: "ABOUT",     href: "/about"     },
  { label: "CURATIONS", href: "/curations" },
  { label: "JOURNAL",   href: "/journal"   },
] as const;

const navLink = (active: boolean) => ({
  fontFamily: "var(--font-jost)",
  fontSize: "0.55rem",
  letterSpacing: "0.25em",
  textTransform: "uppercase" as const,
  color: active ? "rgba(26,18,10,0.85)" : "rgba(26,18,10,0.5)",
  textDecoration: "none",
  borderBottom: active ? "1px solid rgba(26,18,10,0.4)" : "none",
  paddingBottom: active ? "2px" : "0",
});

export default function SubPageHeader() {
  const pathname = usePathname();

  return (
    // Fixed-height header so the centred mark never displaces nav items.
    // Nav text and SIGN IN are pinned to the top via absolute positioning;
    // the mark floats in the true vertical + horizontal centre.
    <header className="relative w-full" style={{ height: "96px" }}>

      {/* Nav — top left */}
      <nav
        className="absolute flex items-center gap-8"
        style={{ top: "1.25rem", left: "2rem" }}
      >
        {NAV_ITEMS.map(({ label, href }) => (
          <Link key={label} href={href} style={navLink(pathname === href)}>
            {label}
          </Link>
        ))}
      </nav>

      {/* Brand mark — centred in the full header band */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Image
          src="/swan-logo.png"
          alt="Ordre"
          width={48}
          height={35}
          placeholder="empty"
          style={{ objectFit: "contain", width: "48px", height: "auto", display: "block" }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/webfont3e.png"
          alt="ORDRE"
          style={{ width: "160px", height: "auto", display: "block", marginTop: "0.35rem" }}
        />
      </div>

      {/* Sign in — top right */}
      <a
        href="/sign-in"
        className="absolute"
        style={{
          top: "1.25rem",
          right: "2rem",
          fontFamily: "var(--font-jost)",
          fontSize: "0.55rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(26,18,10,0.5)",
          textDecoration: "none",
        }}
      >
        SIGN IN
      </a>

    </header>
  );
}
