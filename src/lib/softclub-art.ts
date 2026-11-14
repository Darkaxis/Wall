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

export const SOFTCLUB_SAMPLE_PHOTOS = {
  naritaLounge: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#DCECE9"/>
          <stop offset="48%" stop-color="#9AC0C9"/>
          <stop offset="100%" stop-color="#4A7A8C"/>
        </linearGradient>
        <radialGradient id="orb" cx="72%" cy="38%" r="42%">
          <stop offset="0%" stop-color="#FFF7EB" stop-opacity="0.95"/>
          <stop offset="45%" stop-color="#E79B74" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#9AC0C9" stop-opacity="0"/>
        </radialGradient>
        <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.2" fill="#FFFFFF" fill-opacity="0.45"/>
        </pattern>
      </defs>
      <rect width="800" height="440" fill="url(#sky)"/>
      <rect width="800" height="440" fill="url(#orb)"/>
      <rect width="800" height="440" fill="url(#dots)"/>
      <!-- Architectural horizon lines (Airport Transit Lounge) -->
      <g stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="1.5" fill="none">
        <line x1="0" y1="290" x2="800" y2="290"/>
        <line x1="0" y1="335" x2="800" y2="335"/>
        <line x1="160" y1="0" x2="90" y2="440"/>
        <line x1="380" y1="0" x2="350" y2="440"/>
        <line x1="600" y1="0" x2="640" y2="440"/>
        <circle cx="576" cy="168" r="88"/>
        <circle cx="576" cy="168" r="124" stroke-dasharray="6 6"/>
      </g>
      <!-- Frosted glass telemetry card inside photo -->
      <rect x="44" y="44" width="260" height="86" rx="16" fill="#FFFFFF" fill-opacity="0.28" stroke="#FFFFFF" stroke-opacity="0.7"/>
      <text x="64" y="76" font-family="monospace" font-size="13" fill="#1B2A2E" font-weight="bold" letter-spacing="3">NRT // TRANSIT_LOUNGE_02</text>
      <text x="64" y="98" font-family="monospace" font-size="11" fill="#1B2A2E" letter-spacing="1.5">35.7720° N, 140.3929° E</text>
      <text x="64" y="116" font-family="monospace" font-size="10" fill="#2A474F" letter-spacing="2">AMBIENT TEMP: 21.4°C // CLEAR</text>
      <!-- Soft motion silhouettes -->
      <ellipse cx="260" cy="300" rx="54" ry="12" fill="#1B2A2E" fill-opacity="0.18"/>
      <ellipse cx="470" cy="312" rx="72" ry="14" fill="#1B2A2E" fill-opacity="0.15"/>
      <rect x="44" y="372" width="160" height="28" rx="14" fill="#DF6D3B" fill-opacity="0.9"/>
      <text x="64" y="390" font-family="monospace" font-size="11" fill="#FFFFFF" letter-spacing="2">REC // 1999.11.14</text>
    </svg>
  `),
  minidiscSession: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440">
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#EBF3EE"/>
          <stop offset="50%" stop-color="#B9D6C5"/>
          <stop offset="100%" stop-color="#6B9683"/>
        </linearGradient>
        <pattern id="grid2" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#FFFFFF" stroke-width="0.75" stroke-opacity="0.45"/>
        </pattern>
      </defs>
      <rect width="800" height="440" fill="url(#bg2)"/>
      <rect width="800" height="440" fill="url(#grid2)"/>
      <!-- Translucent MiniDisc shell -->
      <rect x="240" y="50" width="320" height="320" rx="34" fill="#FFFFFF" fill-opacity="0.38" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="400" cy="210" r="118" fill="#DCECE8" fill-opacity="0.75" stroke="#FFFFFF" stroke-width="3"/>
      <circle cx="400" cy="210" r="82" fill="none" stroke="#528899" stroke-width="1.5" stroke-dasharray="8 4"/>
      <circle cx="400" cy="210" r="34" fill="#DF6D3B" fill-opacity="0.85" stroke="#FFFFFF" stroke-width="3"/>
      <rect x="266" y="76" width="120" height="26" rx="6" fill="#1B2A2E" fill-opacity="0.75"/>
      <text x="278" y="93" font-family="monospace" font-size="11" fill="#EBF3EE" letter-spacing="2">SONY // MD-80</text>
      <text x="48" y="404" font-family="monospace" font-size="12" fill="#1B2A2E" letter-spacing="3">CHILLOUT_COMPILATION_VOL.04 // 118 BPM</text>
    </svg>
  `),
};

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
