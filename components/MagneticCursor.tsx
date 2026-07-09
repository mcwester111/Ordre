"use client";
import { useEffect, useRef } from "react";

export default function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    let mouseX = -200, mouseY = -200;
    let curX = -200, curY = -200;
    let raf: number;
    let hidden = false;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (hidden) {
        hidden = false;
        if (dot) dot.style.opacity = "1";
      }
    };

    const onLeave = () => {
      hidden = true;
      if (dot) dot.style.opacity = "0";
    };

    const tick = () => {
      // Find magnetic target if any
      let targetX = mouseX;
      let targetY = mouseY;

      const magEl = document.querySelector<HTMLElement>("[data-magnetic]");
      if (magEl) {
        const rect = magEl.getBoundingClientRect();
        const inBounds =
          mouseX >= rect.left && mouseX <= rect.right &&
          mouseY >= rect.top  && mouseY <= rect.bottom;

        if (inBounds) {
          const cx = rect.left + rect.width  / 2;
          const cy = rect.top  + rect.height / 2;
          // Gentle 10% pull toward center — almost imperceptible
          targetX = mouseX + (cx - mouseX) * 0.10;
          targetY = mouseY + (cy - mouseY) * 0.10;
        }
      }

      // Smooth follow with tight lerp so it stays precise
      curX += (targetX - curX) * 0.22;
      curY += (targetY - curY) * 0.22;

      if (dot) {
        dot.style.transform = `translate(${curX}px, ${curY}px)`;
      }

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      style={{
        position: "fixed",
        top:  "-2px",
        left: "-2px",
        width:  "4px",
        height: "4px",
        borderRadius: "50%",
        background: "rgba(26, 18, 10, 0.75)",
        pointerEvents: "none",
        zIndex: 999999,
        willChange: "transform",
        transition: "opacity 0.2s ease",
      }}
    />
  );
}
