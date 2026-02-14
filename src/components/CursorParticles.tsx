'use client';

import { useEffect, useRef, useCallback } from 'react';

/*
 * Particles: tiny red hearts ❤ and green/white pills 💊
 * They float around the canvas and get repelled by the cursor,
 * creating a smooth magnetic-repulsion effect. Sits behind all
 * UI (z-index: 1) but above the page background.
 */

interface Particle {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  size: number;
  type: 'heart' | 'pill';
  opacity: number;
  baseOpacity: number;
}

const PARTICLE_COUNT = 180;
const REPEL_RADIUS = 140;
const REPEL_STRENGTH = 4;
const FRICTION = 0.94;
const RETURN_STRENGTH = 0.012;
const MAX_SPEED = 4.5;

/**
 * Distribute particles on a grid with jitter so they are
 * evenly spaced rather than randomly clustered.
 */
function distributeOnGrid(count: number, width: number, height: number) {
  const aspect = width / height;
  const cols = Math.round(Math.sqrt(count * aspect));
  const rows = Math.ceil(count / cols);
  const cellW = width / cols;
  const cellH = height / rows;
  const points: { x: number; y: number }[] = [];

  for (let r = 0; r < rows && points.length < count; r++) {
    for (let c = 0; c < cols && points.length < count; c++) {
      // Centre of cell + random jitter up to 40% of cell size
      const jitterX = (Math.random() - 0.5) * cellW * 0.8;
      const jitterY = (Math.random() - 0.5) * cellH * 0.8;
      points.push({
        x: (c + 0.5) * cellW + jitterX,
        y: (r + 0.5) * cellH + jitterY,
      });
    }
  }
  return points;
}

export function CursorParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const dprRef = useRef(1);

  const createParticleAt = useCallback((hx: number, hy: number): Particle => {
    const type = Math.random() < 0.55 ? 'heart' : 'pill';
    return {
      x: hx,
      y: hy,
      homeX: hx,
      homeY: hy,
      vx: 0,
      vy: 0,
      size: type === 'heart' ? 5 + Math.random() * 5 : 4 + Math.random() * 4,
      type,
      opacity: 0.25 + Math.random() * 0.35,
      baseOpacity: 0.25 + Math.random() * 0.35,
    };
  }, []);

  const drawHeart = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    const s = size * 0.5;
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y - s * 0.2, x - s, y - s * 0.6, x - s, y + s * 0.05);
    ctx.bezierCurveTo(x - s, y + s * 0.7, x, y + s * 1.1, x, y + s * 1.3);
    ctx.bezierCurveTo(x, y + s * 1.1, x + s, y + s * 0.7, x + s, y + s * 0.05);
    ctx.bezierCurveTo(x + s, y - s * 0.6, x, y - s * 0.2, x, y + s * 0.3);
    ctx.closePath();
  }, []);

  const drawPill = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const w = size * 1.6;
    const h = size * 0.8;
    const r = h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5 + r, y - h * 0.5);
    ctx.lineTo(x + w * 0.5 - r, y - h * 0.5);
    ctx.arc(x + w * 0.5 - r, y, r, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.lineTo(x - w * 0.5 + r, y + h * 0.5);
    ctx.arc(x - w * 0.5 + r, y, r, Math.PI * 0.5, -Math.PI * 0.5);
    ctx.closePath();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    // Initialise particles on an even grid with jitter
    const w = window.innerWidth;
    const h = window.innerHeight;
    const gridPoints = distributeOnGrid(PARTICLE_COUNT, w, h);
    particlesRef.current = gridPoints.map((pt) => createParticleAt(pt.x, pt.y));

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', resize);

    const animate = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, width, height);

      for (const p of particlesRef.current) {
        // Repulsion from cursor
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Spring force back toward home position
        const dhx = p.homeX - p.x;
        const dhy = p.homeY - p.y;
        p.vx += dhx * RETURN_STRENGTH;
        p.vy += dhy * RETURN_STRENGTH;

        // Friction
        p.vx *= FRICTION;
        p.vy *= FRICTION;

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED;
          p.vy = (p.vy / speed) * MAX_SPEED;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Subtle opacity pulsing near cursor
        if (dist < REPEL_RADIUS * 1.5) {
          p.opacity = Math.min(p.baseOpacity + 0.25, 0.7);
        } else {
          p.opacity += (p.baseOpacity - p.opacity) * 0.05;
        }

        // Draw — no rotation so hearts & pills always face up
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = p.opacity;

        if (p.type === 'heart') {
          drawHeart(ctx, 0, 0, p.size);
          ctx.fillStyle = '#E53E3E';
          ctx.fill();
        } else {
          // Pill — left half green, right half white
          drawPill(ctx, 0, 0, p.size);
          ctx.save();
          ctx.clip();
          // Left half — green
          ctx.fillStyle = '#38A169';
          ctx.fillRect(-p.size * 1.2, -p.size, p.size * 1.2, p.size * 2);
          // Right half — white
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, -p.size, p.size * 1.2, p.size * 2);
          ctx.restore();
          // Pill outline
          drawPill(ctx, 0, 0, p.size);
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', resize);
    };
  }, [createParticleAt, drawHeart, drawPill]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="cursor-particles-canvas"
    />
  );
}
