"use client";

// Glowing orb that orbits the O letter.
// Mounted as a child of the O span (position:relative, display:inline-block),
// so 50%/50% == centre of the O.
export default function OrbSwirl() {
  return (
    <>
      <style>{`
        @keyframes orb-orbit {
          from { transform: rotate(0deg)   translateX(var(--orb-r)) rotate(0deg);   }
          to   { transform: rotate(360deg) translateX(var(--orb-r)) rotate(-360deg); }
        }
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%       { transform: scale(0.6); opacity: 0.6; }
        }
      `}</style>

      {/* Pivot sits at exact centre of the O span */}
      <span
        className="pointer-events-none"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          display: "block",
          width: 0,
          height: 0,
          zIndex: 12,
          /* orbit radius ≈ 47% of the Zyntro font-size so it hugs the O */
          ["--orb-r" as string]: "calc(clamp(5rem, 16vw, 14rem) * 0.47)",
        }}
      >
        {/* Rotating arm */}
        <span
          style={{
            display: "block",
            width: 0,
            height: 0,
            animation: "orb-orbit 7s linear infinite",
          }}
        >
          {/* Orb centred on the arm tip */}
          <span style={{ display: "block", transform: "translate(-50%, -50%)", position: "relative" }}>
            {/* Soft outer halo */}
            <span style={{
              display: "block",
              position: "absolute",
              width: 22,
              height: 22,
              borderRadius: "50%",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(201,168,76,0.28) 0%, transparent 70%)",
              animation: "orb-pulse 2.8s ease-in-out infinite",
            }} />
            {/* Inner glow */}
            <span style={{
              display: "block",
              position: "absolute",
              width: 11,
              height: 11,
              borderRadius: "50%",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(240,210,130,0.7) 0%, transparent 70%)",
              animation: "orb-pulse 2.8s ease-in-out infinite",
            }} />
            {/* Core */}
            <span style={{
              display: "block",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #ffffff 0%, #e8d080 55%, #c9a84c 100%)",
              boxShadow: "0 0 5px 2px rgba(201,168,76,0.9), 0 0 12px 4px rgba(201,168,76,0.4)",
              animation: "orb-pulse 2.8s ease-in-out infinite",
            }} />
          </span>
        </span>
      </span>
    </>
  );
}
