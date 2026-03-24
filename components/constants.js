// ═══════════════════════════════════════════════════════════════════════════
// CHART SNIPER — Constants & Configuration
// ═══════════════════════════════════════════════════════════════════════════

export const ACCENT = '#0ea5e9';
export const ACCENT2 = '#6366f1';
export const GREEN = '#10b981';
export const RED = '#ef4444';
export const YELLOW = '#f59e0b';
export const GRAY = '#64748b';
export const BG_DEEP = '#070a12';
export const BG_CARD = 'rgba(12,18,35,0.72)';
export const BORDER_SUBTLE = 'rgba(56,68,100,0.25)';
export const GLASS = 'blur(20px) saturate(1.4)';

export const SCALP_TF = [
  { label:'1-Sec',  cat:'ULTRA-SHORT', riskPct:0.10, stopPts:2.0,  tpPts:2.6 },
  { label:'5-Sec',  cat:'ULTRA-SHORT', riskPct:0.12, stopPts:2.5,  tpPts:3.25 },
  { label:'15-Sec', cat:'ULTRA-SHORT', riskPct:0.15, stopPts:3.0,  tpPts:3.9 },
  { label:'30-Sec', cat:'ULTRA-SHORT', riskPct:0.18, stopPts:4.0,  tpPts:5.2 },
  { label:'1-Min',  cat:'SHORT',       riskPct:0.25, stopPts:6.0,  tpPts:7.8 },
  { label:'2-Min',  cat:'SHORT',       riskPct:0.30, stopPts:8.0,  tpPts:10.4 },
  { label:'3-Min',  cat:'SHORT',       riskPct:0.35, stopPts:10.0, tpPts:13.0 },
  { label:'5-Min',  cat:'SHORT',       riskPct:0.40, stopPts:12.0, tpPts:15.6 },
];

export const SWING_TF = [
  { label:'15-Min',  cat:'INTRADAY', riskPct:0.5,   stopPts:15,   tpPts:22.5 },
  { label:'30-Min',  cat:'INTRADAY', riskPct:0.6,   stopPts:20,   tpPts:30 },
  { label:'1-Hr',    cat:'INTRADAY', riskPct:0.75,  stopPts:25,   tpPts:37.5 },
  { label:'2-Hr',    cat:'INTRADAY', riskPct:0.85,  stopPts:30,   tpPts:45 },
  { label:'4-Hr',    cat:'POSITIONAL', riskPct:1.0,  stopPts:40,   tpPts:60 },
  { label:'Daily',   cat:'POSITIONAL', riskPct:1.25, stopPts:60,   tpPts:90 },
  { label:'Weekly',  cat:'MACRO',      riskPct:1.5,  stopPts:100,  tpPts:150 },
  { label:'Monthly', cat:'MACRO',      riskPct:2.0,  stopPts:200,  tpPts:300 },
];

export const PROVIDERS = [
  { id:'claude',  label:'Claude',    icon:'◆' },
  { id:'openai',  label:'ChatGPT',   icon:'◈' },
  { id:'minimax', label:'Minimax',    icon:'◇' },
  { id:'local',   label:'Local LLM', icon:'◉' },
];

export const NAV = [
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
export const gradBorder = (color, opacity = 0.3) => ({
  position: 'relative',
  background: BG_CARD,
  borderRadius: '16px',
  border: `1px solid ${BORDER_SUBTLE}`,
  backdropFilter: GLASS,
  overflow: 'hidden',
});

export const glowBorder = (color) => `0 0 0 1px ${color}22, 0 0 20px ${color}11, 0 4px 24px rgba(0,0,0,0.3)`;
