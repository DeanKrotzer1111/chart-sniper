import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CHART REAPER — Premium Trading Analysis Terminal
// ═══════════════════════════════════════════════════════════════════════════

const ACCENT = '#0ea5e9';
const ACCENT2 = '#6366f1';
const GREEN = '#10b981';
const RED = '#ef4444';
const YELLOW = '#f59e0b';
const GRAY = '#64748b';
const BG_DEEP = '#070a12';
const BG_CARD = 'rgba(12,18,35,0.72)';
const BORDER_SUBTLE = 'rgba(56,68,100,0.25)';
const GLASS = 'blur(20px) saturate(1.4)';

const SCALP_TF = [
  { label:'1-Sec',  cat:'ULTRA-SHORT', riskPct:0.10, stopPts:2.0,  tpPts:2.6 },
  { label:'5-Sec',  cat:'ULTRA-SHORT', riskPct:0.12, stopPts:2.5,  tpPts:3.25 },
  { label:'15-Sec', cat:'ULTRA-SHORT', riskPct:0.15, stopPts:3.0,  tpPts:3.9 },
  { label:'30-Sec', cat:'ULTRA-SHORT', riskPct:0.18, stopPts:4.0,  tpPts:5.2 },
  { label:'1-Min',  cat:'SHORT',       riskPct:0.25, stopPts:6.0,  tpPts:7.8 },
  { label:'2-Min',  cat:'SHORT',       riskPct:0.30, stopPts:8.0,  tpPts:10.4 },
  { label:'3-Min',  cat:'SHORT',       riskPct:0.35, stopPts:10.0, tpPts:13.0 },
  { label:'5-Min',  cat:'SHORT',       riskPct:0.40, stopPts:12.0, tpPts:15.6 },
];
const SWING_TF = [
  { label:'15-Min',  cat:'INTRADAY', riskPct:0.5,   stopPts:15,   tpPts:22.5 },
  { label:'30-Min',  cat:'INTRADAY', riskPct:0.6,   stopPts:20,   tpPts:30 },
  { label:'1-Hr',    cat:'INTRADAY', riskPct:0.75,  stopPts:25,   tpPts:37.5 },
  { label:'2-Hr',    cat:'INTRADAY', riskPct:0.85,  stopPts:30,   tpPts:45 },
  { label:'4-Hr',    cat:'POSITIONAL', riskPct:1.0,  stopPts:40,   tpPts:60 },
  { label:'Daily',   cat:'POSITIONAL', riskPct:1.25, stopPts:60,   tpPts:90 },
  { label:'Weekly',  cat:'MACRO',      riskPct:1.5,  stopPts:100,  tpPts:150 },
  { label:'Monthly', cat:'MACRO',      riskPct:2.0,  stopPts:200,  tpPts:300 },
];

const PROVIDERS = [
  { id:'claude',  label:'Claude',    icon:'◆' },
  { id:'openai',  label:'ChatGPT',   icon:'◈' },
  { id:'minimax', label:'Minimax',    icon:'◇' },
  { id:'local',   label:'Local LLM', icon:'◉' },
];

const NAV = [
  { section:'TRADING TOOLS', items:[
    { id:'dashboard', icon:'⬡', label:'Dashboard' },
    { id:'swing',     icon:'↗', label:'Swing Trading' },
    { id:'scalp',     icon:'⚡', label:'Scalp Trading' },
  ]},
  { section:'ANALYSIS & LEARNING', items:[
    { id:'learning', icon:'◎', label:'Learning' },
    { id:'journal',  icon:'▤', label:'Journal' },
    { id:'history',  icon:'◫', label:'Trade History', badge:'NEW' },
  ]},
  { section:'ACCOUNT', items:[
    { id:'plans',    icon:'◆', label:'Plans' },
    { id:'settings', icon:'⚙', label:'Settings' },
  ]},
  { section:'HELP & SUPPORT', items:[
    { id:'support',  icon:'◯', label:'Support' },
  ]},
];

// ─── CSS-IN-JS HELPERS ──────────────────────────────────────────────────
const gradBorder = (color, opacity = 0.3) => ({
  position: 'relative',
  background: BG_CARD,
  borderRadius: '16px',
  border: `1px solid ${BORDER_SUBTLE}`,
  backdropFilter: GLASS,
  overflow: 'hidden',
});

const glowBorder = (color) => `0 0 0 1px ${color}22, 0 0 20px ${color}11, 0 4px 24px rgba(0,0,0,0.3)`;

// ─── SVG MASCOTS ────────────────────────────────────────────────────────
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

// ─── API ENGINE (unchanged logic) ────────────────────────────────────────
function buildPricePrompt() {
  return `Find the OHLC header text at the top-left of this chart.
It looks like: MNQH26 · 1   O 24914.25   H 24915.75   L 24911.50   C 24913.00
The header always ends with the letter C followed by the close price.
Read the number immediately after the letter C. That is the ONLY number you should output.
Rules:
  • Output ONLY the number after C — nothing else
  • Do NOT output the O, H, or L values
  • Do NOT output volume, percentage, or any other number
  • If you see 'C 24913.00' → output: 24913.00
  • If you see 'C 5168.70'  → output: 5168.70`;
}

