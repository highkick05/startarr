/**
 * High-Definition Vector Fallback Icon Generator
 * Generates ultra-crisp, modern app monograms and vector badges.
 * Never uses blurry 16px raster globes or pixelated favicons.
 */

// Modern vibrant gradient palettes tailored for dark homelab / dashboard themes
const PALETTES = [
  { start: '#0284c7', end: '#0369a1', text: '#ffffff', glow: '#38bdf8' }, // Sky Blue
  { start: '#6366f1', end: '#4f46e5', text: '#ffffff', glow: '#818cf8' }, // Indigo
  { start: '#8b5cf6', end: '#7c3aed', text: '#ffffff', glow: '#a78bfa' }, // Violet
  { start: '#d946ef', end: '#c026d3', text: '#ffffff', glow: '#f0abfc' }, // Fuchsia
  { start: '#059669', end: '#047857', text: '#ffffff', glow: '#34d399' }, // Emerald
  { start: '#0d9488', end: '#0f766e', text: '#ffffff', glow: '#2dd4bf' }, // Teal
  { start: '#ea580c', end: '#c2410c', text: '#ffffff', glow: '#fb923c' }, // Orange / Coral
  { start: '#e11d48', end: '#be123c', text: '#ffffff', glow: '#fb7185' }, // Rose
  { start: '#2563eb', end: '#1d4ed8', text: '#ffffff', glow: '#60a5fa' }, // Royal Blue
  { start: '#0891b2', end: '#0e7490', text: '#ffffff', glow: '#22d3ee' }, // Cyan
];

function getPalette(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % PALETTES.length;
  return PALETTES[idx];
}

export function getInitials(title: string, url = ''): string {
  const cleanTitle = (title || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '');

  if (cleanTitle && cleanTitle.toLowerCase() !== 'unknown' && cleanTitle.toLowerCase() !== 'error') {
    // Split by spaces, dashes, dots, underscores
    const words = cleanTitle.split(/[\s\-_.]+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (cleanTitle.length >= 2) {
      return cleanTitle.slice(0, 2).toUpperCase();
    }
    return cleanTitle.toUpperCase();
  }

  if (url) {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      const hostPart = u.hostname.replace(/^www\./i, '').split('.')[0];
      if (hostPart.length >= 2) {
        return hostPart.slice(0, 2).toUpperCase();
      }
      return hostPart.toUpperCase() || 'AP';
    } catch {
      // ignore
    }
  }

  return 'AP';
}

/**
 * Generate a 128x128 ultra-crisp SVG Data URI Monogram badge.
 */
export function getHighResFallbackIcon(title: string, url = ''): string {
  const initials = getInitials(title, url);
  const seed = (title || '') + (url || '');
  const palette = getPalette(seed || 'startarr');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.start}" />
      <stop offset="100%" stop-color="${palette.end}" />
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28" />
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0.03" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
    <filter id="f" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3" />
    </filter>
  </defs>
  <!-- Background Squircle with subtle depth stroke -->
  <rect x="5" y="5" width="118" height="118" rx="30" fill="url(#g)" stroke="rgba(255,255,255,0.22)" stroke-width="2" />
  <!-- Gloss highlight -->
  <rect x="6" y="6" width="116" height="58" rx="28" fill="url(#shine)" />
  <!-- Crisp high-contrast lettermark -->
  <text x="64" y="69" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
        font-size="${initials.length > 2 ? '38' : '46'}" 
        font-weight="800" 
        letter-spacing="-0.5" 
        fill="${palette.text}" 
        text-anchor="middle" 
        dominant-baseline="central"
        filter="url(#f)">${initials}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Modern ultra-sharp 128x128 Vector Neon Globe (for users wanting a sleek 4K web globe icon).
 */
export function getModernGlobeIcon(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <radialGradient id="globe-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <linearGradient id="globe-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <filter id="globe-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#00f3ff" flood-opacity="0.4" />
    </filter>
  </defs>
  <!-- Sleek dark squircle -->
  <rect x="5" y="5" width="118" height="118" rx="30" fill="url(#globe-bg)" stroke="#0ea5e9" stroke-opacity="0.35" stroke-width="2" />
  <!-- Globe Outer Sphere -->
  <g filter="url(#globe-glow)">
    <circle cx="64" cy="64" r="42" fill="none" stroke="url(#globe-cyan)" stroke-width="3" />
    <!-- Equator and parallels -->
    <ellipse cx="64" cy="64" rx="42" ry="18" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-opacity="0.8" />
    <line x1="22" y1="64" x2="106" y2="64" stroke="#38bdf8" stroke-width="2.5" stroke-opacity="0.8" />
    <!-- Prime meridian & longitudinal lines -->
    <ellipse cx="64" cy="64" rx="20" ry="42" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-opacity="0.8" />
    <line x1="64" y1="22" x2="64" y2="106" stroke="#38bdf8" stroke-width="2.5" stroke-opacity="0.8" />
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
