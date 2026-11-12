'use client';

import { useEffect, useRef } from 'react';

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; baseAlpha: number }[] = [];
    let blobs: { x: number; y: number; vx: number; vy: number; radius: number; color: string }[] = [];
    
    const mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 15000); // Density
      
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.5 + 0.1,
          baseAlpha: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const initBlobs = () => {
      blobs = [
        { x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0.2, vy: 0.1, radius: 400, color: 'rgba(110, 231, 255, 0.05)' }, // Cyan
        { x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: -0.1, vy: 0.2, radius: 500, color: 'rgba(167, 139, 250, 0.05)' }, // Violet
      ];
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Blobs (Gradients)
      blobs.forEach(blob => {
        blob.x += blob.vx;
        blob.y += blob.vy;
        
        if (blob.x < -blob.radius) blob.x = canvas.width + blob.radius;
        if (blob.x > canvas.width + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = canvas.height + blob.radius;
        if (blob.y > canvas.height + blob.radius) blob.y = -blob.radius;

        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Grid
      ctx.strokeStyle = 'rgba(110, 231, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Particles
      ctx.fillStyle = '#6EE7FF';
      
      particles.forEach((p) => {
        // Movement
        p.x += p.vx;
        p.y += p.vy;

        // Mouse Interaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const interactRadius = 150;

        if (dist < interactRadius) {
          const force = (interactRadius - dist) / interactRadius;
          const angle = Math.atan2(dy, dx);
          p.x -= Math.cos(angle) * force * 2;
          p.y -= Math.sin(angle) * force * 2;
          p.alpha = Math.min(1, p.baseAlpha + force); // Brighten near mouse
        } else {
          p.alpha = p.baseAlpha;
        }

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', () => {
      resize();
      initParticles();
      initBlobs();
    });
    
    window.addEventListener('mousemove', handleMouseMove);

    resize();
    initParticles();
    initBlobs();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1] bg-primary-bg pointer-events-none"
    />
  );
}