function buildAnalysisPrompt(tf, mode) {
  return `You are analyzing a ${tf} ${mode} trading chart screenshot.
Your PRIMARY job: determine if price is CONTINUING its trend or REVERSING.
BIAS WARNING: Do NOT default to the current trend direction. Reversals are equally valid signals.
Complete ALL 5 steps before deciding. Steps B-E can OVERRIDE Step A.

═══ STEP A — PREVAILING TREND (context only, NOT automatically the trade direction) ═══
  Examine the SEQUENCE of swing highs and lows over the last 20+ candles.
  Higher highs + higher lows = UPTREND
  Lower highs + lower lows = DOWNTREND
  Neither clearly = RANGING
  Score A: UP | DOWN | RANGE

═══ STEP B — REVERSAL CANDLESTICK PATTERNS (last 1-3 candles ONLY) ═══
  At TOP of uptrend/resistance: Shooting star, bearish engulfing, gravestone doji, evening star, tweezer top
  At BOTTOM of downtrend/support: Hammer, bullish engulfing, dragonfly doji, morning star, tweezer bottom
  Score B: BEARISH_REVERSAL | BULLISH_REVERSAL | NONE

═══ STEP C — KEY LEVEL INTERACTION ═══
  Rejection AT resistance (wick poked above, CLOSED back below) = BEARISH
  Rejection AT support (wick poked below, CLOSED back above) = BULLISH
  Clean breakout ABOVE resistance = BULLISH
  Clean breakdown BELOW support = BEARISH
  Not near any level = NEUTRAL
  Score C: BEARISH | BULLISH | NEUTRAL

═══ STEP D — MOMENTUM EXHAUSTION ═══
  BEARISH EXHAUSTION: shrinking bullish bodies, growing upper wicks
  BULLISH EXHAUSTION: shrinking bearish bodies, growing lower wicks
  Score D: BEARISH_EXHAUSTION | BULLISH_EXHAUSTION | NONE

═══ STEP E — STRUCTURE BREAK / CHoCH ═══
  In UPTREND: last candle CLOSED BELOW last swing low? → BEARISH_BREAK
  In DOWNTREND: last candle CLOSED ABOVE last swing high? → BULLISH_BREAK
  Score E: BEARISH_BREAK | BULLISH_BREAK | NONE

═══ DECISION RULES — strict priority ═══
  RULE 1: B=BEARISH_REVERSAL+C=BEARISH+(D=BEARISH_EXHAUSTION OR E=BEARISH_BREAK)→SELL 82-95
          B=BULLISH_REVERSAL+C=BULLISH+(D=BULLISH_EXHAUSTION OR E=BULLISH_BREAK)→BUY 82-95
  RULE 2: B=BEARISH_REVERSAL+C=BEARISH→SELL 66-81 / B=BULLISH_REVERSAL+C=BULLISH→BUY 66-81
  RULE 3: E=BEARISH_BREAK+C=BEARISH→SELL 65-78 / E=BULLISH_BREAK+C=BULLISH→BUY 65-78
  RULE 4: A=UP, no reversal→BUY 60-80 / A=DOWN, no reversal→SELL 60-80
  RULE 5: Mixed→NEUTRAL 35-50

Output ONLY a raw JSON object:
  currentPrice, direction (BUY/SELL/NEUTRAL), marketTrend (Bullish/Bearish/Neutral/Ranging),
  confidence (0-100), isReversal (true if Rules 1-3), reasoning (array of 5 strings),
  pattern, volume, momentum, timeInTrade,
  supportLevels (array of 2 numbers), resistanceLevels (array of 2 numbers),
  orderBlocks (array of {type:'bullish'|'bearish', from:number, to:number})`;
}

function imageToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function parseJSON(text) {
  let s = text.trim().replace(/```json\s*/g,'').replace(/```\s*/g,'');
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0].replace(/,\s*([\]}])/g,'$1')); } catch { return null; }
}

async function callProvider(prov, keys, sys, content, maxTok) {
  maxTok = maxTok || 1200;
  const img = typeof content === 'object' ? content : null;
  const txt = typeof content === 'string' ? content : null;

  if (prov === 'claude') {
    const msgs = [{ role:'user', content: img
      ? [{ type:'image', source:{ type:'base64', media_type:'image/png', data:img.b64 }}, { type:'text', text:img.text }]
      : [{ type:'text', text:txt }]
    }];
    // When running as a Claude artifact, no API key is needed (auth is handled automatically).
    // When self-hosted, the user provides their own key.
    const hdrs = { 'Content-Type':'application/json' };
    if (keys.claude) {
      hdrs['x-api-key'] = keys.claude;
      hdrs['anthropic-version'] = '2023-06-01';
      hdrs['anthropic-dangerous-direct-browser-access'] = 'true';
    }
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers: hdrs,
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:maxTok, temperature:0, system:sys, messages:msgs })
    });
    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.error?.message || 'Claude '+r.status); }
    return (await r.json()).content?.map(c=>c.text||'').join('') || '';
  }
  if (prov === 'openai') {
    const msgs = [{ role:'system', content:sys },
      { role:'user', content: img ? [{ type:'image_url', image_url:{ url:'data:image/png;base64,'+img.b64 }}, { type:'text', text:img.text }] : txt }];
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+keys.openai },
      body: JSON.stringify({ model:'gpt-4o', max_tokens:maxTok, temperature:0, messages:msgs })
    });
    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.error?.message || 'OpenAI '+r.status); }
    return (await r.json()).choices?.[0]?.message?.content || '';
  }
  if (prov === 'minimax') {
    const msgs = [{ role:'system', content:sys },
      { role:'user', content: img ? [{ type:'image_url', image_url:{ url:'data:image/png;base64,'+img.b64 }}, { type:'text', text:img.text }] : txt }];
    const r = await fetch('https://api.minimaxi.chat/v1/text/chatcompletion_v2', {
      method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+keys.minimax },
      body: JSON.stringify({ model:'MiniMax-Text-01', max_tokens:maxTok, temperature:0, messages:msgs })
    });
    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.error?.message || 'Minimax '+r.status); }
    return (await r.json()).choices?.[0]?.message?.content || '';
  }
  if (prov === 'local') {
    const msgs = [{ role:'system', content:sys },
      { role:'user', content: img ? [{ type:'image_url', image_url:{ url:'data:image/png;base64,'+img.b64 }}, { type:'text', text:img.text }] : txt }];
    const r = await fetch('/llm/v1/chat/completions', {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ max_tokens:maxTok, temperature:0, messages:msgs })
    });
    if (!r.ok) throw new Error('Local LLM '+r.status);
    return (await r.json()).choices?.[0]?.message?.content || '';
  }
  throw new Error('Unknown provider');
}

