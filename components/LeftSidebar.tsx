"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ConversationRow } from "@/lib/conversations";
import { saveNotepadToSupabase } from "@/lib/profile";

const INK = "rgba(26,18,10,0.85)";
const MUTED = "rgba(26,18,10,0.42)";
const LINE = "rgba(100,65,15,0.13)";
const GOLD = "rgba(100,65,15,0.7)";

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-jost)",
  fontSize: "0.42rem",
  fontWeight: 600,
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  color: GOLD,
};

const INLINE_INPUT: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  borderBottom: `1px solid rgba(100,65,15,0.3)`,
  outline: "none",
  fontFamily: "var(--font-cormorant)",
  fontStyle: "italic",
  fontSize: "0.88rem",
  color: INK,
  padding: "0",
  width: "100%",
  minWidth: 0,
};

const PROJECTS_KEY   = "ordre.projects.v1";
const NOTEPAD_KEY    = "ordre.notepad.v1";
const MOODBOARD_KEY  = "ordre.moodboard.v1";
const CANVAS_KEY     = "ordre.canvas.v1";
const CLOSET_KEY     = "ordre.closet.v1";
const CLOSET_CATEGORIES = ["top", "bottom", "dress", "outerwear", "shoes", "accessory", "other"] as const;
type ClosetCategory = typeof CLOSET_CATEGORIES[number];

type MoodImage    = { id: string; dataUrl: string };
type ClosetItem   = { id: string; dataUrl: string; name?: string; category: ClosetCategory };
type ClosetCubby  = { id: string; label: string; items: ClosetItem[] };
type CanvasItem = {
  id: string;
  type?: "image" | "text";
  imageId?: string;
  text?: string;
  fontSize?: number;
  fontColor?: string;
  x: number; y: number; w: number; zIndex: number;
  rotation?: number;
  opacity?: number;
};
type Canvas = { id: string; items: CanvasItem[]; background?: string; aspectRatio?: string };

async function processMoodImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      const transparent = file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif";
      if (!transparent) {
        // Fill white so JPEG output doesn't render transparent areas as black
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(transparent ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

const EDITOR_GOLD  = "rgba(100,65,15,0.7)";
const EDITOR_MUTED = "rgba(100,65,15,0.42)";

let _sliderListId = 0;
function editorSnapPoints(min: number, max: number): number[] {
  const center = (min + max) / 2;
  const half   = (max - min) / 2;
  return [-0.75, -0.25, 0, 0.25, 0.75].map(f => center + f * half);
}

// Snap positions as fractions of full range (fixed for all sliders since center = midpoint)
const SNAP_FRACS = [0.125, 0.375, 0.5, 0.625, 0.875];

function EditorSliderRow({ label, value, min, max, set, unit = "%" }: { label: string; value: number; min: number; max: number; set: (v: number) => void; unit?: string }) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const snapPts   = React.useMemo(() => editorSnapPoints(min, max), [min, max]);
  const threshold = (max - min) * 0.18;

  // Sync DOM value when parent state changes (e.g. Reset All)
  useEffect(() => {
    if (inputRef.current && +inputRef.current.value !== value) {
      inputRef.current.value = String(value);
    }
  }, [value]);

  // Live update during drag (no snap yet)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    set(+e.target.value);
  };

  // Snap on release — browser drag is done, so the DOM write sticks
  const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    const raw     = +e.currentTarget.value;
    const nearest = snapPts.reduce((best, p) => Math.abs(p - raw) < Math.abs(best - raw) ? p : best, raw);
    if (Math.abs(nearest - raw) <= threshold) {
      const snapped = Math.round(nearest * 10) / 10;
      if (inputRef.current) inputRef.current.value = String(snapped);
      set(snapped);
    }
  };

  return (
    <div style={{ marginBottom: "0.8rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.29rem", fontWeight: 600, letterSpacing: "0.17em", textTransform: "uppercase", color: EDITOR_MUTED }}>{label}</span>
        <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.29rem", color: EDITOR_MUTED }}>{value}{unit}</span>
      </div>
      <input ref={inputRef} type="range" min={min} max={max} defaultValue={value} step="any"
        onChange={handleChange} onMouseUp={handleMouseUp}
        style={{ width: "100%", accentColor: "rgba(100,65,15,0.58)", cursor: "pointer", display: "block" }} />
      <div style={{ position: "relative", height: 6, marginTop: 1 }}>
        {SNAP_FRACS.map(f => (
          <div key={f} style={{
            position: "absolute",
            left: `${f * 100}%`,
            transform: "translateX(-50%)",
            width: 1,
            height: 4,
            background: "rgba(100,65,15,0.18)",
          }} />
        ))}
      </div>
    </div>
  );
}

function EditorIconBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: "rgba(100,65,15,0.06)", border: "1px solid rgba(100,65,15,0.16)", borderRadius: 4, cursor: "pointer", padding: "0.28rem 0.48rem", fontFamily: "var(--font-jost)", fontSize: "0.27rem", letterSpacing: "0.07em", color: EDITOR_GOLD }}>
      {label}
    </button>
  );
}

