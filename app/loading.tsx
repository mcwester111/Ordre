// Route-level loading state, shown during navigation/streaming. A quiet
// parchment hold with the wordmark breathing, in keeping with the splash.

export default function Loading() {
  return (
    <main className="relative min-h-screen flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/webfont3e.png"
        alt="Ordre"
        style={{
          width: "180px",
          height: "auto",
          animation: "ordre-breathe 2.2s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes ordre-breathe {
          0%, 100% { opacity: 0.25; }
          50%      { opacity: 0.75; }
        }
      `}</style>
    </main>
  );
}
