import React from 'react';
import { ACCENT, ACCENT2, GREEN, GRAY, YELLOW, BORDER_SUBTLE, gradBorder } from './constants';

function DashboardPage({ journal, setPage }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const day = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  const wins = journal.filter(t=>t.outcome==='won').length;
  const losses = journal.filter(t=>t.outcome==='lost').length;
  const total = wins + losses;
  const winRate = total > 0 ? ((wins/total)*100).toFixed(1) : '0';
  const pf = losses > 0 ? (wins/losses).toFixed(2) : wins > 0 ? '∞' : '—';

  return (
    <div>
      <div style={{ marginBottom:'6px', fontSize:'12px', color:GRAY, fontWeight:600, letterSpacing:'1px', textTransform:'uppercase' }}>
        {day.toUpperCase()} · COMMAND CENTER
      </div>
      <h1 style={{ fontSize:'34px', fontWeight:800, color:'#fff', marginBottom:'6px', letterSpacing:'-0.5px' }}>
        {greeting}, Trader ⚔️
      </h1>
      <p style={{ color:GRAY, fontSize:'14px', marginBottom:'28px' }}>Cut through the noise. What are we trading today?</p>

      {/* Quick action cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'28px' }}>
        {[
          { id:'swing', title:'Swing Trading', sub:'Multi-day · Multi-week', desc:'Identify high-probability setups that develop over days or weeks.', color:ACCENT2, active:'8.3k' },
          { id:'scalp', title:'Scalp Trading', sub:'Seconds · Minutes', desc:'Capture quick price movements with laser-precise entries.', color:ACCENT, active:'7.4k' },
        ].map(c => (
          <div key={c.id} onClick={()=>setPage(c.id)} style={{
            ...gradBorder(c.color), padding:'24px', cursor:'pointer', transition:'all 0.25s',
            borderColor:`${c.color}25`,
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=c.color+'50';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=c.color+'25';e.currentTarget.style.transform='none';}}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
              <div>
                <div style={{ fontSize:'18px', fontWeight:700, color:'#fff', marginBottom:'2px' }}>{c.title}</div>
                <div style={{ fontSize:'12px', color:GRAY }}>{c.sub}</div>
              </div>
              <span style={{ fontSize:'11px', color:GREEN, fontWeight:600, background:`${GREEN}15`, padding:'3px 10px', borderRadius:'20px' }}>
                ⚡ {c.active} active
              </span>
            </div>
            <p style={{ fontSize:'13px', color:'#8892a6', lineHeight:1.5, marginBottom:'14px' }}>{c.desc}</p>
            <div style={{ color:c.color, fontSize:'13px', fontWeight:600, display:'flex', alignItems:'center', gap:'6px' }}>
              Analyze {c.title.split(' ')[0]} Charts <span style={{ fontSize:'16px' }}>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ marginBottom:'24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
          <div style={{ width:4, height:20, borderRadius:2, background:ACCENT }} />
          <h2 style={{ fontSize:'16px', fontWeight:700, color:'#fff', letterSpacing:'-0.2px' }}>TRADING PERFORMANCE</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
          {[
            { label:'Trades', sub:'analyzed', val:journal.length, icon:'📊', color:ACCENT },
            { label:'Win Rate', sub:'of all trades', val:winRate+'%', icon:'📈', color:GREEN },
            { label:'Profit Factor', sub:'win/loss ratio', val:pf, icon:'🏆', color:YELLOW },
            { label:'Lessons', sub:'completed', val:'0', icon:'📚', color:ACCENT2 },
          ].map(s => (
            <div key={s.label} style={{ ...gradBorder(s.color), padding:'20px', textAlign:'center' }}>
              <div style={{ fontSize:'24px', marginBottom:'8px', opacity:0.7 }}>{s.icon}</div>
              <div style={{ fontSize:'28px', fontWeight:800, color:s.val==='0'||s.val==='0%'||s.val==='—'?GRAY:'#fff', marginBottom:'2px' }}>{s.val}</div>
              <div style={{ fontSize:'12px', color:'#7a8599', fontWeight:600 }}>{s.label}</div>
              <div style={{ fontSize:'11px', color:GRAY }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Pulse */}
      <div style={{ ...gradBorder(GREEN), padding:'20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:4, height:20, borderRadius:2, background:GREEN }} />
            <div>
              <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>MARKET PULSE</h3>
              <div style={{ fontSize:'11px', color:GRAY }}>Live community sentiment</div>
            </div>
          </div>
          <span style={{ fontSize:'12px', color:GREEN, fontWeight:600, display:'flex', alignItems:'center', gap:'5px' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:GREEN, animation:'liveDot 2s infinite' }} /> 149 online
          </span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div style={{ background:'rgba(16,185,129,0.06)', borderRadius:'12px', padding:'14px 16px', border:'1px solid rgba(16,185,129,0.12)' }}>
            <div style={{ fontSize:'10px', color:GRAY, fontWeight:700, letterSpacing:'1px', marginBottom:'6px' }}>WEEKLY SENTIMENT</div>
            <div style={{ fontSize:'13px', color:'#c8d0dc' }}>📈 Market trending <span style={{ color:GREEN, fontWeight:700 }}>bullish</span> with strong institutional momentum</div>
          </div>
          <div style={{ background:'rgba(99,102,241,0.06)', borderRadius:'12px', padding:'14px 16px', border:'1px solid rgba(99,102,241,0.12)' }}>
            <div style={{ fontSize:'10px', color:GRAY, fontWeight:700, letterSpacing:'1px', marginBottom:'6px' }}>NEW CONTENT</div>
            <div style={{ fontSize:'13px', color:'#c8d0dc' }}>🧠 Advanced pattern recognition guide <span style={{ color:ACCENT, fontWeight:600 }}>now available</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
