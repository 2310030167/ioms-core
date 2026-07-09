"use client";
import React, { useEffect, useRef } from "react";

export default function AmbientCanvas() {
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const res = () => {
      cv.width = cv.parentElement?.clientWidth || window.innerWidth;
      cv.height = cv.parentElement?.clientHeight || window.innerHeight;
    };
    res();
    window.addEventListener("resize", res);
    const pArr: Array<{ x: number; y: number; r: number; sX: number; sY: number; o: number }> = [];
    for (let i = 0; i < 45; i++) {
      pArr.push({
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        r: Math.random() * 1.5 + 0.5,
        sX: (Math.random() - 0.5) * 0.2,
        sY: (Math.random() - 0.5) * 0.2,
        o: Math.random() * 0.3 + 0.1
      });
    }
    const rndr = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      pArr.forEach((p) => {
        p.x += p.sX;
        p.y += p.sY;
        if (p.x < 0 || p.x > cv.width) p.sX *= -1;
        if (p.y < 0 || p.y > cv.height) p.sY *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 51, 234, ${p.o})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#a855f7";
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(rndr);
    };
    rndr();
    return () => {
      window.removeEventListener("resize", res);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={cvRef} className="absolute inset-0 pointer-events-none z-0 opacity-40 selection:bg-transparent" />;
}