"use client";

import { useState, useCallback, useEffect } from "react";

export type UserProfile = {
  colors: string[];
  contrast: string; // "low" | "medium" | "high"
  world: string;
  silhouette: string;
  aesthetic: string[];
};

export function buildProfileDescription(p: UserProfile): string {
  const chosenPalettes = COLOR_PALETTES.filter(c => p.colors.includes(c.value));
  const contrastLabel = CONTRAST_OPTIONS.find(c => c.value === p.contrast)?.label ?? "";
  const worldLabel = WORLD_OPTIONS.find(w => w.value === p.world)?.label ?? "";
  const silhouetteLabel = SILHOUETTE_OPTIONS.find(s => s.value === p.silhouette)?.label ?? "";
  const aestheticLabels = AESTHETIC_OPTIONS.filter(a => p.aesthetic.includes(a.value)).map(a => a.label);

  const parts: string[] = [];

  if (chosenPalettes.length) {
    const paletteDescriptions = chosenPalettes.map(c => `"${c.label}" (${c.meaning})`).join("; ");
    parts.push(`colour world: ${paletteDescriptions}`);
  }
  if (contrastLabel)           parts.push(`natural contrast: ${contrastLabel.toLowerCase()}`);
  if (worldLabel)              parts.push(`aesthetic world: ${worldLabel}`);
  if (silhouetteLabel)         parts.push(`form: ${silhouetteLabel.toLowerCase()}`);
  if (aestheticLabels.length)  parts.push(`sensibility: ${aestheticLabels.join(" & ").toLowerCase()}`);

  return parts.length
    ? `Client profile — ${parts.join(". ")}.`
    : "";
}

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const COLOR_PALETTES = [
  { label: "Carmine",        value: "carmine",         colors: ["#9E0031", "#770058", "#600047", "#44001A"], featured: true,  meaning: "this client is drawn to intensity and drama — they want fashion that makes a statement, commands a room and is unafraid of power. Recommend pieces with presence: deep jewel tones, strong silhouettes, garments with theatrical weight" },
  { label: "Silver Mist",    value: "silver-mist",    colors: ["#FCF7FF", "#C4CAD0", "#878C8F", "#655560"], featured: false, meaning: "this client is chic, modern and trend-aware — they are polished, follow the right references and want to look current. They are somewhat predictable in the best sense: they trust the edit. Recommend well-positioned contemporary pieces, clean lines, and looks that read as effortlessly of-the-moment" },
  { label: "Indigo & Earth", value: "indigo-earth",   colors: ["#EF946C", "#C4A77D", "#70877F", "#2F2963"], featured: true,  meaning: "this client lives a bohemian, earthy lifestyle — they are drawn to artisan craft, natural materials, global influences and unhurried dressing. Recommend flowing silhouettes, natural fibres, handmade or ethically-sourced pieces, and a palette rooted in earth and landscape" },
  { label: "Velvet Rose",    value: "velvet-rose",    colors: ["#0F110C", "#9D6381", "#612940", "#FDECEF"], featured: true,  meaning: "this client favours classic style with a dark romantic edge — they are elegant but not conventional, drawn to tradition with a shadow underneath it. Recommend timeless silhouettes in muted, moody tones: dusty rose, black, deep burgundy, and the occasional soft blush for contrast" },
  { label: "Fête",           value: "fete",            colors: ["#ED254E", "#F9DC5C", "#C2EABD", "#011936"], featured: true,  meaning: "this client has a joyful, playful and uninhibited relationship with fashion — they enjoy bright colour, fun dressing and experiences that feel bubbly and alive. Recommend bold colour-blocking, playful prints, youthful silhouettes and designers who don't take themselves too seriously" },
  { label: "Understory",     value: "understory",      colors: ["#0D1F22", "#264027", "#6F732F", "#B38A58"], featured: false, meaning: "this client is intellectual and inward-looking — they read widely, think deeply and are entirely indifferent to trends. They dress with quiet intention rather than to be seen. Recommend considered, unfussy pieces in forest tones: deep greens, aged bronze, dark teal. Think independent labels, utilitarian cuts, garments that age well" },
  { label: "Grande Dame",    value: "grande-dame",    colors: ["#39181D", "#96031A", "#FDC55E", "#BFBFC5"], featured: true,  meaning: "this client lives for glamour — old Hollywood, red carpet moments, vintage Versace and maximalist dressing. They believe more is more. Recommend statement pieces, rich fabrics like velvet and silk, bold jewel tones, gold accents and designers who understand theatre" },
  { label: "Electric Noir",  value: "electric-noir",  colors: ["#0D0106", "#3626A7", "#657ED4", "#FF331F"], featured: true,  meaning: "this client lives for nightlife, city energy and the electric pulse of somewhere like New York — they are drawn to the 80s: bold shoulders, graphic contrast, neon against black. Recommend high-impact evening pieces, leather, strong colour pops against dark foundations, and designers with an urban or new-wave sensibility" },
  { label: "Bare Silk",      value: "bare-silk",      colors: ["#D98877", "#E19D94", "#EEC5AF", "#FCE5D9"], featured: false, meaning: "this client is drawn to quiet luxury and old money sensibility — they wear cashmere, carry nothing logo, and dress with an understated confidence that needs no announcement. Recommend tonal dressing in warm nudes and blush roses, impeccable tailoring, heritage labels and pieces that whisper rather than shout" },
  { label: "Shore & Sail",   value: "shore-sail",     colors: ["#B3001B", "#245894", "#D3E0EE", "#CCAD8F"], featured: true,  meaning: "this client has a coastal, preppy sensibility — think Nantucket, sailing clubs, sun-bleached linen and effortless summer ease. Recommend classic Americana and European resort wear: navy and white stripes, crisp cotton, relaxed tailoring and a palette anchored in sea, sand and faded red" },
];

