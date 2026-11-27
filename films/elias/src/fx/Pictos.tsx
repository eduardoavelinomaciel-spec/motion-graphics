import React from "react";
// Mini-quadros pictográficos (SVG 200×160) usados dentro dos balões de HQ.
const INK = "#10141f";
const Star: React.FC<{ x: number; y: number; r?: number; c?: string }> = ({ x, y, r = 10, c = "#FFD23F" }) => (
  <path d={`M${x} ${y - r} l${r * 0.3} ${r * 0.7} ${r * 0.8} ${r * 0.1} -${r * 0.6} ${r * 0.5} ${r * 0.2} ${r * 0.8} -${r * 0.7} -${r * 0.45} -${r * 0.7} ${r * 0.45} ${r * 0.2} -${r * 0.8} -${r * 0.6} -${r * 0.5} ${r * 0.8} -${r * 0.1}z`} fill={c} stroke={INK} strokeWidth="3" />
);
const Heart: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 1, c = "#F7B2AD" }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 12 C-26 -8 -12 -26 0 -12 C12 -26 26 -8 0 12z" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
);
const Frame: React.FC<{ bg: string; children: React.ReactNode }> = ({ bg, children }) => (
  <svg viewBox="0 0 200 160" width="100%" height="100%"><rect width="200" height="160" fill={bg} />{children}</svg>
);
const Balloon: React.FC<{ x: number; y: number; r?: number; c?: string }> = ({ x, y, r = 22, c = "#E5483B" }) => (
  <g>
    <path d={`M${x} ${y + r * 1.3} q-6 18 4 36`} stroke={INK} strokeWidth="3" fill="none" />
    <ellipse cx={x} cy={y} rx={r} ry={r * 1.2} fill={c} stroke={INK} strokeWidth="5" />
    <ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.18} ry={r * 0.3} fill="#fff" opacity="0.7" />
  </g>
);

// balão volta pra casa
export const PicHouse: React.FC = () => (
  <Frame bg="#BFD7EA">
    <rect x="95" y="70" width="90" height="70" fill="#F3E0C0" stroke={INK} strokeWidth="5" />
    <path d="M85 74 L140 32 L195 74z" fill="#D1584A" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <rect x="125" y="95" width="30" height="45" fill="#8A6347" stroke={INK} strokeWidth="4" />
    <rect x="105" y="82" width="20" height="18" fill="#FFE9B0" stroke={INK} strokeWidth="4" />
    <Balloon x={50} y={60} />
    <path d="M70 40 q18 -18 36 -2" stroke={INK} strokeWidth="4" fill="none" strokeDasharray="6 6" />
    <path d="M101 34 l10 0 l-6 9z" fill={INK} />
  </Frame>
);
export const PicHand: React.FC = () => (
  <Frame bg="#FFE9B0">
    <circle cx="100" cy="115" r="22" fill="#EBC09A" stroke={INK} strokeWidth="5" />
    <path d="M100 95 v-60" stroke={INK} strokeWidth="5" />
    <Balloon x={100} y={38} />
    <Heart x={150} y={46} s={0.9} />
    <Star x={42} y={40} r={12} />
    <Star x={160} y={110} r={10} />
  </Frame>
);
// esposa sorrindo (lembrança) e senhor orgulhoso
export const PicWife: React.FC = () => (
  <Frame bg="#F7D9D3">
    <circle cx="100" cy="82" r="38" fill="#F1CDAA" stroke={INK} strokeWidth="5" />
    <path d="M62 78 q4 -44 38 -40 q36 -2 38 40 q-14 -26 -38 -22 q-26 -2 -38 22z" fill="#C8B89A" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M82 98 q18 16 36 0" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
    <circle cx="86" cy="82" r="4" fill={INK} /><circle cx="114" cy="82" r="4" fill={INK} />
    <Heart x={160} y={36} s={1} /><Heart x={36} y={50} s={0.7} />
    <circle cx="140" cy="56" r="9" fill="#F7B2AD" stroke={INK} strokeWidth="3" />
  </Frame>
);
export const PicProud: React.FC = () => (
  <Frame bg="#E3EFE6">
    <circle cx="100" cy="66" r="24" fill="#E2A57A" stroke={INK} strokeWidth="5" />
    <path d="M70 140 q0 -50 30 -50 q30 0 30 50z" fill="#6B8F6A" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M90 76 q10 10 20 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
    <Star x={100} y={112} r={13} />
    <Star x={46} y={46} r={11} /><Star x={156} y={52} r={11} c="#F7B2AD" />
    <path d="M24 134 q30 -24 60 0 M116 134 q30 -24 60 0" stroke={INK} strokeWidth="4" fill="none" />
  </Frame>
);
// "não sei o que você sente..." : interrogação + mãos dadas com coração
export const PicQuestion: React.FC = () => (
  <Frame bg="#E8E3F2">
    <text x="100" y="118" textAnchor="middle" fontSize="130" fontWeight="900" fill="#6A4C93" stroke={INK} strokeWidth="5" paintOrder="stroke" fontFamily="Bangers, Impact, sans-serif">?</text>
    <Star x={36} y={38} r={9} /><Star x={170} y={44} r={9} c="#7AE7C7" />
  </Frame>
);
export const PicHands: React.FC = () => (
  <Frame bg="#F7D9D3">
    <rect x="22" y="76" width="82" height="30" rx="15" fill="#EBC09A" stroke={INK} strokeWidth="5" />
    <rect x="96" y="76" width="82" height="30" rx="15" fill="#CDB591" stroke={INK} strokeWidth="5" />
    <Heart x={100} y={44} s={1.5} />
    <Star x={40} y={130} r={10} /><Star x={166} y={128} r={10} c="#7AE7C7" />
  </Frame>
);
