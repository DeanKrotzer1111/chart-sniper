import React, { useState } from 'react';
import { ACCENT, SCALP_TF, SWING_TF } from './components/constants';
import GridBg from './components/GridBg';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/DashboardPage';
import TradingPage from './components/TradingPage';
import JournalPage from './components/JournalPage';
import HistoryPage from './components/HistoryPage';
import LearningPage from './components/LearningPage';
import SettingsPage from './components/SettingsPage';
import PlansPage from './components/PlansPage';
import SupportPage from './components/SupportPage';
import LandingPage from './components/LandingPage';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
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

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', fontFamily:"'DM Sans', -apple-system, sans-serif", color:'#e2e8f0', overflow:'hidden' }}>
      <GridBg />
      <Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} onLogoClick={() => setShowLanding(true)} />
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
