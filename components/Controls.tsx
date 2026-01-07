
import React from 'react';
import { ModelType, SimulationParams } from '../types';
import { calculateCriticalForce } from '../services/physicsEngine';

interface ControlsProps {
  modelType: ModelType;
  params: SimulationParams;
  setParams: (p: SimulationParams) => void;
  onReset: () => void;
  isPlaying: boolean;
  togglePlay: () => void;
}

const Controls: React.FC<ControlsProps> = ({ modelType, params, setParams, onReset, isPlaying, togglePlay }) => {
  const update = (key: keyof SimulationParams, val: number) => {
    setParams({ ...params, [key]: val });
    onReset();
  };

  const critical = modelType === 'plank' ? calculateCriticalForce(params) : null;

  return (
    <div className="sidebar">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>实验参数控制</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={togglePlay}
            className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
            style={{ flex: 1 }}
          >
            {isPlaying ? '暂停' : '开始'}
          </button>
          <button onClick={onReset} className="btn btn-reset" style={{ flex: 1 }}>
            重置
          </button>
        </div>
      </div>

      {modelType === 'plank' && critical && (
        <div className="alert-info" style={{ marginBottom: '1.5rem' }}>
          <div className="label" style={{ color: '#60a5fa', marginBottom: '4px' }}>临界滑动阈值</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>滑块受力 F1c:</span> <strong>{critical.F1c.toFixed(1)}N</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>木板受力 F2c:</span> <strong>{critical.F2c.toFixed(1)}N</strong>
          </div>
        </div>
      )}

      <div className="input-group">
        <div className="label">环境常量</div>
        <div className="input-row">
          <span style={{ fontSize: '0.85rem' }}>重力 g (m/s²)</span>
          <input className="input-field" type="number" step="0.1" value={params.g} onChange={e => update('g', parseFloat(e.target.value))} />
        </div>
      </div>

      {modelType === 'plank' ? (
        <>
          <div className="input-group">
            <div className="label">滑块 m (Block)</div>
            <div className="input-row"><span>质量 m (kg)</span><input className="input-field" type="number" value={params.mass} onChange={e => update('mass', parseFloat(e.target.value))} /></div>
            <div className="input-row"><span>初速 v0 (m/s)</span><input className="input-field" type="number" value={params.v0} onChange={e => update('v0', parseFloat(e.target.value))} /></div>
            <div className="input-row"><span>拉力 F1 (N)</span><input className="input-field" type="number" value={params.F_block} onChange={e => update('F_block', parseFloat(e.target.value))} /></div>
          </div>
          <div className="input-group">
            <div className="label">木板 M (Plank)</div>
            <div className="input-row"><span>质量 M (kg)</span><input className="input-field" type="number" value={params.M_plank} onChange={e => update('M_plank', parseFloat(e.target.value))} /></div>
            <div className="input-row"><span>长度 L (m)</span><input className="input-field" type="number" value={params.L_plank} onChange={e => update('L_plank', parseFloat(e.target.value))} /></div>
            <div className="input-row"><span>拉力 F2 (N)</span><input className="input-field" type="number" value={params.F_plank} onChange={e => update('F_plank', parseFloat(e.target.value))} /></div>
          </div>
          <div className="input-group">
            <div className="label">摩阻系数</div>
            <div className="input-row"><span>μ1 (m-M)</span><input className="input-field" type="number" step="0.01" value={params.mu_block} onChange={e => update('mu_block', parseFloat(e.target.value))} /></div>
            <div className="input-row"><span>μ2 (M-地)</span><input className="input-field" type="number" step="0.01" value={params.mu_ground} onChange={e => update('mu_ground', parseFloat(e.target.value))} /></div>
          </div>
        </>
      ) : (
        <>
          <div className="input-group">
            <div className="label">滑块属性</div>
            <div className="input-row"><span>质量 m (kg)</span><input className="input-field" type="number" value={params.mass} onChange={e => update('mass', parseFloat(e.target.value))} /></div>
            <div className="input-row"><span>倾角 θ (°)</span><input className="input-field" type="number" value={params.theta} onChange={e => update('theta', parseFloat(e.target.value))} /></div>
            <div className="input-row"><span>初速 v0 (m/s)</span><input className="input-field" type="number" value={params.v0} onChange={e => update('v0', parseFloat(e.target.value))} /></div>
            <div className="input-row"><span>外力 F (N)</span><input className="input-field" type="number" value={params.F_mag} onChange={e => update('F_mag', parseFloat(e.target.value))} /></div>
          </div>
          <div className="input-group">
            <div className="label">接触特性</div>
            <div className="input-row"><span>摩擦系数 μ</span><input className="input-field" type="number" step="0.01" value={params.mu} onChange={e => update('mu', parseFloat(e.target.value))} /></div>
            {modelType === 'belt' && (
              <div className="input-row"><span>带速 v_b (m/s)</span><input className="input-field" type="number" value={params.v_belt} onChange={e => update('v_belt', parseFloat(e.target.value))} /></div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Controls;
