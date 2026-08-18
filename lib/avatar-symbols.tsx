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
  // Optional fill factor (0–1) to shrink the symbol within its circle.
  fill?: number;
  // When true, applies high-contrast filter to render as a solid silhouette.
  solid?: boolean;
};
export type AvatarLabel = "name" | "initial" | "none";

const SHEET_W = 1342;
const SHEET_H = 831;

export const SYMBOLS: SymbolDef[] = [
  { id: "heart",       name: "Heart",       cx: 137,  cy: 268, minDist: 132, fill: 0.92 },
  { id: "crown",       name: "Crown",       cx: 414,  cy: 299, minDist: 117 },
  { id: "key",         name: "Key",         cx: 669,  cy: 269, minDist: 132, fill: 0.88 },
  { id: "dice",        name: "Dice",        cx: 920,  cy: 299, minDist: 109, fill: 0.88 },
  { id: "sailboat",    name: "Sailboat",    cx: 1193, cy: 280, minDist:  94, fill: 0.75 },
  { id: "dove",        name: "Dove",        cx: 137,  cy: 613, minDist: 131 },
  { id: "pomegranate", name: "Pomegranate", cx: 434,  cy: 625, minDist: 103, fill: 0.75 },
  { id: "eightball",   name: "8 Ball",      cx: 690,  cy: 627, minDist: 116 },
  { id: "ring",        name: "Ring",        cx: 927,  cy: 637, minDist: 122 },
  { id: "rose",        name: "Rose",        cx: 1176, cy: 625, minDist: 103, fill: 0.75 },
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
  const scale = (size / 2) / symbol.minDist * (symbol.fill ?? 1);
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