const WORLD_OPTIONS = [
  { label: "The Medieval Court", value: "medieval-court",  description: "Guinevere at dusk, velvet sleeves trailing through candlelit halls. The Pre-Raphaelites, McQueen's romantic vision, garments that feel pulled from another time entirely." },
  { label: "60s Rome",          value: "60s-rome",        description: "La Dolce Vita, Fellini, the early years of Valentino and Pucci. Sensual ease, open-air restaurants, the golden hour stretched indefinitely into evening." },
  { label: "70s California",    value: "70s-california",  description: "Sun-bleached denim, Halston at night, the line between underdressed and iconic impossibly thin. Ease as a form of power." },
  { label: "80s New York",      value: "80s-new-york",    description: "Power shoulders, graphic contrast, the energy of something about to happen. Mugler, Grace Jones, Studio 54 and the morning after." },
  { label: "80s Tokyo",         value: "80s-tokyo",       description: "Comme des Garçons, Yohji Yamamoto, Issey Miyake arriving in Paris and rewriting the rules. Structural, conceptual, entirely unbothered by Western convention." },
  { label: "90s Minimalism",    value: "90s-minimalism",  description: "Calvin Klein, Helmut Lang, the radical act of wearing almost nothing beautifully. Clean, spare, exact — every piece earned its place." },
  { label: "The present moment", value: "present",        description: "No nostalgia. The runway right now, the conversation happening today. Forward-facing, trend-literate, alive to what's next." },
];

const SILHOUETTE_OPTIONS = [
  { label: "Slight & willowy",     value: "slight-willowy" },
  { label: "Tall & long-limbed",   value: "tall-angular" },
  { label: "Curved & soft",        value: "curved-fluid" },
  { label: "Petite & precise",     value: "petite-defined" },
  { label: "Strong & broad",       value: "athletic-strong" },
];

