// ═══════════════════════════════════════════════════════════════════════════
// CHART SNIPER — Core Analysis Logic (extracted for testability)
// ═══════════════════════════════════════════════════════════════════════════

export function parseJSON(text) {
  let s = text.trim().replace(/```json\s*/g,'').replace(/```\s*/g,'');
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0].replace(/,\s*([\]}])/g,'$1')); } catch { return null; }
}

export function calcLevels(price, dir, tf, bal) {
  const {stopPts, tpPts, riskPct} = tf;
  const s = dir === 'SELL';
  return {
    sl: s ? price + stopPts : price - stopPts,
    tp1: s ? price - tpPts : price + tpPts,
    tp2: s ? price - tpPts * 1.5 : price + tpPts * 1.5,
    dollarRisk: bal * riskPct / 100,
    rrRatio: (tpPts / stopPts).toFixed(2) + ':1',
    riskPct,
    stopPts,
    tpPts
  };
}

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

export function resolveConsensus(parsed) {
  if (!parsed.length) return null;

  const votes = { BUY: 0, SELL: 0, NEUTRAL: 0 };
  parsed.forEach(p => {
    const d = (p.direction || '').toUpperCase();
    if (votes[d] !== undefined) votes[d]++;
  });

  let winDir = 'NEUTRAL';
  if (votes.BUY > votes.SELL && votes.BUY > votes.NEUTRAL) winDir = 'BUY';
  else if (votes.SELL > votes.BUY && votes.SELL > votes.NEUTRAL) winDir = 'SELL';

  const winners = parsed.filter(p => (p.direction || '').toUpperCase() === winDir);
  let best = { ...(winners.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0] || parsed[0]) };
  best.direction = winDir;

  const agree = votes[winDir];
  if (agree === 3) best.confidence = Math.min(99, (best.confidence || 70) + 12);
  else if (agree >= 2) best.confidence = Math.min(95, (best.confidence || 70) + 5);

  const note = 'Consensus: ' + agree + '/' + parsed.length + ' AI analyses agreed on ' + winDir + ' direction.';
  if (Array.isArray(best.reasoning) && best.reasoning.length) best.reasoning[0] = note + ' ' + best.reasoning[0];
  else best.reasoning = [note, 'N/A', 'N/A', 'N/A', 'N/A'];

  return best;
}

export const fmt = (n) => typeof n === 'number' ? n.toFixed(2) : '—';
