import React, { useState } from 'react';
import {
  ACCENT, ACCENT2, GREEN, GRAY, BG_DEEP, BG_CARD,
  BORDER_SUBTLE, GLASS, gradBorder, glowBorder
} from './constants';
import GridBg from './GridBg';

// ═══════════════════════════════════════════════════════════════════════════
// CHART SNIPER — Landing Page
// ═══════════════════════════════════════════════════════════════════════════

const FEATURES = [
  { icon: '◈', title: 'Multi-Model AI', desc: 'Consensus voting across Claude, GPT-4o, and local models for reliable signals' },
  { icon: '⚡', title: 'Smart Routing', desc: 'Automatic model selection: cheap models first, premium only when needed. Save 60-70% on API costs' },
  { icon: '▤', title: '5-Step Analysis', desc: 'Structured evaluation framework prevents bias and hallucinated confidence' },
  { icon: '◎', title: 'Risk Management', desc: 'Auto-calculated SL, TP1, TP2 with position sizing for 15 timeframes' },
  { icon: '◫', title: 'Trade Journal', desc: 'Track every analysis with outcomes. Monitor win rate and performance over time' },
  { icon: '⬡', title: 'Prompt Versioning', desc: 'A/B test different prompt strategies. Track which version produces the best results' },
];

const STEPS = [
  { num: '01', title: 'Upload your chart screenshot' },
  { num: '02', title: 'AI analyzes trend, patterns, levels, momentum, and structure' },
  { num: '03', title: 'Get a BUY/SELL signal with confidence score and risk levels' },
];

const PLANS = [
  {
    name: 'Free', price: '$0', period: '/mo', primary: false,
    features: ['5 analyses/day', 'All providers', 'Basic journal'],
    cta: 'Get Started',
  },
  {
    name: 'Pro', price: '$29', period: '/mo', primary: true,
    features: ['Unlimited analyses', 'All providers', 'Full history', 'Priority support'],
    cta: 'Upgrade to Pro',
  },
];

const TECH = ['React', 'FastAPI', 'Claude', 'GPT-4o', 'ChromaDB', 'Docker'];