async function runAnalysis(file, prov, keys, tf, mode, onStatus) {
  const b64 = await imageToBase64(file);
  const priceSys = 'Return only a bare number — the current live price from the chart. No words, no symbols, no explanation.';
  const aSys = 'You are a trading chart analyst. Respond with a single raw JSON object only. No markdown. Start { end }.';
  const aP = buildAnalysisPrompt(tf, mode);

  // Helper: call with a 90-second timeout to prevent infinite hangs
  const callWithTimeout = (sys, content, maxTok) => {
    return Promise.race([
      callProvider(prov, keys, sys, content, maxTok),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Request timed out (90s). Try a smaller image or different provider.')), 90000))
    ]);
  };

  // Run SEQUENTIALLY to avoid overwhelming the artifact proxy.
  // Inside Claude.ai artifacts, parallel fetches get queued/throttled anyway.
  
  // Step 1: Price read
  if (onStatus) onStatus('reading');
  let p1 = null;
  try {
    const priceText = await callWithTimeout(priceSys, { b64, text:buildPricePrompt() }, 32);
    const n = parseFloat(priceText.trim().replace(/[^0-9.]/g, ''));
    if (!isNaN(n) && n > 0) p1 = n;
  } catch(e) { /* price read failed, will use analysis price */ }

  // Step 2: Analysis calls — run sequentially, stop early if we get 2 agreeing
  if (onStatus) onStatus('analyzing');
  const parsed = [];
  for (let i = 0; i < 3; i++) {
    try {
      if (onStatus) onStatus('analyzing ' + (i+1) + '/3');
      const text = await callWithTimeout(aSys, { b64, text:aP }, 1200);
      const obj = parseJSON(text);
      if (obj) parsed.push(obj);
      // Early exit: if first 2 calls agree on direction, skip the 3rd
      if (parsed.length >= 2) {
        const dirs = parsed.map(p => (p.direction||'').toUpperCase());
        if (dirs[0] === dirs[1] && dirs[0] !== 'NEUTRAL') break;
      }
    } catch(e) { /* this call failed, continue to next */ }
  }

  if (!parsed.length) throw new Error('All analysis calls failed. The request may have timed out — try a smaller/cropped chart image.');
  const votes={BUY:0,SELL:0,NEUTRAL:0};
  parsed.forEach(p=>{const d=(p.direction||'').toUpperCase(); if(votes[d]!==undefined) votes[d]++;});
  let winDir='NEUTRAL';
  if(votes.BUY>votes.SELL&&votes.BUY>votes.NEUTRAL) winDir='BUY';
  else if(votes.SELL>votes.BUY&&votes.SELL>votes.NEUTRAL) winDir='SELL';
  const winners=parsed.filter(p=>(p.direction||'').toUpperCase()===winDir);
  let best={...(winners.sort((a,b)=>(b.confidence||0)-(a.confidence||0))[0]||parsed[0])};
  best.direction=winDir;
  const agree=votes[winDir];
  if(agree===3) best.confidence=Math.min(99,(best.confidence||70)+12);
  else if(agree>=2) best.confidence=Math.min(95,(best.confidence||70)+5);
  const note='Consensus: '+agree+'/'+parsed.length+' AI analyses agreed on '+winDir+' direction.';
  if(Array.isArray(best.reasoning)&&best.reasoning.length) best.reasoning[0]=note+' '+best.reasoning[0];
  else best.reasoning=[note,'N/A','N/A','N/A','N/A'];
  let aPrice=typeof best.currentPrice==='number'?best.currentPrice:parseFloat(best.currentPrice);
  if(isNaN(aPrice)) aPrice=null;
  let fp=null;
  if(p1&&aPrice) fp=Math.abs(p1-aPrice)/Math.max(p1,aPrice)>0.005?aPrice:p1;
  else fp=p1||aPrice;
  if(!fp) throw new Error('Could not read price. Make sure the OHLC header is visible.');
  best.currentPrice=fp;
  return best;
}

function calcLevels(price, dir, tf, bal) {
  const {stopPts,tpPts,riskPct}=tf;
  const s=dir==='SELL';
  return { sl:s?price+stopPts:price-stopPts, tp1:s?price-tpPts:price+tpPts,
    tp2:s?price-tpPts*1.5:price+tpPts*1.5, dollarRisk:bal*riskPct/100,
    rrRatio:(tpPts/stopPts).toFixed(2)+':1', riskPct, stopPts, tpPts };
}

const fmt=(n)=>typeof n==='number'?n.toFixed(2):'—';

// ─── ANIMATED BACKGROUND ─────────────────────────────────────────────────
function GridBg() {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, #04060c 0%, #0a0f1e 40%, #06091a 70%, #030510 100%)' }} />
      <div style={{ position:'absolute', inset:0, opacity:0.03,
        backgroundImage:'linear-gradient(rgba(14,165,233,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.5) 1px, transparent 1px)',
        backgroundSize:'60px 60px' }} />
      <div style={{ position:'absolute', top:'-30%', right:'-20%', width:'70%', height:'70%',
        background:`radial-gradient(ellipse, ${ACCENT}06 0%, transparent 60%)` }} />
      <div style={{ position:'absolute', bottom:'-20%', left:'-10%', width:'50%', height:'50%',
        background:`radial-gradient(ellipse, ${ACCENT2}04 0%, transparent 60%)` }} />
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────
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
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:800, color:'#fff', flexShrink:0 }}>CR</div>
        <div style={{ overflow:'hidden', whiteSpace:'nowrap' }}>
          <div style={{ fontSize:'16px', fontWeight:800, color:'#fff', letterSpacing:'-0.3px' }}>Chart Reaper</div>
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

// ─── DASHBOARD ──────────────────────────────────────────────────────────
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

