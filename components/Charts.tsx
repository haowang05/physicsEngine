
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataPoint, ModelType } from '../types';
import { COLORS } from '../constants';

interface ChartsProps {
  data: DataPoint[];
  modelType: ModelType;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#0f172a', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        <p style={{ margin: '0 0 5px 0', color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '3px' }}>
          时间: <span style={{ color: 'white', fontWeight: 'bold' }}>{typeof label === 'number' ? label.toFixed(3) : label}s</span>
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: '2px 0', color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
            <span>{entry.name}:</span>
            <span style={{ fontWeight: 'bold' }}>{typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}</span>
          </p>
        ))}
        {payload[0].payload.event && (
          <p style={{ margin: '5px 0 0 0', color: '#fbbf24', fontStyle: 'italic', borderTop: '1px solid #334155', paddingTop: '5px' }}>
            事件: {payload[0].payload.event}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const Charts: React.FC<ChartsProps> = ({ data, modelType }) => {
  // 采样逻辑优化：保留关键事件点 + 周期性采样点
  const displayData = useMemo(() => {
    if (data.length < 400) return data;
    const step = Math.floor(data.length / 400);
    return data.filter((d, i) => d.event || i % step === 0 || i === data.length - 1);
  }, [data]);

  const commonXAxis = (
    <XAxis 
      dataKey="time" 
      stroke="#94a3b8" 
      tick={{fontSize: 10}} 
      tickFormatter={(t) => t.toFixed(2)} 
      type="number"
      domain={['dataMin', 'dataMax']}
    />
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
      
      <div className="card" style={{ height: '260px' }}>
        <div className="label">速度-时间 (v-t) / m/s</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            {commonXAxis}
            <YAxis stroke="#94a3b8" tick={{fontSize: 10}} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
            <Line type="monotone" dataKey="v1" stroke={COLORS.block} dot={false} name="滑块速度 v1" strokeWidth={2} isAnimationActive={false} />
            {(modelType === 'plank' || modelType === 'belt') && (
               <Line type="monotone" dataKey="v2" stroke={COLORS.plank} dot={false} name={modelType === 'belt' ? "带速 v_b" : "木板速度 v2"} strokeWidth={2} strokeDasharray="4 4" isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ height: '260px' }}>
        <div className="label">位移-时间 (x-t) / m</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            {commonXAxis}
            <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
            <Line type="monotone" dataKey="x1" stroke={COLORS.block} dot={false} name="滑块位移 x1" strokeWidth={2} isAnimationActive={false} />
            {modelType === 'plank' && (
               <Line type="monotone" dataKey="x2" stroke={COLORS.plank} dot={false} name="木板位移 x2" strokeWidth={2} isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ height: '260px' }}>
        <div className="label">路程-时间 (s-t) / m</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            {commonXAxis}
            <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
            <Line type="monotone" dataKey="s1" stroke={COLORS.block} dot={false} name="滑块路程 s1" strokeWidth={2} isAnimationActive={false} />
            {modelType === 'plank' && (
               <Line type="monotone" dataKey="s2" stroke={COLORS.plank} dot={false} name="木板路程 s2" strokeWidth={2} isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ height: '260px' }}>
        <div className="label">加速度 (a-t) / m/s²</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            {commonXAxis}
            <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
            <Line type="stepAfter" dataKey="a1" stroke={COLORS.block} dot={false} name="滑块加速度 a1" strokeWidth={2} isAnimationActive={false} />
            {modelType === 'plank' && (
              <Line type="stepAfter" dataKey="a2" stroke={COLORS.plank} dot={false} name="木板加速度 a2" strokeWidth={2} isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
