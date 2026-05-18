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
          <a href="/cookie-preferences" style={LINK}>Cookie Preferences</a>
        </nav>

        {/* Centre — empty */}
        <div />

        {/* Right — social + contact */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "1.75rem" }}>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            style={LINK}
          >
            Instagram
          </a>
          <a
            href="mailto:madeleineclaire.editorial@gmail.com"
            style={LINK}
          >
            Contact
          </a>
        </nav>

      </div>
    </footer>
  );
}
