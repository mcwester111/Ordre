"use client";

// Shared footer — hairline rule, three-column layout, faint warm-brown tone.
// Centre: the Gothic rose window medallion from the curator page, printed tiny
// like a colophon mark.

const LINK: React.CSSProperties = {
  fontFamily: "var(--font-jost)",
  fontSize: "0.48rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(55,38,12,0.72)",
  textDecoration: "none",
  cursor: "pointer",
};

export default function Footer() {
  return (
    <footer style={{ width: "100%", marginTop: "auto" }}>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        paddingLeft: "2rem",
        paddingRight: "2rem",
        paddingBottom: "1.75rem",
        gap: "1rem",
      }}>

        {/* Left — legal */}
        <nav style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
          <a href="/privacy"  style={LINK}>Privacy Policy</a>
          <a href="/terms"    style={LINK}>Terms of Service</a>
          <button
            onClick={() => window.dispatchEvent(new Event("ordre:cookie-preferences"))}
            style={{ ...LINK, background: "none", border: "none", padding: 0 }}
          >
            Cookie Preferences
          </button>
        </nav>

        {/* Centre — empty */}
        <div />

        {/* Right — social + contact */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "1.75rem" }}>
          <a
            href="https://instagram.com/ordre.style"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...LINK, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
            aria-label="Ordre on Instagram"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ flexShrink: 0, display: "block" }}
            >
              <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.6" y1="6.4" x2="17.61" y2="6.4" />
            </svg>
            Instagram
          </a>
          <a
            href="mailto:contact@ordre.style"
            style={LINK}
          >
            Contact
          </a>
        </nav>

      </div>
    </footer>
  );
}
