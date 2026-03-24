import { describe, it, expect } from 'vitest';
import { parseJSON, calcLevels, buildPricePrompt, buildAnalysisPrompt, resolveConsensus, fmt } from './analysis.js';

// ═══════════════════════════════════════════════════════════════════════════
// parseJSON — LLM output extraction
// ═══════════════════════════════════════════════════════════════════════════

describe('parseJSON', () => {
  it('parses clean JSON', () => {
    const result = parseJSON('{"direction":"BUY","confidence":85}');
    expect(result).toEqual({ direction: 'BUY', confidence: 85 });
  });

  it('strips markdown code fences', () => {
    const input = '```json\n{"direction":"SELL","confidence":72}\n```';
    const result = parseJSON(input);
    expect(result).toEqual({ direction: 'SELL', confidence: 72 });
  });

  it('extracts JSON from surrounding text', () => {
    const input = 'Here is my analysis:\n{"direction":"BUY","confidence":60}\nHope that helps!';
    const result = parseJSON(input);
    expect(result).toEqual({ direction: 'BUY', confidence: 60 });
  });

  it('handles trailing commas in JSON', () => {
    const input = '{"direction":"SELL","confidence":70,}';
    const result = parseJSON(input);
    expect(result).toEqual({ direction: 'SELL', confidence: 70 });
  });

  it('handles trailing commas before closing bracket in arrays', () => {
    const input = '{"levels":[1,2,3,]}';
    const result = parseJSON(input);
    expect(result).toEqual({ levels: [1, 2, 3] });
  });

  it('returns null for empty string', () => {
    expect(parseJSON('')).toBeNull();
  });

  it('returns null for plain text with no JSON', () => {
    expect(parseJSON('I cannot analyze this chart.')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseJSON('{direction: BUY}')).toBeNull();
  });

  it('parses nested objects', () => {
    const input = '{"direction":"BUY","orderBlocks":[{"type":"bullish","from":100,"to":105}]}';
    const result = parseJSON(input);
    expect(result.orderBlocks).toHaveLength(1);
    expect(result.orderBlocks[0].type).toBe('bullish');
  });

  it('handles whitespace and newlines in JSON', () => {
    const input = `{
      "direction": "SELL",
      "confidence": 88
    }`;
    const result = parseJSON(input);
    expect(result.direction).toBe('SELL');
    expect(result.confidence).toBe(88);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// calcLevels — Risk management calculations
// ═══════════════════════════════════════════════════════════════════════════

describe('calcLevels', () => {
  const scalp1m = { stopPts: 5, tpPts: 7, riskPct: 0.20 };
  const swing4h = { stopPts: 50, tpPts: 75, riskPct: 1.0 };

  describe('BUY direction', () => {
    it('places stop loss below entry', () => {
      const levels = calcLevels(25000, 'BUY', scalp1m, 10000);
      expect(levels.sl).toBe(24995);
    });

    it('places TP1 above entry', () => {
      const levels = calcLevels(25000, 'BUY', scalp1m, 10000);
      expect(levels.tp1).toBe(25007);
    });

    it('places TP2 at 1.5x the TP distance', () => {
      const levels = calcLevels(25000, 'BUY', scalp1m, 10000);
      expect(levels.tp2).toBe(25010.5);
    });
  });

  describe('SELL direction', () => {
    it('places stop loss above entry', () => {
      const levels = calcLevels(25000, 'SELL', scalp1m, 10000);
      expect(levels.sl).toBe(25005);
    });

    it('places TP1 below entry', () => {
      const levels = calcLevels(25000, 'SELL', scalp1m, 10000);
      expect(levels.tp1).toBe(24993);
    });

    it('places TP2 at 1.5x the TP distance', () => {
      const levels = calcLevels(25000, 'SELL', scalp1m, 10000);
      expect(levels.tp2).toBe(24989.5);
    });
  });

  describe('dollar risk calculation', () => {
    it('calculates correct dollar risk for scalp', () => {
      const levels = calcLevels(25000, 'BUY', scalp1m, 10000);
      expect(levels.dollarRisk).toBe(20); // 10000 * 0.20 / 100
    });

    it('calculates correct dollar risk for swing', () => {
      const levels = calcLevels(5000, 'SELL', swing4h, 50000);
      expect(levels.dollarRisk).toBe(500); // 50000 * 1.0 / 100
    });

    it('handles zero balance', () => {
      const levels = calcLevels(25000, 'BUY', scalp1m, 0);
      expect(levels.dollarRisk).toBe(0);
    });
  });

  describe('risk:reward ratio', () => {
    it('computes correct R:R for scalp timeframe', () => {
      const levels = calcLevels(25000, 'BUY', scalp1m, 10000);
      expect(levels.rrRatio).toBe('1.40:1');
    });

    it('computes correct R:R for swing timeframe', () => {
      const levels = calcLevels(5000, 'SELL', swing4h, 50000);
      expect(levels.rrRatio).toBe('1.50:1');
    });
  });

  it('passes through timeframe params', () => {
    const levels = calcLevels(25000, 'BUY', scalp1m, 10000);
    expect(levels.riskPct).toBe(0.20);
    expect(levels.stopPts).toBe(5);
    expect(levels.tpPts).toBe(7);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// resolveConsensus — Multi-call voting logic
// ═══════════════════════════════════════════════════════════════════════════

describe('resolveConsensus', () => {
  it('returns null for empty array', () => {
    expect(resolveConsensus([])).toBeNull();
  });

  it('returns the single result when only 1 call succeeds', () => {
    const parsed = [{ direction: 'BUY', confidence: 70, reasoning: ['trend up'] }];
    const result = resolveConsensus(parsed);
    expect(result.direction).toBe('BUY');
  });

  it('selects majority direction with 2/3 agreement', () => {
    const parsed = [
      { direction: 'BUY', confidence: 75, reasoning: ['a'] },
      { direction: 'SELL', confidence: 80, reasoning: ['b'] },
      { direction: 'BUY', confidence: 70, reasoning: ['c'] },
    ];
    const result = resolveConsensus(parsed);
    expect(result.direction).toBe('BUY');
  });

  it('boosts confidence by 5 for 2/3 consensus', () => {
    const parsed = [
      { direction: 'SELL', confidence: 80, reasoning: ['a'] },
      { direction: 'SELL', confidence: 75, reasoning: ['b'] },
      { direction: 'BUY', confidence: 90, reasoning: ['c'] },
    ];
    const result = resolveConsensus(parsed);
    expect(result.direction).toBe('SELL');
    expect(result.confidence).toBe(85); // 80 + 5
  });

  it('boosts confidence by 12 for 3/3 unanimous consensus', () => {
    const parsed = [
      { direction: 'BUY', confidence: 82, reasoning: ['a'] },
      { direction: 'BUY', confidence: 78, reasoning: ['b'] },
      { direction: 'BUY', confidence: 80, reasoning: ['c'] },
    ];
    const result = resolveConsensus(parsed);
    expect(result.direction).toBe('BUY');
    expect(result.confidence).toBe(94); // 82 + 12
  });

  it('caps confidence at 99 for unanimous consensus', () => {
    const parsed = [
      { direction: 'SELL', confidence: 95, reasoning: ['a'] },
      { direction: 'SELL', confidence: 92, reasoning: ['b'] },
      { direction: 'SELL', confidence: 90, reasoning: ['c'] },
    ];
    const result = resolveConsensus(parsed);
    expect(result.confidence).toBe(99); // 95 + 12 = 107, capped at 99
  });

  it('caps confidence at 95 for 2/3 consensus', () => {
    const parsed = [
      { direction: 'BUY', confidence: 93, reasoning: ['a'] },
      { direction: 'BUY', confidence: 88, reasoning: ['b'] },
      { direction: 'SELL', confidence: 70, reasoning: ['c'] },
    ];
    const result = resolveConsensus(parsed);
    expect(result.confidence).toBe(95); // 93 + 5 = 98, capped at 95
  });

  it('picks highest confidence winner among majority', () => {
    const parsed = [
      { direction: 'BUY', confidence: 60, reasoning: ['weak'] },
      { direction: 'BUY', confidence: 85, reasoning: ['strong'] },
      { direction: 'SELL', confidence: 90, reasoning: ['dissent'] },
    ];
    const result = resolveConsensus(parsed);
    expect(result.direction).toBe('BUY');
    // Should use the 85-confidence result as base, then +5
    expect(result.confidence).toBe(90);
  });

  it('prepends consensus note to reasoning', () => {
    const parsed = [
      { direction: 'SELL', confidence: 70, reasoning: ['bearish pattern'] },
      { direction: 'SELL', confidence: 72, reasoning: ['resistance rejection'] },
    ];
    const result = resolveConsensus(parsed);
    expect(result.reasoning[0]).toContain('Consensus: 2/2');
    expect(result.reasoning[0]).toContain('SELL');
  });

  it('creates default reasoning array when missing', () => {
    const parsed = [
      { direction: 'BUY', confidence: 70 },
      { direction: 'BUY', confidence: 65 },
    ];
    const result = resolveConsensus(parsed);
    expect(result.reasoning).toHaveLength(5);
    expect(result.reasoning[0]).toContain('Consensus');
    expect(result.reasoning[1]).toBe('N/A');
  });

  it('handles case-insensitive direction matching', () => {
    const parsed = [
      { direction: 'buy', confidence: 70, reasoning: ['a'] },
      { direction: 'Buy', confidence: 75, reasoning: ['b'] },
      { direction: 'BUY', confidence: 80, reasoning: ['c'] },
    ];
    const result = resolveConsensus(parsed);
    expect(result.direction).toBe('BUY');
  });

  it('defaults to NEUTRAL when votes are tied', () => {
    const parsed = [
      { direction: 'BUY', confidence: 80, reasoning: ['a'] },
      { direction: 'SELL', confidence: 80, reasoning: ['b'] },
    ];
    const result = resolveConsensus(parsed);
    expect(result.direction).toBe('NEUTRAL');
  });

  it('handles missing confidence gracefully', () => {
    const parsed = [
      { direction: 'BUY', reasoning: ['a'] },
      { direction: 'BUY', reasoning: ['b'] },
      { direction: 'BUY', reasoning: ['c'] },
    ];
    const result = resolveConsensus(parsed);
    // confidence defaults to 70, then +12 = 82
    expect(result.confidence).toBe(82);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// buildPricePrompt — Prompt construction
// ═══════════════════════════════════════════════════════════════════════════

describe('buildPricePrompt', () => {
  it('returns a string containing OHLC instructions', () => {
    const prompt = buildPricePrompt();
    expect(prompt).toContain('OHLC');
    expect(prompt).toContain('close price');
  });

  it('includes example output format', () => {
    const prompt = buildPricePrompt();
    expect(prompt).toContain('24913.00');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// buildAnalysisPrompt — Analysis prompt construction
// ═══════════════════════════════════════════════════════════════════════════

describe('buildAnalysisPrompt', () => {
  it('includes the timeframe and mode', () => {
    const prompt = buildAnalysisPrompt('1-Min', 'scalp');
    expect(prompt).toContain('1-Min');
    expect(prompt).toContain('scalp');
  });

  it('contains all 5 analysis steps', () => {
    const prompt = buildAnalysisPrompt('4-Hr', 'swing');
    expect(prompt).toContain('STEP A');
    expect(prompt).toContain('STEP B');
    expect(prompt).toContain('STEP C');
    expect(prompt).toContain('STEP D');
    expect(prompt).toContain('STEP E');
  });

  it('includes bias warning', () => {
    const prompt = buildAnalysisPrompt('1-Min', 'scalp');
    expect(prompt).toContain('BIAS WARNING');
  });

  it('specifies JSON output format', () => {
    const prompt = buildAnalysisPrompt('Daily', 'swing');
    expect(prompt).toContain('raw JSON object');
    expect(prompt).toContain('direction');
    expect(prompt).toContain('confidence');
  });

  it('includes all 5 decision rules', () => {
    const prompt = buildAnalysisPrompt('5-Min', 'scalp');
    expect(prompt).toContain('RULE 1');
    expect(prompt).toContain('RULE 2');
    expect(prompt).toContain('RULE 3');
    expect(prompt).toContain('RULE 4');
    expect(prompt).toContain('RULE 5');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// fmt — Number formatting utility
// ═══════════════════════════════════════════════════════════════════════════

describe('fmt', () => {
  it('formats numbers to 2 decimal places', () => {
    expect(fmt(25000)).toBe('25000.00');
    expect(fmt(3.1)).toBe('3.10');
    expect(fmt(0.5)).toBe('0.50');
  });

  it('returns dash for non-numbers', () => {
    expect(fmt(undefined)).toBe('—');
    expect(fmt(null)).toBe('—');
    expect(fmt('hello')).toBe('—');
  });

  it('handles zero', () => {
    expect(fmt(0)).toBe('0.00');
  });

  it('handles negative numbers', () => {
    expect(fmt(-5.123)).toBe('-5.12');
  });
});
