// ─── API ENGINE ────────────────────────────────────────────────────────

export function buildPricePrompt() {
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

export function buildAnalysisPrompt(tf, mode) {
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

export function imageToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export function parseJSON(text) {
  let s = text.trim().replace(/```json\s*/g,'').replace(/```\s*/g,'');
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0].replace(/,\s*([\]}])/g,'$1')); } catch { return null; }
}

export async function callProvider(prov, keys, sys, content, maxTok) {
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

export async function runAnalysis(file, prov, keys, tf, mode, onStatus) {
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

export function calcLevels(price, dir, tf, bal) {
  const {stopPts,tpPts,riskPct}=tf;
  const s=dir==='SELL';
  return { sl:s?price+stopPts:price-stopPts, tp1:s?price-tpPts:price+tpPts,
    tp2:s?price-tpPts*1.5:price+tpPts*1.5, dollarRisk:bal*riskPct/100,
    rrRatio:(tpPts/stopPts).toFixed(2)+':1', riskPct, stopPts, tpPts };
}

export const fmt=(n)=>typeof n==='number'?n.toFixed(2):'—';
