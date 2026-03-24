import React from 'react';
import { ACCENT, ACCENT2, GRAY, GREEN, NAV } from './constants';

function Sidebar({ page, setPage, collapsed, setCollapsed }) {
  const w = collapsed ? 0 : 220;
  return (
    <aside style={{ width:w, minWidth:w, height:'100vh', background:'rgba(6,8,16,0.95)',
      borderRight:'1px solid rgba(56,68,100,0.15)', display:'flex', flexDirection:'column',
      backdropFilter:'blur(24px)', transition:'width 0.3s cubic-bezier(0.4,0,0.2,1),min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
      overflow:'hidden', position:'relative', zIndex:50, flexShrink:0 }}>

      {/* Logo */}
      <div style={{ padding:'20px 18px', borderBottom:'1px solid rgba(56,68,100,0.15)', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:32, height:32, borderRadius:'10px', background:`linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:800, color:'#fff', flexShrink:0 }}>CS</div>
        <div style={{ overflow:'hidden', whiteSpace:'nowrap' }}>
          <div style={{ fontSize:'16px', fontWeight:800, color:'#fff', letterSpacing:'-0.3px' }}>Chart Sniper</div>
          <div style={{ fontSize:'10px', color:GRAY, letterSpacing:'0.5px', marginTop:'-1px' }}>Cut through the noise. Trade with precision.</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'2px' }}>
        {NAV.map(sec => (
          <div key={sec.section} style={{ marginBottom:'8px' }}>
            <div style={{ fontSize:'10px', fontWeight:700, color:'rgba(100,116,139,0.6)', letterSpacing:'1.2px',
              padding:'8px 10px 4px', textTransform:'uppercase' }}>{sec.section}</div>
            {sec.items.map(item => {
              const active = page === item.id;
              return (
                <button key={item.id} onClick={()=>setPage(item.id)} style={{
                  display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'9px 12px',
                  background: active ? `linear-gradient(90deg, ${ACCENT}18, transparent)` : 'transparent',
                  border:'none', borderRadius:'10px', cursor:'pointer', fontFamily:'inherit',
                  borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
                  color: active ? '#fff' : '#7a8599', fontSize:'13.5px', fontWeight: active ? 600 : 400,
                  transition:'all 0.2s', textAlign:'left', position:'relative',
                }}>
                  <span style={{ fontSize:'14px', width:'18px', textAlign:'center', opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && <span style={{ marginLeft:'auto', fontSize:'9px', fontWeight:700, background:`linear-gradient(135deg, ${GREEN}, #059669)`,
                    color:'#fff', padding:'2px 6px', borderRadius:'6px', letterSpacing:'0.5px' }}>{item.badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(56,68,100,0.15)', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:30, height:30, borderRadius:'8px', background:`linear-gradient(135deg, ${ACCENT}40, ${ACCENT2}40)`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:ACCENT }}>S</div>
        <div style={{ overflow:'hidden' }}>
          <div style={{ fontSize:'13px', fontWeight:600, color:'#cdd5e0' }}>User</div>
          <div style={{ fontSize:'11px', color:GRAY }}>Free Plan</div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
