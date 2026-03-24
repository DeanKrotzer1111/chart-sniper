import React, { useState } from 'react';
import { ACCENT, GRAY, BORDER_SUBTLE, PROVIDERS, gradBorder } from './constants';

function SettingsPage({ apiKeys, setApiKeys, provider, setProvider, bal, setBal }) {
  const [show, setShow] = useState({});
  return (
    <div>
      <h1 style={{ fontSize:'28px', fontWeight:800, color:'#fff', marginBottom:'20px' }}>⚙ Settings</h1>
      <div style={{ ...gradBorder(ACCENT), padding:'18px', marginBottom:'14px' }}>
        <div style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'10px' }}>Active Provider</div>
        <div style={{ display:'flex', gap:'6px' }}>
          {PROVIDERS.map(p=>(
            <button key={p.id} onClick={()=>setProvider(p.id)} style={{
              padding:'8px 16px', borderRadius:'10px', border: provider===p.id ? 'none' : '1px solid '+BORDER_SUBTLE,
              background: provider===p.id ? ACCENT : 'rgba(14,20,36,0.6)',
              color: provider===p.id ? '#fff' : '#7a8599', cursor:'pointer', fontFamily:'inherit', fontSize:'13px', fontWeight:600,
            }}>{p.icon} {p.label}</button>
          ))}
        </div>
      </div>
      {[
        { id:'claude', label:'Claude API Key', ph:'sk-ant-...' },
        { id:'openai', label:'OpenAI API Key', ph:'sk-...' },
        { id:'minimax', label:'Minimax API Key', ph:'eyJ...' },
      ].map(k=>(
        <div key={k.id} style={{ ...gradBorder(GRAY), padding:'16px', marginBottom:'10px' }}>
          <div style={{ fontSize:'13px', fontWeight:600, color:'#c8d0dc', marginBottom:'6px' }}>{k.label}</div>
          <div style={{ display:'flex', gap:'8px' }}>
            <input type={show[k.id]?'text':'password'} value={apiKeys[k.id]||''} onChange={e=>setApiKeys(p=>({...p,[k.id]:e.target.value}))}
              placeholder={k.ph} style={{ flex:1, padding:'9px 12px', borderRadius:'8px', background:'rgba(8,12,24,0.8)',
                border:'1px solid '+BORDER_SUBTLE, color:'#e2e8f0', fontFamily:'inherit', fontSize:'13px', outline:'none' }} />
            <button onClick={()=>setShow(p=>({...p,[k.id]:!p[k.id]}))} style={{ padding:'8px 14px', borderRadius:'8px',
              background:'rgba(14,20,36,0.6)', border:'1px solid '+BORDER_SUBTLE, color:GRAY, cursor:'pointer',
              fontFamily:'inherit', fontSize:'12px', fontWeight:600, whiteSpace:'nowrap' }}>
              {show[k.id]?'Hide':'Show'}
            </button>
          </div>
        </div>
      ))}
      <div style={{ ...gradBorder(GRAY), padding:'16px' }}>
        <div style={{ fontSize:'13px', fontWeight:600, color:'#c8d0dc', marginBottom:'6px' }}>Local LLM Port</div>
        <input value={apiKeys.localPort||'8080'} onChange={e=>setApiKeys(p=>({...p,localPort:e.target.value}))}
          placeholder="8080" style={{ maxWidth:'200px', padding:'9px 12px', borderRadius:'8px', background:'rgba(8,12,24,0.8)',
            border:'1px solid '+BORDER_SUBTLE, color:'#e2e8f0', fontFamily:'inherit', fontSize:'13px', outline:'none' }} />
        <div style={{ fontSize:'11px', color:GRAY, marginTop:'4px' }}>Proxied via /llm → localhost:{apiKeys.localPort||'8080'}</div>
      </div>
    </div>
  );
}

export default SettingsPage;
