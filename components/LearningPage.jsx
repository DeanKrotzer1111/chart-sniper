import React from 'react';
import { ACCENT, GRAY, BORDER_SUBTLE, gradBorder } from './constants';

function LearningPage() {
  const lessons = [
    { t:'Smart Money Concepts', d:'Institutional order flow, liquidity sweeps, market structure.', i:'🏦' },
    { t:'Fair Value Gaps', d:'Imbalances in price delivery and trading the rebalance.', i:'📊' },
    { t:'Order Blocks', d:'Zones where institutions placed large orders.', i:'🧱' },
    { t:'Break of Structure', d:'Trend continuation through structural breaks.', i:'💥' },
    { t:'Change of Character', d:'Reversals through character shifts in price action.', i:'🔄' },
    { t:'Liquidity Concepts', d:'Stop hunts, engineered grabs, buy/sell-side liquidity.', i:'💧' },
    { t:'Risk Management', d:'Position sizing, R:R ratios, capital preservation.', i:'🛡️' },
    { t:'Trading Psychology', d:'Emotions, revenge trading, discipline.', i:'🧠' },
  ];
  return (
    <div>
      <h1 style={{ fontSize:'28px', fontWeight:800, color:'#fff', marginBottom:'20px' }}>◎ Learning</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        {lessons.map(l=>(
          <div key={l.t} style={{ ...gradBorder(ACCENT), padding:'18px', cursor:'pointer', transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=ACCENT+'40';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER_SUBTLE;e.currentTarget.style.transform='none';}}>
            <div style={{ fontSize:'26px', marginBottom:'8px' }}>{l.i}</div>
            <div style={{ fontSize:'15px', fontWeight:700, color:'#fff', marginBottom:'3px' }}>{l.t}</div>
            <div style={{ fontSize:'12px', color:GRAY, lineHeight:1.5 }}>{l.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LearningPage;
