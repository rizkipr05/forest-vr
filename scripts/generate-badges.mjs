import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "public/images/badges");
fs.mkdirSync(outDir, { recursive: true });

const badges = [
  {
    file: "first-discovery.svg",
    c1: "#065f46",
    c2: "#10b981",
    ring: "#d97706",
    symbol: `<path d="M60 28 L66 54 L92 60 L66 66 L60 92 L54 66 L28 60 L54 54 Z" fill="#fef3c7"/><circle cx="60" cy="60" r="9" fill="#065f46" stroke="#fbbf24" stroke-width="3"/>`,
  },
  {
    file: "rainforest-scout.svg",
    c1: "#0c4a6e",
    c2: "#0ea5e9",
    ring: "#fbbf24",
    symbol: `<circle cx="46" cy="62" r="14" fill="none" stroke="#fef3c7" stroke-width="5"/><circle cx="74" cy="62" r="14" fill="none" stroke="#fef3c7" stroke-width="5"/><path d="M54 52 L66 52 M42 48 L50 40 M78 48 L70 40" stroke="#fde047" stroke-width="4" stroke-linecap="round"/>`,
  },
  {
    file: "amazon-guardian.svg",
    c1: "#78350f",
    c2: "#f59e0b",
    ring: "#fde68a",
    symbol: `<path d="M32 76 L38 44 L52 56 L60 36 L68 56 L82 44 L88 76 Z" fill="#fef3c7"/><rect x="34" y="78" width="52" height="8" rx="4" fill="#b45309"/>`,
  },
  {
    file: "quiz-challenger.svg",
    c1: "#4c1d95",
    c2: "#8b5cf6",
    ring: "#fbbf24",
    symbol: `<circle cx="60" cy="52" r="18" fill="#fef3c7"/><path d="M50 68 L45 92 L60 83 L75 92 L70 68" fill="#fde047"/><path d="M52 52 L58 58 L69 45" fill="none" stroke="#4c1d95" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    file: "amazon-scholar.svg",
    c1: "#831843",
    c2: "#ec4899",
    ring: "#fde047",
    symbol: `<path d="M60 34 L90 48 L60 62 L30 48 Z" fill="#fef3c7"/><path d="M42 56 L42 74 Q60 86 78 74 L78 56" fill="none" stroke="#fde047" stroke-width="4.5" stroke-linecap="round"/><line x1="86" y1="50" x2="86" y2="75" stroke="#fde047" stroke-width="3.5" stroke-linecap="round"/>`,
  },
];

for (const b of badges) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${b.c1}"/>
      <stop offset="100%" stop-color="${b.c2}"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="54" fill="url(#g)" stroke="${b.ring}" stroke-width="5"/>
  <circle cx="60" cy="60" r="45" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-dasharray="4 4" stroke-width="2"/>
  ${b.symbol}
</svg>`;
  fs.writeFileSync(path.join(outDir, b.file), svg, "utf8");
}
console.log("Generated 5 expedition medallion badges.");
