
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataPoint, ModelType } from '../types';
import { COLORS } from '../constants';

interface ChartsProps {
  data: DataPoint[];
  modelType: ModelType;
}

const Charts: React.FC<ChartsProps> = ({ data, modelType }) => {
  const displayData = data.length > 200 ? data.filter((_, i) => i % Math.ceil(data.length / 200) === 0) : data;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
      
      <div className="card" style={{ height: '220px' }}>
        <div className="label">速度-时间 (v-t)</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 10}} tickFormatter={(t) => t.toFixed(1)} />
            <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
            <Line type="monotone" dataKey="v1" stroke={COLORS.block} dot={false} name="v1" strokeWidth={2} isAnimationActive={false} />
            {(modelType === 'plank' || modelType === 'belt') && (
               <Line type="monotone" dataKey="v2" stroke={COLORS.plank} dot={false} name="v2" strokeWidth={2} strokeDasharray="4 4" isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ height: '220px' }}>
        <div className="label">位移-时间 (x-t)</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 10}} tickFormatter={(t) => t.toFixed(1)} />
            <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
            <Line type="monotone" dataKey="x1" stroke={COLORS.block} dot={false} name="x1" strokeWidth={2} isAnimationActive={false} />
            {modelType === 'plank' && (
               <Line type="monotone" dataKey="x2" stroke={COLORS.plank} dot={false} name="x2" strokeWidth={2} isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ height: '220px' }}>
        <div className="label">路程-时间 (s-t)</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 10}} tickFormatter={(t) => t.toFixed(1)} />
            <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
            <Line type="monotone" dataKey="s1" stroke={COLORS.block} dot={false} name="s1" strokeWidth={2} isAnimationActive={false} />
            {modelType === 'plank' && (
               <Line type="monotone" dataKey="s2" stroke={COLORS.plank} dot={false} name="s2" strokeWidth={2} isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ height: '220px' }}>
        <div className="label">加速度 (a-t)</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{fontSize: 10}} tickFormatter={(t) => t.toFixed(1)} />
            <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
            <Line type="stepAfter" dataKey="a1" stroke={COLORS.block} dot={false} name="a1" strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
