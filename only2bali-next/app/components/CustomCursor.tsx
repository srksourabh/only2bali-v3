"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 768px)").matches);

    const onMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    let reqId: number;

    const update = () => {
      setTrail((t) => {
        const dx = pos.x - t.x;
        const dy = pos.y - t.y;
        return {
          x: t.x + dx * 0.15,
          y: t.y + dy * 0.15,
        };
      });
      reqId = requestAnimationFrame(update);
    };

    reqId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(reqId);
  }, [pos, isMobile]);

  if (isMobile) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: "12px",
          height: "12px",
          backgroundColor: "var(--saffron)",
          borderRadius: "50%",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 99999,
          boxShadow: "0 0 4px rgba(232, 148, 26, 0.4)"
        }}
      />
      <div
        style={{
          position: "fixed",
          left: trail.x,
          top: trail.y,
          width: "28px",
          height: "28px",
          border: "2.5px solid var(--emerald)",
          backgroundColor: "rgba(14, 79, 68, 0.08)",
          borderRadius: "50%",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 99998,
          boxShadow: "0 0 10px rgba(14, 79, 68, 0.2)",
          transition: "transform 0.08s ease-out"
        }}
      />
    </>
  );
}
