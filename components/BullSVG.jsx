import React from 'react';
import { GREEN } from './constants';

function BullSVG({ size = 180 }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <div style={{ position:'absolute', inset:'-20%', borderRadius:'50%',
        background:`radial-gradient(circle, ${GREEN}18 0%, transparent 65%)`,
        animation:'mascotPulse 3s ease-in-out infinite' }} />
      <svg viewBox="0 0 200 200" style={{ width:'100%', height:'100%', position:'relative', zIndex:1 }}>
        <defs>
          <linearGradient id="bullBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a07830"/><stop offset="100%" stopColor="#7a5a18"/>
          </linearGradient>
          <linearGradient id="bullHead" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#b08a38"/><stop offset="100%" stopColor="#8a6a20"/>
          </linearGradient>
          <filter id="bullShadow"><feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3"/></filter>
        </defs>
        <g filter="url(#bullShadow)">
          <ellipse cx="108" cy="118" rx="50" ry="36" fill="url(#bullBody)"/>
          <ellipse cx="70" cy="90" rx="28" ry="26" fill="url(#bullHead)"/>
          <path d="M50 76 Q34 50 46 36" fill="none" stroke="#f0e8d0" strokeWidth="6" strokeLinecap="round"/>
          <path d="M88 76 Q102 50 90 36" fill="none" stroke="#f0e8d0" strokeWidth="6" strokeLinecap="round"/>
          <ellipse cx="48" cy="80" rx="9" ry="6" fill="#8a6a20"/>
          <circle cx="62" cy="86" r="4.5" fill="#1a1208"/>
          <circle cx="60.5" cy="84.5" r="1.8" fill="#fff" opacity="0.9"/>
          <ellipse cx="57" cy="100" rx="3.5" ry="2.5" fill="#3d2a08"/>
          <ellipse cx="66" cy="100" rx="3.5" ry="2.5" fill="#3d2a08"/>
          <path d="M60 106 Q55 120 62 124 Q69 120 64 106" fill="#9a7a28" stroke="#7a5a18" strokeWidth="0.8"/>
          <rect x="74" y="148" width="11" height="30" rx="5" fill="#7a5a18"/>
          <rect x="93" y="148" width="11" height="30" rx="5" fill="#8a6a20"/>
          <rect x="114" y="148" width="11" height="30" rx="5" fill="#7a5a18"/>
          <rect x="133" y="148" width="11" height="30" rx="5" fill="#8a6a20"/>
          <path d="M158 112 Q174 104 170 88" fill="none" stroke="#6a4a10" strokeWidth="3.5" strokeLinecap="round"/>
        </g>
        <circle cx="164" cy="44" r="18" fill={GREEN} opacity="0.95"/>
        <text x="164" y="52" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="bold">↑</text>
      </svg>
    </div>
  );
}

export default BullSVG;
