import React from 'react';
import { ACCENT, ACCENT2 } from './constants';

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

export default GridBg;
