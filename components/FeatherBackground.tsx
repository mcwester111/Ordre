"use client";

import { useEffect, useRef } from "react";

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function drawLayer(
  ctx: CanvasRenderingContext2D,
  W: number,
  bandTop: number,
  bandH: number,
  rand: () => number
) {
  // ── 1. Warm shadow band ──
  const shadowGrad = ctx.createLinearGradient(0, bandTop, 0, bandTop + bandH);
  shadowGrad.addColorStop(0.00, "rgba(238,232,222,0.00)");
  shadowGrad.addColorStop(0.18, "rgba(212,200,183,0.62)");
  shadowGrad.addColorStop(0.48, "rgba(192,178,158,0.90)");
  shadowGrad.addColorStop(0.75, "rgba(172,157,135,0.97)");
  shadowGrad.addColorStop(1.00, "rgba(152,136,112,1.00)");
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(0, bandTop, W, bandH);

  // ── 2. Rounded feather tips ──
  // Bezier magic number for ellipse approximation
  const K = 0.5523;

  const baseW    = 50 + rand() * 14;  // 50–64 px base width
  const spacing  = baseW * 0.50;      // 50% overlap — dense plumage
  const numF     = Math.ceil(W / spacing) + 6;

  for (let i = -3; i < numF; i++) {
    const fw   = baseW * (0.80 + rand() * 0.40);
    const fh   = bandH * (0.68 + rand() * 0.18);
    const fx   = i * spacing + (rand() - 0.5) * 12;
    const fy   = bandTop + (rand() - 0.5) * bandH * 0.06;
    const tilt = (rand() - 0.5) * 0.10;

    ctx.save();
    ctx.translate(fx + fw / 2, fy + fh * 0.28);
    ctx.rotate(tilt);

    const hw  = fw * 0.48;  // half-width
    const ht  = fh * 0.54;  // dome height (above centre)
    const hb  = fh * 0.26;  // taper height (below centre)

    // Smooth egg shape: elliptical dome top + gentle taper below
    ctx.beginPath();
    ctx.moveTo(0, -ht);
    // Right half of ellipse dome
    ctx.bezierCurveTo( hw * K, -ht,   hw, -ht * K,   hw,  0);
    // Taper to base point
    ctx.bezierCurveTo( hw,  hb * 0.55,  hw * 0.18,  hb,  0,  hb);
    // Mirror left
    ctx.bezierCurveTo(-hw * 0.18,  hb, -hw,  hb * 0.55, -hw,  0);
    // Left half of ellipse dome
    ctx.bezierCurveTo(-hw, -ht * K,  -hw * K, -ht,   0, -ht);
    ctx.closePath();

    // White-core radial gradient fading to transparent warm edge
    const grad = ctx.createRadialGradient(0, -ht * 0.22, ht * 0.06, 0, -ht * 0.05, fh * 0.52);
    grad.addColorStop(0.00, "rgba(255,255,255,1.00)");
    grad.addColorStop(0.16, "rgba(254,253,250,0.98)");
    grad.addColorStop(0.40, "rgba(249,246,241,0.92)");
    grad.addColorStop(0.62, "rgba(238,232,222,0.70)");
    grad.addColorStop(0.80, "rgba(224,216,202,0.38)");
    grad.addColorStop(1.00, "rgba(208,198,182,0.00)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Delicate rachis (central spine)
    ctx.strokeStyle = "rgba(180,168,150,0.22)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -ht * 0.86);
    ctx.quadraticCurveTo(fw * 0.01, 0, fw * 0.018, hb * 0.82);
    ctx.stroke();

    ctx.restore();
  }

  // ── 3. Bright crest highlight at the top of each band ──
  const hiH = bandH * 0.32;
  const hi  = ctx.createLinearGradient(0, bandTop - hiH * 0.14, 0, bandTop + hiH);
  hi.addColorStop(0.0, "rgba(255,255,255,0.85)");
  hi.addColorStop(0.3, "rgba(255,255,255,0.42)");
  hi.addColorStop(1.0, "rgba(255,255,255,0.00)");
  ctx.fillStyle = hi;
  ctx.fillRect(0, bandTop - hiH * 0.14, W, hiH * 1.14);
}

export default function FeatherBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function draw() {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const W   = canvas.offsetWidth;
      const H   = canvas.offsetHeight;
      if (!W || !H) return;

      canvas.width  = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.scale(dpr, dpr);

      // Warm ivory-cream base
      ctx.fillStyle = "#ede4d6";
      ctx.fillRect(0, 0, W, H);

      const rand = seededRng(42);

      const rowSpacing = 56;
      const bandH      = 82;
      const numRows    = Math.ceil(H / rowSpacing) + 4;

      // Paint bottom rows first — upper rows shingle over them
      for (let row = numRows; row >= 0; row--) {
        drawLayer(ctx, W, row * rowSpacing, bandH, rand);
      }

      // Soft central glow for text legibility
      const glow = ctx.createRadialGradient(W / 2, H / 2, H * 0.04, W / 2, H / 2, H * 0.56);
      glow.addColorStop(0, "rgba(255,251,245,0.60)");
      glow.addColorStop(1, "rgba(255,251,245,0.00)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }

    const raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}
