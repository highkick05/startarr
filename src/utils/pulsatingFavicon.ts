/**
 * Pulsating Neon Star Favicon Generator
 * Dynamically renders an animated glowing neon star to the browser tab icon.
 */

export function initPulsatingFavicon() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  let animationFrameId: number;
  let lastUpdate = 0;
  const targetFpsInterval = 45; // ~22 fps: silky smooth motion with virtually 0% CPU footprint

  function drawRoundedRect(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h);
    c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r);
    c.arcTo(x, y, x + r, y, r);
    c.closePath();
  }

  function drawConcaveStar(
    c: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    rotationRad = 0
  ) {
    c.save();
    c.translate(cx, cy);
    if (rotationRad !== 0) {
      c.rotate(rotationRad);
    }

    c.beginPath();
    c.moveTo(0, -radius);
    // Right point
    c.quadraticCurveTo(0, 0, radius, 0);
    // Bottom point
    c.quadraticCurveTo(0, 0, 0, radius);
    // Left point
    c.quadraticCurveTo(0, 0, -radius, 0);
    // Top point
    c.quadraticCurveTo(0, 0, 0, -radius);
    c.closePath();

    c.restore();
  }

  function render(timestamp: number) {
    animationFrameId = requestAnimationFrame(render);

    // Throttle frame rate for optimal performance
    if (timestamp - lastUpdate < targetFpsInterval) {
      return;
    }
    lastUpdate = timestamp;

    // Time cycle: 1.8 seconds per full pulse
    const cycle = (timestamp % 1800) / 1800;
    const pulseFactor = 0.5 - 0.5 * Math.cos(cycle * 2 * Math.PI); // Smooth 0 -> 1 -> 0 ease-in-out
    const starScale = 0.82 + pulseFactor * 0.32; // Scale from 0.82 to 1.14
    const glowBlur = 4 + pulseFactor * 8; // Glow intensity

    ctx!.clearRect(0, 0, size, size);

    // 1. Dark sleek squircle background badge
    drawRoundedRect(ctx!, 3, 3, size - 6, size - 6, 16);
    ctx!.fillStyle = '#06080d';
    ctx!.fill();
    ctx!.strokeStyle = `rgba(0, 243, 255, ${0.25 + pulseFactor * 0.35})`;
    ctx!.lineWidth = 2;
    ctx!.stroke();

    const center = size / 2;

    // 2. Pulsating ambient neon aura
    const auraRadius = 14 + pulseFactor * 10;
    const auraGrad = ctx!.createRadialGradient(center, center, 2, center, center, auraRadius);
    auraGrad.addColorStop(0, `rgba(0, 243, 255, ${0.65 + pulseFactor * 0.3})`);
    auraGrad.addColorStop(0.5, `rgba(236, 72, 153, ${0.3 + pulseFactor * 0.3})`);
    auraGrad.addColorStop(1, 'rgba(6, 8, 13, 0)');
    ctx!.fillStyle = auraGrad;
    ctx!.beginPath();
    ctx!.arc(center, center, auraRadius, 0, Math.PI * 2);
    ctx!.fill();

    // 3. Secondary diagonal star (Electric Pink / Violet)
    const secondaryRadius = 13 * starScale;
    ctx!.save();
    ctx!.shadowColor = '#ec4899';
    ctx!.shadowBlur = glowBlur * 0.8;
    drawConcaveStar(ctx!, center, center, secondaryRadius, Math.PI / 4);
    const pinkGrad = ctx!.createLinearGradient(center - secondaryRadius, center - secondaryRadius, center + secondaryRadius, center + secondaryRadius);
    pinkGrad.addColorStop(0, '#ffffff');
    pinkGrad.addColorStop(0.4, '#ec4899');
    pinkGrad.addColorStop(1, '#8b5cf6');
    ctx!.fillStyle = pinkGrad;
    ctx!.fill();
    ctx!.restore();

    // 4. Primary 4-point star (Neon Cyan & Electric Sky)
    const primaryRadius = 24 * starScale;
    ctx!.save();
    ctx!.shadowColor = '#00f3ff';
    ctx!.shadowBlur = glowBlur;
    drawConcaveStar(ctx!, center, center, primaryRadius, 0);
    const cyanGrad = ctx!.createLinearGradient(center - primaryRadius, center, center + primaryRadius, center);
    cyanGrad.addColorStop(0, '#00f3ff');
    cyanGrad.addColorStop(0.5, '#ffffff');
    cyanGrad.addColorStop(1, '#00f3ff');
    ctx!.fillStyle = cyanGrad;
    ctx!.fill();
    ctx!.restore();

    // 5. Intense white center core flare
    ctx!.save();
    ctx!.shadowColor = '#ffffff';
    ctx!.shadowBlur = 6 + pulseFactor * 4;
    ctx!.fillStyle = '#ffffff';
    ctx!.beginPath();
    ctx!.arc(center, center, 2.5 + pulseFactor * 1.5, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.restore();

    // Update the favicon link href
    if (link) {
      link.href = canvas.toDataURL('image/png');
    }
  }

  animationFrameId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}