export default function LandingPage({ onGetStarted }) {
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const gradientText = {
    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const sectionStyle = {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '80px 24px',
  };

  const sectionTitle = {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
    ...gradientText,
  };

  const sectionHeading = {
    fontSize: 32,
    fontWeight: 700,
    textAlign: 'center',
    color: '#e2e8f0',
    marginBottom: 48,
    lineHeight: 1.3,
  };

  const cardBase = {
    ...gradBorder(ACCENT),
    padding: '28px 24px',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#e2e8f0', position: 'relative', overflowX: 'hidden' }}>
      <GridBg />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '0 24px' }}>
        {/* Animated glow */}
        <div style={{
          position: 'absolute', width: 480, height: 480, borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT}18 0%, ${ACCENT2}08 40%, transparent 70%)`,
          animation: 'heroGlow 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20, ...gradientText }}>
          Chart Sniper
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, maxWidth: 700 }}>
          <span style={gradientText}>AI-Powered</span>{' '}
          <span style={{ color: '#e2e8f0' }}>Chart Analysis</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: GRAY, maxWidth: 520, lineHeight: 1.6, marginBottom: 40 }}>
          Upload a chart. Get a signal. Trade with confidence.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={onGetStarted}
            onMouseEnter={() => setHoveredBtn('start')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              padding: '14px 36px', fontSize: 16, fontWeight: 600, border: 'none', borderRadius: 12, cursor: 'pointer',
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
              color: '#fff',
              boxShadow: hoveredBtn === 'start' ? `0 0 30px ${ACCENT}44` : `0 0 20px ${ACCENT}22`,
              transform: hoveredBtn === 'start' ? 'translateY(-2px)' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            Start Free
          </button>
          <button
            onMouseEnter={() => setHoveredBtn('demo')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              padding: '14px 36px', fontSize: 16, fontWeight: 600, borderRadius: 12, cursor: 'pointer',
              background: 'transparent',
              border: `1px solid ${BORDER_SUBTLE}`,
              color: '#e2e8f0',
              backdropFilter: GLASS,
              transform: hoveredBtn === 'demo' ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredBtn === 'demo' ? `0 0 20px ${ACCENT2}22` : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            View Demo
          </button>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 32, animation: 'fadeIn 1s ease 1s both' }}>
          <div style={{ width: 24, height: 40, borderRadius: 12, border: `1px solid ${BORDER_SUBTLE}`, display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
            <div style={{ width: 3, height: 8, borderRadius: 2, background: ACCENT, animation: 'scrollDot 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section style={{ ...sectionStyle, position: 'relative', zIndex: 1 }}>
        <div style={sectionTitle}>Features</div>
        <h2 style={sectionHeading}>Everything you need to trade smarter</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                ...cardBase,
                boxShadow: hoveredFeature === i ? glowBorder(ACCENT) : `0 4px 24px rgba(0,0,0,0.3)`,
                transform: hoveredFeature === i ? 'translateY(-4px)' : 'none',
                borderImage: hoveredFeature === i ? `linear-gradient(135deg, ${ACCENT}44, ${ACCENT2}44) 1` : 'none',
                borderColor: hoveredFeature === i ? 'transparent' : BORDER_SUBTLE,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 14, opacity: 0.9, ...gradientText }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#e2e8f0' }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: GRAY, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ ...sectionStyle, position: 'relative', zIndex: 1 }}>
        <div style={sectionTitle}>How It Works</div>
        <h2 style={sectionHeading}>Three steps to better trades</h2>

        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
                style={{
                  flex: '0 1 280px',
                  textAlign: 'center',
                  padding: '32px 20px',
                  transition: 'all 0.3s ease',
                  transform: hoveredStep === i ? 'translateY(-4px)' : 'none',
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `linear-gradient(135deg, ${ACCENT}22, ${ACCENT2}22)`,
                  border: `1px solid ${ACCENT}33`,
                  fontSize: 22, fontWeight: 800, ...gradientText,
                }}>
                  {s.num}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#cbd5e1', margin: 0 }}>{s.title}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: '0 0 60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  paddingTop: 32, alignSelf: 'center',
                }}>
                  <div style={{
                    width: 60, height: 2,
                    background: `linear-gradient(90deg, ${ACCENT}44, ${ACCENT2}44)`,
                  }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section style={{ ...sectionStyle, position: 'relative', zIndex: 1 }}>
        <div style={sectionTitle}>Pricing</div>
        <h2 style={sectionHeading}>Simple, transparent pricing</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 700, margin: '0 auto' }}>
          {PLANS.map((plan, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredPlan(i)}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{
                ...cardBase,
                padding: '36px 28px',
                textAlign: 'center',
                boxShadow: hoveredPlan === i ? glowBorder(plan.primary ? ACCENT2 : ACCENT) : `0 4px 24px rgba(0,0,0,0.3)`,
                transform: hoveredPlan === i ? 'translateY(-4px)' : 'none',
                border: plan.primary ? `1px solid ${ACCENT2}44` : `1px solid ${BORDER_SUBTLE}`,
              }}
            >
              {plan.primary && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`,
                  borderRadius: '16px 16px 0 0',
                }} />
              )}
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#e2e8f0' }}>{plan.name}</h3>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 40, fontWeight: 800, ...gradientText }}>{plan.price}</span>
                <span style={{ fontSize: 15, color: GRAY }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', textAlign: 'left' }}>
                {plan.features.map((feat, fi) => (
                  <li key={fi} style={{ fontSize: 14, color: '#cbd5e1', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: GREEN, fontSize: 14 }}>✓</span> {feat}
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                style={{
                  width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 600, borderRadius: 10, cursor: 'pointer',
                  background: plan.primary ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : 'transparent',
                  color: '#fff',
                  border: plan.primary ? 'none' : `1px solid ${BORDER_SUBTLE}`,
                  transition: 'all 0.3s ease',
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECH STACK BAR ────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 24px', borderTop: `1px solid ${BORDER_SUBTLE}`, borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: GRAY, fontWeight: 500 }}>Built with</span>
          {TECH.map((t, i) => (
            <React.Fragment key={i}>
              <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{t}</span>
              {i < TECH.length - 1 && <span style={{ color: `${ACCENT}44`, fontSize: 10 }}>·</span>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 14, color: GRAY, marginBottom: 8 }}>
            Built by <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Dean Krotzer</span>
            {' '} · {' '}
            <a
              href="https://github.com/dean-krotzer/chart-reaper"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: ACCENT, textDecoration: 'none' }}
            >
              GitHub
            </a>
          </p>
          <p style={{ fontSize: 12, color: `${GRAY}99`, marginBottom: 4 }}>MIT License</p>
          <p style={{ fontSize: 11, color: `${GRAY}77`, margin: 0 }}>
            Not financial advice. Past results do not guarantee future performance.
          </p>
        </div>
      </footer>

      {/* ── KEYFRAMES ─────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes heroGlow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes scrollDot {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.3; transform: translateY(8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
