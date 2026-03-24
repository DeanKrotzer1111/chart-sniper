import React from 'react';
import { RED } from './constants';

function BearSVG({ size = 180 }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <div style={{ position:'absolute', inset:'-20%', borderRadius:'50%',
        background:`radial-gradient(circle, ${RED}18 0%, transparent 65%)`,
        animation:'mascotPulse 3s ease-in-out infinite' }} />
      <svg viewBox="0 0 200 200" style={{ width:'100%', height:'100%', position:'relative', zIndex:1 }}>
        <defs>
          <linearGradient id="bearBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#353535"/><stop offset="100%" stopColor="#1e1e1e"/>
          </linearGradient>
          <filter id="bearShadow"><feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.3"/></filter>
        </defs>
        <g filter="url(#bearShadow)">
          <ellipse cx="100" cy="122" rx="52" ry="42" fill="url(#bearBody)"/>
          <circle cx="100" cy="70" r="34" fill="#2e2e2e" stroke="#222" strokeWidth="1"/>
          <circle cx="72" cy="44" r="14" fill="#2e2e2e"/><circle cx="72" cy="44" r="8" fill="#4a4a4a"/>
          <circle cx="128" cy="44" r="14" fill="#2e2e2e"/><circle cx="128" cy="44" r="8" fill="#4a4a4a"/>
          <ellipse cx="100" cy="80" rx="17" ry="13" fill="#c4a46a"/>
          <ellipse cx="100" cy="75" rx="7" ry="5" fill="#111"/>
          <circle cx="85" cy="64" r="7" fill="#f8f8f8"/>
          <circle cx="85" cy="64" r="3.5" fill="#111"/>
          <circle cx="83.5" cy="62.5" r="1.3" fill="#fff"/>
          <circle cx="115" cy="64" r="7" fill="#f8f8f8"/>
          <circle cx="115" cy="64" r="3.5" fill="#111"/>
          <circle cx="113.5" cy="62.5" r="1.3" fill="#fff"/>
          <path d="M93 87 Q100 94 107 87" fill="none" stroke="#111" strokeWidth="1.8"/>
          <path d="M52 112 Q36 124 42 148" fill="none" stroke="#2a2a2a" strokeWidth="15" strokeLinecap="round"/>
          <circle cx="40" cy="150" r="2.5" fill="#bbb"/><circle cx="44" cy="153" r="2.5" fill="#bbb"/>
          <path d="M148 112 Q164 124 158 148" fill="none" stroke="#2a2a2a" strokeWidth="15" strokeLinecap="round"/>
          <circle cx="160" cy="150" r="2.5" fill="#bbb"/><circle cx="156" cy="153" r="2.5" fill="#bbb"/>
          <ellipse cx="80" cy="170" rx="15" ry="11" fill="#252525"/>
          <ellipse cx="120" cy="170" rx="15" ry="11" fill="#252525"/>
        </g>
        <circle cx="164" cy="40" r="18" fill={RED} opacity="0.95"/>
        <text x="164" y="48" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="bold">↓</text>
      </svg>
    </div>
  );
}

export default BearSVG;
