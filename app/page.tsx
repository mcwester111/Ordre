import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-obsidian overflow-hidden flex flex-col items-center justify-center">
      {/* Noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />

      {/* Radial vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(8,7,5,0.7) 100%)",
        }}
      />

      {/* Horizontal gold rules */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(201,168,76,0.3) 20%, rgba(201,168,76,0.3) 80%, transparent)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(201,168,76,0.3) 20%, rgba(201,168,76,0.3) 80%, transparent)",
        }}
      />

      {/* Vertical gold rules */}
      <div
        className="absolute top-0 bottom-0 left-0 w-px"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(201,168,76,0.2) 20%, rgba(201,168,76,0.2) 80%, transparent)",
        }}
      />
      <div
        className="absolute top-0 bottom-0 right-0 w-px"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(201,168,76,0.2) 20%, rgba(201,168,76,0.2) 80%, transparent)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
        {/* Eyebrow */}
        <p
          className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-gold-dim mb-8 animate-fade-in"
          style={{ animationDelay: "0.1s", opacity: 0 }}
        >
          Fashion Intelligence &nbsp;✦&nbsp; Est. 2026
        </p>

        {/* Top ornament */}
        <div
          className="flex items-center gap-3 mb-6 w-64 animate-fade-in"
          style={{ animationDelay: "0.2s", opacity: 0 }}
        >
          <div
            className="flex-1 h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(201,168,76,0.5))",
            }}
          />
          <span className="text-gold text-xs">✦</span>
          <div
            className="flex-1 h-px"
            style={{
              background:
                "linear-gradient(to left, transparent, rgba(201,168,76,0.5))",
            }}
          />
        </div>

        {/* Logotype */}
        <h1
          className="font-serif text-display-xl text-cream leading-none tracking-tight animate-fade-in"
          style={{ animationDelay: "0.3s", opacity: 0 }}
        >
          Ordre.
        </h1>

        {/* Bottom ornament */}
        <div
          className="flex items-center gap-3 mt-6 mb-10 w-64 animate-fade-in"
          style={{ animationDelay: "0.4s", opacity: 0 }}
        >
          <div
            className="flex-1 h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(201,168,76,0.5))",
            }}
          />
          <span className="text-gold text-xs">✦</span>
          <div
            className="flex-1 h-px"
            style={{
              background:
                "linear-gradient(to left, transparent, rgba(201,168,76,0.5))",
            }}
          />
        </div>

        {/* Tagline */}
        <p
          className="font-serif italic text-display-md text-cream-dim mb-6 animate-fade-in"
          style={{ animationDelay: "0.5s", opacity: 0 }}
        >
          Your aesthetic, articulated.
        </p>

        {/* Description */}
        <p
          className="font-sans font-light text-sm tracking-wide text-cream-muted max-w-sm mb-14 leading-relaxed animate-fade-in"
          style={{ animationDelay: "0.65s", opacity: 0 }}
        >
          Share images. Describe your vision. Receive precise guidance
          on the style language that is uniquely yours.
        </p>

        {/* CTA */}
        <Link
          href="/curator"
          className="group relative inline-flex items-center gap-3 animate-fade-in"
          style={{ animationDelay: "0.8s", opacity: 0 }}
        >
          {/* Button border */}
          <span
            className="absolute inset-0 border border-gold-dim transition-all duration-500 group-hover:border-gold"
            style={{
              boxShadow: "0 0 0 0 rgba(201,168,76,0)",
            }}
          />
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              boxShadow: "0 0 30px rgba(201,168,76,0.08), inset 0 0 30px rgba(201,168,76,0.04)",
            }}
          />

          <span className="relative px-10 py-4 font-sans text-xs tracking-[0.3em] uppercase text-gold transition-colors duration-300 group-hover:text-gold-light">
            Begin Your Curation
          </span>
          <span className="relative pr-8 font-sans text-xs text-gold-dim transition-all duration-300 group-hover:text-gold group-hover:translate-x-1">
            →
          </span>
        </Link>

        {/* Fine print */}
        <p
          className="mt-16 font-sans text-[0.6rem] tracking-[0.25em] uppercase text-cream-muted opacity-40 animate-fade-in"
          style={{ animationDelay: "1s", opacity: 0 }}
        >
          Powered by Claude AI
        </p>
      </div>
    </main>
  );
}
