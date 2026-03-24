import React, { useState } from 'react';
import { ACCENT, ACCENT2, GREEN, GRAY, BORDER_SUBTLE, gradBorder } from './constants';

function SupportPage() {
  const [form, setForm] = useState({ name:'', email:'', msg:'' });
  const [sent, setSent] = useState(false);
  return (
    <div>
      <h1 style={{ fontSize:'28px', fontWeight:800, color:'#fff', marginBottom:'20px' }}>◯ Support</h1>
      {sent ? (
        <div style={{ ...gradBorder(GREEN), padding:'40px', textAlign:'center' }}>
          <div style={{ fontSize:'40px', marginBottom:'10px' }}>✅</div>
          <div style={{ fontWeight:700, fontSize:'18px', color:'#fff', marginBottom:'4px' }}>Message Sent</div>
          <div style={{ color:GRAY, fontSize:'13px' }}>We'll get back to you soon.</div>
          <button onClick={()=>{setSent(false);setForm({name:'',email:'',msg:''});}} style={{ marginTop:'16px', padding:'8px 20px',
            borderRadius:'10px', border:'none', background:ACCENT, color:'#fff', fontFamily:'inherit', fontWeight:600, cursor:'pointer' }}>Send Another</button>
        </div>
      ) : (
        <div style={{ ...gradBorder(GRAY), padding:'20px', maxWidth:'600px' }}>
          {[
            { label:'Name', val:form.name, k:'name', ph:'Your name', type:'text' },
            { label:'Email', val:form.email, k:'email', ph:'your@email.com', type:'email' },
          ].map(f=>(
            <div key={f.k} style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#8892a6', display:'block', marginBottom:'4px' }}>{f.label}</label>
              <input type={f.type} value={f.val} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', background:'rgba(8,12,24,0.8)',
                  border:'1px solid '+BORDER_SUBTLE, color:'#e2e8f0', fontFamily:'inherit', fontSize:'13px', outline:'none' }} />
            </div>
          ))}
          <div style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#8892a6', display:'block', marginBottom:'4px' }}>Message</label>
            <textarea value={form.msg} onChange={e=>setForm(p=>({...p,msg:e.target.value}))} rows={5} placeholder="How can we help?"
              style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', background:'rgba(8,12,24,0.8)',
                border:'1px solid '+BORDER_SUBTLE, color:'#e2e8f0', fontFamily:'inherit', fontSize:'13px', outline:'none', resize:'vertical' }} />
          </div>
          <button onClick={()=>{if(form.name&&form.email&&form.msg)setSent(true);}} style={{ padding:'10px 24px', borderRadius:'10px',
            border:'none', background:`linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, color:'#fff',
            fontFamily:'inherit', fontWeight:700, cursor:'pointer', fontSize:'14px' }}>Send Message</button>
        </div>
      )}
    </div>
  );
}

export default SupportPage;
