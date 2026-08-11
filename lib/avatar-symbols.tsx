import React from "react";

export type SymbolDef = {
  id: string;
  name: string;
  // Dark-pixel centroid in the 1342×831 sprite sheet.
  cx: number;
  cy: number;
  // Minimum distance (px) from centroid to nearest cell edge.
  // Scale = (size/2) / minDist keeps the display strictly inside the cell,
  // preventing adjacent symbols from bleeding into the circle.
  minDist: number;
};
export type AvatarLabel = "name" | "initial" | "none";

const SHEET_W = 1342;
const SHEET_H = 831;

export const SYMBOLS: SymbolDef[] = [
  { id: "heart",       name: "Heart",       cx: 137,  cy: 268, minDist: 132 },
  { id: "crown",       name: "Crown",       cx: 414,  cy: 299, minDist: 117 },
  { id: "key",         name: "Key",         cx: 669,  cy: 269, minDist: 132 },
  { id: "dice",        name: "Dice",        cx: 928,  cy: 307, minDist: 109 },
  { id: "sailboat",    name: "Sailboat",    cx: 1193, cy: 322, minDist:  94 },
  { id: "dove",        name: "Dove",        cx: 137,  cy: 613, minDist: 131 },
  { id: "pomegranate", name: "Pomegranate", cx: 434,  cy: 625, minDist: 103 },
  { id: "eightball",   name: "8 Ball",      cx: 690,  cy: 627, minDist: 116 },
  { id: "ring",        name: "Ring",        cx: 927,  cy: 637, minDist: 122 },
  { id: "rose",        name: "Rose",        cx: 1176, cy: 601, minDist: 103 },
];

export function SymbolSvg({
  symbol,
  size,
}: {
  symbol: SymbolDef;
  size: number;
  color?: string;
}) {
  // Scale so the nearest cell edge maps exactly to the circle radius.
  // This guarantees no adjacent-cell content bleeds into the display.
  const scale = (size / 2) / symbol.minDist;
  const bgW = SHEET_W * scale;
  const bgH = SHEET_H * scale;
  const x = -(symbol.cx * scale - size / 2);
  const y = -(symbol.cy * scale - size / 2);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        backgroundImage: "url('/marks-sheet2.png')",
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `${x}px ${y}px`,
        backgroundRepeat: "no-repeat",
        mixBlendMode: "multiply",
        flexShrink: 0,
      }}
    />
  );
}