function ImageEditorModal({ img, onSave, onClose }: { img: MoodImage; onSave: (dataUrl: string) => void; onClose: () => void }) {
  type EditorTab = "adjust" | "crop" | "filters" | "background";
  const [tab, setTab] = useState<EditorTab>("adjust");

  // Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast]     = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [temperature, setTemperature] = useState(0);   // -100..100
  const [exposure, setExposure]       = useState(0);   // -50..50
  const [highlights, setHighlights]   = useState(0);   // -100..100
  const [shadows, setShadows]         = useState(0);   // -100..100
  const [clarity, setClarity]         = useState(0);   // 0..100
  const [vignette, setVignette]       = useState(0);   // 0..100

  // Transform
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH]       = useState(false);
  const [flipV, setFlipV]       = useState(false);

  // Crop (normalized 0-1, in displayed image space)
  const [crop, setCrop]           = useState({ x: 0, y: 0, w: 1, h: 1 });
  const [cropAspect, setCropAspect] = useState("free");
  const [dragging, setDragging]   = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; crop: typeof crop } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Filter preset
  const [activeFilter, setActiveFilter] = useState("none");

  // Background removal
  const [bgDataUrl, setBgDataUrl]         = useState<string | null>(null);
  const [bgThreshold, setBgThreshold]     = useState(35);
  const [processingBg, setProcessingBg]   = useState(false);

  const src = bgDataUrl || img.dataUrl;

  // CSS filter string for live preview
  const hueShift = temperature * 0.28;
  const expBoost  = 100 + exposure * 0.9;
  const adjFilter = `brightness(${Math.round(brightness * expBoost / 100)}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hueShift}deg)`;

  const FILTER_PRESETS = [
    { id: "none",   label: "Original", css: "" },
    { id: "warm",   label: "Warm",     css: "sepia(0.22) saturate(115%) brightness(104%)" },
    { id: "cool",   label: "Cool",     css: "hue-rotate(16deg) saturate(85%) brightness(104%)" },
    { id: "bw",     label: "B & W",    css: "grayscale(100%)" },
    { id: "matte",  label: "Matte",    css: "contrast(80%) brightness(115%) saturate(72%)" },
    { id: "vivid",  label: "Vivid",    css: "saturate(158%) contrast(112%)" },
    { id: "fade",   label: "Fade",     css: "brightness(116%) contrast(82%) saturate(70%)" },
    { id: "noir",   label: "Noir",     css: "grayscale(100%) contrast(128%) brightness(88%)" },
    { id: "golden", label: "Golden",   css: "sepia(42%) saturate(140%) brightness(106%)" },
    { id: "chrome", label: "Chrome",   css: "saturate(132%) contrast(110%) brightness(103%)" },
    { id: "lomo",   label: "Lomo",     css: "saturate(128%) contrast(138%) brightness(82%)" },
    { id: "cinema", label: "Cinema",   css: "sepia(18%) contrast(114%) brightness(95%) saturate(90%)" },
  ];
  const presetCss    = FILTER_PRESETS.find(f => f.id === activeFilter)?.css ?? "";
  const fullFilter   = [adjFilter, presetCss].filter(Boolean).join(" ");

  // Highlights/shadows: applied post-draw via canvas pixel manipulation on Apply
  // Transform CSS
  const transformStr = [
    rotation ? `rotate(${rotation}deg)` : "",
    flipH ? "scaleX(-1)" : "",
    flipV ? "scaleY(-1)" : "",
  ].filter(Boolean).join(" ") || "none";

  // ── Crop interaction ──────────────────────────────────────────────
  const handleCropDown = (handle: string) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragging(handle);
    setDragStart({ x: e.clientX, y: e.clientY, crop: { ...crop } });
  };

  useEffect(() => {
    if (!dragging || !dragStart) return;
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.x) / rect.width;
      const dy = (e.clientY - dragStart.y) / rect.height;
      let { x, y, w, h } = dragStart.crop;
      if (dragging === "move") {
        x = Math.max(0, Math.min(1 - w, x + dx));
        y = Math.max(0, Math.min(1 - h, y + dy));
      }
      if (dragging.includes("w")) { const nx = Math.max(0, x + dx); w = Math.max(0.04, w - (nx - x)); x = nx; }
      if (dragging.includes("e")) w = Math.max(0.04, Math.min(1 - x, w + dx));
      if (dragging.includes("n")) { const ny = Math.max(0, y + dy); h = Math.max(0.04, h - (ny - y)); y = ny; }
      if (dragging.includes("s")) h = Math.max(0.04, Math.min(1 - y, h + dy));
      if (cropAspect !== "free") {
        const [aw, ah] = cropAspect.split(":").map(Number);
        const ratio = aw / ah;
        if (dragging.includes("n") || dragging.includes("s")) w = Math.min(1 - x, h * ratio);
        else h = Math.min(1 - y, w / ratio);
      }
      setCrop({ x, y, w, h });
    };
    const onUp = () => { setDragging(null); setDragStart(null); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, dragStart, cropAspect]);

  // ── Background removal (flood-fill from edges) ────────────────────
  const handleRemoveBg = async () => {
    setProcessingBg(true);
    await new Promise(r => setTimeout(r, 30));
    try {
      const imgEl = new Image();
      imgEl.src = img.dataUrl;
      await new Promise<void>(r => { imgEl.onload = () => r(); });
      const W = imgEl.naturalWidth, H = imgEl.naturalHeight;
      const offscreen = document.createElement("canvas");
      offscreen.width = W; offscreen.height = H;
      const ctx = offscreen.getContext("2d")!;
      ctx.drawImage(imgEl, 0, 0);
      const data = ctx.getImageData(0, 0, W, H);
      const px = data.data;

      // Sample bg color from 5×5 corner patches
      let rSum = 0, gSum = 0, bSum = 0, n = 0;
      const sampleCorner = (ox: number, oy: number) => {
        for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 5; dx++) {
          const i = (Math.min(H-1, oy+dy) * W + Math.min(W-1, ox+dx)) * 4;
          if (px[i+3] > 0) { rSum += px[i]; gSum += px[i+1]; bSum += px[i+2]; n++; }
        }
      };
      sampleCorner(0,0); sampleCorner(W-5,0); sampleCorner(0,H-5); sampleCorner(W-5,H-5);
      const bgR = n ? rSum/n : 255, bgG = n ? gSum/n : 255, bgB = n ? bSum/n : 255;

      const dist = (i: number) => Math.sqrt((px[i]-bgR)**2 + (px[i+1]-bgG)**2 + (px[i+2]-bgB)**2);
      const visited = new Uint8Array(W * H);
      const stack: number[] = [];
      for (let x = 0; x < W; x++) { stack.push(x, 0); stack.push(x, H-1); }
      for (let y = 1; y < H-1; y++) { stack.push(0, y); stack.push(W-1, y); }
      let si = 0;
      while (si < stack.length) {
        const x = stack[si++], y = stack[si++];
        const flat = y * W + x;
        if (visited[flat]) continue;
        visited[flat] = 1;
        if (dist(flat * 4) <= bgThreshold) {
          px[flat*4+3] = 0;
          if (x > 0)   stack.push(x-1, y);
          if (x < W-1) stack.push(x+1, y);
          if (y > 0)   stack.push(x, y-1);
          if (y < H-1) stack.push(x, y+1);
        }
      }
      ctx.putImageData(data, 0, 0);
      setBgDataUrl(offscreen.toDataURL("image/png"));
    } finally { setProcessingBg(false); }
  };

  // ── Apply all edits ───────────────────────────────────────────────
  const handleApply = async () => {
    const imgEl = new Image();
    imgEl.src = src;
    await new Promise<void>(r => { imgEl.onload = () => r(); });
    const origW = imgEl.naturalWidth, origH = imgEl.naturalHeight;
    const is90 = rotation === 90 || rotation === 270;
    const rotW = is90 ? origH : origW, rotH = is90 ? origW : origH;

    // Step 1: rotate/flip + filter
    const rot = document.createElement("canvas");
    rot.width = rotW; rot.height = rotH;
    const rctx = rot.getContext("2d")!;
    rctx.filter = fullFilter;
    rctx.translate(rotW/2, rotH/2);
    rctx.rotate(rotation * Math.PI / 180);
    rctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    rctx.drawImage(imgEl, -origW/2, -origH/2);

    // Step 2: pixel-level highlights & shadows
    if (highlights !== 0 || shadows !== 0) {
      const id = rctx.getImageData(0, 0, rotW, rotH);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = (d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114) / 255;
        const hf = lum > 0.5 ? (lum - 0.5) * 2 : 0;
        const sf = lum < 0.5 ? (0.5 - lum) * 2 : 0;
        const adj = (hf * highlights + sf * shadows) * 0.6;
        d[i]   = Math.min(255, Math.max(0, d[i]   + adj));
        d[i+1] = Math.min(255, Math.max(0, d[i+1] + adj));
        d[i+2] = Math.min(255, Math.max(0, d[i+2] + adj));
      }
      rctx.putImageData(id, 0, 0);
    }

    // Step 3: crop
    const cx = Math.round(rotW * crop.x), cy = Math.round(rotH * crop.y);
    const cw = Math.round(rotW * crop.w), ch = Math.round(rotH * crop.h);
    const final = document.createElement("canvas");
    final.width = cw; final.height = ch;
    const fctx = final.getContext("2d")!;
    fctx.drawImage(rot, cx, cy, cw, ch, 0, 0, cw, ch);

    // Step 4: vignette
    if (vignette > 0) {
      const r = Math.hypot(cw, ch) * 0.6;
      const grad = fctx.createRadialGradient(cw/2, ch/2, r*0.2, cw/2, ch/2, r);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, `rgba(0,0,0,${vignette/110})`);
      fctx.fillStyle = grad; fctx.fillRect(0, 0, cw, ch);
    }

    // Step 5: clarity (sharpness via unsharp-mask approximation — skip for now, use identity)
    const isPng = src.startsWith("data:image/png") || bgDataUrl !== null;
    onSave(isPng ? final.toDataURL("image/png") : final.toDataURL("image/jpeg", 0.92));
  };

  // ── Shared style constants ────────────────────────────────────────
  const GOLD  = EDITOR_GOLD;
  const MUTED = EDITOR_MUTED;
  const INK   = "rgba(26,18,10,0.8)";

  const resetAll = () => {
    setBrightness(100); setContrast(100); setSaturation(100);
    setTemperature(0); setExposure(0); setHighlights(0); setShadows(0); setClarity(0); setVignette(0);
    setRotation(0); setFlipH(false); setFlipV(false);
    setActiveFilter("none"); setCrop({ x: 0, y: 0, w: 1, h: 1 }); setCropAspect("free");
    setBgDataUrl(null);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(26,18,10,0.62)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div
        style={{ background: "rgba(245,240,232,0.98)", borderRadius: 12, width: "min(940px, 94vw)", height: "min(680px, 90vh)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 70px rgba(26,18,10,0.32)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.1rem", borderBottom: "1px solid rgba(100,65,15,0.1)", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "0.88rem", color: INK, letterSpacing: "0.04em" }}>Edit Image</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: "0.65rem", lineHeight: 1 }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Preview area */}
          <div style={{ flex: 1, background: tab === "background" && bgDataUrl ? "repeating-conic-gradient(rgba(0,0,0,0.06) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px" : "rgba(26,18,10,0.05)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
            <div ref={previewRef} style={{ position: "relative", display: "inline-block", maxWidth: "90%", maxHeight: "calc(100% - 2rem)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src} alt=""
                style={{ display: "block", maxWidth: "100%", maxHeight: "54vh", objectFit: "contain", filter: fullFilter, transform: transformStr, transformOrigin: "center center" }}
              />
              {/* Crop overlay */}
              {tab === "crop" && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${crop.y*100}%`, background: "rgba(0,0,0,0.52)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${(1-crop.y-crop.h)*100}%`, background: "rgba(0,0,0,0.52)" }} />
                  <div style={{ position: "absolute", top: `${crop.y*100}%`, height: `${crop.h*100}%`, left: 0, width: `${crop.x*100}%`, background: "rgba(0,0,0,0.52)" }} />
                  <div style={{ position: "absolute", top: `${crop.y*100}%`, height: `${crop.h*100}%`, right: 0, width: `${(1-crop.x-crop.w)*100}%`, background: "rgba(0,0,0,0.52)" }} />
                  <div
                    style={{ position: "absolute", left: `${crop.x*100}%`, top: `${crop.y*100}%`, width: `${crop.w*100}%`, height: `${crop.h*100}%`, border: "1.5px solid rgba(255,255,255,0.88)", boxSizing: "border-box", cursor: "move", pointerEvents: "auto" }}
                    onMouseDown={handleCropDown("move")}
                  >
                    {/* Rule-of-thirds */}
                    {["33.33%","66.66%"].map(p => (
                      <React.Fragment key={p}>
                        <div style={{ position: "absolute", left: p, top: 0, bottom: 0, width: 0, borderLeft: "1px solid rgba(255,255,255,0.22)", pointerEvents: "none" }} />
                        <div style={{ position: "absolute", top: p, left: 0, right: 0, height: 0, borderTop: "1px solid rgba(255,255,255,0.22)", pointerEvents: "none" }} />
                      </React.Fragment>
                    ))}
                    {/* Corner handles */}
                    {(["nw","ne","sw","se"] as const).map(h => (
                      <div key={h} onMouseDown={handleCropDown(h)} style={{ position: "absolute", ...(h.includes("n")?{top:-5}:{bottom:-5}), ...(h.includes("w")?{left:-5}:{right:-5}), width: 11, height: 11, background: "white", borderRadius: 1, cursor: h==="nw"||h==="se"?"nwse-resize":"nesw-resize", pointerEvents: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
                    ))}
                    {/* Edge handles */}
                    <div onMouseDown={handleCropDown("n")} style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 26, height: 8, background: "white", borderRadius: 2, cursor: "ns-resize", pointerEvents: "auto" }} />
                    <div onMouseDown={handleCropDown("s")} style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", width: 26, height: 8, background: "white", borderRadius: 2, cursor: "ns-resize", pointerEvents: "auto" }} />
                    <div onMouseDown={handleCropDown("w")} style={{ position: "absolute", left: -4, top: "50%", transform: "translateY(-50%)", width: 8, height: 26, background: "white", borderRadius: 2, cursor: "ew-resize", pointerEvents: "auto" }} />
                    <div onMouseDown={handleCropDown("e")} style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", width: 8, height: 26, background: "white", borderRadius: 2, cursor: "ew-resize", pointerEvents: "auto" }} />
                  </div>
                </div>
              )}
            </div>
            {/* Vignette preview */}
            {vignette > 0 && (
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,${vignette/115}) 100%)`, pointerEvents: "none" }} />
            )}
          </div>

          {/* ── Right panel ── */}
          <div style={{ width: 268, borderLeft: "1px solid rgba(100,65,15,0.1)", display: "flex", flexDirection: "column", flexShrink: 0, background: "rgba(245,240,232,0.6)" }}>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(100,65,15,0.1)", flexShrink: 0 }}>
              {(["adjust","crop","filters","background"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: "none", border: "none", borderBottom: tab===t ? "2px solid rgba(100,65,15,0.52)" : "2px solid transparent", cursor: "pointer", padding: "0.55rem 0", fontFamily: "var(--font-jost)", fontSize: "0.26rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: tab===t ? GOLD : MUTED, transition: "color 0.15s" }}>
                  {t === "background" ? "BG" : t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0.9rem", scrollbarWidth: "none" }}>

              {tab === "adjust" && (<>
                <EditorSliderRow label="Exposure"    value={exposure}     min={-50}  max={50}  set={setExposure}     unit="" />
                <EditorSliderRow label="Brightness"  value={brightness}   min={0}    max={200} set={setBrightness}   />
                <EditorSliderRow label="Contrast"    value={contrast}     min={0}    max={200} set={setContrast}     />
                <EditorSliderRow label="Highlights"  value={highlights}   min={-100} max={100} set={setHighlights}   unit="" />
                <EditorSliderRow label="Shadows"     value={shadows}      min={-100} max={100} set={setShadows}      unit="" />
                <EditorSliderRow label="Saturation"  value={saturation}   min={0}    max={200} set={setSaturation}   />
                <EditorSliderRow label="Temperature" value={temperature}  min={-100} max={100} set={setTemperature}  unit="" />
                <EditorSliderRow label="Clarity"     value={clarity}      min={0}    max={100} set={setClarity}      />
                <EditorSliderRow label="Vignette"    value={vignette}     min={0}    max={100} set={setVignette}     />
                <div style={{ borderTop: "1px solid rgba(100,65,15,0.1)", paddingTop: "0.75rem", marginTop: "0.2rem" }}>
                  <div style={{ fontFamily: "var(--font-jost)", fontSize: "0.26rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED, marginBottom: "0.45rem" }}>Transform</div>
                  <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                    <EditorIconBtn label="↺ CCW" onClick={() => setRotation(r => (r-90+360)%360)} />
                    <EditorIconBtn label="↻ CW"  onClick={() => setRotation(r => (r+90)%360)} />
                    <EditorIconBtn label="⇄ Flip H" onClick={() => setFlipH(v => !v)} />
                    <EditorIconBtn label="⇅ Flip V" onClick={() => setFlipV(v => !v)} />
                  </div>
                </div>
              </>)}

              {tab === "crop" && (<>
                <div style={{ fontFamily: "var(--font-jost)", fontSize: "0.26rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED, marginBottom: "0.4rem" }}>Aspect Ratio</div>
                <div style={{ display: "flex", gap: "0.28rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
                  {[["free","Free"],["1:1","1:1"],["4:3","4:3"],["3:4","3:4"],["16:9","16:9"],["9:16","9:16"],["3:2","3:2"],["2:3","2:3"]].map(([val,lbl]) => (
                    <button key={val} onClick={() => {
                      setCropAspect(val);
                      if (val !== "free") {
                        const [aw,ah] = val.split(":").map(Number), ratio = aw/ah;
                        const newH = Math.min(1-crop.y, crop.w/ratio);
                        const newW = Math.min(1-crop.x, newH*ratio);
                        setCrop(c => ({ ...c, w: newW, h: newW/ratio }));
                      }
                    }} style={{ background: cropAspect===val?"rgba(100,65,15,0.11)":"rgba(100,65,15,0.04)", border: `1px solid rgba(100,65,15,${cropAspect===val?0.32:0.13})`, borderRadius: 4, cursor: "pointer", padding: "0.26rem 0.42rem", fontFamily: "var(--font-jost)", fontSize: "0.26rem", letterSpacing: "0.07em", color: cropAspect===val?GOLD:MUTED }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid rgba(100,65,15,0.1)", paddingTop: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{ fontFamily: "var(--font-jost)", fontSize: "0.26rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED, marginBottom: "0.45rem" }}>Rotate & Flip</div>
                  <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                    <EditorIconBtn label="↺ CCW"    onClick={() => setRotation(r => (r-90+360)%360)} />
                    <EditorIconBtn label="↻ CW"     onClick={() => setRotation(r => (r+90)%360)} />
                    <EditorIconBtn label="⇄ Flip H" onClick={() => setFlipH(v => !v)} />
                    <EditorIconBtn label="⇅ Flip V" onClick={() => setFlipV(v => !v)} />
                  </div>
                </div>
                <button onClick={() => { setCrop({ x:0,y:0,w:1,h:1 }); setCropAspect("free"); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-jost)", fontSize: "0.26rem", letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, padding: 0 }}>
                  Reset Crop
                </button>
              </>)}

              {tab === "filters" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem" }}>
                  {FILTER_PRESETS.map(preset => (
                    <button key={preset.id} onClick={() => setActiveFilter(preset.id)}
                      style={{ background: "none", border: `1.5px solid rgba(100,65,15,${activeFilter===preset.id?0.42:0.1})`, borderRadius: 6, cursor: "pointer", padding: "0.28rem", textAlign: "center" }}>
                      <div style={{ width: "100%", paddingBottom: "62%", position: "relative", overflow: "hidden", borderRadius: 3, marginBottom: 5 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: preset.css || "none" }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.26rem", letterSpacing: "0.11em", textTransform: "uppercase", color: activeFilter===preset.id?GOLD:MUTED }}>{preset.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {tab === "background" && (<>
                <p style={{ fontFamily: "var(--font-cormorant)", fontSize: "0.68rem", color: MUTED, fontStyle: "italic", lineHeight: 1.45, margin: "0 0 0.9rem" }}>
                  Remove the background from your image. Works best on plain or uniform backgrounds.
                </p>
                <EditorSliderRow label="Sensitivity" value={bgThreshold} min={5} max={80} set={setBgThreshold} unit="" />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginTop: "0.2rem" }}>
                  <button onClick={handleRemoveBg} disabled={processingBg}
                    style={{ background: "rgba(100,65,15,0.09)", border: "1px solid rgba(100,65,15,0.22)", borderRadius: 6, cursor: processingBg?"wait":"pointer", padding: "0.52rem", fontFamily: "var(--font-jost)", fontSize: "0.28rem", letterSpacing: "0.13em", textTransform: "uppercase", color: GOLD }}>
                    {processingBg ? "Processing…" : bgDataUrl ? "Re-process" : "Remove Background"}
                  </button>
                  {bgDataUrl && (
                    <button onClick={() => setBgDataUrl(null)}
                      style={{ background: "none", border: "1px solid rgba(100,65,15,0.16)", borderRadius: 6, cursor: "pointer", padding: "0.52rem", fontFamily: "var(--font-jost)", fontSize: "0.28rem", letterSpacing: "0.13em", textTransform: "uppercase", color: MUTED }}>
                      Restore Original
                    </button>
                  )}
                </div>
                {bgDataUrl && (
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.26rem", color: "rgba(100,65,15,0.38)", marginTop: "0.7rem", lineHeight: 1.6 }}>
                    Background removed. Adjust sensitivity and re-process if edges look rough.
                  </p>
                )}
              </>)}

            </div>

            {/* Footer */}
            <div style={{ borderTop: "1px solid rgba(100,65,15,0.1)", padding: "0.65rem 0.9rem", display: "flex", gap: "0.42rem", justifyContent: "flex-end", flexShrink: 0 }}>
              <button onClick={resetAll} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-jost)", fontSize: "0.26rem", letterSpacing: "0.13em", textTransform: "uppercase", color: MUTED, padding: "0.32rem 0.45rem" }}>Reset All</button>
              <button onClick={onClose} style={{ background: "none", border: "1px solid rgba(100,65,15,0.18)", borderRadius: 5, cursor: "pointer", fontFamily: "var(--font-jost)", fontSize: "0.26rem", letterSpacing: "0.13em", textTransform: "uppercase", color: MUTED, padding: "0.32rem 0.65rem" }}>Cancel</button>
              <button onClick={handleApply} style={{ background: "rgba(100,65,15,0.11)", border: "1px solid rgba(100,65,15,0.28)", borderRadius: 5, cursor: "pointer", fontFamily: "var(--font-jost)", fontSize: "0.26rem", letterSpacing: "0.13em", textTransform: "uppercase", color: GOLD, padding: "0.32rem 0.65rem" }}>Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageThumb({ img, onAdd, onRemove, onEdit }: { img: MoodImage; onAdd: () => void; onRemove: () => void; onEdit: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData("text/plain", img.id); e.dataTransfer.effectAllowed = "copy"; }}
      style={{ position: "relative", aspectRatio: "1", overflow: "hidden", borderRadius: 3, border: "1px solid rgba(100,65,15,0.1)", cursor: "grab" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onAdd}
      title="Drag to canvas or click to add"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {/* Three-dot settings button */}
      <button
        onClick={e => { e.stopPropagation(); onEdit(); }}
        style={{
          position: "absolute", top: 3, right: 3,
          width: 18, height: 18, borderRadius: "50%",
          background: "rgba(26,18,10,0.62)", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(245,240,232,0.9)", lineHeight: 1,
          opacity: hovered ? 1 : 0, transition: "opacity 0.15s",
        }}
        title="Edit image"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.92)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
      </button>
      {/* Remove button */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        style={{
          position: "absolute", top: 3, left: 3,
          width: 16, height: 16, borderRadius: "50%",
          background: "rgba(26,18,10,0.62)", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(245,240,232,0.9)", fontSize: "0.45rem", lineHeight: 1,
          opacity: hovered ? 1 : 0, transition: "opacity 0.15s",
        }}
        title="Remove from library"
      >✕</button>
    </div>
  );
}

type Project = { id: string; name: string; conversationIds: string[] };

function genId() { return Math.random().toString(36).slice(2); }
function toTitleCase(s: string) { return s.replace(/\b\w/g, c => c.toUpperCase()); }

async function removeBgWhiten(dataUrl: string, threshold = 42): Promise<string> {
  const imgEl = new Image();
  imgEl.src = dataUrl;
  await new Promise<void>(r => { imgEl.onload = () => r(); });
  const W = imgEl.naturalWidth, H = imgEl.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imgEl, 0, 0);
  const data = ctx.getImageData(0, 0, W, H);
  const px = data.data;
  // Sample bg color from corner patches
  let rS = 0, gS = 0, bS = 0, n = 0;
  const sc = (ox: number, oy: number) => { for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 5; dx++) { const i = (Math.min(H-1,oy+dy)*W+Math.min(W-1,ox+dx))*4; if (px[i+3]>0){rS+=px[i];gS+=px[i+1];bS+=px[i+2];n++;} } };
  sc(0,0); sc(W-5,0); sc(0,H-5); sc(W-5,H-5);
  const bgR = n?rS/n:255, bgG = n?gS/n:255, bgB = n?bS/n:255;
  const dist = (i: number) => Math.sqrt((px[i]-bgR)**2+(px[i+1]-bgG)**2+(px[i+2]-bgB)**2);
  const visited = new Uint8Array(W*H);
  const stack: number[] = [];
  for (let x=0;x<W;x++){stack.push(x,0);stack.push(x,H-1);}
  for (let y=1;y<H-1;y++){stack.push(0,y);stack.push(W-1,y);}
  let si=0;
  while (si<stack.length){
    const x=stack[si++],y=stack[si++],flat=y*W+x;
    if(visited[flat])continue;
    visited[flat]=1;
    if(dist(flat*4)<=threshold){px[flat*4+3]=0;if(x>0)stack.push(x-1,y);if(x<W-1)stack.push(x+1,y);if(y>0)stack.push(x,y-1);if(y<H-1)stack.push(x,y+1);}
  }
  // Composite over white
  for (let i=0;i<px.length;i+=4){
    const a=px[i+3]/255;
    px[i]=Math.round(px[i]*a+255*(1-a));
    px[i+1]=Math.round(px[i+1]*a+255*(1-a));
    px[i+2]=Math.round(px[i+2]*a+255*(1-a));
    px[i+3]=255;
  }
  ctx.putImageData(data,0,0);
  return canvas.toDataURL("image/png");
}

export default function LeftSidebar({
  conversations,
  conversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onRenameConversation,
}: {
  conversations: ConversationRow[];
  conversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, title: string) => void;
}) {
  const [collapsed, setCollapsed]               = useState(false);
  const [projects, setProjects]                 = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [addingProject, setAddingProject]       = useState(false);
  const [newProject, setNewProject]             = useState("");
  const [editingKey, setEditingKey]             = useState<string | null>(null);
  const [editValue, setEditValue]               = useState("");
  const [hoveredKey, setHoveredKey]             = useState<string | null>(null);
  const [menuOpen, setMenuOpen]                 = useState<string | null>(null);
  const [addingConvTo, setAddingConvTo]         = useState<string | null>(null);
  const [notepadOpen, setNotepadOpen]           = useState(false);
  const [noteContent, setNoteContent]           = useState("");
  const [activeFormats, setActiveFormats]       = useState<Set<"italic" | "bullet" | "numbered">>(new Set());
  const [moodboardImages, setMoodboardImages]   = useState<MoodImage[]>([]);
  const [moodboardOpen, setMoodboardOpen]       = useState(false);
  const [canvases, setCanvases]                 = useState<Canvas[]>([]);
  const [activeCanvasId, setActiveCanvasId]     = useState<string>("");
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [canvasDragOver, setCanvasDragOver]     = useState(false);
  const [canvasMoving, setCanvasMoving]         = useState(false);
  const [editingImage, setEditingImage]         = useState<MoodImage | null>(null);
  const [activeTool, setActiveTool]             = useState<"select" | "text">("select");
  const [editingTextId, setEditingTextId]       = useState<string | null>(null);
  const [openPanel, setOpenPanel]               = useState<"color" | "layers" | "size" | null>(null);
  const [closetOpen, setClosetOpen]             = useState(false);
  const [cubbies, setCubbies]                   = useState<ClosetCubby[]>([]);
  const [editingCubbyId, setEditingCubbyId]     = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue]     = useState("");
  const [hoveredCubbyIdx, setHoveredCubbyIdx]   = useState<number | null>(null);
  const [openCubbyId, setOpenCubbyId]           = useState<string | null>(null);
  const [processingBg, setProcessingBg]         = useState<Set<string>>(new Set());
  const [lassoTarget, setLassoTarget]           = useState<{ cubbyId: string; itemId: string; dataUrl: string } | null>(null);
  const [lassoClosed, setLassoClosed]           = useState(false);
  const [lassoApplying, setLassoApplying]       = useState(false);
  const [lassoZoom, setLassoZoom]               = useState(1);
  const [lassoPan, setLassoPan]                 = useState({ x: 0, y: 0 });
  const [lassoPanMode, setLassoPanMode]         = useState(false);
  const [lassoMode, setLassoMode]               = useState<"keep" | "remove">("keep");
  const [lassoCanUndo, setLassoCanUndo]         = useState(false);
  const [lassoAddedMood, setLassoAddedMood]     = useState(false);
  const lassoAddedMoodTimer                     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lassoCanvasRef   = useRef<HTMLCanvasElement>(null);
  const lassoImgRef      = useRef<HTMLImageElement>(null);
  const lassoPointsRef   = useRef<{ x: number; y: number }[]>([]);
  const lassoDrawingRef  = useRef(false);
  const lassoBaSizeRef   = useRef({ w: 0, h: 0 }); // base canvas size at zoom=1, dpr-scaled
  const lassoModeRef     = useRef<"keep" | "remove">("keep");
  const lassoZoomRef     = useRef(1);
  const lassoHistoryRef  = useRef<string[]>([]);
  const lassoSessionRef  = useRef<string | null>(null);
  const lassoAreaRef     = useRef<HTMLDivElement>(null);
  const panDragRef       = useRef<{ active: boolean; startX: number; startY: number; startPanX: number; startPanY: number }>({ active: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  const projectInputRef    = useRef<HTMLInputElement>(null);
  const editInputRef       = useRef<HTMLInputElement>(null);
  const noteTextareaRef    = useRef<HTMLTextAreaElement>(null);
  const notepadSaveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodboardInputRef  = useRef<HTMLInputElement>(null);
  const closetFileRef      = useRef<HTMLInputElement>(null);
  const uploadingCubbyRef  = useRef<string | null>(null);
  const canvasRef          = useRef<HTMLDivElement>(null);
  const dragRef            = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; halfW: number; halfH: number } | null>(null);
  const resizeRef          = useRef<{ id: string; startX: number; origW: number } | null>(null);
  const rotateRef          = useRef<{ id: string; cx: number; cy: number; startAngle: number; origRotation: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROJECTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Project[];
        setProjects(parsed.map(p => ({ conversationIds: [], ...p })));
      }
    } catch { /* ignore */ }
    try {
      const note = localStorage.getItem(NOTEPAD_KEY);
      if (note) setNoteContent(note);
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem(MOODBOARD_KEY);
      if (raw) setMoodboardImages(JSON.parse(raw));
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem(CANVAS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && "imageId" in parsed[0]) {
          // Migrate old flat CanvasItem[] format → Canvas[]
          const migrated: Canvas[] = [{ id: genId(), items: parsed }];
          setCanvases(migrated);
          setActiveCanvasId(migrated[0].id);
          localStorage.setItem(CANVAS_KEY, JSON.stringify(migrated));
        } else if (Array.isArray(parsed)) {
          const cvs: Canvas[] = parsed.length > 0 ? parsed : [{ id: genId(), items: [] }];
          setCanvases(cvs);
          setActiveCanvasId(cvs[0].id);
        }
      } else {
        const init: Canvas = { id: genId(), items: [] };
        setCanvases([init]);
        setActiveCanvasId(init.id);
      }
    } catch {
      const init: Canvas = { id: genId(), items: [] };
      setCanvases([init]);
      setActiveCanvasId(init.id);
    }
  }, []);

  useEffect(() => {
    if (notepadOpen) setTimeout(() => {
      const ta = noteTextareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }, 60);
  }, [notepadOpen]);

  useEffect(() => { if (addingProject) projectInputRef.current?.focus(); }, [addingProject]);
  useEffect(() => { if (editingKey) editInputRef.current?.focus(); }, [editingKey]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-row-menu]")) setMenuOpen(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const saveProjects = (next: Project[]) => {
    setProjects(next);
    try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const handleNoteChange = useCallback((val: string) => {
    setNoteContent(val);
    try { localStorage.setItem(NOTEPAD_KEY, val); } catch { /* ignore */ }
    // Debounce Supabase save — fire 1.5 s after the user stops typing
    if (notepadSaveTimer.current) clearTimeout(notepadSaveTimer.current);
    notepadSaveTimer.current = setTimeout(() => saveNotepadToSupabase(val), 1500);
  }, []);

  const saveMoodboard = useCallback((images: MoodImage[]) => {
    setMoodboardImages(images);
    try { localStorage.setItem(MOODBOARD_KEY, JSON.stringify(images)); } catch { /* ignore */ }
  }, []);

  const handleMoodboardFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f =>
      f.type.startsWith("image/") && f.type !== "image/svg+xml"
    );
    if (!files.length) return;
    const added: MoodImage[] = [];
    for (const file of files.slice(0, 12)) {
      try { added.push({ id: genId(), dataUrl: await processMoodImage(file) }); } catch { /* skip */ }
    }
    setMoodboardImages(prev => {
      const next = [...prev, ...added];
      try { localStorage.setItem(MOODBOARD_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    if (moodboardInputRef.current) moodboardInputRef.current.value = "";
  }, []);

  const saveCanvas = useCallback((cvs: Canvas[]) => {
    try { localStorage.setItem(CANVAS_KEY, JSON.stringify(cvs)); } catch { /* ignore */ }
  }, []);

  const addToCanvas = useCallback((imageId: string) => {
    setCanvases(prev => {
      const next = prev.map(c => {
        if (c.id !== activeCanvasId) return c;
        const newItem: CanvasItem = {
          id: genId(), imageId,
          x: 5 + (c.items.length % 5) * 8,
          y: 5 + Math.floor(c.items.length / 5) * 14,
          w: 30,
          zIndex: c.items.length + 1,
        };
        return { ...c, items: [...c.items, newItem] };
      });
      try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [activeCanvasId]);

  const addToCanvasAt = useCallback((imageId: string, xPct: number, yPct: number) => {
    setCanvases(prev => {
      const next = prev.map(c => {
        if (c.id !== activeCanvasId) return c;
        const newItem: CanvasItem = {
          id: genId(), imageId,
          x: Math.max(0, Math.min(70, xPct - 15)),
          y: Math.max(0, Math.min(80, yPct - 10)),
          w: 30,
          zIndex: c.items.length + 1,
        };
        return { ...c, items: [...c.items, newItem] };
      });
      try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [activeCanvasId]);

  const removeMoodImage = useCallback((imageId: string) => {
    setMoodboardImages(prev => {
      const next = prev.filter(m => m.id !== imageId);
      try { localStorage.setItem(MOODBOARD_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setCanvases(prev => {
      const next = prev.map(c => ({ ...c, items: c.items.filter(i => i.imageId !== imageId) }));
      try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const saveEditedImage = useCallback((newDataUrl: string) => {
    setMoodboardImages(prev => {
      const next = prev.map(m => m.id === editingImage?.id ? { ...m, dataUrl: newDataUrl } : m);
      try { localStorage.setItem(MOODBOARD_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setEditingImage(null);
  }, [editingImage]);

  const createCanvas = useCallback(() => {
    const nc: Canvas = { id: genId(), items: [] };
    setCanvases(prev => {
      const next = [...prev, nc];
      try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setActiveCanvasId(nc.id);
    setSelectedCanvasId(null);
  }, []);

  const deleteCanvas = useCallback((canvasId: string) => {
    setCanvases(prev => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex(c => c.id === canvasId);
      const next = prev.filter(c => c.id !== canvasId);
      if (activeCanvasId === canvasId) {
        setActiveCanvasId(next[Math.max(0, idx - 1)].id);
      }
      try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setSelectedCanvasId(null);
  }, [activeCanvasId]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const snapPos = (x: number, y: number, halfW: number, halfH: number) => {
      // Snap image center to canvas center axes (one vertical + one horizontal line at 50%)
      const cx = x + halfW, cy = y + halfH;
      return {
        x: Math.abs(cx - 50) < 6 ? 50 - halfW : x,
        y: Math.abs(cy - 50) < 6 ? 50 - halfH : y,
      };
    };
    if (dragRef.current) {
      const { id, startX, startY, origX, origY, halfW, halfH } = dragRef.current;
      const dx = (e.clientX - startX) / rect.width * 100;
      const dy = (e.clientY - startY) / rect.height * 100;
      const { x: sx, y: sy } = snapPos(origX + dx, origY + dy, halfW, halfH);
      setCanvases(prev => prev.map(c =>
        c.id !== activeCanvasId ? c :
        { ...c, items: c.items.map(i => i.id === id ? { ...i, x: sx, y: sy } : i) }
      ));
    } else if (resizeRef.current) {
      const { id, startX, origW } = resizeRef.current;
      const dx = (e.clientX - startX) / rect.width * 100;
      setCanvases(prev => prev.map(c =>
        c.id !== activeCanvasId ? c :
        { ...c, items: c.items.map(i => i.id === id ? { ...i, w: Math.max(8, origW + dx) } : i) }
      ));
    } else if (rotateRef.current) {
      const { id, cx, cy, startAngle, origRotation } = rotateRef.current;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
      const raw = origRotation + (angle - startAngle);
      // Normalize to [0, 360) then snap to cardinal angles within 6°
      const norm = ((raw % 360) + 360) % 360;
      const cardinals = [0, 90, 180, 270, 360];
      const nearest = cardinals.reduce((best, c) => Math.abs(c - norm) < Math.abs(best - norm) ? c : best, cardinals[0]);
      const snapped = Math.abs(nearest - norm) < 6 ? raw + (nearest - norm) : raw;
      setCanvases(prev => prev.map(c =>
        c.id !== activeCanvasId ? c :
        { ...c, items: c.items.map(i => i.id === id ? { ...i, rotation: snapped } : i) }
      ));
    }
  }, [activeCanvasId]);

  const handleCanvasPointerUp = useCallback(() => {
    const wasDragging = !!(dragRef.current || resizeRef.current || rotateRef.current);
    dragRef.current = null;
    resizeRef.current = null;
    rotateRef.current = null;
    setCanvasMoving(false);
    if (wasDragging) setCanvases(prev => { saveCanvas(prev); return prev; });
  }, [saveCanvas]);

  const setCanvasBackground = useCallback((color: string) => {
    setCanvases(prev => {
      const next = prev.map(c => c.id === activeCanvasId ? { ...c, background: color } : c);
      try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [activeCanvasId]);

  const setCanvasAspectRatio = useCallback((ratio: string) => {
    setCanvases(prev => {
      const next = prev.map(c => c.id === activeCanvasId ? { ...c, aspectRatio: ratio } : c);
      try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [activeCanvasId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedCanvasId) return;
    setCanvases(prev => {
      const next = prev.map(c => {
        if (c.id !== activeCanvasId) return c;
        const item = c.items.find(i => i.id === selectedCanvasId);
        if (!item) return c;
        const maxZ = Math.max(0, ...c.items.map(i => i.zIndex));
        return { ...c, items: [...c.items, { ...item, id: genId(), x: item.x + 5, y: item.y + 5, zIndex: maxZ + 1 }] };
      });
      try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [selectedCanvasId, activeCanvasId]);

  const removeBg = useCallback(() => {
    if (!selectedCanvasId) return;
    const activeCanvas = canvases.find(c => c.id === activeCanvasId);
    const item = activeCanvas?.items.find(i => i.id === selectedCanvasId);
    if (!item || item.type === "text") return;
    const moodImg = moodboardImages.find(m => m.id === item.imageId);
    if (!moodImg) return;
    const img = new window.Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = img.width; cv.height = img.height;
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (r > 210 && g > 210 && b > 210) {
          const brightness = (r + g + b) / 3;
          d[i + 3] = Math.max(0, Math.round(d[i + 3] * Math.max(0, 1 - (brightness - 210) / 45)));
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const newDataUrl = cv.toDataURL("image/png");
      setMoodboardImages(prev => {
        const next = prev.map(m => m.id === item.imageId ? { ...m, dataUrl: newDataUrl } : m);
        try { localStorage.setItem(MOODBOARD_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    };
    img.src = moodImg.dataUrl;
  }, [selectedCanvasId, canvases, activeCanvasId, moodboardImages]);

  const downloadCanvas = useCallback(async () => {
    const activeCanvas = canvases.find(c => c.id === activeCanvasId);
    if (!activeCanvas) return;
    const aspect = activeCanvas.aspectRatio ?? "free";
    const dims: Record<string, [number, number]> = {
      "free": [1200, 900], "1:1": [1080, 1080], "4:5": [1080, 1350],
      "9:16": [1080, 1920], "4:3": [1200, 900], "16:9": [1920, 1080],
    };
    const [outW, outH] = dims[aspect] ?? [1200, 900];
    const oc = document.createElement("canvas");
    oc.width = outW; oc.height = outH;
    const ctx = oc.getContext("2d")!;
    const bg = activeCanvas.background ?? "#FFFFFF";
    if (bg !== "transparent") { ctx.fillStyle = bg; ctx.fillRect(0, 0, outW, outH); }
    const sorted = [...activeCanvas.items].sort((a, b) => a.zIndex - b.zIndex);
    for (const it of sorted) {
      if (it.type === "text") {
        const xPx = it.x / 100 * outW, yPx = it.y / 100 * outH, wPx = it.w / 100 * outW;
        const fSize = Math.round((it.fontSize ?? 18) * outW / 400);
        ctx.save();
        ctx.globalAlpha = it.opacity ?? 1;
        ctx.translate(xPx + wPx / 2, yPx + fSize * 0.7);
        ctx.rotate((it.rotation ?? 0) * Math.PI / 180);
        ctx.font = `${fSize}px 'Cormorant Garamond', Georgia, serif`;
        ctx.fillStyle = it.fontColor ?? "#1a120a";
        ctx.textAlign = "center";
        ctx.fillText(it.text ?? "", 0, 0);
        ctx.restore();
      } else {
        const moodImg = moodboardImages.find(m => m.id === it.imageId);
        if (!moodImg) continue;
        await new Promise<void>(res => {
          const img = new window.Image();
          img.onload = () => {
            const xPx = it.x / 100 * outW, yPx = it.y / 100 * outH;
            const wPx = it.w / 100 * outW, hPx = img.height / img.width * wPx;
            ctx.save();
            ctx.globalAlpha = it.opacity ?? 1;
            ctx.translate(xPx + wPx / 2, yPx + hPx / 2);
            ctx.rotate((it.rotation ?? 0) * Math.PI / 180);
            ctx.drawImage(img, -wPx / 2, -hPx / 2, wPx, hPx);
            ctx.restore();
            res();
          };
          img.onerror = () => res();
          img.src = moodImg.dataUrl;
        });
      }
    }
    const useTransparent = bg === "transparent";
    oc.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `moodboard.${useTransparent ? "png" : "jpg"}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, useTransparent ? "image/png" : "image/jpeg", 0.93);
  }, [canvases, activeCanvasId, moodboardImages]);

  const addTextItem = useCallback((xPct: number, yPct: number) => {
    const newId = genId();
    setCanvases(prev => {
      const next = prev.map(c => {
        if (c.id !== activeCanvasId) return c;
        const maxZ = Math.max(0, ...c.items.map(i => i.zIndex));
        const newItem: CanvasItem = {
          id: newId, type: "text", text: "", fontSize: 18, fontColor: "#1a120a",
          x: Math.max(0, Math.min(70, xPct - 10)), y: Math.max(0, Math.min(90, yPct - 3)),
          w: 25, zIndex: maxZ + 1,
        };
        return { ...c, items: [...c.items, newItem] };
      });
      try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setSelectedCanvasId(newId);
    setEditingTextId(newId);
    setActiveTool("select");
  }, [activeCanvasId]);

  const reorderLayer = useCallback((itemId: string, dir: "up" | "down") => {
    setCanvases(prev => {
      const next = prev.map(c => {
        if (c.id !== activeCanvasId) return c;
        const sorted = [...c.items].sort((a, b) => a.zIndex - b.zIndex);
        const idx = sorted.findIndex(i => i.id === itemId);
        if (dir === "up" && idx < sorted.length - 1) {
          const tmp = sorted[idx].zIndex;
          sorted[idx] = { ...sorted[idx], zIndex: sorted[idx + 1].zIndex };
          sorted[idx + 1] = { ...sorted[idx + 1], zIndex: tmp };
        } else if (dir === "down" && idx > 0) {
          const tmp = sorted[idx].zIndex;
          sorted[idx] = { ...sorted[idx], zIndex: sorted[idx - 1].zIndex };
          sorted[idx - 1] = { ...sorted[idx - 1], zIndex: tmp };
        }
        return { ...c, items: sorted };
      });
      try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [activeCanvasId]);

  const DEFAULT_CUBBIES = (): ClosetCubby[] =>
    Array.from({ length: 25 }, (_, i) => ({ id: `cubby-${i}`, label: "", items: [] }));

  // Closet: load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLOSET_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && (parsed.length === 0 || "label" in parsed[0])) {
          // Ensure we always have 15 cubbies
          const padded = [...parsed];
          while (padded.length < 25) padded.push({ id: `cubby-${padded.length}`, label: "", items: [] });
          setCubbies(padded);
          return;
        }
      }
    } catch { /* ignore */ }
    setCubbies(DEFAULT_CUBBIES());
  }, []);

  // Closet: expose window bridge so AI can read the wardrobe
  useEffect(() => {
    (window as unknown as Record<string, unknown>).getClosetItems = () =>
      cubbies.flatMap(c => c.items.map(i => ({ id: i.id, cubbyLabel: c.label, category: i.category })));
    return () => { delete (window as unknown as Record<string, unknown>).getClosetItems; };
  }, [cubbies]);

  const saveCubbies = (next: ClosetCubby[]) => {
    setCubbies(next);
    try { localStorage.setItem(CLOSET_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const drawLassoCanvas = useCallback(() => {
    const canvas = lassoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pts = lassoPointsRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (pts.length < 2) return;
    const drawing = lassoDrawingRef.current;

    // Scale line widths so they stay visually consistent across DPR and CSS zoom
    const rect = canvas.getBoundingClientRect();
    const s = rect.width > 0 ? canvas.width / rect.width : 1;

    const drawStroke = (close: boolean) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      if (close) ctx.closePath();
      ctx.setLineDash([6 * s, 4 * s]);
      ctx.strokeStyle = "rgba(0,0,0,0.9)";
      ctx.lineWidth = 3.5 * s;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();
      ctx.setLineDash([]);
    };

    if (!drawing && pts.length >= 3) {
      ctx.save();
      if (lassoModeRef.current === "keep") {
        // Dark outside, clear inside — shows what will be kept
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      } else {
        // Dark inside, clear outside — shows what will be removed
        ctx.fillStyle = "rgba(180,40,40,0.45)";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      drawStroke(true);
    } else {
      drawStroke(false);
    }
  }, []);

  const handleLassoPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = lassoCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    lassoPointsRef.current = [{ x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }];
    lassoDrawingRef.current = true;
    setLassoClosed(false);
    drawLassoCanvas();
  }, [drawLassoCanvas]);

  const handleLassoPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!lassoDrawingRef.current) return;
    const canvas = lassoCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const pts = lassoPointsRef.current;
    const last = pts[pts.length - 1];
    const dist = Math.hypot(x - last.x, y - last.y);
    if (dist >= 4) { pts.push({ x, y }); drawLassoCanvas(); }
  }, [drawLassoCanvas]);

  const handleLassoPointerUp = useCallback(() => {
    if (!lassoDrawingRef.current) return;
    lassoDrawingRef.current = false;
    if (lassoPointsRef.current.length >= 3) {
      setLassoClosed(true);
      drawLassoCanvas();
    }
  }, [drawLassoCanvas]);

  const applyLasso = useCallback(async () => {
    if (!lassoTarget || lassoPointsRef.current.length < 3 || !lassoCanvasRef.current) return;
    setLassoApplying(true);
    try {
      const canvas = lassoCanvasRef.current;
      const displayW = canvas.width;
      const displayH = canvas.height;
      const img = new Image();
      img.src = lassoTarget.dataUrl;
      await new Promise<void>(r => { img.onload = () => r(); });
      const scaleX = img.naturalWidth / displayW;
      const scaleY = img.naturalHeight / displayH;
      const out = document.createElement("canvas");
      out.width = img.naturalWidth; out.height = img.naturalHeight;
      const ctx = out.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.save();
      const pts = lassoPointsRef.current;
      if (lassoModeRef.current === "keep") {
        // Clip to inside lasso, draw image only inside
        ctx.beginPath();
        ctx.moveTo(pts[0].x * scaleX, pts[0].y * scaleY);
        pts.slice(1).forEach(p => ctx.lineTo(p.x * scaleX, p.y * scaleY));
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 0, 0);
      } else {
        // Clip to outside lasso (evenodd), draw image outside
        ctx.beginPath();
        ctx.rect(0, 0, out.width, out.height);
        ctx.moveTo(pts[0].x * scaleX, pts[0].y * scaleY);
        pts.slice(1).forEach(p => ctx.lineTo(p.x * scaleX, p.y * scaleY));
        ctx.closePath();
        ctx.clip("evenodd");
        ctx.drawImage(img, 0, 0);
      }
      ctx.restore();
      const newUrl = out.toDataURL("image/png");
      // Push old url to undo history before saving
      lassoHistoryRef.current.push(lassoTarget.dataUrl);
      setLassoCanUndo(true);
      saveCubbies(cubbies.map(c => c.id === lassoTarget.cubbyId
        ? { ...c, items: c.items.map(i => i.id === lassoTarget.itemId ? { ...i, dataUrl: newUrl } : i) }
        : c
      ));
      // Update editor with new image (stay open for further refinement)
      setLassoTarget({ ...lassoTarget, dataUrl: newUrl });
      lassoPointsRef.current = [];
      setLassoClosed(false);
    } finally {
      setLassoApplying(false);
    }
  }, [lassoTarget, cubbies, saveCubbies]);

  const addLassoToMoodboard = useCallback(() => {
    if (!lassoTarget) return;
    saveMoodboard([...moodboardImages, { id: genId(), dataUrl: lassoTarget.dataUrl }]);
    setLassoAddedMood(true);
    if (lassoAddedMoodTimer.current) clearTimeout(lassoAddedMoodTimer.current);
    lassoAddedMoodTimer.current = setTimeout(() => setLassoAddedMood(false), 1800);
  }, [lassoTarget, moodboardImages, saveMoodboard]);

  const undoLasso = useCallback(() => {
    if (!lassoTarget || lassoHistoryRef.current.length === 0) return;
    const prevUrl = lassoHistoryRef.current.pop()!;
    setLassoCanUndo(lassoHistoryRef.current.length > 0);
    saveCubbies(cubbies.map(c => c.id === lassoTarget.cubbyId
      ? { ...c, items: c.items.map(i => i.id === lassoTarget.itemId ? { ...i, dataUrl: prevUrl } : i) }
      : c
    ));
    setLassoTarget({ ...lassoTarget, dataUrl: prevUrl });
    lassoPointsRef.current = [];
    setLassoClosed(false);
  }, [lassoTarget, cubbies, saveCubbies]);

  const zoomIn = useCallback(() => {
    setLassoZoom(z => { const s = [1, 1.5, 2, 3, 4]; return s.find(v => v > z) ?? z; });
  }, []);

  const zoomOut = useCallback(() => {
    setLassoZoom(z => { const s = [4, 3, 2, 1.5, 1]; return s.find(v => v < z) ?? z; });
  }, []);

  const handlePanPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    panDragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startPanX: lassoPan.x, startPanY: lassoPan.y };
  }, [lassoPan]);

  const handlePanPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!panDragRef.current.active) return;
    const dx = e.clientX - panDragRef.current.startX;
    const dy = e.clientY - panDragRef.current.startY;
    setLassoPan({ x: panDragRef.current.startPanX + dx, y: panDragRef.current.startPanY + dy });
  }, []);

  const handlePanPointerUp = useCallback(() => { panDragRef.current.active = false; }, []);

  useEffect(() => {
    lassoZoomRef.current = lassoZoom;
    if (lassoZoom === 1) { setLassoPan({ x: 0, y: 0 }); setLassoPanMode(false); }
    // Resize canvas to match zoom × DPR so it's always pixel-perfect
    const canvas = lassoCanvasRef.current;
    const base = lassoBaSizeRef.current;
    if (!canvas || base.w === 0) return;
    const newW = Math.round(base.w * lassoZoom);
    const newH = Math.round(base.h * lassoZoom);
    if (newW === canvas.width && newH === canvas.height) return;
    const sx = newW / canvas.width;
    const sy = newH / canvas.height;
    lassoPointsRef.current = lassoPointsRef.current.map(p => ({ x: p.x * sx, y: p.y * sy }));
    canvas.width = newW;
    canvas.height = newH;
    drawLassoCanvas();
  }, [lassoZoom, drawLassoCanvas]);

  useEffect(() => {
    if (!lassoTarget) return;
    const key = `${lassoTarget.cubbyId}:${lassoTarget.itemId}`;
    if (lassoSessionRef.current !== key) {
      lassoSessionRef.current = key;
      setLassoZoom(1); lassoZoomRef.current = 1;
      setLassoPan({ x: 0, y: 0 }); setLassoPanMode(false);
      setLassoMode("keep"); lassoModeRef.current = "keep";
      lassoHistoryRef.current = []; setLassoCanUndo(false);
    }
  }, [lassoTarget]);

  // Native non-passive wheel listener so preventDefault() works for scroll-to-zoom
  useEffect(() => {
    const el = lassoAreaRef.current;
    if (!el || !lassoTarget) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn(); else zoomOut();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [lassoTarget, zoomIn, zoomOut]);

  const handleClosetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cubbyId = uploadingCubbyRef.current;
    if (!cubbyId) return;
    const files = Array.from(e.target.files || []);
    // Check before upload: is this the first item going into an unlabelled cubby?
    const cubby = cubbies.find(c => c.id === cubbyId);
    const needsLabel = cubby && cubby.items.length === 0 && !cubby.label.trim();
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCubbies(prev => {
          const next = prev.map(c => c.id === cubbyId
            ? { ...c, items: [...c.items, { id: genId(), dataUrl, category: "other" as ClosetCategory }] }
            : c);
          try { localStorage.setItem(CLOSET_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
        // Prompt for label on the first image added to an unlabelled cubby
        if (needsLabel) {
          setTimeout(() => { setEditLabelValue(""); setEditingCubbyId(cubbyId); }, 80);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
    uploadingCubbyRef.current = null;
  };

  const updateCubbyLabel = (cubbyId: string, label: string) => {
    saveCubbies(cubbies.map(c => c.id === cubbyId ? { ...c, label } : c));
  };

  // Delete selected canvas item with Backspace/Delete
  useEffect(() => {
    if (!moodboardOpen) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if ((e.key === "Delete" || e.key === "Backspace") && tag !== "INPUT" && tag !== "TEXTAREA" && selectedCanvasId) {
        setCanvases(prev => {
          const next = prev.map(c =>
            c.id !== activeCanvasId ? c :
            { ...c, items: c.items.filter(i => i.id !== selectedCanvasId) }
          );
          saveCanvas(next);
          return next;
        });
        setSelectedCanvasId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [moodboardOpen, selectedCanvasId, saveCanvas, activeCanvasId]);

  const toggleFormat = (type: "italic" | "bullet" | "numbered") => {
    const ta = noteTextareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const selEnd = ta.selectionEnd;
    const val = noteContent;

    if (type === "italic") {
      const isOn = activeFormats.has("italic");
      setActiveFormats(prev => { const n = new Set(prev); isOn ? n.delete("italic") : n.add("italic"); return n; });
      // Wrap selection or insert a _ marker (opening when turning on, closing when off)
      const selected = val.slice(pos, selEnd);
      if (selected) {
        const newVal = val.slice(0, pos) + `_${selected}_` + val.slice(selEnd);
        handleNoteChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + selected.length + 2, pos + selected.length + 2); }, 0);
      } else {
        const newVal = val.slice(0, pos) + "_" + val.slice(pos);
        handleNoteChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + 1, pos + 1); }, 0);
      }
      return;
    }

    // bullet / numbered — persistent list mode, mutually exclusive
    const isOn = activeFormats.has(type);
    setActiveFormats(prev => {
      const n = new Set(prev);
      if (isOn) {
        n.delete(type);
      } else {
        n.add(type);
        n.delete(type === "bullet" ? "numbered" : "bullet");
      }
      return n;
    });

    // When turning ON, prefix the current line if it's empty
    if (!isOn) {
      const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
      const lineContent = val.slice(lineStart, pos);
      if (!lineContent.trim()) {
        const prefix = type === "bullet" ? "• " : "1. ";
        const newVal = val.slice(0, lineStart) + prefix + val.slice(lineStart);
        handleNoteChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length); }, 0);
        return;
      }
    }
    setTimeout(() => ta.focus(), 0);
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    const hasBullet = activeFormats.has("bullet");
    const hasNumbered = activeFormats.has("numbered");
    if (!hasBullet && !hasNumbered) return;
    e.preventDefault();
    const ta = noteTextareaRef.current!;
    const pos = ta.selectionStart;
    const val = noteContent;
    const lineStart = val.lastIndexOf("\n", pos - 1) + 1;
    const lineContent = val.slice(lineStart, pos);

    if (hasBullet) {
      // Empty bullet line → exit list mode
      if (lineContent === "• ") {
        setActiveFormats(prev => { const n = new Set(prev); n.delete("bullet"); return n; });
        const newVal = val.slice(0, lineStart) + "\n" + val.slice(pos);
        handleNoteChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + 1, lineStart + 1); }, 0);
        return;
      }
      const newVal = val.slice(0, pos) + "\n• " + val.slice(pos);
      handleNoteChange(newVal);
      setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + 3, pos + 3); }, 0);
    } else {
      // Empty numbered line → exit list mode
      if (/^\d+\. $/.test(lineContent)) {
        setActiveFormats(prev => { const n = new Set(prev); n.delete("numbered"); return n; });
        const newVal = val.slice(0, lineStart) + "\n" + val.slice(pos);
        handleNoteChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + 1, lineStart + 1); }, 0);
        return;
      }
      // Find next number from last numbered line above cursor
      const textBefore = val.slice(0, pos);
      const lines = textBefore.split("\n");
      let nextNum = 1;
      for (let i = lines.length - 1; i >= 0; i--) {
        const m = lines[i].match(/^(\d+)\. /);
        if (m) { nextNum = parseInt(m[1]) + 1; break; }
      }
      const prefix = `\n${nextNum}. `;
      const newVal = val.slice(0, pos) + prefix + val.slice(pos);
      handleNoteChange(newVal);
      setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + prefix.length, pos + prefix.length); }, 0);
    }
  };

  const addProject = () => {
    const name = newProject.trim();
    if (!name) { setAddingProject(false); return; }
    const id = genId();
    saveProjects([...projects, { id, name, conversationIds: [] }]);
    setNewProject("");
    setAddingProject(false);
    setExpandedProjects(prev => new Set([...prev, id]));
  };

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setAddingConvTo(null); }
      else next.add(id);
      return next;
    });
  };

  const addConvToProject = (projectId: string, convId: string) => {
    saveProjects(projects.map(p =>
      p.id === projectId
        ? { ...p, conversationIds: [...(p.conversationIds ?? []), convId] }
        : p
    ));
    setAddingConvTo(null);
  };

  const removeConvFromProject = (projectId: string, convId: string) => {
    saveProjects(projects.map(p =>
      p.id === projectId
        ? { ...p, conversationIds: (p.conversationIds ?? []).filter(id => id !== convId) }
        : p
    ));
  };

  const startEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const commitEdit = () => {
    if (!editingKey) return;
    const val = editValue.trim();
    if (val) {
      if (editingKey.startsWith("conv:")) {
        onRenameConversation(editingKey.slice(5), val);
      } else if (editingKey.startsWith("proj:")) {
        saveProjects(projects.map(p => p.id === editingKey.slice(5) ? { ...p, name: val } : p));
      }
    }
    setEditingKey(null);
    setEditValue("");
  };

  const cancelEdit = () => { setEditingKey(null); setEditValue(""); };

  const NEW_INPUT_STYLE: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.45)",
    border: `1px solid rgba(100,65,15,0.22)`,
    borderRadius: 5,
    padding: "0.35rem 0.5rem",
    fontFamily: "var(--font-cormorant)",
    fontStyle: "italic",
    fontSize: "0.88rem",
    color: INK,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <>
    <aside
      style={{
        width: collapsed ? 28 : 220,
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "rgba(228,220,206,0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderRight: `1px solid rgba(100,65,15,0.18)`,
        overflowY: collapsed ? "hidden" : "auto",
        overflowX: "hidden",
        scrollbarWidth: "none",
        paddingBottom: collapsed ? 0 : "2rem",
        position: "relative",
        zIndex: 2,
        transition: "width 0.22s ease",
      }}
    >
      {/* Collapse toggle row */}
      <div style={{ display: "flex", justifyContent: collapsed ? "center" : "flex-end", flexShrink: 0 }}>
        <button
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(100,65,15,0.38)",
            padding: "0.75rem 0.75rem",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "rgba(100,65,15,0.85)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(100,65,15,0.38)"; }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>
      </div>

      {/* Sidebar content — hidden when collapsed */}
      <div style={{ opacity: collapsed ? 0 : 1, pointerEvents: collapsed ? "none" : "auto", transition: "opacity 0.15s ease", minWidth: 220 }}>

        {/* New Conversation */}
        <div style={{ padding: "1.25rem 1rem 1rem" }}>
          <button
            onClick={onNewConversation}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(26,18,10,0.055)",
              border: `1px solid rgba(26,18,10,0.13)`,
              borderRadius: 8,
              padding: "0.55rem 0.75rem",
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s",
              fontFamily: "var(--font-jost)",
              fontSize: "0.48rem",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: INK,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,18,10,0.09)"; e.currentTarget.style.borderColor = "rgba(26,18,10,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(26,18,10,0.055)"; e.currentTarget.style.borderColor = "rgba(26,18,10,0.13)"; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Conversation
          </button>
        </div>

        <div style={{ height: 1, background: LINE, margin: "0 1rem" }} />

        {/* ── Projects ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 0 0.5rem 1rem" }}>
          <span style={SECTION_LABEL}>Projects</span>
          <button
            onClick={() => setAddingProject(true)}
            title="New project"
            style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, padding: "0.4rem 1rem", lineHeight: 1, fontSize: "0.75rem" }}
            onMouseEnter={e => { e.currentTarget.style.color = INK; }}
            onMouseLeave={e => { e.currentTarget.style.color = GOLD; }}
          >+</button>
        </div>

        {addingProject && (
          <div style={{ padding: "0 1rem 0.5rem" }}>
            <input
              ref={projectInputRef}
              value={newProject}
              onChange={e => setNewProject(toTitleCase(e.target.value))}
              onKeyDown={e => { if (e.key === "Enter") addProject(); if (e.key === "Escape") { setAddingProject(false); setNewProject(""); } }}
              onBlur={addProject}
              placeholder="Project name…"
              style={NEW_INPUT_STYLE}
            />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column" }}>
          {projects.map(p => {
            const isExpanded = expandedProjects.has(p.id);
            const projKey    = `proj:${p.id}`;
            const projConvIds = p.conversationIds ?? [];
            const projConvs = projConvIds
              .map(id => conversations.find(c => c.id === id))
              .filter((c): c is ConversationRow => !!c);
            const availableConvs = conversations.filter(c => !projConvIds.includes(c.id));

            return (
              <div key={p.id}>
                {/* Project header row */}
                <div
                  style={{ display: "flex", alignItems: "center", position: "relative", transition: "background 0.12s", background: hoveredKey === projKey ? "rgba(26,18,10,0.04)" : "transparent" }}
                  onMouseEnter={() => setHoveredKey(projKey)}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  {editingKey === projKey ? (
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={e => setEditValue(toTitleCase(e.target.value))}
                      onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                      onBlur={commitEdit}
                      style={{ ...INLINE_INPUT, padding: "0.45rem 0 0.45rem 1rem" }}
                    />
                  ) : (
                    <button
                      onClick={() => toggleProject(p.id)}
                      style={{
                        flex: 1, display: "flex", alignItems: "center",
                        background: "none", border: "none",
                        padding: "0.45rem 0 0.45rem 1rem",
                        cursor: "pointer", textAlign: "left", overflow: "hidden",
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "0.88rem", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </span>
                    </button>
                  )}
                  {/* Three-dot menu */}
                  <div data-row-menu style={{ position: "relative", flexShrink: 0 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === projKey ? null : projKey); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        padding: "0.35rem 0.6rem", lineHeight: 1,
                        color: "rgba(26,18,10,0.4)",
                        opacity: hoveredKey === projKey || menuOpen === projKey ? 1 : 0,
                        transition: "opacity 0.12s", display: "flex", alignItems: "center",
                      }}
                    ><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg></button>
                    {menuOpen === projKey && (
                      <div style={{ position: "absolute", right: 4, top: "100%", zIndex: 300, background: "rgba(245,240,232,0.97)", border: "1px solid rgba(100,65,15,0.15)", borderRadius: 6, boxShadow: "0 4px 16px rgba(26,18,10,0.1)", minWidth: 140, overflow: "hidden" }}>
                        {[
                          { label: "Rename", action: () => { startEdit(projKey, p.name); setMenuOpen(null); } },
                          { label: "Delete project", action: () => { saveProjects(projects.filter(x => x.id !== p.id)); setMenuOpen(null); }, danger: true },
                        ].map(item => (
                          <button key={item.label} onClick={item.action} style={{ display: "block", width: "100%", background: "none", border: "none", textAlign: "left", padding: "0.5rem 0.85rem", fontFamily: "var(--font-jost)", fontSize: "0.44rem", letterSpacing: "0.08em", color: item.danger ? "rgba(160,40,20,0.75)" : INK, cursor: "pointer", transition: "background 0.1s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,18,10,0.05)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                          >{item.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded — conversations in this project */}
                {isExpanded && (
                  <div style={{ borderLeft: `1px solid ${LINE}`, marginLeft: "1.25rem", marginBottom: "0.25rem" }}>
                    {projConvs.map(c => {
                      const pcKey = `projconv:${p.id}:${c.id}`;
                      return (
                        <div
                          key={c.id}
                          style={{ display: "flex", alignItems: "center", position: "relative", background: hoveredKey === pcKey ? "rgba(26,18,10,0.04)" : c.id === conversationId ? "rgba(26,18,10,0.06)" : "transparent", transition: "background 0.12s" }}
                          onMouseEnter={() => setHoveredKey(pcKey)}
                          onMouseLeave={() => setHoveredKey(null)}
                        >
                          <button
                            onClick={() => onSelectConversation(c.id)}
                            style={{ flex: 1, background: "none", border: "none", padding: "0.4rem 0 0.4rem 0.75rem", textAlign: "left", fontFamily: "var(--font-cormorant)", fontSize: "0.82rem", color: c.id === conversationId ? INK : MUTED, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >{c.title}</button>
                          <div data-row-menu style={{ position: "relative", flexShrink: 0 }}>
                            <button
                              onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === pcKey ? null : pcKey); }}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "0.35rem 0.6rem", lineHeight: 1, color: "rgba(26,18,10,0.4)", opacity: hoveredKey === pcKey || menuOpen === pcKey ? 1 : 0, transition: "opacity 0.12s", display: "flex", alignItems: "center" }}
                            ><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg></button>
                            {menuOpen === pcKey && (
                              <div style={{ position: "absolute", right: 4, top: "100%", zIndex: 300, background: "rgba(245,240,232,0.97)", border: "1px solid rgba(100,65,15,0.15)", borderRadius: 6, boxShadow: "0 4px 16px rgba(26,18,10,0.1)", minWidth: 160, overflow: "hidden" }}>
                                {[
                                  { label: "Rename", action: () => { startEdit(`conv:${c.id}`, c.title); setMenuOpen(null); } },
                                  { label: "Remove from project", action: () => { removeConvFromProject(p.id, c.id); setMenuOpen(null); } },
                                  { label: "Delete", action: () => { onDeleteConversation(c.id); setMenuOpen(null); }, danger: true },
                                ].map(item => (
                                  <button key={item.label} onClick={item.action} style={{ display: "block", width: "100%", background: "none", border: "none", textAlign: "left", padding: "0.5rem 0.85rem", fontFamily: "var(--font-jost)", fontSize: "0.44rem", letterSpacing: "0.08em", color: item.danger ? "rgba(160,40,20,0.75)" : INK, cursor: "pointer", transition: "background 0.1s" }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,18,10,0.05)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                                  >{item.label}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Add conversation to project */}
                    {addingConvTo === p.id ? (
                      <div style={{ paddingBottom: "0.25rem" }}>
                        {availableConvs.length === 0 ? (
                          <p style={{ padding: "0.4rem 0.75rem", fontFamily: "var(--font-jost)", fontSize: "0.44rem", letterSpacing: "0.08em", color: "rgba(26,18,10,0.3)", margin: 0 }}>No conversations to add</p>
                        ) : (
                          availableConvs.map(c => (
                            <button key={c.id} onClick={() => addConvToProject(p.id, c.id)}
                              style={{ display: "block", width: "100%", background: "none", border: "none", padding: "0.38rem 0.75rem", textAlign: "left", fontFamily: "var(--font-cormorant)", fontSize: "0.82rem", color: "rgba(26,18,10,0.35)", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.12s, background 0.12s" }}
                              onMouseEnter={e => { e.currentTarget.style.color = INK; e.currentTarget.style.background = "rgba(26,18,10,0.05)"; }}
                              onMouseLeave={e => { e.currentTarget.style.color = "rgba(26,18,10,0.35)"; e.currentTarget.style.background = "transparent"; }}
                            >+ {c.title}</button>
                          ))
                        )}
                        <button onClick={() => setAddingConvTo(null)}
                          style={{ display: "block", width: "100%", background: "none", border: "none", padding: "0.35rem 0.75rem", textAlign: "left", fontFamily: "var(--font-jost)", fontSize: "0.4rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,18,10,0.28)", cursor: "pointer" }}
                          onMouseEnter={e => { e.currentTarget.style.color = MUTED; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "rgba(26,18,10,0.28)"; }}
                        >Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingConvTo(p.id)}
                        style={{ display: "block", width: "100%", background: "none", border: "none", padding: "0.38rem 0.75rem", textAlign: "left", fontFamily: "var(--font-jost)", fontSize: "0.4rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(100,65,15,0.42)", cursor: "pointer", transition: "color 0.12s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = GOLD; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "rgba(100,65,15,0.42)"; }}
                      >+ Add conversation</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ height: 1, background: LINE, margin: "0.75rem 1rem" }} />

        {/* ── ORDRE (past conversations) ── */}
        <div style={{ padding: "0 1rem 0.5rem" }}>
          <span style={SECTION_LABEL}>Ordre</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {conversations.map(c => {
            const convKey = `conv:${c.id}`;
            return (
              <div
                key={c.id}
                style={{ display: "flex", alignItems: "center", position: "relative", background: hoveredKey === convKey ? "rgba(26,18,10,0.04)" : c.id === conversationId ? "rgba(26,18,10,0.06)" : "transparent", transition: "background 0.12s" }}
                onMouseEnter={() => setHoveredKey(convKey)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {editingKey === convKey ? (
                  <input
                    ref={editInputRef}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                    onBlur={commitEdit}
                    style={{ ...INLINE_INPUT, padding: "0.5rem 0 0.5rem 1rem" }}
                  />
                ) : (
                  <button
                    onClick={() => onSelectConversation(c.id)}
                    style={{ flex: 1, background: "none", border: "none", padding: "0.5rem 0 0.5rem 1rem", textAlign: "left", fontFamily: "var(--font-cormorant)", fontSize: "0.88rem", color: c.id === conversationId ? INK : MUTED, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >{c.title}</button>
                )}
                <div data-row-menu style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === convKey ? null : convKey); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0.35rem 0.6rem", lineHeight: 1, color: "rgba(26,18,10,0.4)", opacity: hoveredKey === convKey || menuOpen === convKey ? 1 : 0, transition: "opacity 0.12s", display: "flex", alignItems: "center" }}
                  ><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg></button>
                  {menuOpen === convKey && (
                    <div style={{ position: "absolute", right: 4, top: "100%", zIndex: 300, background: "rgba(245,240,232,0.97)", border: "1px solid rgba(100,65,15,0.15)", borderRadius: 6, boxShadow: "0 4px 16px rgba(26,18,10,0.1)", minWidth: 140, overflow: "hidden" }}>
                      {[
                        { label: "Rename", action: () => { startEdit(convKey, c.title); setMenuOpen(null); } },
                        { label: "Delete", action: () => { onDeleteConversation(c.id); setMenuOpen(null); }, danger: true },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} style={{ display: "block", width: "100%", background: "none", border: "none", textAlign: "left", padding: "0.5rem 0.85rem", fontFamily: "var(--font-jost)", fontSize: "0.44rem", letterSpacing: "0.08em", color: item.danger ? "rgba(160,40,20,0.75)" : INK, cursor: "pointer", transition: "background 0.1s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(26,18,10,0.05)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >{item.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Notepad widget ── */}
        <div style={{ padding: "1.25rem 1rem 0.5rem" }}>
          <div style={{ height: 1, background: LINE, marginBottom: "1.25rem" }} />
          <button
            onClick={() => setNotepadOpen(true)}
            title="Open notepad"
            style={{
              display: "block",
              width: "100%",
              background: "rgba(245,240,232,0.85)",
              border: `1px solid rgba(100,65,15,0.18)`,
              borderRadius: 7,
              padding: 0,
              cursor: "pointer",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(40,28,12,0.07)",
              transition: "box-shadow 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(40,28,12,0.13)"; e.currentTarget.style.borderColor = "rgba(100,65,15,0.32)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(40,28,12,0.07)"; e.currentTarget.style.borderColor = "rgba(100,65,15,0.18)"; }}
          >
            {/* Notepad header strip */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.4rem 0.65rem 0.35rem",
              borderBottom: `1px solid rgba(100,65,15,0.1)`,
            }}>
              {/* Pencil icon with dot badge when notes exist */}
              <div style={{ position: "relative", lineHeight: 0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(100,65,15,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
                {noteContent.trim() && (
                  <span style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "rgba(100,65,15,0.65)",
                  }} />
                )}
              </div>
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.38rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,65,15,0.55)" }}>Notes</span>
            </div>
            {/* Lined preview area — blank, text stays private */}
            <div style={{
              position: "relative",
              height: 64,
              overflow: "hidden",
              background: `repeating-linear-gradient(to bottom, transparent 0px, transparent 15px, rgba(100,65,15,0.1) 15px, rgba(100,65,15,0.1) 16px)`,
            }} />
          </button>
        </div>

        {/* ── Moodboard widget ── */}
        <div style={{ padding: "1rem 1rem 0.75rem" }}>
          <div style={{ height: 1, background: LINE, marginBottom: "1.25rem" }} />
          <input
            ref={moodboardInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleMoodboardFiles}
          />
          <button
            onClick={() => setMoodboardOpen(true)}
            title="Open moodboard"
            style={{
              display: "block", width: "100%",
              background: "rgba(245,240,232,0.85)",
              border: `1px solid rgba(100,65,15,0.18)`,
              borderRadius: 7, padding: 0, cursor: "pointer", overflow: "hidden",
              boxShadow: "0 1px 4px rgba(40,28,12,0.07)",
              transition: "box-shadow 0.15s, border-color 0.15s",
              textAlign: "left",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(40,28,12,0.13)"; e.currentTarget.style.borderColor = "rgba(100,65,15,0.32)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(40,28,12,0.07)"; e.currentTarget.style.borderColor = "rgba(100,65,15,0.18)"; }}
          >
            {/* Header strip */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.4rem 0.65rem 0.35rem",
              borderBottom: `1px solid rgba(100,65,15,0.1)`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                {/* Grid icon with dot badge when images exist */}
                <div style={{ position: "relative", lineHeight: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="rgba(100,65,15,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="1" width="5.5" height="5.5" rx="0.8" />
                    <rect x="9.5" y="1" width="5.5" height="5.5" rx="0.8" />
                    <rect x="1" y="9.5" width="5.5" height="5.5" rx="0.8" />
                    <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="0.8" />
                  </svg>
                  {moodboardImages.length > 0 && (
                    <span style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "rgba(100,65,15,0.65)",
                    }} />
                  )}
                </div>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.38rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,65,15,0.55)" }}>Moodboards</span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); moodboardInputRef.current?.click(); }}
                onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); moodboardInputRef.current?.click(); } }}
                title="Add images"
                style={{ color: GOLD, fontSize: "0.75rem", padding: "0 0.1rem", lineHeight: 1, cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = INK; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = GOLD; }}
              >+</div>
            </div>
            {/* Moodboard collage illustration */}
            <div style={{ height: 64, overflow: "hidden", position: "relative" }}>
              <svg viewBox="0 0 188 64" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
                {/* Row 1 — gaps: 3, 5, 3, 4, 3 */}
                <rect x="12"  y="8"  width="24" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.2)"  strokeWidth="0.7"/>
                <rect x="39"  y="8"  width="20" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.13)" strokeWidth="0.7"/>
                <rect x="64"  y="8"  width="22" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.18)" strokeWidth="0.7"/>
                <rect x="89"  y="8"  width="18" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.13)" strokeWidth="0.7"/>
                <rect x="111" y="8"  width="28" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.2)"  strokeWidth="0.7"/>
                <rect x="142" y="8"  width="34" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.15)" strokeWidth="0.7"/>
                {/* Row 2 — gaps: 4, 3, 5, 3, 4 */}
                <rect x="12"  y="25" width="18" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.15)" strokeWidth="0.7"/>
                <rect x="34"  y="25" width="30" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.2)"  strokeWidth="0.7"/>
                <rect x="67"  y="25" width="15" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.13)" strokeWidth="0.7"/>
                <rect x="84"  y="25" width="26" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.18)" strokeWidth="0.7"/>
                <rect x="113" y="25" width="28" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.13)" strokeWidth="0.7"/>
                <rect x="145" y="25" width="31" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.2)"  strokeWidth="0.7"/>
                {/* Row 3 — gaps: 3, 5, 3, 4, 3 */}
                <rect x="12"  y="42" width="22" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.18)" strokeWidth="0.7"/>
                <rect x="37"  y="42" width="18" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.13)" strokeWidth="0.7"/>
                <rect x="60"  y="42" width="28" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.2)"  strokeWidth="0.7"/>
                <rect x="91"  y="42" width="14" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.15)" strokeWidth="0.7"/>
                <rect x="109" y="42" width="34" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.13)" strokeWidth="0.7"/>
                <rect x="146" y="42" width="30" height="14" rx="0.5" fill="none" stroke="rgba(100,65,15,0.2)"  strokeWidth="0.7"/>
              </svg>
            </div>
          </button>
        </div>

        {/* ── Closet widget ── */}
        <div style={{ padding: "1rem 1rem 1rem" }}>
          <div style={{ height: 1, background: LINE, marginBottom: "1.25rem" }} />
          <button
            onClick={() => setClosetOpen(true)}
            title="Open closet"
            style={{
              display: "block", width: "100%",
              background: "rgba(245,240,232,0.85)",
              border: `1px solid rgba(100,65,15,0.18)`,
              borderRadius: 7, padding: 0, cursor: "pointer", overflow: "hidden",
              boxShadow: "0 1px 4px rgba(40,28,12,0.07)",
              transition: "box-shadow 0.15s, border-color 0.15s",
              textAlign: "left",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(40,28,12,0.13)"; e.currentTarget.style.borderColor = "rgba(100,65,15,0.32)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(40,28,12,0.07)"; e.currentTarget.style.borderColor = "rgba(100,65,15,0.18)"; }}
          >
            {/* Header strip */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.4rem 0.65rem 0.35rem",
              borderBottom: `1px solid rgba(100,65,15,0.1)`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <div style={{ position: "relative", lineHeight: 0 }}>
                  {/* Hanger icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="10" height="10" aria-hidden>
                    <g fill="none" stroke="rgba(100,65,15,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M24 21v-6c0-2.55 1.75-4.6 4-4.6s4 2.05 4 4.6v1.25"/>
                      <path d="M24 21c-2.25 0-4.05 1.25-5.95 2.5L8.8 29.65c-1.75 1.15-.95 3.85 1.15 3.85h28.1c2.1 0 2.9-2.7 1.15-3.85l-9.25-6.15C28.05 22.25 26.25 21 24 21Z"/>
                    </g>
                  </svg>
                  {cubbies.some(c => c.items.length > 0) && (
                    <span style={{
                      position: "absolute", top: -2, right: -2,
                      width: 4, height: 4, borderRadius: "50%",
                      background: "rgba(100,65,15,0.65)",
                    }} />
                  )}
                </div>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.38rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,65,15,0.55)" }}>Closet</span>
              </div>
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.34rem", color: MUTED, letterSpacing: "0.05em" }}>
                {(() => { const n = cubbies.reduce((s, c) => s + c.items.length, 0); return n > 0 ? `${n} piece${n !== 1 ? "s" : ""}` : ""; })()}
              </span>
            </div>
            {/* Cabinet preview illustration */}
            <div style={{ height: 64, overflow: "hidden", position: "relative" }}>
              <svg viewBox="0 0 188 64" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
                {/* hangers — equally spaced: rod x=10–178, 4 hangers at cx=44,77,111,144 */}
                {/* translate_x = cx - 24*0.44 = cx - 10.56; translate_y=3 (hook top sits on rod) */}
                <g transform="translate(33, 5) scale(0.44)" fill="none" stroke="rgba(100,65,15,0.28)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M24 21v-6c0-2.55 1.75-4.6 4-4.6s4 2.05 4 4.6v1.25"/>
                  <path d="M24 21c-2.25 0-4.05 1.25-5.95 2.5L8.8 29.65c-1.75 1.15-.95 3.85 1.15 3.85h28.1c2.1 0 2.9-2.7 1.15-3.85l-9.25-6.15C28.05 22.25 26.25 21 24 21Z"/>
                </g>
                <g transform="translate(66, 5) scale(0.44)" fill="none" stroke="rgba(100,65,15,0.25)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M24 21v-6c0-2.55 1.75-4.6 4-4.6s4 2.05 4 4.6v1.25"/>
                  <path d="M24 21c-2.25 0-4.05 1.25-5.95 2.5L8.8 29.65c-1.75 1.15-.95 3.85 1.15 3.85h28.1c2.1 0 2.9-2.7 1.15-3.85l-9.25-6.15C28.05 22.25 26.25 21 24 21Z"/>
                </g>
                <g transform="translate(100, 5) scale(0.44)" fill="none" stroke="rgba(100,65,15,0.28)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M24 21v-6c0-2.55 1.75-4.6 4-4.6s4 2.05 4 4.6v1.25"/>
                  <path d="M24 21c-2.25 0-4.05 1.25-5.95 2.5L8.8 29.65c-1.75 1.15-.95 3.85 1.15 3.85h28.1c2.1 0 2.9-2.7 1.15-3.85l-9.25-6.15C28.05 22.25 26.25 21 24 21Z"/>
                </g>
                <g transform="translate(133, 5) scale(0.44)" fill="none" stroke="rgba(100,65,15,0.24)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M24 21v-6c0-2.55 1.75-4.6 4-4.6s4 2.05 4 4.6v1.25"/>
                  <path d="M24 21c-2.25 0-4.05 1.25-5.95 2.5L8.8 29.65c-1.75 1.15-.95 3.85 1.15 3.85h28.1c2.1 0 2.9-2.7 1.15-3.85l-9.25-6.15C28.05 22.25 26.25 21 24 21Z"/>
                </g>
                {/* rod drawn after hangers so it sits in front */}
                <line x1="10" y1="10" x2="178" y2="10" stroke="rgba(100,65,15,0.22)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="20" y1="4" x2="20" y2="10" stroke="rgba(100,65,15,0.15)" strokeWidth="1"/>
                <line x1="168" y1="4" x2="168" y2="10" stroke="rgba(100,65,15,0.15)" strokeWidth="1"/>
                {/* price tags hanging from each hanger bottom (~y=18) */}
                {[44, 77, 111, 144].map((cx, i) => (
                  <g key={i} stroke="rgba(100,65,15,0.38)" fill="none" strokeLinecap="round">
                    <line x1={cx} y1="20" x2={cx} y2="26" strokeWidth="0.5"/>
                    <circle cx={cx} cy="26.8" r="0.9" strokeWidth="0.5"/>
                    <rect x={cx - 3.5} y="27.5" width="7" height="9" rx="1" strokeWidth="0.65"/>
                  </g>
                ))}
              </svg>
            </div>
          </button>
        </div>

      </div>{/* end sidebar content */}

    </aside>
      {notepadOpen && createPortal(
        <div
          onClick={e => { if (e.target === e.currentTarget) setNotepadOpen(false); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(26,18,10,0.35)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(1rem, 4vw, 3rem)",
          }}
        >
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: 640,
            height: "80vh",
            maxHeight: "80vh",
            background: "#F8F3EA",
            borderRadius: 12,
            boxShadow: "0 24px 64px -16px rgba(26,18,10,0.45), 0 0 0 1px rgba(100,65,15,0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Toolbar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.1rem",
              padding: "0.55rem 0.75rem 0.5rem 1.1rem",
              borderBottom: `2px solid rgba(180,60,40,0.22)`,
              flexShrink: 0,
            }}>
              {/* Label */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginRight: "0.6rem" }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="rgba(100,65,15,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 2.5a2.121 2.121 0 0 1 3 3L5.5 14 1 15l1-4.5L11 2.5z"/>
                </svg>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.43rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,65,15,0.55)" }}>Notes</span>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 14, background: "rgba(100,65,15,0.18)", margin: "0 0.4rem" }} />

              {/* Format buttons */}
              {([
                {
                  id: "italic" as const,
                  title: "Italic",
                  content: <em style={{ fontFamily: "Georgia, serif", fontSize: "0.85rem", fontStyle: "italic", lineHeight: 1 }}>I</em>,
                },
                {
                  id: "bullet" as const,
                  title: "Bullet list",
                  content: (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                      <circle cx="2.5" cy="4.5" r="1" fill="currentColor" stroke="none"/>
                      <circle cx="2.5" cy="8.5" r="1" fill="currentColor" stroke="none"/>
                      <circle cx="2.5" cy="12.5" r="1" fill="currentColor" stroke="none"/>
                      <line x1="6" y1="4.5" x2="14" y2="4.5"/>
                      <line x1="6" y1="8.5" x2="14" y2="8.5"/>
                      <line x1="6" y1="12.5" x2="14" y2="12.5"/>
                    </svg>
                  ),
                },
                {
                  id: "numbered" as const,
                  title: "Numbered list",
                  content: (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <text x="0" y="5.5" style={{ font: "bold 4.5px var(--font-jost)", fill: "currentColor", stroke: "none" }}>1.</text>
                      <text x="0" y="9.5" style={{ font: "bold 4.5px var(--font-jost)", fill: "currentColor", stroke: "none" }}>2.</text>
                      <text x="0" y="13.5" style={{ font: "bold 4.5px var(--font-jost)", fill: "currentColor", stroke: "none" }}>3.</text>
                      <line x1="6" y1="4.5" x2="14" y2="4.5"/>
                      <line x1="6" y1="8.5" x2="14" y2="8.5"/>
                      <line x1="6" y1="12.5" x2="14" y2="12.5"/>
                    </svg>
                  ),
                },
              ] as const).map(btn => {
                const isActive = activeFormats.has(btn.id);
                return (
                  <button
                    key={btn.id}
                    onClick={() => toggleFormat(btn.id)}
                    title={btn.title}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isActive ? "rgba(26,18,10,0.1)" : "none",
                      border: "none", cursor: "pointer",
                      padding: "0.3rem 0.4rem", borderRadius: 4,
                      color: isActive ? "rgba(26,18,10,0.85)" : "rgba(26,18,10,0.4)",
                      transition: "color 0.12s, background 0.12s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "rgba(26,18,10,0.85)"; e.currentTarget.style.background = isActive ? "rgba(26,18,10,0.14)" : "rgba(26,18,10,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = isActive ? "rgba(26,18,10,0.85)" : "rgba(26,18,10,0.4)"; e.currentTarget.style.background = isActive ? "rgba(26,18,10,0.1)" : "none"; }}
                  >
                    {btn.content}
                  </button>
                );
              })}

              {/* Spacer + close */}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setNotepadOpen(false)}
                title="Close"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0.35rem 0.45rem", color: "rgba(26,18,10,0.28)",
                  fontSize: "0.72rem", lineHeight: 1, transition: "color 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "rgba(26,18,10,0.75)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(26,18,10,0.28)"; }}
              >✕</button>
            </div>

            {/* Lined textarea — wrapper is position:relative so textarea can fill it absolutely */}
            <div style={{
              flex: 1,
              position: "relative",
              borderLeft: `2px solid rgba(180,60,40,0.18)`,
              marginLeft: "2.8rem",
              minHeight: 0,
            }}>
              <textarea
                ref={noteTextareaRef}
                value={noteContent}
                onChange={e => handleNoteChange(e.target.value)}
                onKeyDown={handleNoteKeyDown}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  overflowY: "auto",
                  background: `repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(100,65,15,0.1) 27px, rgba(100,65,15,0.1) 28px)`,
                  padding: "0px 1.5rem 1.5rem 1rem",
                  fontFamily: "var(--font-cormorant)",
                  fontStyle: "italic",
                  fontSize: "0.92rem",
                  lineHeight: "28px",
                  color: "rgba(26,18,10,0.85)",
                  caretColor: "rgba(26,18,10,0.75)",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
      {moodboardOpen && createPortal(
        <div
          onClick={e => { if (e.target === e.currentTarget) setMoodboardOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(26,18,10,0.38)",
            backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "clamp(1rem, 4vw, 2.5rem)",
          }}
        >
          <div style={{
            position: "relative", width: "100%", maxWidth: 900,
            height: "85vh", maxHeight: "85vh",
            background: "#F8F3EA", borderRadius: 12,
            boxShadow: "0 28px 72px -18px rgba(26,18,10,0.48), 0 0 0 1px rgba(100,65,15,0.14)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center",
              padding: "0.65rem 1rem 0.6rem",
              borderBottom: `1px solid rgba(100,65,15,0.13)`,
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.42rem" }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="rgba(100,65,15,0.5)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="1" width="5.5" height="5.5" rx="0.8" />
                  <rect x="9.5" y="1" width="5.5" height="5.5" rx="0.8" />
                  <rect x="1" y="9.5" width="5.5" height="5.5" rx="0.8" />
                  <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="0.8" />
                </svg>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.42rem", fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(100,65,15,0.5)" }}>Moodboards</span>
              </div>
              <div style={{ flex: 1 }} />
              {selectedCanvasId && (
                <button
                  onClick={() => {
                    setCanvases(prev => {
                      const next = prev.map(c =>
                        c.id !== activeCanvasId ? c :
                        { ...c, items: c.items.filter(i => i.id !== selectedCanvasId) }
                      );
                      saveCanvas(next);
                      return next;
                    });
                    setSelectedCanvasId(null);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-jost)", fontSize: "0.36rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(160,60,40,0.65)", marginRight: "1rem", transition: "color 0.12s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "rgba(160,60,40,0.9)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(160,60,40,0.65)"; }}
                >Remove</button>
              )}
              <button
                onClick={() => setMoodboardOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.3rem 0.4rem", color: "rgba(26,18,10,0.28)", fontSize: "0.7rem", lineHeight: 1, transition: "color 0.12s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "rgba(26,18,10,0.75)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(26,18,10,0.28)"; }}
              >✕</button>
            </div>

            {/* Two-panel body */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

              {/* Left: Images panel */}
              <div style={{ width: 192, flexShrink: 0, borderRight: `1px solid rgba(100,65,15,0.12)`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0.75rem", height: 32, borderBottom: `1px solid rgba(100,65,15,0.1)`, flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.37rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD }}>
                    Images{moodboardImages.length > 0 ? ` (${moodboardImages.length})` : ""}
                  </span>
                  <button
                    onClick={() => moodboardInputRef.current?.click()}
                    style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontSize: "0.75rem", lineHeight: 1, padding: "0 2px", transition: "color 0.12s" }}
                    title="Add images"
                    onMouseEnter={e => { e.currentTarget.style.color = INK; }}
                    onMouseLeave={e => { e.currentTarget.style.color = GOLD; }}
                  >+</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "0.55rem", scrollbarWidth: "none" }}>
                  {moodboardImages.length === 0 ? (
                    <div style={{ paddingTop: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.65rem" }}>
                      <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "0.78rem", color: "rgba(100,65,15,0.32)", margin: 0, textAlign: "center", lineHeight: 1.4 }}>
                        Add images to your library
                      </p>
                      <button
                        onClick={() => moodboardInputRef.current?.click()}
                        style={{ background: "none", border: `1px solid rgba(100,65,15,0.22)`, borderRadius: 5, padding: "0.28rem 0.6rem", fontFamily: "var(--font-jost)", fontSize: "0.34rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, cursor: "pointer" }}
                      >+ Add</button>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.38rem" }}>
                      {moodboardImages.map(img => (
                        <ImageThumb
                          key={img.id}
                          img={img}
                          onAdd={() => addToCanvas(img.id)}
                          onRemove={() => removeMoodImage(img.id)}
                          onEdit={() => setEditingImage(img)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Canvas */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(236,229,216,0.35)" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "0 0.75rem", height: 32, gap: "0.5rem", borderBottom: `1px solid rgba(100,65,15,0.1)`, flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.37rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD }}>Canvas</span>
                  {canvases.length > 1 && (
                    <div style={{ display: "flex", gap: 3 }}>
                      {canvases.map((c, i) => {
                        const isActive = c.id === activeCanvasId;
                        return (
                          <div key={c.id} style={{ position: "relative", display: "inline-flex" }}>
                            <button
                              onClick={() => { setActiveCanvasId(c.id); setSelectedCanvasId(null); }}
                              style={{
                                background: isActive ? "rgba(100,65,15,0.12)" : "transparent",
                                border: `1px solid rgba(100,65,15,${isActive ? 0.22 : 0.14})`,
                                borderRadius: 2,
                                padding: "0 5px",
                                height: 16,
                                fontFamily: "var(--font-jost)",
                                fontSize: "0.3rem",
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                color: isActive ? GOLD : "rgba(100,65,15,0.38)",
                                cursor: "pointer",
                                lineHeight: "14px",
                                transition: "background 0.12s, color 0.12s",
                              }}
                            >{i + 1}</button>
                            {canvases.length > 1 && (
                              <button
                                onClick={() => deleteCanvas(c.id)}
                                title="Delete canvas"
                                style={{
                                  position: "absolute", top: -4, right: -4,
                                  width: 10, height: 10, borderRadius: "50%",
                                  background: "rgba(100,65,15,0.55)", border: "none",
                                  cursor: "pointer", display: "none",
                                  alignItems: "center", justifyContent: "center",
                                  color: "rgba(245,240,232,0.9)", fontSize: "0.3rem",
                                  lineHeight: 1,
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.display = "flex"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                              >×</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ flex: 1 }} />
                  {selectedCanvasId && (
                    <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.34rem", letterSpacing: "0.1em", color: "rgba(100,65,15,0.38)" }}>
                      Delete · Backspace to remove
                    </span>
                  )}
                  <button
                    onClick={createCanvas}
                    title="New canvas"
                    style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontSize: "0.75rem", lineHeight: 1, padding: "0 2px", transition: "color 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = INK; }}
                    onMouseLeave={e => { e.currentTarget.style.color = GOLD; }}
                  >+</button>
                </div>
                {/* Canvas toolbar */}
                {(() => {
                  const activeCanvas = canvases.find(c => c.id === activeCanvasId);
                  const canvasBg = activeCanvas?.background ?? "#FFFFFF";
                  const canvasAspect = activeCanvas?.aspectRatio ?? "free";
                  const selectedItem = activeCanvas?.items.find(i => i.id === selectedCanvasId);
                  const TB_BTN: React.CSSProperties = {
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 26, height: 26, borderRadius: 5, border: "none",
                    background: "none", cursor: "pointer", flexShrink: 0,
                    color: "rgba(100,65,15,0.55)", transition: "background 0.1s, color 0.1s",
                  };
                  const BG_COLORS = ["#FFFFFF","#F8F3EA","#F5F0E8","#1A120A","#000000","#F5D5C5","#C5D5C0","#1A2340","transparent"];
                  const SIZES = [
                    { label: "Free", value: "free" },
                    { label: "Square 1:1", value: "1:1" },
                    { label: "Portrait 4:5", value: "4:5" },
                    { label: "Story 9:16", value: "9:16" },
                    { label: "Landscape 4:3", value: "4:3" },
                    { label: "Wide 16:9", value: "16:9" },
                  ];
                  return (
                    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 2, padding: "0 0.6rem", height: 36, borderBottom: `1px solid rgba(100,65,15,0.1)`, flexShrink: 0, background: "rgba(248,243,234,0.6)" }}>
                      {/* Background color */}
                      <button
                        title="Canvas background"
                        onClick={() => setOpenPanel(p => p === "color" ? null : "color")}
                        style={{ ...TB_BTN, background: openPanel === "color" ? "rgba(100,65,15,0.1)" : "none" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(100,65,15,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = openPanel === "color" ? "rgba(100,65,15,0.1)" : "none"; }}
                      >
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: canvasBg === "transparent" ? "linear-gradient(135deg, #fff 50%, #ccc 50%)" : canvasBg, border: "1px solid rgba(100,65,15,0.25)", flexShrink: 0 }} />
                      </button>
                      {/* Layers */}
                      <button
                        title="Layers"
                        onClick={() => setOpenPanel(p => p === "layers" ? null : "layers")}
                        style={{ ...TB_BTN, background: openPanel === "layers" ? "rgba(100,65,15,0.1)" : "none" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(100,65,15,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = openPanel === "layers" ? "rgba(100,65,15,0.1)" : "none"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                        </svg>
                      </button>
                      {/* Remove background */}
                      <button
                        title="Remove background"
                        onClick={removeBg}
                        disabled={!selectedItem || selectedItem.type === "text"}
                        style={{ ...TB_BTN, opacity: (!selectedItem || selectedItem.type === "text") ? 0.3 : 1 }}
                        onMouseEnter={e => { if (!(!selectedItem || selectedItem.type === "text")) e.currentTarget.style.background = "rgba(100,65,15,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.954 3.046a1.5 1.5 0 0 0-2.121 0L3 18.879V21h2.121L21 5.167a1.5 1.5 0 0 0-.046-2.121z"/>
                          <path d="M3 21h18"/>
                        </svg>
                      </button>
                      {/* Opacity slider (shown when item selected) */}
                      {selectedItem && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 2 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(100,65,15,0.5)" strokeWidth="1.8" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20V2z" fill="rgba(100,65,15,0.25)"/>
                          </svg>
                          <input
                            type="range" min={0} max={1} step={0.05}
                            value={selectedItem.opacity ?? 1}
                            onChange={e => {
                              const v = parseFloat(e.target.value);
                              setCanvases(prev => {
                                const next = prev.map(c => c.id !== activeCanvasId ? c :
                                  { ...c, items: c.items.map(i => i.id === selectedCanvasId ? { ...i, opacity: v } : i) }
                                );
                                try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
                                return next;
                              });
                            }}
                            style={{ width: 52, height: 3, accentColor: "rgba(100,65,15,0.7)", cursor: "pointer" }}
                          />
                        </div>
                      )}
                      <div style={{ flex: 1 }} />
                      {/* Text tool */}
                      <button
                        title="Add text"
                        onClick={() => setActiveTool(t => t === "text" ? "select" : "text")}
                        style={{ ...TB_BTN, background: activeTool === "text" ? "rgba(100,65,15,0.12)" : "none", color: activeTool === "text" ? GOLD : "rgba(100,65,15,0.55)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(100,65,15,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = activeTool === "text" ? "rgba(100,65,15,0.12)" : "none"; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
                        </svg>
                      </button>
                      {/* Duplicate */}
                      <button
                        title="Duplicate"
                        onClick={duplicateSelected}
                        disabled={!selectedCanvasId}
                        style={{ ...TB_BTN, opacity: selectedCanvasId ? 1 : 0.3 }}
                        onMouseEnter={e => { if (selectedCanvasId) e.currentTarget.style.background = "rgba(100,65,15,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </button>
                      {/* Download */}
                      <button
                        title="Download moodboard"
                        onClick={() => downloadCanvas()}
                        style={TB_BTN}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(100,65,15,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                      {/* Canvas size */}
                      <button
                        title="Canvas size"
                        onClick={() => setOpenPanel(p => p === "size" ? null : "size")}
                        style={{ ...TB_BTN, background: openPanel === "size" ? "rgba(100,65,15,0.1)" : "none" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(100,65,15,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = openPanel === "size" ? "rgba(100,65,15,0.1)" : "none"; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                        </svg>
                      </button>

                      {/* Color picker panel */}
                      {openPanel === "color" && (
                        <div style={{ position: "absolute", top: "100%", left: 4, zIndex: 200, background: "#F8F3EA", border: "1px solid rgba(100,65,15,0.18)", borderRadius: 8, padding: "0.7rem", boxShadow: "0 8px 24px rgba(26,18,10,0.14)", minWidth: 180 }}>
                          <p style={{ margin: "0 0 0.45rem", fontFamily: "var(--font-jost)", fontSize: "0.35rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD }}>Canvas background</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "0.5rem" }}>
                            {BG_COLORS.map(col => (
                              <button
                                key={col}
                                onClick={() => { setCanvasBackground(col); setOpenPanel(null); }}
                                title={col}
                                style={{
                                  width: 22, height: 22, borderRadius: 4, border: `2px solid ${canvasBg === col ? GOLD : "rgba(100,65,15,0.2)"}`,
                                  background: col === "transparent" ? "linear-gradient(135deg,#fff 50%,#ccc 50%)" : col,
                                  cursor: "pointer", padding: 0,
                                }}
                              />
                            ))}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.33rem", color: GOLD }}>Custom</span>
                            <input
                              type="color"
                              value={canvasBg === "transparent" ? "#ffffff" : canvasBg}
                              onChange={e => setCanvasBackground(e.target.value)}
                              style={{ width: 26, height: 20, border: "none", padding: 0, borderRadius: 3, cursor: "pointer", background: "none" }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Layers panel */}
                      {openPanel === "layers" && (
                        <div style={{ position: "absolute", top: "100%", left: 32, zIndex: 200, background: "#F8F3EA", border: "1px solid rgba(100,65,15,0.18)", borderRadius: 8, padding: "0.6rem", boxShadow: "0 8px 24px rgba(26,18,10,0.14)", minWidth: 200 }}>
                          <p style={{ margin: "0 0 0.4rem", fontFamily: "var(--font-jost)", fontSize: "0.35rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD }}>Layers</p>
                          {(activeCanvas?.items ?? []).length === 0 && (
                            <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "0.78rem", color: MUTED, margin: 0 }}>No items yet</p>
                          )}
                          {[...(activeCanvas?.items ?? [])].sort((a, b) => b.zIndex - a.zIndex).map((it, idx, arr) => {
                            const imgSrc = it.type !== "text" ? moodboardImages.find(m => m.id === it.imageId) : null;
                            return (
                              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: idx < arr.length - 1 ? "1px solid rgba(100,65,15,0.08)" : "none" }}>
                                <div
                                  onClick={() => { setSelectedCanvasId(it.id); setOpenPanel(null); }}
                                  style={{ width: 28, height: 22, borderRadius: 3, overflow: "hidden", border: `1px solid rgba(100,65,15,${selectedCanvasId === it.id ? 0.4 : 0.14})`, cursor: "pointer", flexShrink: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  {it.type === "text"
                                    ? <span style={{ fontSize: "0.5rem", fontFamily: "var(--font-cormorant)", color: it.fontColor ?? "#1a120a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 2px" }}>T</span>
                                    : imgSrc && <img src={imgSrc.dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  }
                                </div>
                                <span style={{ flex: 1, fontFamily: "var(--font-jost)", fontSize: "0.34rem", color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {it.type === "text" ? (it.text || "Text") : `Image ${idx + 1}`}
                                </span>
                                <div style={{ display: "flex", gap: 2 }}>
                                  <button onClick={() => reorderLayer(it.id, "up")} title="Move up" style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontSize: "0.6rem", padding: "1px 3px" }}>↑</button>
                                  <button onClick={() => reorderLayer(it.id, "down")} title="Move down" style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontSize: "0.6rem", padding: "1px 3px" }}>↓</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Size panel */}
                      {openPanel === "size" && (
                        <div style={{ position: "absolute", top: "100%", right: 4, zIndex: 200, background: "#F8F3EA", border: "1px solid rgba(100,65,15,0.18)", borderRadius: 8, padding: "0.6rem", boxShadow: "0 8px 24px rgba(26,18,10,0.14)", minWidth: 160 }}>
                          <p style={{ margin: "0 0 0.4rem", fontFamily: "var(--font-jost)", fontSize: "0.35rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD }}>Canvas size</p>
                          {SIZES.map(s => (
                            <button
                              key={s.value}
                              onClick={() => { setCanvasAspectRatio(s.value); setOpenPanel(null); }}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                width: "100%", background: canvasAspect === s.value ? "rgba(100,65,15,0.08)" : "none",
                                border: "none", borderRadius: 4, padding: "5px 8px", cursor: "pointer",
                                fontFamily: "var(--font-jost)", fontSize: "0.36rem", color: canvasAspect === s.value ? GOLD : INK,
                                fontWeight: canvasAspect === s.value ? 600 : 400,
                              }}
                            >
                              <span>{s.label}</span>
                              {canvasAspect === s.value && <span style={{ color: GOLD }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", overflow: "hidden" }}
                  onClick={() => { if (openPanel) setOpenPanel(null); }}
                >
                  {(() => {
                    const activeCanvas = canvases.find(c => c.id === activeCanvasId);
                    const canvasBg = activeCanvas?.background ?? "#FFFFFF";
                    const canvasAspect = activeCanvas?.aspectRatio ?? "free";
                    const [aw, ah] = canvasAspect !== "free" ? canvasAspect.split(":").map(Number) : [0, 0];
                    const isPortrait = ah > aw;
                    const aspectStyle: React.CSSProperties = canvasAspect === "free"
                      ? { width: "100%", height: "100%" }
                      : isPortrait
                        ? { height: "100%", width: "auto", aspectRatio: `${aw}/${ah}`, maxWidth: "100%" }
                        : { width: "100%", height: "auto", aspectRatio: `${aw}/${ah}`, maxHeight: "100%" };
                    return (
                  <div
                    ref={canvasRef}
                    onClick={e => {
                      if (e.target === e.currentTarget) {
                        if (activeTool === "text" && canvasRef.current) {
                          const rect = canvasRef.current.getBoundingClientRect();
                          addTextItem((e.clientX - rect.left) / rect.width * 100, (e.clientY - rect.top) / rect.height * 100);
                        } else {
                          setSelectedCanvasId(null);
                          setEditingTextId(null);
                        }
                      }
                    }}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                    onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                    onDragEnter={() => setCanvasDragOver(true)}
                    onDragLeave={e => { if (!canvasRef.current?.contains(e.relatedTarget as Node)) setCanvasDragOver(false); }}
                    onDrop={async e => {
                      e.preventDefault();
                      setCanvasDragOver(false);
                      if (!canvasRef.current) return;
                      const rect = canvasRef.current.getBoundingClientRect();
                      const xPct = (e.clientX - rect.left) / rect.width * 100;
                      const yPct = (e.clientY - rect.top) / rect.height * 100;
                      const imageId = e.dataTransfer.getData("text/plain");
                      if (imageId) { addToCanvasAt(imageId, xPct, yPct); return; }
                      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/") && f.type !== "image/svg+xml");
                      for (const file of files.slice(0, 4)) {
                        try {
                          const dataUrl = await processMoodImage(file);
                          const id = genId();
                          setMoodboardImages(prev => {
                            const next = [...prev, { id, dataUrl }];
                            try { localStorage.setItem(MOODBOARD_KEY, JSON.stringify(next)); } catch { /* ignore */ }
                            return next;
                          });
                          addToCanvasAt(id, xPct, yPct);
                        } catch { /* skip */ }
                      }
                    }}
                    style={{
                      ...aspectStyle,
                      position: "relative",
                      background: canvasBg === "transparent"
                        ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 16px 16px"
                        : canvasBg,
                      border: `1px solid rgba(100,65,15,${canvasDragOver ? 0.45 : 0.18})`,
                      boxShadow: canvasDragOver
                        ? "0 2px 20px rgba(40,28,12,0.1), inset 0 0 0 2px rgba(100,65,15,0.1)"
                        : "0 2px 20px rgba(40,28,12,0.1)",
                      overflow: "hidden",
                      cursor: activeTool === "text" ? "text" : "default",
                      transition: "border-color 0.12s, box-shadow 0.12s",
                    }}
                  >
                    {/* Center-axis snap guide — fades in during drag */}
                    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, opacity: canvasMoving ? 1 : 0, transition: "opacity 0.15s ease" }}>
                      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(100,65,15,0.2)", transform: "translateX(-50%)" }} />
                      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(100,65,15,0.2)", transform: "translateY(-50%)" }} />
                    </div>
                    {(() => {
                      const activeItems = (canvases.find(c => c.id === activeCanvasId) ?? canvases[0])?.items ?? [];
                      return (<>
                        {activeItems.length === 0 && (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                            <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "0.88rem", color: "rgba(100,65,15,0.42)", margin: 0 }}>
                              Drag images here or click Text to begin
                            </p>
                          </div>
                        )}
                        {activeItems.map(item => {
                          const isSelected = selectedCanvasId === item.id;
                          const isTextItem = item.type === "text";
                          const src = isTextItem ? null : moodboardImages.find(m => m.id === item.imageId);
                          if (!isTextItem && !src) return null;
                          const HANDLE_STYLE: React.CSSProperties = { position: "absolute", right: -5, top: -5, width: 18, height: 18, background: "rgba(26,18,10,0.62)", borderRadius: "50%", cursor: "crosshair", display: "flex", alignItems: "center", justifyContent: "center" };
                          return (
                            <div
                              key={item.id}
                              style={{
                                position: "absolute",
                                left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`,
                                zIndex: item.zIndex,
                                cursor: isTextItem && editingTextId === item.id ? "text" : "grab",
                                userSelect: "none",
                                opacity: item.opacity ?? 1,
                                transform: `rotate(${item.rotation ?? 0}deg)`,
                                transformOrigin: "center center",
                                outline: isSelected ? "1.5px solid rgba(100,65,15,0.55)" : "none",
                                outlineOffset: 1,
                              }}
                              onPointerDown={e => {
                                if (isTextItem && editingTextId === item.id) return;
                                e.preventDefault();
                                e.stopPropagation();
                                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                                const ir = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                const cr = canvasRef.current?.getBoundingClientRect();
                                const halfW = cr ? (ir.width / cr.width * 100) / 2 : 0;
                                const halfH = cr ? (ir.height / cr.height * 100) / 2 : 0;
                                dragRef.current = { id: item.id, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y, halfW, halfH };
                                setCanvasMoving(true);
                                setSelectedCanvasId(item.id);
                                setCanvases(prev => prev.map(c => {
                                  if (c.id !== activeCanvasId) return c;
                                  const maxZ = Math.max(0, ...c.items.map(i => i.zIndex));
                                  return { ...c, items: c.items.map(i => i.id === item.id ? { ...i, zIndex: maxZ + 1 } : i) };
                                }));
                              }}
                              onDoubleClick={() => { if (isTextItem) setEditingTextId(item.id); }}
                            >
                              {isTextItem ? (
                                editingTextId === item.id ? (
                                  <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    autoFocus
                                    onBlur={e => {
                                      const text = e.currentTarget.innerText;
                                      setCanvases(prev => {
                                        const next = prev.map(c => c.id !== activeCanvasId ? c :
                                          { ...c, items: c.items.map(i => i.id === item.id ? { ...i, text } : i) }
                                        );
                                        try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
                                        return next;
                                      });
                                      setEditingTextId(null);
                                    }}
                                    onPointerDown={e => e.stopPropagation()}
                                    style={{ outline: "none", minWidth: 40, minHeight: 24, fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: `${item.fontSize ?? 18}px`, color: item.fontColor ?? "#1a120a", lineHeight: 1.3, padding: "2px 4px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                  >
                                    {item.text}
                                  </div>
                                ) : (
                                  <div style={{ minWidth: 40, minHeight: 24, fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: `${item.fontSize ?? 18}px`, color: item.fontColor ?? "#1a120a", lineHeight: 1.3, padding: "2px 4px", whiteSpace: "pre-wrap", wordBreak: "break-word", pointerEvents: "none" }}>
                                    {item.text || <span style={{ opacity: 0.35 }}>Double-click to edit</span>}
                                  </div>
                                )
                              ) : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={src!.dataUrl} alt="" style={{ width: "100%", display: "block", pointerEvents: "none" }} draggable={false} />
                              )}
                              {isSelected && (<>
                                {/* Rotate handle */}
                                <div
                                  style={HANDLE_STYLE}
                                  onPointerDown={e => {
                                    e.preventDefault(); e.stopPropagation();
                                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                                    setCanvasMoving(true);
                                    const itemEl = e.currentTarget.parentElement!;
                                    const r = itemEl.getBoundingClientRect();
                                    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                                    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
                                    rotateRef.current = { id: item.id, cx, cy, startAngle, origRotation: item.rotation ?? 0 };
                                  }}
                                  onPointerMove={e => { e.stopPropagation(); handleCanvasPointerMove(e); }}
                                  onPointerUp={e => { e.stopPropagation(); handleCanvasPointerUp(); }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.92)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                  </svg>
                                </div>
                                {/* Resize handle */}
                                <div
                                  style={{ ...HANDLE_STYLE, right: -5, top: "auto", bottom: -5, cursor: "se-resize" }}
                                  onPointerDown={e => {
                                    e.preventDefault(); e.stopPropagation();
                                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                                    setCanvasMoving(true);
                                    resizeRef.current = { id: item.id, startX: e.clientX, origW: item.w };
                                  }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.92)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                                  </svg>
                                </div>
                                {/* Font controls for text items */}
                                {isTextItem && (
                                  <div
                                    style={{ position: "absolute", top: -32, left: 0, display: "flex", gap: 4, background: "rgba(26,18,10,0.78)", borderRadius: 6, padding: "3px 6px", pointerEvents: "all" }}
                                    onPointerDown={e => e.stopPropagation()}
                                  >
                                    <select
                                      value={item.fontSize ?? 18}
                                      onChange={e => setCanvases(prev => {
                                        const next = prev.map(c => c.id !== activeCanvasId ? c : { ...c, items: c.items.map(i => i.id === item.id ? { ...i, fontSize: +e.target.value } : i) });
                                        try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
                                        return next;
                                      })}
                                      style={{ background: "none", border: "none", color: "rgba(245,240,232,0.9)", fontSize: "0.32rem", cursor: "pointer", outline: "none" }}
                                    >
                                      {[10,14,18,24,32,42,56,72].map(s => <option key={s} value={s}>{s}px</option>)}
                                    </select>
                                    <input
                                      type="color"
                                      value={item.fontColor ?? "#1a120a"}
                                      onChange={e => setCanvases(prev => {
                                        const next = prev.map(c => c.id !== activeCanvasId ? c : { ...c, items: c.items.map(i => i.id === item.id ? { ...i, fontColor: e.target.value } : i) });
                                        try { localStorage.setItem(CANVAS_KEY, JSON.stringify(next)); } catch {}
                                        return next;
                                      })}
                                      style={{ width: 18, height: 18, border: "none", padding: 0, borderRadius: 2, cursor: "pointer", background: "none" }}
                                    />
                                  </div>
                                )}
                              </>)}
                            </div>
                          );
                        })}
                      </>);
                    })()}
                  </div>
                    );
                  })()}
                </div>
              </div>

            </div>{/* end two-panel body */}
          </div>
        </div>,
        document.body
      )}
      {/* Hidden file input for closet uploads */}
      <input
        ref={closetFileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleClosetUpload}
      />

      {closetOpen && createPortal(
        <div
          onClick={e => { if (e.target === e.currentTarget) { setClosetOpen(false); setOpenCubbyId(null); } }}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(26,18,10,0.35)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "clamp(1rem, 4vw, 3rem)",
          }}
        >
          <div style={{
            position: "relative",
            width: "min(720px, 100%)",
            aspectRatio: "1263 / 1100",
            background: "#F8F3EA",
            borderRadius: 14,
            boxShadow: "0 24px 64px rgba(26,18,10,0.22), 0 2px 8px rgba(26,18,10,0.1)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Shelves background */}
            <img src="/cabinetshelves-transparent.png" aria-hidden style={{
              position: "absolute", top: "11%", left: "50.25%",
              transform: "translateX(-50%)", width: "107.7%", height: "auto",
              pointerEvents: "none", zIndex: 1, mixBlendMode: "multiply", opacity: 0.7,
            }} />
            {/* Frame overlay */}
            <img src="/cabinet-border.png" aria-hidden style={{
              position: "absolute", top: "3.2rem", left: 0, right: 0, bottom: 0,
              width: "100%", height: "calc(100% - 3.2rem)",
              objectFit: "contain", objectPosition: "top center",
              pointerEvents: "none", zIndex: 2, mixBlendMode: "multiply", opacity: 0.88,
            }} />

            {/* Header */}
            <div style={{
              position: "relative", zIndex: 3,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "1.1rem 1.6rem 0.9rem",
              borderBottom: "1px solid rgba(100,65,15,0.1)", flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="14" height="14" aria-hidden style={{ flexShrink: 0 }}>
                  <g fill="none" stroke="rgba(100,65,15,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M24 21v-6c0-2.55 1.75-4.6 4-4.6s4 2.05 4 4.6v1.25"/>
                    <path d="M24 21c-2.25 0-4.05 1.25-5.95 2.5L8.8 29.65c-1.75 1.15-.95 3.85 1.15 3.85h28.1c2.1 0 2.9-2.7 1.15-3.85l-9.25-6.15C28.05 22.25 26.25 21 24 21Z"/>
                  </g>
                </svg>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.38rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,65,15,0.55)" }}>Closet</span>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.38rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(100,65,15,0.55)" }}>
                  {(() => { const n = cubbies.reduce((s, c) => s + c.items.length, 0); return n > 0 ? `${n} piece${n !== 1 ? "s" : ""}` : "Your wardrobe"; })()}
                </span>
              </div>
              <button onClick={() => { setClosetOpen(false); setOpenCubbyId(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: "1.1rem", padding: "0.25rem", lineHeight: 1 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = INK; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = MUTED; }}
              >×</button>
            </div>

            {/* Individual cubbies — each positioned to match actual shelf compartment */}
            {cubbies.slice(0, 25).map((cubby, idx) => {
              // Positions baked in from live DOM after user-dragged calibration
              const SLOTS = [
                {l:12.77,t:33.44,w:13.48,h:6.72},{l:28.22,t:33.28,w:13.48,h:6.72},{l:43.26,t:33.44,w:13.48,h:6.72},{l:58.02,t:33.28,w:13.48,h:6.72},{l:73.47,t:33.28,w:13.48,h:6.72},
                {l:12.77,t:41.48,w:13.48,h:6.72},{l:28.22,t:41.32,w:13.48,h:6.72},{l:43.12,t:41.32,w:13.48,h:6.72},{l:57.88,t:41.16,w:13.48,h:6.72},{l:73.33,t:41.32,w:13.48,h:6.72},
                {l:12.77,t:49.36,w:13.48,h:6.72},{l:28.22,t:49.36,w:13.48,h:6.72},{l:43.26,t:49.36,w:13.48,h:6.72},{l:57.88,t:49.36,w:13.48,h:6.72},{l:73.33,t:49.36,w:13.48,h:6.72},
                {l:12.77,t:57.40,w:13.48,h:6.72},{l:28.23,t:57.40,w:13.48,h:6.72},{l:43.12,t:57.40,w:13.48,h:6.72},{l:57.88,t:57.40,w:13.48,h:6.72},{l:73.19,t:57.40,w:13.48,h:6.72},
                {l:12.63,t:65.60,w:13.48,h:6.72},{l:28.22,t:65.60,w:13.48,h:6.72},{l:43.26,t:65.44,w:13.48,h:6.72},{l:58.02,t:65.60,w:13.48,h:6.72},{l:73.47,t:65.44,w:13.48,h:6.72},
              ];
              const {l,t,w,h} = SLOTS[idx] ?? {l:0,t:0,w:13,h:6};
              return (
                <div key={cubby.id} style={{
                  position: "absolute",
                  top: `${t}%`, height: `${h}%`,
                  left: `${l}%`, width: `${w}%`,
                  zIndex: 3,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                  gap: "2px",
                  transition: "background 0.18s",
                }}
                onMouseEnter={e => { setHoveredCubbyIdx(idx); (e.currentTarget as HTMLElement).style.background = "rgba(248,243,234,0.38)"; }}
                onMouseLeave={e => { setHoveredCubbyIdx(null); (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* Filled cubby: dark tint, click opens detail; label input sits on top */}
                  {cubby.items.length > 0 ? (
                    <>
                      {/* Full-area click target to open detail */}
                      <button
                        onClick={() => setOpenCubbyId(cubby.id)}
                        style={{
                          position: "absolute", inset: 0, width: "100%", height: "100%",
                          background: "rgba(26,18,10,0.18)", border: "none", cursor: "pointer", padding: 0,
                        }}
                      />
                      {/* Editable label — stops propagation so clicking it doesn't open detail */}
                      {editingCubbyId === cubby.id ? (
                        <input
                          autoFocus
                          placeholder="NAME"
                          value={editLabelValue}
                          onChange={e => setEditLabelValue(e.target.value)}
                          onBlur={() => {
                            const trimmed = editLabelValue.trim();
                            if (!trimmed && !cubby.label) return; // keep open if first-time and still empty
                            updateCubbyLabel(cubby.id, trimmed);
                            setEditingCubbyId(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              const trimmed = editLabelValue.trim();
                              if (!trimmed && !cubby.label) return; // don't close blank on first add
                              updateCubbyLabel(cubby.id, trimmed);
                              setEditingCubbyId(null);
                            }
                            if (e.key === "Escape" && cubby.label) { // only allow escape if already named
                              setEditingCubbyId(null);
                            }
                          }}
                          onClick={e => e.stopPropagation()}
                          style={{
                            position: "relative", zIndex: 1,
                            background: "none", border: "none", outline: "none",
                            borderBottom: "1px solid rgba(26,18,10,0.3)",
                            fontFamily: "var(--font-jost)", fontWeight: 600,
                            fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
                            color: "rgba(26,18,10,0.8)", textAlign: "center",
                            width: "80%", padding: "0 0 1px",
                          }}
                        />
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setOpenCubbyId(cubby.id); }}
                          onDoubleClick={e => { e.stopPropagation(); setEditLabelValue(cubby.label); setEditingCubbyId(cubby.id); }}
                          style={{
                            position: "relative", zIndex: 1,
                            background: "none", border: "none", cursor: "pointer", padding: 0,
                            fontFamily: "var(--font-jost)", fontWeight: 600,
                            fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
                            color: cubby.label ? "rgba(26,18,10,0.7)" : "rgba(26,18,10,0.3)",
                          }}
                        >{cubby.label || "label"}</button>
                      )}
                    </>
                  ) : (
                    /* Empty cubby: + button on hover */
                    <button
                      onClick={() => { uploadingCubbyRef.current = cubby.id; closetFileRef.current?.click(); }}
                      style={{
                        background: "none", border: `1px solid rgba(100,65,15,0.22)`, borderRadius: "50%",
                        width: "1rem", height: "1rem", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: MUTED, fontSize: "0.55rem", lineHeight: 1, padding: 0,
                        transition: "background 0.15s, opacity 0.15s",
                        flexShrink: 0,
                        opacity: hoveredCubbyIdx === idx ? 1 : 0,
                        pointerEvents: hoveredCubbyIdx === idx ? "auto" : "none",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(210,200,185,0.55)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,65,15,0.18)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,65,15,0.22)"; }}
                    >+</button>
                  )}
                </div>
              );
            })}

            {/* Empty-state tagline */}
            {!cubbies.some(c => c.items.length > 0) && (
              <div style={{
                position: "absolute", bottom: "5%", left: 0, right: 0,
                zIndex: 3, textAlign: "center", padding: "0 2rem",
                pointerEvents: "none",
              }}>
                <p style={{
                  fontFamily: "var(--font-jost)", fontSize: "0.48rem",
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: MUTED, lineHeight: 1.9, margin: 0,
                }}>
                  Store your wardrobe here — organize by category,<br />
                  ask Ordre for advice on how to develop the best pairings
                </p>
              </div>
            )}

            {/* Cubby detail panel — slides in over the shelf when a filled cubby is clicked */}
            {(() => {
              const activeCubby = openCubbyId ? cubbies.find(c => c.id === openCubbyId) : null;
              if (!activeCubby) return null;
              return (
                <div style={{
                  position: "absolute", inset: 0, zIndex: 20,
                  background: "#F8F3EA",
                  display: "flex", flexDirection: "column",
                  animation: "closetFadeUp 0.22s ease",
                }}>
                  {/* Detail header */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "1rem 1.2rem 0.75rem",
                    borderBottom: `1px solid rgba(100,65,15,0.1)`,
                    flexShrink: 0,
                  }}>
                    <button
                      onClick={() => setOpenCubbyId(null)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: "1rem", lineHeight: 1, padding: "0 0.25rem 0 0" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = INK; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = MUTED; }}
                    >←</button>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.42rem", letterSpacing: "0.1em", color: MUTED }}>
                      {activeCubby.items.length} {activeCubby.items.length === 1 ? "piece" : "pieces"}
                    </span>
                    <button
                      onClick={() => { uploadingCubbyRef.current = activeCubby.id; closetFileRef.current?.click(); }}
                      style={{
                        background: "none", border: `1px solid rgba(100,65,15,0.22)`, borderRadius: "50%",
                        width: "1.4rem", height: "1.4rem", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: MUTED, fontSize: "0.75rem", lineHeight: 1, padding: 0,
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = INK; (e.currentTarget as HTMLElement).style.color = "#F8F3EA"; (e.currentTarget as HTMLElement).style.borderColor = INK; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = MUTED; (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,65,15,0.22)"; }}
                    >+</button>
                  </div>

                  {/* Image grid */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.2rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem", alignContent: "start" }}>
                    {activeCubby.items.map(item => (
                      <div key={item.id} style={{ position: "relative", aspectRatio: "3/4", borderRadius: 6, overflow: "hidden", border: `1px solid rgba(100,65,15,0.12)` }}
                        onMouseEnter={e => { e.currentTarget.querySelectorAll<HTMLElement>('[data-hover-btn]').forEach(b => { b.style.opacity = "1"; }); }}
                        onMouseLeave={e => { e.currentTarget.querySelectorAll<HTMLElement>('[data-hover-btn]').forEach(b => { b.style.opacity = "0"; }); }}
                      >
                        <img src={item.dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        <button
                          data-hover-btn
                          onClick={() => {
                            saveCubbies(cubbies.map(c => c.id === activeCubby.id
                              ? { ...c, items: c.items.filter(i => i.id !== item.id) }
                              : c
                            ));
                          }}
                          style={{
                            position: "absolute", top: 4, right: 4,
                            width: 20, height: 20, borderRadius: "50%",
                            background: "rgba(26,18,10,0.6)", border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#F8F3EA", fontSize: "0.55rem", lineHeight: 1, padding: 0,
                            opacity: 0, transition: "opacity 0.15s",
                          }}
                        >✕</button>
                        <button
                          data-hover-btn
                          onClick={() => setLassoTarget({ cubbyId: activeCubby.id, itemId: item.id, dataUrl: item.dataUrl })}
                          style={{
                            position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)",
                            height: 18, padding: "0 6px", borderRadius: 9,
                            background: "rgba(26,18,10,0.6)", border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#F8F3EA", fontSize: "0.45rem", letterSpacing: "0.06em",
                            fontFamily: "var(--font-jost)", whiteSpace: "nowrap",
                            opacity: 0, transition: "opacity 0.15s",
                          }}
                        >remove bg</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Lasso background-removal editor */}
            {lassoTarget && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 25,
                background: "#1C1208", display: "flex", flexDirection: "column",
                animation: "closetFadeUp 0.18s ease",
              }}>
                {/* Header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.55rem 0.9rem", borderBottom: "1px solid rgba(255,255,255,0.07)",
                  flexShrink: 0,
                }}>
                  <button
                    onClick={() => { setLassoTarget(null); lassoPointsRef.current = []; setLassoClosed(false); lassoSessionRef.current = null; }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: "1rem", lineHeight: 1, padding: "0 0.2rem 0 0", flexShrink: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
                  >←</button>
                  <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.37rem", fontWeight: 600, letterSpacing: "0.17em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", flex: 1, minWidth: 0 }}>
                    {lassoClosed
                      ? (lassoMode === "keep" ? "Apply to keep the selection" : "Apply to remove the selection")
                      : (lassoMode === "keep" ? "Draw around what to keep" : "Draw around what to remove")}
                  </span>
                  {/* Keep / Remove mode toggle */}
                  <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                    {(["keep", "remove"] as const).map(m => (
                      <button key={m} onClick={() => { setLassoMode(m); lassoModeRef.current = m; drawLassoCanvas(); }}
                        style={{ background: lassoMode === m ? "rgba(255,255,255,0.15)" : "transparent", border: "none", cursor: "pointer", padding: "0.18rem 0.45rem", fontFamily: "var(--font-jost)", fontSize: "0.32rem", letterSpacing: "0.1em", textTransform: "uppercase", color: lassoMode === m ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)", transition: "background 0.12s" }}
                      >{m}</button>
                    ))}
                  </div>
                  {/* Zoom controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.18rem", flexShrink: 0 }}>
                    <button onClick={zoomOut} disabled={lassoZoom <= 1}
                      style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 3, cursor: lassoZoom > 1 ? "pointer" : "default", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", color: lassoZoom > 1 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)", fontSize: "0.85rem", lineHeight: 1 }}
                    >−</button>
                    <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.35rem", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", minWidth: 22, textAlign: "center" }}>{lassoZoom === 1 ? "1×" : `${lassoZoom}×`}</span>
                    <button onClick={zoomIn} disabled={lassoZoom >= 4}
                      style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 3, cursor: lassoZoom < 4 ? "pointer" : "default", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", color: lassoZoom < 4 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)", fontSize: "0.85rem", lineHeight: 1 }}
                    >+</button>
                  </div>
                  {lassoZoom > 1 && (
                    <button onClick={() => setLassoPanMode(m => !m)}
                      style={{ background: lassoPanMode ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, cursor: "pointer", padding: "0.18rem 0.4rem", fontFamily: "var(--font-jost)", fontSize: "0.33rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", flexShrink: 0 }}
                    >{lassoPanMode ? "Draw" : "Move"}</button>
                  )}
                  <button onClick={undoLasso} disabled={!lassoCanUndo}
                    style={{ background: "none", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 3, cursor: lassoCanUndo ? "pointer" : "default", padding: "0.18rem 0.45rem", fontFamily: "var(--font-jost)", fontSize: "0.33rem", letterSpacing: "0.1em", textTransform: "uppercase", color: lassoCanUndo ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.15)", flexShrink: 0 }}
                  >Undo</button>
{lassoClosed && !lassoPanMode && (
                    <button onClick={() => { lassoPointsRef.current = []; setLassoClosed(false); drawLassoCanvas(); }}
                      style={{ background: "none", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 3, cursor: "pointer", padding: "0.18rem 0.45rem", fontFamily: "var(--font-jost)", fontSize: "0.33rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", flexShrink: 0 }}
                    >Redraw</button>
                  )}
                  <button onClick={applyLasso} disabled={!lassoClosed || lassoApplying}
                    style={{ background: lassoClosed ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.08)", border: "none", borderRadius: 3, cursor: lassoClosed ? "pointer" : "default", padding: "0.18rem 0.55rem", fontFamily: "var(--font-jost)", fontSize: "0.33rem", letterSpacing: "0.1em", textTransform: "uppercase", color: lassoClosed ? "#1C1208" : "rgba(255,255,255,0.2)", transition: "background 0.15s", flexShrink: 0 }}
                  >{lassoApplying ? "Applying…" : "Apply"}</button>
                  <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                    <button onClick={addLassoToMoodboard}
                      style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 3, cursor: "pointer", padding: "0.18rem 0.55rem", fontFamily: "var(--font-jost)", fontSize: "0.33rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}
                    >Add to moodboard</button>
                    <span style={{ opacity: lassoAddedMood ? 1 : 0, transition: "opacity 0.35s", color: "rgba(140,210,140,0.9)", fontSize: "0.75rem", lineHeight: 1 }}>✓</span>
                  </div>
                </div>
                {/* Zoomable image + lasso canvas */}
                <div
                  ref={lassoAreaRef}
                  style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "3.5rem" }}
                >
                  <div
                    style={{
                      position: "relative", display: "inline-flex",
                      transform: `scale(${lassoZoom}) translate(${lassoPan.x / lassoZoom}px, ${lassoPan.y / lassoZoom}px)`,
                      transformOrigin: "center center",
                      transition: panDragRef.current.active ? "none" : "transform 0.18s ease",
                      cursor: lassoPanMode ? "grab" : "crosshair",
                    }}
                    onPointerDown={lassoPanMode ? handlePanPointerDown : undefined}
                    onPointerMove={lassoPanMode ? handlePanPointerMove : undefined}
                    onPointerUp={lassoPanMode ? handlePanPointerUp : undefined}
                    onPointerLeave={lassoPanMode ? handlePanPointerUp : undefined}
                  >
                    <img
                      ref={lassoImgRef}
                      src={lassoTarget.dataUrl}
                      alt=""
                      onLoad={() => {
                        const img = lassoImgRef.current;
                        const canvas = lassoCanvasRef.current;
                        if (!img || !canvas) return;
                        const dpr = window.devicePixelRatio || 1;
                        lassoBaSizeRef.current = { w: img.clientWidth * dpr, h: img.clientHeight * dpr };
                        canvas.width = Math.round(lassoBaSizeRef.current.w * lassoZoomRef.current);
                        canvas.height = Math.round(lassoBaSizeRef.current.h * lassoZoomRef.current);
                        lassoPointsRef.current = [];
                        setLassoClosed(false);
                      }}
                      style={{ display: "block", maxWidth: "min(100%, 520px)", maxHeight: "calc(100vh - 180px)", objectFit: "contain", userSelect: "none", WebkitUserSelect: "none", pointerEvents: "none" }}
                      draggable={false}
                    />
                    <canvas
                      ref={lassoCanvasRef}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none", pointerEvents: lassoPanMode ? "none" : "auto", cursor: "inherit" }}
                      onPointerDown={lassoPanMode ? undefined : handleLassoPointerDown}
                      onPointerMove={lassoPanMode ? undefined : handleLassoPointerMove}
                      onPointerUp={lassoPanMode ? undefined : handleLassoPointerUp}
                      onPointerLeave={lassoPanMode ? undefined : handleLassoPointerUp}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}
      <style>{`@keyframes closetFadeUp { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
      {editingImage && (
        <ImageEditorModal
          img={editingImage}
          onSave={saveEditedImage}
          onClose={() => setEditingImage(null)}
        />
      )}
    </>
  );
}
