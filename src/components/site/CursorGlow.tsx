import { useEffect, useRef } from "react";

export function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!dot || !ring || !glow) return;

    let mouseX = -1000;
    let mouseY = -1000;
    let dotX = -1000;
    let dotY = -1000;
    let ringX = -1000;
    let ringY = -1000;
    let glowX = -1000;
    let glowY = -1000;
    let raf: number;
    let visible = false;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        dotX = mouseX;
        dotY = mouseY;
        ringX = mouseX;
        ringY = mouseY;
        glowX = mouseX;
        glowY = mouseY;
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
        glow.style.opacity = "1";
      }
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      glow.style.opacity = "0";
    };

    const animate = () => {
      // Dot follows mouse tightly
      dotX += (mouseX - dotX) * 0.85;
      dotY += (mouseY - dotY) * 0.85;
      // Ring follows with slight lag
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      // Glow follows very lazily
      glowX += (mouseX - glowX) * 0.06;
      glowY += (mouseY - glowY) * 0.06;

      dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;

      raf = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Large ambient glow — very subtle, slow-following */}
      <div
        ref={glowRef}
        className="cursor-glow-ambient"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, oklch(0.82 0.15 162 / 0.055) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 9998,
          opacity: 0,
          transition: "opacity 0.4s ease",
          willChange: "transform",
        }}
      />
      {/* Ring — medium lag */}
      <div
        ref={ringRef}
        className="cursor-glow-ring"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1px solid oklch(0.82 0.15 162 / 0.35)",
          background: "transparent",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0,
          transition: "opacity 0.3s ease",
          willChange: "transform",
        }}
      />
      {/* Dot — snappy, tight follow */}
      <div
        ref={dotRef}
        className="cursor-glow-dot"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "oklch(0.82 0.15 162)",
          boxShadow: "0 0 8px 2px oklch(0.82 0.15 162 / 0.6)",
          pointerEvents: "none",
          zIndex: 10000,
          opacity: 0,
          transition: "opacity 0.2s ease",
          willChange: "transform",
        }}
      />
    </>
  );
}
