export const DEFAULT_GLOBE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="globe-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="40%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="globe-shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.2" />
    </filter>
  </defs>
  <rect x="8" y="8" width="112" height="112" rx="28" fill="url(#globe-bg)" filter="url(#shadow)" />
  <rect x="9" y="9" width="110" height="52" rx="26" fill="url(#globe-shine)" />
  <g transform="translate(28, 28)" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <circle cx="36" cy="36" r="32" />
    <ellipse cx="36" cy="36" rx="16" ry="32" />
    <line x1="36" y1="4" x2="36" y2="68" />
    <line x1="4" y1="36" x2="68" y2="36" />
    <path d="M 8.3 20 Q 36 28 63.7 20" />
    <path d="M 8.3 52 Q 36 44 63.7 52" />
  </g>
</svg>`;

export const DEFAULT_GLOBE_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(DEFAULT_GLOBE_SVG)}`;
