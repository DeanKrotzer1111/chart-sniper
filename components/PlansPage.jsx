import React from 'react';
import { ACCENT, ACCENT2, GRAY, YELLOW, BORDER_SUBTLE, gradBorder } from './constants';

function PlansPage() {
  return (
    <div>
      <h1 style={{ fontSize:'28px', fontWeight:800, color:'#fff', marginBottom:'6px' }}>◆ Plans</h1>
      <p style={{ color:GRAY, marginBottom:'24px', fontSize:'13px' }}>Choose the plan that fits your trading style.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }}>
        {[
          { n:'Free', p:'$0', c:GRAY, f:['5 analyses/day','Single provider','Basic journal','Community support'] },
          { n:'Pro', p:'$29/mo', c:ACCENT, pop:true, f:['Unlimited analyses','All 4 providers','Full journal + history','Priority support','Custom timeframes'] },
          { n:'Elite', p:'$79/mo', c:YELLOW, f:['Everything in Pro','Batch analysis','API access','Auto-journaling','Discord support','Early access'] },
        ].map(pl=>(
          <div key={pl.n} style={{ ...gradBorder(pl.c), padding:'24px', textAlign:'center', position:'relative',
            borderColor: pl.pop ? ACCENT+'40' : BORDER_SUBTLE, transform: pl.pop ? 'scale(1.02)' : 'none' }}>
            {pl.pop&&<div style={{ position:'absolute', top:'-11px', left:'50%', transform:'translateX(-50%)',
              background:`linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, color:'#fff', padding:'3px 14px',
              borderRadius:'20px', fontSize:'10px', fontWeight:700, letterSpacing:'0.5px' }}>POPULAR</div>}
            <div style={{ fontSize:'22px', fontWeight:800, color:pl.c, marginTop: pl.pop ? 8 : 0 }}>{pl.n}</div>
            <div style={{ fontSize:'36px', fontWeight:900, color:'#fff', margin:'8px 0 16px' }}>{pl.p}</div>
            {pl.f.map(f=><div key={f} style={{ fontSize:'13px', color:'#8892a6', padding:'4px 0', textAlign:'left' }}>✓ {f}</div>)}
            <button style={{ width:'100%', marginTop:'18px', padding:'10px', borderRadius:'10px', border:'none',
              fontFamily:'inherit', fontSize:'13px', fontWeight:700, cursor:'pointer',
              background: pl.pop ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : 'rgba(30,40,60,0.5)',
              color:'#fff', boxShadow: pl.pop ? `0 4px 16px ${ACCENT}33` : 'none',
            }}>{pl.n==='Free'?'Current Plan':'Upgrade'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlansPage;