const AESTHETIC_OPTIONS = [
  { label: "Romantic",    value: "romantic" },
  { label: "Refined",     value: "refined" },
  { label: "Dramatic",    value: "dramatic" },
  { label: "Irreverent",  value: "irreverent" },
  { label: "Ethereal",    value: "ethereal" },
  { label: "Classic",     value: "classic" },
  { label: "Playful",     value: "playful" },
  { label: "Minimalist",   value: "minimalist" },
  { label: "Curious",      value: "curious" },
];

/* ─── Contrast options ──────────────────────────────────────────────────────── */

const CONTRAST_OPTIONS = [
  {
    value: "low",
    label: "Low Contrast",
    description: "Your features sit close in tone — skin, hair and eyes share the same quiet register. Tonal dressing and soft colour feel effortless on you.",
    rectBg: "#D8D0C4",
    rectText: "#958A7E", // nearly the same as background — barely legible
    fontWeight: 600,
  },
  {
    value: "medium",
    label: "Medium Contrast",
    description: "A moderate difference between your features. You move comfortably between muted and bold, and most colour territories work in your favour.",
    rectBg: "#D8D0C4",
    rectText: "#6E6156", // mid-tone — comfortably readable
    fontWeight: 600,
  },
  {
    value: "high",
    label: "High Contrast",
    description: "Strong difference between your skin, hair and eyes — think deep hair against fair skin, or bright eyes against a dark complexion. Bold colour and graphic pattern are your allies.",
    rectBg: "#D8D0C4",
    rectText: "#18110A", // near-black — strikingly clear
    fontWeight: 600,
  },
];

/* ─── Shared style tokens ───────────────────────────────────────────────────── */
const C = {
  goldBright:  "rgba(100,65,15,1)",
  goldMid:     "rgba(100,65,15,0.85)",
  goldDim:     "rgba(100,65,15,0.60)",
  goldHair:    "rgba(100,65,15,0.28)",
  textBright:  "#1A120A",
  textMid:     "rgba(26,18,10,0.80)",
  textDim:     "rgba(26,18,10,0.50)",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)",
  fontSize: "0.58rem",
  letterSpacing: "0.32em",
  textTransform: "uppercase",
  color: C.goldMid,
};

/* ─── Step sub-components ───────────────────────────────────────────────────── */

