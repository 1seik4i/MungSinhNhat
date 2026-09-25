import React, { useEffect, useRef } from 'react';

export default function CanvasEffects() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let frame;
    const resize = () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width * dpr; canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#c86b79', '#d89b62', '#7ea6a1', '#d4af5e'];
    const pieces = Array.from({ length: 18 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      width: 4 + Math.random() * 5, height: 9 + Math.random() * 11,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - .5) * .36, vy: .24 + Math.random() * .42,
      angle: Math.random() * Math.PI, spin: (Math.random() - .5) * .035,
      alpha: .25 + Math.random() * .35,
    }));
    const dots = Array.from({ length: 55 }, () => ({
      x: Math.random() * width, y: Math.random() * height, radius: .7 + Math.random() * 1.3,
      alpha: .12 + Math.random() * .24, rate: .004 + Math.random() * .009,
      direction: Math.random() > .5 ? 1 : -1, color: colors[Math.floor(Math.random() * colors.length)],
    }));
    let lastTime = performance.now();
    const render = (now) => {
      const factor = Math.min((now - lastTime) / 16.67, 3); lastTime = now;
      ctx.clearRect(0, 0, width, height);
      dots.forEach((dot) => {
        dot.alpha += dot.rate * dot.direction;
        if (dot.alpha > .38 || dot.alpha < .1) dot.direction *= -1;
        ctx.beginPath(); ctx.fillStyle = dot.color; ctx.globalAlpha = dot.alpha;
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2); ctx.fill();
      });
      pieces.forEach((piece) => {
        piece.x += piece.vx * factor; piece.y += piece.vy * factor; piece.angle += piece.spin * factor;
        if (piece.y > height + 24) { piece.y = -24; piece.x = Math.random() * width; }
        if (piece.x > width + 24) piece.x = -24;
        if (piece.x < -24) piece.x = width + 24;
        ctx.save(); ctx.translate(piece.x, piece.y); ctx.rotate(piece.angle);
        ctx.globalAlpha = piece.alpha; ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height); ctx.restore();
      });
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(frame); };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, width: '100vw', height: '100vh' }} />;
}
