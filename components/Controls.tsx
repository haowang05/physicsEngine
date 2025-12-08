import React from 'react';
import { ModelType, SimulationParams } from '../types';

interface ControlsProps {
  modelType: ModelType;
  params: SimulationParams;
  setParams: (p: SimulationParams) => void;
  onReset: () => void;
  isPlaying: boolean;
  togglePlay: () => void;
}

const InputGroup = ({ label, children }: { label: string, children?: React.ReactNode }) => (
  <div className="mb-4">
    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">{label}</label>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const NumberInput = ({ label, value, onChange, min, max, step = 0.1 }: any) => (
  <div className="flex justify-between items-center">
    <span className="text-slate-300 text-sm w-32">{label}</span>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
      step={step}
      min={min}
      max={max}
    />
  </div>
);

const Controls: React.FC<ControlsProps> = ({ modelType, params, setParams, onReset, isPlaying, togglePlay }) => {
  
  const update = (key: keyof SimulationParams, val: number) => {
    setParams({ ...params, [key]: val });
    onReset(); // Reset sim when params change
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-700 p-4 overflow-y-auto h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-white text-lg font-bold mb-4">参数配置</h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={togglePlay}
            className={`flex-1 py-2 px-4 rounded font-bold ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white transition`}
          >
            {isPlaying ? '暂停' : '开始'}
          </button>
          <button
            onClick={onReset}
            className="flex-1 py-2 px-4 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold transition"
          >
            重置
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <InputGroup label="环境参数">
          <NumberInput label="重力 g (m/s²)" value={params.g} onChange={(v: number) => update('g', v)} />
        </InputGroup>

        {modelType !== 'plank' && (
          <InputGroup label="滑块属性">
            <NumberInput label="质量 m (kg)" value={params.mass} onChange={(v: number) => update('mass', v)} min={0.1} />
            <NumberInput label="初速度 v0 (m/s)" value={params.v0} onChange={(v: number) => update('v0', v)} />
            <NumberInput label="外力 F (N)" value={params.F_mag} onChange={(v: number) => update('F_mag', v)} />
             {modelType === 'single' && (
               <NumberInput label="外力角度 (°)" value={params.F_angle} onChange={(v: number) => update('F_angle', v)} />
             )}
          </InputGroup>
        )}

        {modelType !== 'plank' && (
          <InputGroup label="接触面属性">
            <NumberInput label="倾角 θ (°)" value={params.theta} onChange={(v: number) => update('theta', v)} min={0} max={90} />
            <NumberInput label="摩擦系数 μ" value={params.mu} onChange={(v: number) => update('mu', v)} min={0} step={0.05} />
          </InputGroup>
        )}

        {modelType === 'belt' && (
          <InputGroup label="传送带参数">
            <NumberInput label="传送带速度 (m/s)" value={params.v_belt} onChange={(v: number) => update('v_belt', v)} />
          </InputGroup>
        )}

        {/* Stacked Block Specific Controls */}
        {modelType === 'plank' && (
          <>
            <InputGroup label="上滑块 (Block m)">
              <NumberInput label="质量 m (kg)" value={params.mass} onChange={(v: number) => update('mass', v)} min={0.1} />
              <NumberInput label="初速度 v0 (m/s)" value={params.v0} onChange={(v: number) => update('v0', v)} />
              <NumberInput label="拉力 F1 (N)" value={params.F_block} onChange={(v: number) => update('F_block', v)} />
            </InputGroup>

            <InputGroup label="下木板 (Plank M)">
              <NumberInput label="质量 M (kg)" value={params.M_plank} onChange={(v: number) => update('M_plank', v)} min={0.1} />
              <NumberInput label="木板长度 L (m)" value={params.L_plank} onChange={(v: number) => update('L_plank', v)} min={0.5} />
              <NumberInput label="初速度 v0 (m/s)" value={params.v0_plank} onChange={(v: number) => update('v0_plank', v)} />
              <NumberInput label="拉力 F2 (N)" value={params.F_plank} onChange={(v: number) => update('F_plank', v)} />
            </InputGroup>

            <InputGroup label="摩擦系数">
               <NumberInput label="μ1 (上下接触面)" value={params.mu_block} onChange={(v: number) => update('mu_block', v)} step={0.05} />
               <NumberInput label="μ2 (下表面/地面)" value={params.mu_ground} onChange={(v: number) => update('mu_ground', v)} step={0.05} />
            </InputGroup>
          </>
        )}
      </div>
    </div>
  );
};

export default Controls;