function StepColors({ profile, toggle }: { profile: UserProfile; toggle: (v: string) => void }) {
  return (
    <>
      <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.3rem, 2.4vw, 1.8rem)", color: C.textBright, marginBottom: "0.2rem", lineHeight: 1.2 }}>
        Which palettes are you drawn to?
      </h2>
      <p style={{ ...labelStyle, color: C.textDim, letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
        Select up to three palettes
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.4rem 1.25rem", width: "100%" }}>
        {COLOR_PALETTES.map(p => {
          const sel = profile.colors.includes(p.value);
          const disabled = !sel && profile.colors.length >= 3;
          return (
            <button key={p.value} onClick={() => toggle(p.value)} style={{
              display: "flex", flexDirection: "column", alignItems: "stretch", gap: 0,
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: disabled ? "default" : "pointer",
              transition: "transform 0.2s ease, opacity 0.25s ease",
              transform: sel ? "scale(1.03)" : "scale(1)",
              opacity: disabled ? 0.35 : 1,
            }}>
              {/* Color strips */}
              <div style={{
                display: "flex", width: "100%", height: 82,
                gap: "2px",
                borderRadius: "4px",
                overflow: "hidden",
                opacity: sel ? 1 : 0.82,
                transition: "opacity 0.25s, box-shadow 0.25s, border-color 0.25s",
                filter: p.featured ? "saturate(1.6) brightness(1.08)" : "saturate(0.72) brightness(0.88)",
                border: sel
                  ? "1.5px solid rgba(201,168,76,0.85)"
                  : "1.5px solid rgba(201,168,76,0.32)",
                boxShadow: sel
                  ? "0 0 12px rgba(201,168,76,0.2), 0 4px 20px rgba(0,0,0,0.4)"
                  : "0 2px 12px rgba(0,0,0,0.35)",
              }}>
                {p.colors.map((c, i) => (
                  <div key={i} style={{ flex: 1, background: c, position: "relative", overflow: "hidden" }}>
                    {/* Per-swatch grain */}
                    <div aria-hidden style={{
                      position: "absolute", inset: "-60%", width: "220%", height: "220%",
                      pointerEvents: "none",
                      opacity: 0.42, mixBlendMode: "overlay",
                      animation: `film-grain ${0.3 + i * 0.07}s steps(1) infinite`,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='gs'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23gs)'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "repeat", backgroundSize: "90px 90px",
                    }} />
                  </div>
                ))}
              </div>
              {/* Label */}
              <div style={{
                paddingTop: "0.25rem",
                paddingLeft: "0.1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}>
                {sel && <span style={{ color: "rgba(201,168,76,0.8)", fontSize: "0.5rem" }}>✦</span>}
                <span style={{
                  fontFamily: "var(--font-cormorant)",
                  fontStyle: "italic",
                  fontSize: "0.78rem",
                  color: sel ? C.goldBright : C.textMid,
                  transition: "color 0.25s",
                }}>
                  {p.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepContrast({ profile, setProfile }: { profile: UserProfile; setProfile: React.Dispatch<React.SetStateAction<UserProfile>> }) {
  return (
    <>
      <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.55rem, 2.8vw, 2.1rem)", color: C.textBright, marginBottom: "0.4rem" }}>
        Your natural contrast.
      </h2>
      <p style={{ ...labelStyle, color: C.textDim, letterSpacing: "0.12em", marginBottom: "2.5rem" }}>
        The relationship between your skin, hair and eyes
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
        {CONTRAST_OPTIONS.map(opt => {
          const sel = profile.contrast === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setProfile(p => ({ ...p, contrast: p.contrast === opt.value ? "" : opt.value }))}
              style={{
                padding: "1rem 1.25rem",
                textAlign: "left",
                border: sel ? `1px solid ${C.goldMid}` : `1px solid ${C.goldHair}`,
                background: sel ? "rgba(201,168,76,0.07)" : "transparent",
                cursor: "pointer",
                transition: "all 0.25s",
              }}
            >
              {/* Contrast demonstration rectangle */}
              <div style={{
                display: "block",
                background: opt.rectBg,
                padding: "0.4rem 1rem 0.4rem 1.6rem",
                marginBottom: "0.65rem",
                marginLeft: "-1.25rem",
                marginRight: "-1.25rem",
              }}>
                <span style={{
                  fontFamily: "var(--font-cormorant)",
                  fontStyle: "italic",
                  fontSize: "1.05rem",
                  color: opt.rectText,
                  letterSpacing: "0.01em",
                  fontWeight: ("fontWeight" in opt ? opt.fontWeight : 400) as number,
                }}>
                  {opt.label}
                </span>
              </div>
              <div style={{
                fontFamily: "var(--font-jost)",
                fontSize: "0.62rem",
                letterSpacing: "0.04em",
                lineHeight: 1.6,
                color: sel ? "rgba(26,18,10,0.7)" : "rgba(26,18,10,0.42)",
                transition: "color 0.25s",
              }}>
                {opt.description}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepWorld({ profile, setProfile }: { profile: UserProfile; setProfile: React.Dispatch<React.SetStateAction<UserProfile>> }) {
  return (
    <>
      <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.3rem, 2.4vw, 1.8rem)", color: C.textBright, marginBottom: "0.2rem" }}>
        Which world feels like yours?
      </h2>
      <p style={{ ...labelStyle, color: C.textDim, letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
        The one you'd inhabit, or already do
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.22rem", width: "100%" }}>
        {WORLD_OPTIONS.map(w => {
          const sel = profile.world === w.value;
          return (
            <button key={w.value}
              onClick={() => setProfile(p => ({ ...p, world: p.world === w.value ? "" : w.value }))}
              style={{
                padding: "0.42rem 1rem", textAlign: "left",
                border: sel ? `1px solid ${C.goldMid}` : `1px solid ${C.goldHair}`,
                background: sel ? "rgba(201,168,76,0.07)" : "transparent",
                cursor: "pointer", transition: "all 0.25s",
              }}>
              <div style={{
                fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "0.98rem",
                color: sel ? C.goldBright : C.textMid,
                marginBottom: "0.12rem",
                transition: "color 0.25s",
              }}>
                {w.label}
              </div>
              <div style={{
                fontFamily: "var(--font-jost)", fontSize: "0.56rem",
                letterSpacing: "0.03em", lineHeight: 1.55,
                color: sel ? "rgba(26,18,10,0.7)" : "rgba(26,18,10,0.42)",
                transition: "color 0.25s",
              }}>
                {w.description}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepSilhouette({ profile, setProfile }: { profile: UserProfile; setProfile: React.Dispatch<React.SetStateAction<UserProfile>> }) {
  return (
    <>
      <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.55rem, 2.8vw, 2.1rem)", color: C.textBright, marginBottom: "0.4rem" }}>
        Your form.
      </h2>
      <p style={{ ...labelStyle, color: C.textDim, letterSpacing: "0.12em", marginBottom: "2rem" }}>
        Your body, as it moves through the world
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", width: "100%" }}>
        {SILHOUETTE_OPTIONS.map(s => {
          const sel = profile.silhouette === s.value;
          return (
            <button key={s.value} onClick={() => setProfile(p => ({ ...p, silhouette: p.silhouette === s.value ? "" : s.value }))}
              style={{
                padding: "0.85rem 1.25rem", textAlign: "left",
                border: sel ? `1px solid ${C.goldMid}` : `1px solid ${C.goldHair}`,
                background: sel ? "rgba(201,168,76,0.07)" : "transparent",
                cursor: "pointer", transition: "all 0.25s",
              }}>
              <span style={{
                fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.05rem",
                color: sel ? C.goldBright : C.textMid,
                transition: "color 0.25s",
              }}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepAesthetic({ profile, toggle }: { profile: UserProfile; toggle: (v: string) => void }) {
  return (
    <>
      <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.3rem, 2.4vw, 1.8rem)", color: C.textBright, marginBottom: "0.2rem" }}>
        Your sensibility.
      </h2>
      <p style={{ ...labelStyle, color: C.textDim, letterSpacing: "0.12em", marginBottom: "0.7rem" }}>
        Select up to two
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem", width: "100%" }}>
        {AESTHETIC_OPTIONS.map(a => {
          const sel = profile.aesthetic.includes(a.value);
          const disabled = !sel && profile.aesthetic.length >= 2;
          return (
            <button key={a.value} onClick={() => toggle(a.value)}
              disabled={disabled}
              style={{
                padding: "0.52rem 1.25rem", textAlign: "left",
                border: sel ? `1px solid ${C.goldMid}` : `1px solid ${C.goldHair}`,
                background: sel ? "rgba(201,168,76,0.07)" : "transparent",
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.35 : 1,
                transition: "all 0.25s",
              }}>
              <span style={{
                fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.05rem",
                color: sel ? C.goldBright : C.textMid,
                transition: "color 0.25s",
              }}>
                {a.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ─── Summary / portrait step ───────────────────────────────────────────────── */

function StepPortrait({ profile, onReady }: { profile: UserProfile; onReady: () => void }) {
  const [portrait, setPortrait] = useState("");
  const [names, setNames]       = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const desc = buildProfileDescription(profile);
    fetch("/api/profile-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: desc }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(true); setLoading(false); setRevealed(true); onReady(); return; }
        const raw: string = d.summary ?? "";
        const headingMatch = raw.search(/those who may share/i);
        if (headingMatch >= 0) {
          setPortrait(raw.slice(0, headingMatch).trim());
          setNames(
            raw.slice(headingMatch)
              .split("\n")
              .filter(l => l.includes("✦"))
              .map(l => l.replace("✦", "").trim())
          );
        } else {
          setPortrait(raw.trim());
        }
        setLoading(false);
        setTimeout(() => { setRevealed(true); onReady(); }, 400);
      })
      .catch(() => { setError(true); setLoading(false); setRevealed(true); onReady(); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", minHeight: 220, justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.1rem", color: C.textDim, textAlign: "center" }}>
          Your portrait could not be drawn at this moment.
        </p>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.52rem", letterSpacing: "0.18em", color: C.textDim, opacity: 0.6, textAlign: "center" }}>
          Please ensure your API key is configured, then try again.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.8rem", minHeight: 220 }}>
        {/* Spinning rose window medallion */}
        <div style={{ animation: "spin-slow 6s linear infinite", width: 80, height: 80 }}>
          <svg width="80" height="80" viewBox="0 0 40 40" fill="none"
            stroke="rgba(100,65,15,0.7)" strokeWidth="0.42" strokeLinecap="round">
            <circle cx="20" cy="20" r="18.5" />
            {(() => {
              const n = 16, Ro = 17, Ri = 14.8;
              const pts: string[] = [];
              for (let i = 0; i <= n; i++) {
                const ap = 2 * Math.PI * i / n;
                const am = 2 * Math.PI * (i + 0.5) / n;
                const xp = 20 + Ro * Math.cos(ap), yp = 20 + Ro * Math.sin(ap);
                const xm = 20 + Ri * Math.cos(am), ym = 20 + Ri * Math.sin(am);
                if (i === 0) pts.push(`M${xp.toFixed(2)} ${yp.toFixed(2)}`);
                else pts.push(`L${xp.toFixed(2)} ${yp.toFixed(2)}`);
                if (i < n) pts.push(`L${xm.toFixed(2)} ${ym.toFixed(2)}`);
              }
              return <path d={pts.join(' ')} strokeOpacity="0.38" />;
            })()}
            {[0,30,60,90,120,150,180,210,240,270,300,330].map(deg => (
              <path key={deg}
                d="M -1.15 5.5 C -2.4 0.5 -0.65 -12.4 0 -13.2 C 0.65 -12.4 2.4 0.5 1.15 5.5"
                transform={`translate(20 20) rotate(${deg + 90})`}
                strokeOpacity="0.7"
              />
            ))}
            {[15,45,75,105,135,165,195,225,255,285,315,345].map(deg => (
              <path key={deg}
                d="M -0.72 8.2 C -1.5 4.2 -0.38 -6.8 0 -7.6 C 0.38 -6.8 1.5 4.2 0.72 8.2"
                transform={`translate(20 20) rotate(${deg + 90})`}
                strokeOpacity="0.28"
              />
            ))}
            <circle cx="20" cy="20" r="5.2" strokeOpacity="0.25" />
            {[0,60,120,180,240,300].map(deg => (
              <path key={deg}
                d="M -0.52 1.35 C -1.05 0.35 -0.28 -2.4 0 -2.7 C 0.28 -2.4 1.05 0.35 0.52 1.35"
                transform={`translate(20 20) rotate(${deg + 90})`}
                strokeOpacity="0.9"
              />
            ))}
            <circle cx="20" cy="20" r="0.65" />
          </svg>
        </div>
        <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", color: C.textDim }}>
          A portrait emerges…
        </p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "left", width: "100%", opacity: revealed ? 1 : 0, transition: "opacity 0.6s ease" }}>
      {/* Portrait text */}
      {portrait && (
        <p style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
          color: C.textBright, lineHeight: 1.7, marginBottom: "2rem",
        }}>
          {portrait}
        </p>
      )}

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, rgba(110,80,40,0.3), transparent)" }} />
        <span style={{ ...labelStyle, fontSize: "0.48rem", letterSpacing: "0.28em" }}>
          those who may share your sensibility
        </span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, rgba(110,80,40,0.3), transparent)" }} />
      </div>

      {/* Names */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {names.map((name, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ color: C.goldMid, fontSize: "0.65rem" }}>✦</span>
            <span style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic",
              fontSize: "1.15rem", color: C.goldBright, letterSpacing: "0.02em",
            }}>
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Per-step atmosphere ───────────────────────────────────────────────────── */

const STEP_ATMOSPHERES = [
  // 0 — Palette
  { bg: "rgb(242,237,228)", filter: "none", watermark: "PALETTE",  rule: "rgba(110,80,40,0.22)" },
  // 1 — Contrast
  { bg: "rgb(242,237,228)", filter: "none", watermark: "TEINTE",   rule: "rgba(110,80,40,0.22)" },
  // 2 — World
  { bg: "rgb(242,237,228)", filter: "none", watermark: "MONDE",    rule: "rgba(110,80,40,0.22)" },
  // 3 — Silhouette
  { bg: "rgb(242,237,228)", filter: "none", watermark: "FORME",    rule: "rgba(110,80,40,0.22)" },
  // 4 — Aesthetic
  { bg: "rgb(242,237,228)", filter: "none", watermark: "ESPRIT",   rule: "rgba(110,80,40,0.22)" },
  // 5 — Portrait
  { bg: "rgb(242,237,228)", filter: "none", watermark: "PORTRAIT", rule: "rgba(110,80,40,0.28)" },
];

/* ─── Main component ────────────────────────────────────────────────────────── */

const STEP_LABELS = ["palette", "complexion", "world", "form", "sensibility", "portrait"];

export default function ProfileIntake({ onComplete }: { onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [portraitReady, setPortraitReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    colors: [], contrast: "", world: "", silhouette: "", aesthetic: [],
  });

  const IS_PORTRAIT = step === 5;

  const canAdvance =
    (step === 0 && profile.colors.length > 0) ||
    (step === 1 && !!profile.contrast) ||
    (step === 2 && !!profile.world) ||
    (step === 3 && !!profile.silhouette) ||
    (step === 4 && profile.aesthetic.length > 0) ||
    (step === 5 && portraitReady);

  const advance = () => {
    if (step < STEP_LABELS.length - 1) {
      setVisible(false);
      setTimeout(() => { setStep(s => s + 1); setVisible(true); }, 280);
    } else {
      onComplete(profile);
    }
  };

  const skip = () => onComplete(profile);

  const clearSelection = () => {
    if (step === 0) setProfile(p => ({ ...p, colors: [] }));
    else if (step === 1) setProfile(p => ({ ...p, contrast: "" }));
    else if (step === 2) setProfile(p => ({ ...p, world: "" }));
    else if (step === 3) setProfile(p => ({ ...p, silhouette: "" }));
    else if (step === 4) setProfile(p => ({ ...p, aesthetic: [] }));
  };

  const goBack = () => {
    if (step === 0) return;
    setVisible(false);
    setTimeout(() => { setStep(s => s - 1); setVisible(true); }, 280);
  };

  const toggleColor = useCallback((v: string) => {
    setProfile(p => {
      if (p.colors.includes(v)) return { ...p, colors: p.colors.filter(c => c !== v) };
      if (p.colors.length >= 3) return p;
      return { ...p, colors: [...p.colors, v] };
    });
  }, []);

  const toggleAesthetic = useCallback((v: string) => {
    setProfile(p => {
      if (p.aesthetic.includes(v)) return { ...p, aesthetic: p.aesthetic.filter(a => a !== v) };
      if (p.aesthetic.length >= 2) return p;
      return { ...p, aesthetic: [...p.aesthetic, v] };
    });
  }, []);

  const atm = STEP_ATMOSPHERES[step];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center"
      onClick={clearSelection}
      style={{
        zIndex: 9998,
        background: atm.bg,
        transition: "background 0.6s ease",
      }}>

      {/* Top rule — colour shifts per step */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${atm.rule} 20%, ${atm.rule} 80%, transparent)`, transition: "background 0.6s ease" }} />

      {/* Progress bar — hidden on portrait step */}
      {!IS_PORTRAIT && (
        <div className="absolute top-7 flex items-center gap-2">
          {STEP_LABELS.slice(0, 5).map((_, i) => (
            <div key={i} style={{
              height: 2,
              width: i === step ? 28 : 8,
              borderRadius: 2,
              background: i < step
                ? "rgba(100,65,15,0.45)"
                : i === step
                ? "rgba(100,65,15,0.85)"
                : "rgba(100,65,15,0.12)",
              transition: "all 0.4s ease",
            }} />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col items-center px-8 w-full" onClick={e => e.stopPropagation()}
        style={{
          maxWidth: IS_PORTRAIT ? 560 : 480,
          paddingTop: step === 0 ? "2.25rem" : step === 2 ? "2rem" : step === 4 ? "2.5rem" : "4rem",
          paddingBottom: step === 0 ? "0.75rem" : step === 2 ? "0.75rem" : step === 4 ? "0.75rem" : "2rem",
          textAlign: IS_PORTRAIT ? "left" : "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
        }}>

        {/* Step label — hidden on portrait step */}
        {!IS_PORTRAIT && (
          <p style={{ ...labelStyle, marginBottom: step === 0 ? "0.75rem" : "1.6rem" }}>
            {STEP_LABELS[step]}
          </p>
        )}

        {step === 0 && <StepColors     profile={profile} toggle={toggleColor} />}
        {step === 1 && <StepContrast   profile={profile} setProfile={setProfile} />}
        {step === 2 && <StepWorld      profile={profile} setProfile={setProfile} />}
        {step === 3 && <StepSilhouette profile={profile} setProfile={setProfile} />}
        {step === 4 && <StepAesthetic  profile={profile} toggle={toggleAesthetic} />}
        {step === 5 && <StepPortrait   profile={profile} onReady={() => setPortraitReady(true)} />}

        {/* Continue / Skip */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", visibility: IS_PORTRAIT && !portraitReady ? "hidden" : "visible" }}>
          <button
            onClick={advance}
            disabled={!canAdvance}
            className="group relative inline-flex items-center"
            style={{
              marginTop: IS_PORTRAIT ? "2.5rem" : step === 0 ? "1rem" : step === 2 ? "0.75rem" : step === 4 ? "0.75rem" : "2.5rem",
              opacity: canAdvance ? 1 : 0.28,
              transition: IS_PORTRAIT ? "opacity 2.4s ease" : "opacity 0.5s",
            }}
          >
            <span className="absolute inset-0" style={{ border: "1px solid #1A120A", background: "#1A120A" }} />
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ border: "1px solid #2C1E0F", background: "#2C1E0F" }} />
            <span className="relative px-9 py-3" style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#F5F0E8" }}>
              {IS_PORTRAIT ? "Begin Your Curation" : "Continue"}
            </span>
          </button>

          {/* Skip — hidden on portrait step */}
          {!IS_PORTRAIT && (
            <button onClick={skip} style={{ marginTop: "1rem", fontFamily: "var(--font-jost)", fontSize: "0.52rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(26,18,10,0.4)", background: "none", border: "none", cursor: "pointer" }}>
              Skip for now
            </button>
          )}

          {/* Back — shown from step 1 onward, hidden on portrait step */}
          {step > 0 && !IS_PORTRAIT && (
            <button onClick={goBack} style={{ marginTop: "1.1rem", background: "none", border: "none", cursor: "pointer", color: "rgba(26,18,10,0.3)", fontSize: "0.9rem", lineHeight: 1, transition: "color 0.25s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(26,18,10,0.6)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(26,18,10,0.3)")}
              title="Go back"
            >
              ↩
            </button>
          )}
        </div>
      </div>

      {/* Bottom rule — colour shifts per step */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${atm.rule} 20%, ${atm.rule} 80%, transparent)`, transition: "background 0.6s ease" }} />
    </div>
  );
}
