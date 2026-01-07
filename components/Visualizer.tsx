
import React, { useEffect, useState, useRef } from 'react';
import { ModelType, SimulationParams, SimulationState } from '../types';

interface VisualizerProps {
  type: ModelType;
  params: SimulationParams;
  state: SimulationState;
}

const SCALE = 60; // 像素/米

const Arrow = ({ x, y, angle, length, color, label }: any) => {
  const absLen = Math.abs(length);
  if (absLen < 0.05) return null;
  const rad = (angle * Math.PI) / 180;
  const lenPx = Math.min(absLen * 4, 80); 
  const x2 = x + lenPx * Math.cos(rad);
  const y2 = y - lenPx * Math.sin(rad); 
  
  return (
    <g>
      <line x1={x} y1={y} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" markerEnd={`url(#arrowhead-${color.replace('#','')})`} />
      <text x={x2} y={y2} fill={color} fontSize="10" fontWeight="bold" dy="-5" textAnchor="middle" style={{ paintOrder: 'stroke', stroke: 'black', strokeWidth: '2px' }}>{label}</text>
    </g>
  );
};

const Visualizer: React.FC<VisualizerProps> = ({ type, params, state }) => {
  const [lastStatus, setLastStatus] = useState(state.status);
  const [showStatus, setShowStatus] = useState(false);
  const timerRef = useRef<number | null>(null);

  // 监听状态变化，弹出气泡
  useEffect(() => {
    if (state.status !== lastStatus) {
      setLastStatus(state.status);
      setShowStatus(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setShowStatus(false), 1500);
    }
  }, [state.status, lastStatus]);

  const width = 800;
  const height = 300;
  const groundY = 220;
  
  // 视口跟随逻辑：让物体始终处于屏幕中间区域
  const viewOffset = state.x1 * SCALE > 400 ? 400 - state.x1 * SCALE : 0;

  const slopeAngle = (type === 'single' || type === 'belt') ? params.theta : 0;
  const blockW = 50;
  const blockH = 35;
  const plankW = (params.L_plank || 4) * SCALE;
  const plankH = 20;

  const blockX = state.x1 * SCALE;
  const plankX = state.x2 * SCALE;

  return (
    <div className="visualizer-box" style={{ height: '350px', background: '#020617', position: 'relative', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
      <div className="status-tag">
        {state.status.toUpperCase()}
      </div>

      <div style={{ position: 'absolute', top: '1rem', right: '1rem', textAlign: 'right', color: 'var(--text-dim)', fontSize: '0.8rem', zIndex: 5 }}>
        <div>TIME: <span style={{ color: 'white', fontWeight: 'bold' }}>{state.t.toFixed(2)}s</span></div>
        <div>POS: <span style={{ color: '#60a5fa' }}>{state.x1.toFixed(2)}m</span></div>
        <div>VEL: <span style={{ color: '#60a5fa' }}>{state.v1.toFixed(2)}m/s</span></div>
      </div>

      {/* 摩擦力状态弹出气泡 */}
      {showStatus && (
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 14px',
          background: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          animation: 'fadeInOut 1.5s ease-in-out forwards',
          zIndex: 20
        }}>
          {state.status}
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, 10px); }
          20% { opacity: 1; transform: translate(-50%, 0); }
          80% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -10px); }
        }
        .belt-pattern {
          stroke-dasharray: 20 10;
          animation: beltScroll 1s linear infinite;
        }
        @keyframes beltScroll {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -30; }
        }
      `}</style>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
        <defs>
          <marker id="arrowhead-10b981" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#10b981" /></marker>
          <marker id="arrowhead-ef4444" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" /></marker>
          <marker id="arrowhead-6366f1" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" /></marker>
          <marker id="arrowhead-f59e0b" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" /></marker>
          <linearGradient id="blockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* 坐标轴参考线 */}
        <g transform={`translate(${100 + viewOffset}, ${groundY})`}>
          <g transform={`rotate(${-slopeAngle})`}>
            {/* 轨道/地面 */}
            {type === 'belt' ? (
              <rect x="-1000" y="-2" width="5000" height="10" fill="#334155" className="belt-pattern" stroke="#1e293b" />
            ) : (
              <line x1="-1000" y1="0" x2="5000" y2="0" stroke="#475569" strokeWidth="2" />
            )}

            {/* 木板 (Plank) */}
            {type === 'plank' && (
              <g transform={`translate(${plankX - plankW / 2}, ${-plankH})`}>
                <rect width={plankW} height={plankH} fill="#78350f" stroke="#451a03" strokeWidth="2" rx="2" />
                <text x={plankW/2} y={plankH/2} fill="#fcd34d" fontSize="10" textAnchor="middle" dominantBaseline="middle">M</text>
                
                {/* 木板受力图 */}
                <g transform={`translate(${plankW / 2}, ${plankH / 2})`}>
                  <Arrow angle={90} length={state.forces.gravity2 / 5} color="#10b981" label="Mg" />
                  <Arrow angle={-90} length={state.forces.normal2 / 5} color="#6366f1" label="N2" />
                  <Arrow angle={state.forces.friction2 > 0 ? 0 : 180} length={Math.abs(state.forces.friction2)} color="#ef4444" label="f2" />
                  <Arrow angle={0} length={state.forces.external2} color="#f59e0b" label="F2" />
                </g>
              </g>
            )}

            {/* 滑块 (Block) */}
            <g transform={`translate(${blockX - blockW / 2}, ${-blockH - (type === 'plank' ? plankH : 0)})`}>
              <rect width={blockW} height={blockH} fill="url(#blockGrad)" stroke="#1e3a8a" strokeWidth="2" rx="4" />
              <text x={blockW/2} y={blockH/2} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">m</text>
              
              {/* 滑块受力图 */}
              <g transform={`translate(${blockW / 2}, ${blockH / 2})`}>
                <Arrow angle={90 + slopeAngle} length={state.forces.gravity1 / 5} color="#10b981" label="mg" />
                <Arrow angle={-90} length={state.forces.normal1 / 5} color="#6366f1" label="N1" />
                <Arrow angle={state.forces.friction1 > 0 ? 0 : 180} length={Math.abs(state.forces.friction1)} color="#ef4444" label="f1" />
                <Arrow angle={0} length={state.forces.external1} color="#f59e0b" label="F1" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default Visualizer;
