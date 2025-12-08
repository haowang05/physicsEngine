import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataPoint, ModelType } from '../types';
import { COLORS } from '../constants';

interface ChartsProps {
  data: DataPoint[];
  modelType: ModelType;
}

const Charts: React.FC<ChartsProps> = ({ data, modelType }) => {
  // Downsample data for performance if array is too large
  const displayData = data.length > 200 ? data.filter((_, i) => i % Math.ceil(data.length / 200) === 0) : data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-64 mt-4">
      
      {/* Velocity Chart */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
        <h3 className="text-white text-sm mb-2 font-bold">速度-时间图 (v-t)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tickFormatter={(t) => t.toFixed(1)} label={{ value: 't (s)', position: 'insideBottomRight', offset: -5 }} />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }}
              labelFormatter={(l) => `t: ${Number(l).toFixed(2)}s`}
            />
            <Legend verticalAlign="top" height={36}/>
            <Line type="monotone" dataKey="v1" stroke={COLORS.block} dot={false} name="滑块速度 (v1)" strokeWidth={2} />
            {(modelType === 'plank' || modelType === 'belt') && (
               <Line type="monotone" dataKey="v2" stroke={modelType === 'belt' ? '#fbbf24' : COLORS.plank} dot={false} name={modelType === 'belt' ? "传送带速度" : "木板速度 (v2)"} strokeWidth={2} strokeDasharray="5 5" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Acceleration Chart */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
        <h3 className="text-white text-sm mb-2 font-bold">加速度-时间图 (a-t)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tickFormatter={(t) => t.toFixed(1)} label={{ value: 't (s)', position: 'insideBottomRight', offset: -5 }} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
            <Legend verticalAlign="top" height={36}/>
            <Line type="stepAfter" dataKey="a1" stroke={COLORS.block} dot={false} name="滑块加速度 (a1)" strokeWidth={2} />
            {modelType === 'plank' && (
               <Line type="stepAfter" dataKey="a2" stroke={COLORS.plank} dot={false} name="木板加速度 (a2)" strokeWidth={2} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Displacement Chart (New) */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
        <h3 className="text-white text-sm mb-2 font-bold">位移-时间图 (x-t)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tickFormatter={(t) => t.toFixed(1)} label={{ value: 't (s)', position: 'insideBottomRight', offset: -5 }} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
            <Legend verticalAlign="top" height={36}/>
            <Line type="monotone" dataKey="x1" stroke={COLORS.block} dot={false} name="滑块位移 (x1)" strokeWidth={2} />
            {modelType === 'plank' && (
               <Line type="monotone" dataKey="x2" stroke={COLORS.plank} dot={false} name="木板位移 (x2)" strokeWidth={2} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default Charts;