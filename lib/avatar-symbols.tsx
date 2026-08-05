import React from "react";

export type SymbolDef = { id: string; name: string; paths: React.ReactNode };
export type AvatarLabel = "name" | "initial" | "none";

export const SYMBOLS: SymbolDef[] = [
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
      <path d="M16 4 L18.5 13.5 L28 16 L18.5 18.5 L16 28 L13.5 18.5 L4 16 L13.5 13.5 Z" strokeLinejoin="round" />
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

export function SymbolSvg({
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
