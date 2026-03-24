import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ACCENT, ACCENT2, GREEN, RED, YELLOW, GRAY, BORDER_SUBTLE, PROVIDERS, gradBorder } from './constants';
import { runAnalysis, calcLevels, fmt } from './api';
import BullSVG from './BullSVG';
import BearSVG from './BearSVG';

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

export default TradingPage;
