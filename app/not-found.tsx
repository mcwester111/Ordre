import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center text-center"
      style={{ padding: "2rem" }}
    >
      <Image
        src="/swan-logo.png"
        alt="Ordre"
        width={88}
        height={64}
        style={{ objectFit: "contain", width: "88px", height: "auto", opacity: 0.9 }}
      />

      <p
        style={{
          fontFamily: "var(--font-jost)",
          fontSize: "0.5rem",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "rgba(100,65,15,0.7)",
          marginTop: "2.5rem",
        }}
      >
        Error 404
      </p>

      <h1
        style={{
          fontFamily: "var(--font-cormorant)",
          fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
          fontWeight: 400,
          fontStyle: "italic",
          color: "#1A120A",
          letterSpacing: "0.02em",
          lineHeight: 1.3,
          margin: "1rem 0 0",
          maxWidth: "30ch",
        }}
      >
        This page has slipped out of the collection.
      </h1>

      <p
        style={{
          fontFamily: "var(--font-jost)",
          fontSize: "0.8rem",
          lineHeight: 1.9,
          color: "rgba(26,18,10,0.6)",
          marginTop: "1.2rem",
          maxWidth: "38ch",
        }}
      >
        The page you were looking for could not be found.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "2.5rem",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-jost)",
            fontSize: "0.55rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(26,18,10,0.85)",
            textDecoration: "none",
            borderBottom: "1px solid rgba(26,18,10,0.4)",
            paddingBottom: "2px",
          }}
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
