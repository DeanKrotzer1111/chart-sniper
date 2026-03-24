import React from 'react';
import { GREEN, RED, GRAY, BORDER_SUBTLE, gradBorder } from './constants';
import { fmt } from './api';

function JournalPage({ journal, setJournal }) {
  return (
    <div>
      <h1 style={{ fontSize:'28px', fontWeight:800, color:'#fff', marginBottom:'20px' }}>▤ Journal</h1>
      {journal.length===0 ? (
        <div style={{ ...gradBorder(GRAY), padding:'40px', textAlign:'center', color:GRAY }}>No trades saved yet. Analyze a chart and save the result.</div>
      ) : [...journal].reverse().map(t => (
        <div key={t.id} style={{ ...gradBorder(t.direction==='BUY'?GREEN:RED), padding:'16px', marginBottom:'10px',
          display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
          <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
            <span style={{ color:t.direction==='BUY'?GREEN:RED, fontWeight:800, fontSize:'16px' }}>{t.direction==='BUY'?'▲':'▼'} {t.direction}</span>
            <div>
              <div style={{ fontSize:'14px', fontWeight:600, color:'#e2e8f0' }}>{t.mode} · {t.timeframe}</div>
              <div style={{ fontSize:'12px', color:GRAY }}>Entry: {fmt(t.entryPrice)} · SL: {fmt(t.stopLoss)} · R:R {t.rrRatio}</div>
              <div style={{ fontSize:'11px', color:GRAY }}>{new Date(t.date).toLocaleString()} · {t.provider}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:'5px' }}>
            {['won','lost','not taken'].map(o => (
              <button key={o} onClick={()=>setJournal(prev=>prev.map(x=>x.id===t.id?{...x,outcome:o}:x))} style={{
                padding:'5px 12px', borderRadius:'8px', fontSize:'11px', fontWeight:600, cursor:'pointer',
                fontFamily:'inherit', border:'none', transition:'all 0.15s',
                background: t.outcome===o ? (o==='won'?GREEN:o==='lost'?RED:GRAY) : 'rgba(14,20,36,0.6)',
                color: t.outcome===o ? '#fff' : '#7a8599',
              }}>{o.charAt(0).toUpperCase()+o.slice(1)}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default JournalPage;
