import React from 'react';
import { ACCENT, GREEN, RED, GRAY, gradBorder } from './constants';
import { fmt } from './api';

function HistoryPage({ journal }) {
  const w=journal.filter(t=>t.outcome==='won').length, l=journal.filter(t=>t.outcome==='lost').length, tot=w+l;
  return (
    <div>
      <h1 style={{ fontSize:'28px', fontWeight:800, color:'#fff', marginBottom:'20px' }}>◫ Trade History</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'24px' }}>
        {[
          { label:'Total', val:journal.length, c:ACCENT }, { label:'Win Rate', val:tot>0?((w/tot)*100).toFixed(1)+'%':'0%', c:GREEN },
          { label:'Wins', val:w, c:GREEN }, { label:'Losses', val:l, c:RED },
        ].map(s=>(
          <div key={s.label} style={{ ...gradBorder(s.c), padding:'18px', textAlign:'center' }}>
            <div style={{ fontSize:'11px', color:GRAY, marginBottom:'4px', fontWeight:600 }}>{s.label}</div>
            <div style={{ fontSize:'30px', fontWeight:800, color:s.c }}>{s.val}</div>
          </div>
        ))}
      </div>
      {tot>0&&<div style={{ ...gradBorder(GREEN), padding:'16px', marginBottom:'20px' }}>
        <div style={{ display:'flex', height:'20px', borderRadius:'10px', overflow:'hidden' }}>
          <div style={{ width:(w/tot*100)+'%', background:GREEN, transition:'0.3s' }} />
          <div style={{ width:(l/tot*100)+'%', background:RED, transition:'0.3s' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:GRAY, marginTop:'4px' }}><span>{w}W</span><span>{l}L</span></div>
      </div>}
      <div style={{ ...gradBorder(GRAY), padding:'18px' }}>
        <h3 style={{ fontSize:'14px', fontWeight:700, marginBottom:'12px', color:'#fff' }}>All Trades</h3>
        {journal.length===0?<div style={{ color:GRAY, textAlign:'center', padding:'20px' }}>No trades yet.</div>:(
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
              <thead><tr style={{ borderBottom:'1px solid rgba(56,68,100,0.2)' }}>
                {['Date','Mode','TF','Dir','Entry','SL','TP1','R:R','Outcome'].map(h=>
                  <th key={h} style={{ padding:'8px 6px', textAlign:'left', color:GRAY, fontWeight:700, fontSize:'10px', letterSpacing:'0.5px' }}>{h}</th>)}
              </tr></thead>
              <tbody>{[...journal].reverse().map(t=>(
                <tr key={t.id} style={{ borderBottom:'1px solid rgba(56,68,100,0.1)' }}>
                  <td style={{ padding:'8px 6px', color:'#8892a6' }}>{new Date(t.date).toLocaleDateString()}</td>
                  <td style={{ padding:'8px 6px' }}>{t.mode}</td>
                  <td style={{ padding:'8px 6px' }}>{t.timeframe}</td>
                  <td style={{ padding:'8px 6px', color:t.direction==='BUY'?GREEN:RED, fontWeight:700 }}>{t.direction}</td>
                  <td style={{ padding:'8px 6px' }}>{fmt(t.entryPrice)}</td>
                  <td style={{ padding:'8px 6px' }}>{fmt(t.stopLoss)}</td>
                  <td style={{ padding:'8px 6px' }}>{fmt(t.takeProfit1)}</td>
                  <td style={{ padding:'8px 6px' }}>{t.rrRatio}</td>
                  <td style={{ padding:'8px 6px' }}><span style={{ padding:'2px 8px', borderRadius:'10px', fontSize:'10px', fontWeight:700,
                    background:t.outcome==='won'?`${GREEN}15`:t.outcome==='lost'?`${RED}15`:`${GRAY}15`,
                    color:t.outcome==='won'?GREEN:t.outcome==='lost'?RED:GRAY }}>{(t.outcome||'—').toUpperCase()}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
