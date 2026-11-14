// Authentic Y2K Gen-X Soft Club (c. 1998-2003) procedural SVG art & avatar presets

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export interface AvatarPreset {
  id: string;
  label: string;
  url: string;
}

export const SOFTCLUB_AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "aero-orb",
    label: "Aero",
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#D7ECE8"/>
            <stop offset="50%" stop-color="#86B7C2"/>
            <stop offset="100%" stop-color="#3C7080"/>
          </linearGradient>
          <radialGradient id="shine" cx="35%" cy="30%" r="55%">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"/>
            <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="160" fill="url(#g1)"/>
        <circle cx="80" cy="80" r="52" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.7" stroke-dasharray="4 3"/>
        <circle cx="80" cy="80" r="36" fill="#E8F4F1" fill-opacity="0.35"/>
        <ellipse cx="80" cy="80" rx="58" ry="22" transform="rotate(-24 80 80)" fill="none" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="80" cy="80" r="64" fill="url(#shine)"/>
      </svg>
    `),
  },
  {
    id: "transit-signal",
    label: "Signal",
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#E4EFEA"/>
            <stop offset="55%" stop-color="#9BBFA8"/>
            <stop offset="100%" stop-color="#537A65"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" fill="url(#g2)"/>
        <g stroke="#FFFFFF" stroke-opacity="0.65" stroke-width="1.5" fill="none">
          <line x1="20" y1="40" x2="140" y2="40"/>
          <line x1="20" y1="120" x2="140" y2="120"/>
          <circle cx="80" cy="80" r="32"/>
        </g>
        <circle cx="80" cy="80" r="14" fill="#DF6D3B"/>
        <path d="M55 80 H105 M80 55 V105" stroke="#FFFFFF" stroke-width="2"/>
      </svg>
    `),
  },
  {
    id: "minidisc-amber",
    label: "Disc",
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#F6E9DF"/>
            <stop offset="50%" stop-color="#E8B496"/>
            <stop offset="100%" stop-color="#DF6D3B"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" fill="url(#g3)"/>
        <rect x="26" y="26" width="108" height="108" rx="18" fill="#FFFFFF" fill-opacity="0.28" stroke="#FFFFFF" stroke-width="1.5"/>
        <circle cx="80" cy="80" r="38" fill="#EFF4F3" fill-opacity="0.7" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="80" cy="80" r="12" fill="#528899"/>
      </svg>
    `),
  },
  {
    id: "flora-celadon",
    label: "Flora",
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="g4" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stop-color="#2D535E"/>
            <stop offset="55%" stop-color="#6B9FA8"/>
            <stop offset="100%" stop-color="#D8EFEA"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" fill="url(#g4)"/>
        <g fill="#FFFFFF" fill-opacity="0.45">
          <ellipse cx="80" cy="52" rx="14" ry="26"/>
          <ellipse cx="80" cy="108" rx="14" ry="26"/>
          <ellipse cx="52" cy="80" rx="26" ry="14"/>
          <ellipse cx="108" cy="80" rx="26" ry="14"/>
        </g>
        <circle cx="80" cy="80" r="12" fill="#E6F5D0"/>
      </svg>
    `),
  },
  {
    id: "lounge-wave",
    label: "Wave",
    url: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <rect width="160" height="160" fill="#DDEBE8"/>
        <path d="M0 95 Q40 60 80 95 T160 95 L160 160 L0 160 Z" fill="#7BA8B5" fill-opacity="0.65"/>
        <path d="M0 112 Q40 82 80 112 T160 112 L160 160 L0 160 Z" fill="#467685" fill-opacity="0.8"/>
        <circle cx="112" cy="48" r="20" fill="#DF6D3B" fill-opacity="0.85"/>
      </svg>
    `),
  },
];

export type PhotoFilterId = "none" | "aero-mist" | "halftone-99" | "warm-lounge";

export const PHOTO_FILTERS: {
  id: PhotoFilterId;
  label: string;
  cssClass: string;
}[] = [
  { id: "none", label: "Original", cssClass: "" },
  {
    id: "aero-mist",
    label: "Aero Cyan",
    cssClass: "saturate-[0.85] contrast-[0.95] brightness-[1.04] hue-rotate-[-8deg]",
  },
  {
    id: "halftone-99",
    label: "Soft 99",
    cssClass: "sepia-[0.18] saturate-[0.9] contrast-[0.92] brightness-[1.05]",
  },
  {
    id: "warm-lounge",
    label: "Warm Lounge",
    cssClass: "sepia-[0.28] saturate-[1.15] contrast-[0.96] brightness-[1.02]",
  },
];
