import React from "react";

export type SymbolDef = { id: string; name: string; col: number; row: number };
export type AvatarLabel = "name" | "initial" | "none";

// 5 columns x 2 rows sprite sheet at /public/marks-sheet.png
const COLS = 5;
const ROWS = 2;
const SHEET_W = 1254;
const SHEET_H = 1254;

export const SYMBOLS: SymbolDef[] = [
  { id: "heart",     name: "Heart",    col: 0, row: 0 },
  { id: "crown",     name: "Crown",    col: 1, row: 0 },
  { id: "key",       name: "Key",      col: 2, row: 0 },
  { id: "dice",      name: "Dice",     col: 3, row: 0 },
  { id: "sailboat",  name: "Sailboat", col: 4, row: 0 },
  { id: "dove",      name: "Dove",     col: 0, row: 1 },
  { id: "deer",      name: "Deer",     col: 1, row: 1 },
  { id: "eightball", name: "8 Ball",   col: 2, row: 1 },
  { id: "ring",      name: "Ring",     col: 3, row: 1 },
  { id: "rose",      name: "Rose",     col: 4, row: 1 },
];

// Actual vertical center of each symbol within its 627px cell row,
// measured via canvas pixel scan (non-white content bounding box midpoint).
const ROW_CENTER_Y = [478.5, 152.5]; // row 0, row 1

// Renders one symbol from the sprite sheet, centered in a square container.
export function SymbolSvg({
  symbol,
  size,
}: {
  symbol: SymbolDef;
  size: number;
  color?: string;
}) {
  const cellW = SHEET_W / COLS;
  // Scale so the symbol illustration (avg ~222px wide in a 250.8px cell) fills
  // the circle container. overflow:hidden clips the oval border frame.
  const scale  = (size / cellW) * 1.38;
  const bgW    = SHEET_W * scale;
  const bgH    = SHEET_H * scale;
  const cellH  = SHEET_H / ROWS;
  // Absolute Y center of this symbol in the full image (natural px), then scaled.
  const absCenterY = symbol.row * cellH + ROW_CENTER_Y[symbol.row];
  const x = -(symbol.col * size);
  const y = -(absCenterY * scale - size / 2);

  return (
    <div
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        backgroundImage: "url('/marks-sheet.png')",
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `${x}px ${y}px`,
        backgroundRepeat: "no-repeat",
        mixBlendMode: "multiply",
        flexShrink: 0,
      }}
    />
  );
}