// ─── TRADING PAGE ───────────────────────────────────────────────────────
function TradingPage({ mode, timeframes, journal, setJournal, apiKeys, provider, setProvider }) {
  const [tf, setTf] = useState(timeframes.find(t=>t.label==='1-Min')||timeframes[0]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [bal, setBal] = useState(10000);
  const [riskOverride, setRiskOverride] = useState(null);
  const [slOverride, setSlOverride] = useState(null);
  const [tpOverride, setTpOverride] = useState(null);
  const [tab, setTab] = useState('setup');
  const [dragOver, setDragOver] = useState(false);

  const effectiveTf = useMemo(() => ({
    ...tf,
    riskPct: riskOverride !== null ? riskOverride : tf.riskPct,
    stopPts: slOverride !== null ? slOverride : tf.stopPts,
    tpPts: tpOverride !== null ? tpOverride : tf.tpPts,
  }), [tf, riskOverride, slOverride, tpOverride]);

  useEffect(() => { setRiskOverride(null); setSlOverride(null); setTpOverride(null); }, [tf]);

  const handleFile = useCallback((f) => {
    if (!f||!f.type.startsWith('image/')) return;
    setImage(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(null); setOutcome(null);
  }, []);

  const analyze = useCallback(async () => {
    if (!image) return;
    if (provider==='openai'&&!apiKeys.openai) { setError('Enter your OpenAI API key in Settings.'); return; }
    if (provider==='minimax'&&!apiKeys.minimax) { setError('Enter your Minimax API key in Settings.'); return; }
    setError(null); setResult(null); setOutcome(null);
    try {
      setBusy('reading');
      const res = await runAnalysis(image, provider, apiKeys, tf.label, mode, (status) => setBusy(status));
      setResult({ ...res, ...calcLevels(res.currentPrice, res.direction, effectiveTf, bal), provider });
    } catch(e) { setError(e.message); } finally { setBusy(null); }
  }, [image, provider, apiKeys, tf, mode, bal, effectiveTf]);

  const save = useCallback(() => {
    if (!result||!outcome) return;
    setJournal(prev => [...prev, {
      id:Date.now(), date:new Date().toISOString(), mode, timeframe:tf.label,
      direction:result.direction, entryPrice:result.currentPrice, stopLoss:result.sl,
      takeProfit1:result.tp1, rrRatio:result.rrRatio, accountBalance:bal,
      riskPct:effectiveTf.riskPct, outcome, provider:result.provider,
    }]);
    setOutcome(null);
  }, [result, outcome, mode, tf, bal, effectiveTf, setJournal]);

  const dc = result?.direction==='BUY'?GREEN:result?.direction==='SELL'?RED:GRAY;
  const calcMetrics = useMemo(() => {
    const etf = effectiveTf;
    return {
      dollarRisk: (bal * etf.riskPct / 100).toFixed(2),
      rr: (etf.tpPts / etf.stopPts).toFixed(2),
      slDollar: etf.stopPts.toFixed(2),
      tpDollar: etf.tpPts.toFixed(2),
    };
  }, [effectiveTf, bal]);

  const cats = useMemo(() => {
    const map = {};
    timeframes.forEach(t => { if (!map[t.cat]) map[t.cat] = []; map[t.cat].push(t); });
    return Object.entries(map);
  }, [timeframes]);

  const noKey = (p) => p!=='local' && p!=='claude' && !apiKeys[p];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'4px' }}>
        <div>
          <h1 style={{ fontSize:'28px', fontWeight:800, color:'#fff', letterSpacing:'-0.5px', display:'flex', alignItems:'center', gap:'10px' }}>
            {mode==='scalp'?'⚡':'↗'} {mode==='scalp'?'Scalp':'Swing'} Trading
          </h1>
          <p style={{ color:GRAY, fontSize:'13px', marginTop:'2px' }}>
            {mode==='scalp'?'Analyze charts for ultra-short term trades held for seconds to minutes':'Analyze charts for multi-day to multi-week position trades'}
          </p>
        </div>
      </div>

      {/* NFA Banner */}
      <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'12px',
        padding:'10px 18px', marginBottom:'16px', marginTop:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
        <span style={{ fontSize:'18px' }}>⚠️</span>
        <span style={{ fontSize:'13px', color:'#d4a017' }}>
          <strong>Not Financial Advice.</strong> For educational purposes only. Always conduct your own research.
        </span>
      </div>

      {/* Provider tabs */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
        <span style={{ fontSize:'12px', color:GRAY, fontWeight:600 }}>AI Provider:</span>
        {PROVIDERS.map(p => (
          <button key={p.id} onClick={()=>setProvider(p.id)} style={{
            padding:'6px 14px', borderRadius:'8px', border:'none', cursor:'pointer', fontFamily:'inherit',
            fontSize:'12px', fontWeight:600, transition:'all 0.2s',
            background: provider===p.id ? ACCENT : 'rgba(20,30,50,0.6)',
            color: provider===p.id ? '#fff' : noKey(p.id) ? YELLOW : '#8892a6',
            boxShadow: provider===p.id ? `0 0 12px ${ACCENT}33` : 'none',
          }}>
            {p.label} {noKey(p.id) && '⚠️ no key'}
          </button>
        ))}
        <span style={{ fontSize:'11px', color:GRAY }}>· Change provider & keys in Settings</span>
      </div>

      {/* Two column layout */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'20px', alignItems:'start' }}>
        {/* Left: main content */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ ...gradBorder(ACCENT), padding:'24px' }}>
            <h2 style={{ fontSize:'17px', fontWeight:700, color:'#fff', marginBottom:'4px', display:'flex', alignItems:'center', gap:'8px' }}>
              {mode==='scalp'?'⚡':'↗'} {mode==='scalp'?'Scalp':'Swing'} Trading
            </h2>
            <p style={{ fontSize:'13px', color:GRAY, marginBottom:'16px' }}>Get immediate trade opportunities for quick, short-term profits</p>

            {/* Info box */}
            <div style={{ background:'rgba(14,165,233,0.06)', border:'1px solid rgba(14,165,233,0.15)', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px' }}>
              <div style={{ fontSize:'13px', color:ACCENT, fontWeight:600, marginBottom:'2px' }}>ℹ️ Chart Analysis Information</div>
              <div style={{ fontSize:'12px', color:'#8892a6', lineHeight:1.5 }}>Upload a clear screenshot of your chart. The AI will identify patterns and give you entry, stop loss, and take profit levels.</div>
            </div>

            {/* Upload zone */}
            <div
              onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onClick={()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=e=>handleFile(e.target.files[0]);i.click();}}
              style={{
                border:`2px dashed ${dragOver?ACCENT:BORDER_SUBTLE}`, borderRadius:'14px', padding:'20px',
                minHeight: preview ? 'auto' : '240px', display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', transition:'all 0.25s', position:'relative',
                background: dragOver ? `${ACCENT}08` : 'rgba(8,12,24,0.5)',
              }}>
              {preview ? (
                <div style={{ width:'100%', position:'relative' }}>
                  <img src={preview} alt="Chart" style={{ width:'100%', borderRadius:'10px', display:'block' }} />
                  <button onClick={e=>{e.stopPropagation();setImage(null);setPreview(null);setResult(null);}}
                    style={{ position:'absolute', top:8, right:8, width:28, height:28, borderRadius:'50%',
                      background:'rgba(0,0,0,0.7)', border:'none', color:'#fff', cursor:'pointer', fontSize:'16px',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                </div>
              ) : (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'42px', marginBottom:'10px', opacity:0.5 }}>☁️</div>
                  <div style={{ fontWeight:700, color:'#c8d0dc', fontSize:'15px', marginBottom:'4px' }}>Upload Chart Image</div>
                  <div style={{ fontSize:'12px', color:GRAY, marginBottom:'14px' }}>Drag & drop your trading chart screenshot here, or click to browse</div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:ACCENT, color:'#fff',
                    padding:'8px 18px', borderRadius:'10px', fontWeight:600, fontSize:'13px' }}>
                    ↻ Select Image
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeframe + Analyze */}
          {preview && (
            <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'12px', color:GRAY, fontWeight:600, marginBottom:'4px' }}>Chart Timeframe</div>
                <select value={tf.label} onChange={e=>{const found=timeframes.find(t=>t.label===e.target.value);if(found)setTf(found);}}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:'10px', background:'rgba(12,18,35,0.9)',
                    border:'1px solid '+BORDER_SUBTLE, color:'#e2e8f0', fontFamily:'inherit', fontSize:'14px', outline:'none', cursor:'pointer' }}>
                  {timeframes.map(t=><option key={t.label} value={t.label}>{t.label} ({t.cat})</option>)}
                </select>
              </div>
              <button onClick={analyze} disabled={!!busy}
                style={{ padding:'10px 28px', borderRadius:'12px', border:'none', cursor:busy?'wait':'pointer',
                  fontFamily:'inherit', fontSize:'15px', fontWeight:700, color:'#fff', transition:'all 0.2s',
                  background: busy ? `${RED}cc` : `linear-gradient(135deg, ${RED}, #dc2626)`,
                  boxShadow: busy ? 'none' : `0 4px 20px ${RED}33`,
                  opacity: busy ? 0.7 : 1, marginTop:'18px',
                }}>
                {busy ? (busy==='reading'?'Reading price...': busy.startsWith('analyzing') ? 'Analysis '+busy.slice(-3)+'...' : 'Analyzing...') : '📊 Analyze Chart'}
              </button>
            </div>
          )}

          {/* Live indicator */}
          {busy && (
            <div style={{ ...gradBorder(YELLOW), padding:'12px 18px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:YELLOW, animation:'liveDot 1s infinite' }} />
              <span style={{ fontSize:'13px', color:YELLOW, fontWeight:600 }}>
                {busy==='reading' ? '🔍 Step 1: Reading OHLC price from chart header...'
                  : busy.includes('1/3') ? '🧠 Step 2: Running reversal analysis (call 1 of 3)...'
                  : busy.includes('2/3') ? '🧠 Step 3: Running reversal analysis (call 2 of 3)...'
                  : busy.includes('3/3') ? '🧠 Step 4: Running reversal analysis (call 3 of 3)...'
                  : '🧠 Running 5-step reversal analysis...'}
              </span>
            </div>
          )}

          {error && (
            <div style={{ ...gradBorder(RED), padding:'16px 20px', borderColor:`${RED}30` }}>
              <div style={{ color:RED, fontSize:'14px', fontWeight:600 }}>⚠️ {error}</div>
              {(error.includes('401')||error.toLowerCase().includes('api key'))&&
                <div style={{ fontSize:'12px', color:GRAY, marginTop:'4px' }}>Check your API key in Settings.</div>}
            </div>
          )}

          {/* ═══ RESULTS ═══ */}
          {result && (
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              {/* Hero signal */}
              <div style={{ ...gradBorder(dc), padding:'28px', textAlign:'center', position:'relative', overflow:'hidden', borderColor:`${dc}30` }}>
                <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 30% 40%, ${dc}12 0%, transparent 60%)` }} />
                <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 70% 60%, ${dc}08 0%, transparent 50%)` }} />
                <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ textAlign:'left' }}>
                    {/* Signal badge */}
                    <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 14px', borderRadius:'20px',
                        background:`${dc}18`, border:`1px solid ${dc}30` }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:dc, animation:'liveDot 1.5s infinite' }} />
                        <span style={{ fontSize:'13px', fontWeight:800, color:dc, letterSpacing:'1px' }}>
                          {result.direction==='BUY'?'▲ BUY':result.direction==='SELL'?'▼ SELL':'— NEUTRAL'} SIGNAL
                        </span>
                      </span>
                      {result.isReversal && (
                        <span style={{ padding:'4px 10px', borderRadius:'16px', fontSize:'11px', fontWeight:700,
                          background:'rgba(245,158,11,0.12)', color:YELLOW, border:'1px solid rgba(245,158,11,0.25)' }}>
                          ⚡ REVERSAL
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize:'12px', color:GRAY, fontWeight:600, letterSpacing:'0.5px', marginBottom:'4px' }}>CURRENT PRICE</div>
                    <div style={{ fontSize:'48px', fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1,
                      textShadow:`0 0 40px ${dc}33` }}>
                      {fmt(result.currentPrice)}
                    </div>
                    <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
                      <span style={{ padding:'4px 12px', borderRadius:'16px', fontSize:'12px', fontWeight:600,
                        background:`${dc}12`, color:dc }}>{result.confidence}% conf</span>
                      <span style={{ padding:'4px 12px', borderRadius:'16px', fontSize:'12px', fontWeight:600,
                        background:'rgba(100,116,139,0.12)', color:'#8892a6' }}>{result.marketTrend}</span>
                    </div>
                    <div style={{ fontSize:'13px', color:dc, fontWeight:600, marginTop:'8px' }}>
                      Execute {result.direction==='SELL'?'short':'long'} @ {fmt(result.currentPrice)}
                    </div>
                  </div>
                  {result.direction !== 'NEUTRAL' && (
                    <div style={{ flexShrink:0 }}>
                      {result.direction==='BUY' ? <BullSVG size={150}/> : <BearSVG size={150}/>}
                    </div>
                  )}
                </div>
              </div>

              {/* SL / TP cards */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
                {[
                  { label:'STOP LOSS', val:result.sl, tag:'SL', color:RED, sub:`Risk: ${effectiveTf.riskPct}%` },
                  { label:'TAKE PROFIT 1', val:result.tp1, tag:'TP1', color:GREEN, sub:`Reward: ${result.rrRatio}` },
                  { label:'TAKE PROFIT 2', val:result.tp2, tag:'TP2', color:'#06b6d4', sub:'Reward: 2.0:1' },
                ].map(l => (
                  <div key={l.label} style={{ ...gradBorder(l.color), padding:'18px', borderColor:`${l.color}20` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                      <div style={{ fontSize:'11px', color:GRAY, fontWeight:700, letterSpacing:'0.5px' }}>{l.label}</div>
                      <span style={{ fontSize:'10px', fontWeight:700, color:l.color, background:`${l.color}15`,
                        padding:'2px 8px', borderRadius:'6px' }}>{l.tag}</span>
                    </div>
                    <div style={{ fontSize:'24px', fontWeight:800, color:l.color }}>{fmt(l.val)}</div>
                    <div style={{ fontSize:'11px', color:GRAY, marginTop:'2px' }}>{l.sub}</div>
                  </div>
                ))}
              </div>

              {/* Risk Management */}
              <div style={{ ...gradBorder(ACCENT), padding:'20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
                  <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:'8px' }}>
                    🎯 Risk Management
                  </h3>
                  <span style={{ padding:'4px 12px', borderRadius:'10px', fontSize:'12px', fontWeight:700,
                    background:`${ACCENT}12`, color:ACCENT, border:`1px solid ${ACCENT}20` }}>
                    R:R {result.rrRatio}
                  </span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'18px' }}>
                  {[
                    { label:'Risk %', val:effectiveTf.riskPct+'%' },
                    { label:'R-R Ratio', val:result.rrRatio },
                    { label:'Entry', val:fmt(result.currentPrice) },
                  ].map(s => (
                    <div key={s.label} style={{ background:'rgba(14,20,36,0.6)', borderRadius:'10px', padding:'12px', textAlign:'center' }}>
                      <div style={{ fontSize:'11px', color:GRAY, marginBottom:'3px' }}>{s.label}</div>
                      <div style={{ fontSize:'18px', fontWeight:700, color:'#e2e8f0' }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Price ladder */}
                <div style={{ position:'relative', height:'40px', background:'rgba(14,20,36,0.6)', borderRadius:'20px', overflow:'visible', margin:'10px 0' }}>
                  {(() => {
                    const buy = result.direction==='BUY';
                    const pts = buy
                      ? [{v:result.sl,c:RED,l:'SL'},{v:result.currentPrice,c:'#60a5fa',l:'Entr'},{v:result.tp1,c:GREEN,l:'TP1'},{v:result.tp2,c:'#06b6d4',l:'TP2'}]
                      : [{v:result.tp2,c:'#06b6d4',l:'TP2'},{v:result.tp1,c:GREEN,l:'TP1'},{v:result.currentPrice,c:'#60a5fa',l:'Entr'},{v:result.sl,c:RED,l:'SL'}];
                    const vs=pts.map(p=>p.v); const mn=Math.min(...vs),mx=Math.max(...vs),rg=mx-mn||1;
                    // Draw connector line
                    const minPct = 8, maxPct = 92;
                    return (
                      <>
                        <div style={{ position:'absolute', left:minPct+'%', right:(100-maxPct)+'%', top:'50%', height:'3px',
                          transform:'translateY(-50%)', borderRadius:'2px',
                          background:`linear-gradient(90deg, ${pts[0].c}66, ${pts[1].c}66, ${pts[2].c}66, ${pts[3].c}66)` }} />
                        {buy && <div style={{ position:'absolute', left:'50%', top:'14px', transform:'translateX(-50%)', fontSize:'14px' }}>←</div>}
                        {!buy && <div style={{ position:'absolute', left:'50%', top:'14px', transform:'translateX(-50%)', fontSize:'14px', color:GRAY }}>→</div>}
                        {pts.map((p,i) => {
                          const pct = ((p.v-mn)/rg)*(maxPct-minPct)+minPct;
                          return (
                            <div key={i} style={{ position:'absolute', left:pct+'%', top:'50%', transform:'translate(-50%,-50%)',
                              display:'flex', flexDirection:'column', alignItems:'center', zIndex:2 }}>
                              <span style={{ fontSize:'9px', fontWeight:700, color:p.c, background:`${p.c}20`,
                                padding:'1px 6px', borderRadius:'4px', marginBottom:'3px', border:`1px solid ${p.c}30` }}>{p.l}</span>
                              <div style={{ width:14, height:14, borderRadius:'50%', background:p.c,
                                boxShadow:`0 0 10px ${p.c}55`, border:'2px solid rgba(255,255,255,0.15)' }} />
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Reasoning */}
              <div style={{ ...gradBorder(GRAY), padding:'18px' }}>
                <button onClick={()=>setShowReasoning(!showReasoning)} style={{
                  background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', width:'100%',
                  display:'flex', alignItems:'center', justifyContent:'space-between', padding:0, color:'#fff',
                }}>
                  <span style={{ fontSize:'15px', fontWeight:700, display:'flex', alignItems:'center', gap:'8px' }}>
                    🧠 Trade Reasoning
                  </span>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:'8px', fontSize:'11px', fontWeight:700,
                      background:`${dc}15`, color:dc }}>{result.direction}</span>
                    <span style={{ transform:showReasoning?'rotate(180deg)':'rotate(0)', transition:'0.2s', fontSize:'12px', color:GRAY }}>▼</span>
                  </div>
                </button>
                {showReasoning && (
                  <div style={{ marginTop:'14px', display:'flex', flexDirection:'column', gap:'8px' }}>
                    {(result.reasoning||[]).map((r,i) => (
                      <div key={i} style={{ background:'rgba(14,20,36,0.5)', borderRadius:'10px', padding:'12px 16px',
                        fontSize:'13px', lineHeight:1.6, borderLeft:`3px solid ${ACCENT}33` }}>
                        <span style={{ color:ACCENT, fontWeight:700, fontSize:'11px', letterSpacing:'0.5px' }}>
                          STEP {['A','B','C','D','E'][i]} – {['TREND STRUCTURE','PRICE POSITION','KEY LEVELS','MOMENTUM','DECISION RULE'][i]}
                        </span>
                        <div style={{ color:'#b0b8c8', marginTop:'4px' }}>{r}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* S/R + Order Blocks */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div style={{ ...gradBorder(GREEN), padding:'16px' }}>
                  <div style={{ fontSize:'11px', color:GREEN, fontWeight:700, letterSpacing:'0.5px', marginBottom:'8px' }}>SUPPORT LEVELS</div>
                  {(result.supportLevels||[]).map((s,i)=><div key={i} style={{ fontSize:'16px', fontWeight:700, color:'#e2e8f0' }}>{fmt(s)}</div>)}
                </div>
                <div style={{ ...gradBorder(RED), padding:'16px' }}>
                  <div style={{ fontSize:'11px', color:RED, fontWeight:700, letterSpacing:'0.5px', marginBottom:'8px' }}>RESISTANCE LEVELS</div>
                  {(result.resistanceLevels||[]).map((r,i)=><div key={i} style={{ fontSize:'16px', fontWeight:700, color:'#e2e8f0' }}>{fmt(r)}</div>)}
                </div>
              </div>

              {(result.orderBlocks||[]).length > 0 && (
                <div style={{ ...gradBorder(ACCENT2), padding:'16px' }}>
                  <div style={{ fontSize:'11px', color:ACCENT2, fontWeight:700, letterSpacing:'0.5px', marginBottom:'8px' }}>ORDER BLOCKS</div>
                  {result.orderBlocks.map((ob,i) => (
                    <div key={i} style={{ fontSize:'13px', color:ob.type==='bullish'?GREEN:RED, marginBottom:'2px' }}>
                      {ob.type==='bullish'?'🟢':'🔴'} {ob.type} OB: {fmt(ob.from)} → {fmt(ob.to)}
                    </div>
                  ))}
                </div>
              )}

              {/* Details grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px' }}>
                {[
                  { label:'Pattern', val:result.pattern },
                  { label:'Volume', val:result.volume },
                  { label:'Momentum', val:result.momentum },
                  { label:'Time in Trade', val:result.timeInTrade },
                ].map(d => (
                  <div key={d.label} style={{ ...gradBorder(GRAY), padding:'12px', textAlign:'center' }}>
                    <div style={{ fontSize:'10px', color:GRAY, fontWeight:600, letterSpacing:'0.5px', marginBottom:'3px' }}>{d.label.toUpperCase()}</div>
                    <div style={{ fontSize:'12px', fontWeight:600, color:'#c8d0dc', wordBreak:'break-word' }}>{d.val||'—'}</div>
                  </div>
                ))}
              </div>

              {/* Outcome */}
              <div style={{ ...gradBorder(ACCENT), padding:'18px', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'13px', fontWeight:700, color:'#c8d0dc' }}>Trade Outcome:</span>
                {['won','lost','not taken'].map(o => (
                  <button key={o} onClick={()=>setOutcome(o)} style={{
                    padding:'7px 16px', borderRadius:'10px', border: outcome===o ? 'none' : '1px solid '+BORDER_SUBTLE,
                    cursor:'pointer', fontFamily:'inherit', fontSize:'12px', fontWeight:600, transition:'all 0.2s',
                    background: outcome===o ? (o==='won'?GREEN:o==='lost'?RED:GRAY) : 'rgba(14,20,36,0.6)',
                    color: outcome===o ? '#fff' : '#8892a6',
                  }}>{o.charAt(0).toUpperCase()+o.slice(1)}</button>
                ))}
                <button onClick={save} disabled={!outcome} style={{
                  marginLeft:'auto', padding:'8px 20px', borderRadius:'10px', border:'none', cursor:outcome?'pointer':'default',
                  fontFamily:'inherit', fontSize:'13px', fontWeight:700, color:'#fff', transition:'all 0.2s',
                  background: outcome ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : 'rgba(30,40,60,0.5)',
                  opacity: outcome ? 1 : 0.4, boxShadow: outcome ? `0 4px 16px ${ACCENT}33` : 'none',
                }}>💾 Save to Journal</button>
              </div>
            </div>
          )}

          {!result && !busy && !error && !preview && (
            <div style={{ display:'none' }} /> 
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:'14px', position:'sticky', top:'20px' }}>
          {/* Tab bar */}
          <div style={{ display:'flex', borderRadius:'12px', overflow:'hidden', border:'1px solid '+BORDER_SUBTLE }}>
            {['setup','history'].map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{
                flex:1, padding:'10px', border:'none', cursor:'pointer', fontFamily:'inherit',
                fontSize:'13px', fontWeight:600, transition:'all 0.2s',
                background: tab===t ? 'rgba(14,165,233,0.1)' : 'rgba(8,12,24,0.6)',
                color: tab===t ? ACCENT : GRAY,
                borderBottom: tab===t ? `2px solid ${ACCENT}` : '2px solid transparent',
              }}>{t==='setup'?'Trade Setup':'History'}</button>
            ))}
          </div>

          {tab === 'setup' ? (
            <>
              {/* Pre-Trade Calculator */}
              <div style={{ ...gradBorder(ACCENT), padding:'18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                  <span style={{ fontSize:'16px' }}>📊</span>
                  <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff' }}>Pre-Trade Setup Calculator</h3>
                </div>
                <p style={{ fontSize:'11px', color:GRAY, marginBottom:'12px' }}>Set your risk parameters for trade analysis</p>
                <div style={{ fontSize:'12px', color:ACCENT, fontWeight:600, marginBottom:'14px' }}>
                  Using {tf.label} {mode} timeframe settings
                </div>

                {/* Timeframe quick select */}
                <div style={{ background:`${ACCENT}10`, borderRadius:'10px', padding:'10px 14px', marginBottom:'14px',
                  border:`1px solid ${ACCENT}15` }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:ACCENT, marginBottom:'4px' }}>⏱ {tf.label}</div>
                  <div style={{ fontSize:'11px', color:GRAY }}>({tf.cat})</div>
                </div>

                <div style={{ fontSize:'11px', fontWeight:700, color:GRAY, letterSpacing:'0.5px', marginBottom:'8px' }}>RISK PARAMETERS</div>
                {[
                  { label:'Account Balance ($)', val:bal, set:v=>setBal(Number(v)||0), rec:null },
                  { label:'Risk Per Trade (%)', val:riskOverride!==null?riskOverride:tf.riskPct, set:v=>setRiskOverride(Number(v)||0), rec:`Rec: ${tf.riskPct}% for ${tf.label}` },
                  { label:'Stop Loss (Points)', val:slOverride!==null?slOverride:tf.stopPts, set:v=>setSlOverride(Number(v)||0), rec:`Rec: ${tf.stopPts} pts for ${tf.label}` },
                  { label:'Take Profit (Points)', val:tpOverride!==null?tpOverride:tf.tpPts, set:v=>setTpOverride(Number(v)||0), rec:`Auto-calculated at ${(tf.tpPts/tf.stopPts).toFixed(1)}:1 risk-reward` },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom:'12px' }}>
                    <label style={{ fontSize:'12px', fontWeight:600, color:'#8892a6', display:'block', marginBottom:'4px' }}>{f.label}</label>
                    <input type="number" value={f.val} onChange={e=>f.set(e.target.value)}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:'8px', background:'rgba(8,12,24,0.8)',
                        border:'1px solid '+BORDER_SUBTLE, color:'#e2e8f0', fontFamily:'inherit', fontSize:'14px', outline:'none' }} />
                    {f.rec && <div style={{ fontSize:'11px', color:GRAY, marginTop:'2px' }}>{f.rec}</div>}
                  </div>
                ))}

                {/* Calculated metrics */}
                <div style={{ background:`${ACCENT}08`, borderRadius:'10px', padding:'14px', border:`1px solid ${ACCENT}15`, marginTop:'4px' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, color:ACCENT, letterSpacing:'0.5px', marginBottom:'10px' }}>CALCULATED METRICS</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    {[
                      { label:'Dollar Risk', val:'$'+calcMetrics.dollarRisk },
                      { label:'R:R Ratio', val:calcMetrics.rr+':1' },
                      { label:'Stop Loss $', val:'$'+calcMetrics.slDollar },
                      { label:'Take Profit $', val:'$'+calcMetrics.tpDollar },
                    ].map(m => (
                      <div key={m.label} style={{ background:'rgba(8,12,24,0.5)', borderRadius:'8px', padding:'8px 10px' }}>
                        <div style={{ fontSize:'10px', color:GRAY, marginBottom:'2px' }}>{m.label}</div>
                        <div style={{ fontSize:'16px', fontWeight:700, color:'#e2e8f0' }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Timeframe */}
              <div style={{ ...gradBorder(ACCENT2), padding:'16px' }}>
                <div style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'10px' }}>⏱ Quick Timeframe</div>
                {cats.map(([cat, items]) => (
                  <div key={cat} style={{ marginBottom:'8px' }}>
                    <div style={{ fontSize:'10px', fontWeight:700, color:GRAY, letterSpacing:'1px', marginBottom:'4px' }}>{cat}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                      {items.map(t => (
                        <button key={t.label} onClick={()=>setTf(t)} style={{
                          padding:'5px 10px', borderRadius:'6px', border: tf.label===t.label ? `1px solid ${ACCENT}` : '1px solid '+BORDER_SUBTLE,
                          background: tf.label===t.label ? `${ACCENT}15` : 'rgba(14,20,36,0.5)',
                          color: tf.label===t.label ? ACCENT : '#7a8599', cursor:'pointer',
                          fontFamily:'inherit', fontSize:'11px', fontWeight:600, transition:'all 0.15s',
                        }}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div style={{ ...gradBorder(YELLOW), padding:'16px' }}>
                <div style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'8px' }}>🔥 {mode==='scalp'?'Scalping':'Swing'} Tips</div>
                {(mode === 'scalp' ? [
                  '1-Sec/5-Sec: Use Level 2 data for best results',
                  '30-Sec charts work best with momentum setups',
                  'Keep tight stops — exit quickly on reversals',
                  '1-Min is ideal for most scalp setups',
                  'Always trade with the higher timeframe trend',
                ] : [
                  'Use 4-Hr for primary trend identification',
                  'Daily charts offer clearest structure',
                  'Weekly levels are strongest S/R zones',
                  'Allow trades room to breathe — wider stops',
                  'Look for confluence across multiple timeframes',
                ]).map((tip,i) => (
                  <div key={i} style={{ fontSize:'12px', color:'#8892a6', padding:'4px 0', display:'flex', gap:'6px' }}>
                    <span style={{ color:YELLOW, flexShrink:0 }}>•</span> {tip}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ ...gradBorder(GRAY), padding:'18px' }}>
              <h3 style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'12px' }}>Recent Trades</h3>
              {journal.filter(t=>t.mode===mode).length===0 ? (
                <div style={{ fontSize:'13px', color:GRAY, textAlign:'center', padding:'20px 0' }}>No {mode} trades yet.</div>
              ) : [...journal].filter(t=>t.mode===mode).reverse().slice(0,8).map(t => (
                <div key={t.id} style={{ padding:'8px 0', borderBottom:'1px solid rgba(56,68,100,0.12)', fontSize:'12px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:t.direction==='BUY'?GREEN:RED, fontWeight:700 }}>{t.direction==='BUY'?'▲':'▼'} {t.direction}</span>
                    <span style={{ color:t.outcome==='won'?GREEN:t.outcome==='lost'?RED:GRAY, fontWeight:600 }}>{(t.outcome||'—').toUpperCase()}</span>
                  </div>
                  <div style={{ color:GRAY }}>{t.timeframe} · {fmt(t.entryPrice)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── JOURNAL ────────────────────────────────────────────────────────────
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

// ─── HISTORY ────────────────────────────────────────────────────────────
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

// ─── LEARNING ───────────────────────────────────────────────────────────
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

// ─── SETTINGS ───────────────────────────────────────────────────────────
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

// ─── PLANS ──────────────────────────────────────────────────────────────
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

// ─── SUPPORT ────────────────────────────────────────────────────────────
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

// ─── MAIN APP ───────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [journal, setJournal] = useState([]);
  const [apiKeys, setApiKeys] = useState({ claude:'', openai:'', minimax:'', localPort:'8080' });
  const [provider, setProvider] = useState(typeof window!=='undefined'&&window.location.hostname==='localhost'?'local':'claude');
  const [bal, setBal] = useState(10000);

  const render = () => {
    switch(page) {
      case 'dashboard': return <DashboardPage journal={journal} setPage={setPage} />;
      case 'scalp': return <TradingPage mode="scalp" timeframes={SCALP_TF} journal={journal} setJournal={setJournal} apiKeys={apiKeys} provider={provider} setProvider={setProvider} />;
      case 'swing': return <TradingPage mode="swing" timeframes={SWING_TF} journal={journal} setJournal={setJournal} apiKeys={apiKeys} provider={provider} setProvider={setProvider} />;
      case 'journal': return <JournalPage journal={journal} setJournal={setJournal} />;
      case 'history': return <HistoryPage journal={journal} />;
      case 'learning': return <LearningPage />;
      case 'settings': return <SettingsPage apiKeys={apiKeys} setApiKeys={setApiKeys} provider={provider} setProvider={setProvider} bal={bal} setBal={setBal} />;
      case 'plans': return <PlansPage />;
      case 'support': return <SupportPage />;
      default: return <DashboardPage journal={journal} setPage={setPage} />;
    }
  };

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', fontFamily:"'DM Sans', -apple-system, sans-serif", color:'#e2e8f0', overflow:'hidden' }}>
      <GridBg />
      <Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <main style={{ flex:1, overflowY:'auto', padding:'28px 32px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>{render()}</div>
      </main>
      <style>{`
        @keyframes liveDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes mascotPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.08);opacity:1} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        *::-webkit-scrollbar{width:5px} *::-webkit-scrollbar-track{background:transparent} *::-webkit-scrollbar-thumb{background:rgba(56,68,100,0.3);border-radius:3px}
        ::selection{background:${ACCENT}33}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
      `}</style>
    </div>
  );
}
