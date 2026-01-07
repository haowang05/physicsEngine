
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ModelType, SimulationParams, SimulationState, DataPoint } from './types';
import { DEFAULT_PARAMS } from './constants';
import { initializeState, stepSimulation } from './services/physicsEngine';
import Controls from './components/Controls';
import Visualizer from './components/Visualizer';
import Charts from './components/Charts';
import { Box, Layers, ArrowRightLeft } from 'lucide-react';

function App() {
  const [modelType, setModelType] = useState<ModelType>('single');
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS['single']);
  const [state, setState] = useState<SimulationState>(initializeState('single', DEFAULT_PARAMS['single']));
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const requestRef = useRef<number>(0);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setState(initializeState(modelType, params));
    setHistory([]);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, [modelType, params]);

  const changeModel = (type: ModelType) => {
    setModelType(type);
    setParams(DEFAULT_PARAMS[type]);
    setIsPlaying(false);
    setHistory([]);
    setState(initializeState(type, DEFAULT_PARAMS[type]));
  };

  const updateLoop = useCallback(() => {
    if (!isPlaying) return;
    setState(prev => stepSimulation(modelType, prev, params));
    requestRef.current = requestAnimationFrame(updateLoop);
  }, [isPlaying, modelType, params]);

  useEffect(() => {
    if (state.t === 0 && history.length > 0) return;
    setHistory(prev => {
       if (prev.length > 0 && prev[prev.length-1].time === state.t) return prev;
       const newData: DataPoint = {
         time: state.t,
         x1: state.x1,
         x2: modelType === 'plank' ? state.x2 : undefined,
         s1: state.s1,
         s2: modelType === 'plank' ? state.s2 : undefined,
         v1: state.v1,
         v2: modelType === 'belt' ? params.v_belt : state.v2,
         a1: state.a1,
         a2: state.a2,
         v_rel: state.v1 - (modelType === 'belt' ? params.v_belt : (state.v2 || 0)),
         Ek: 0.5 * params.mass * state.v1 * state.v1,
         Q: 0
       };
       return [...prev, newData].slice(-1000);
    });
  }, [state, params, modelType, history.length]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(updateLoop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying, updateLoop]);

  return (
    <div className="app-container">
      <Controls 
        modelType={modelType} 
        params={params} 
        setParams={setParams} 
        onReset={handleReset}
        isPlaying={isPlaying}
        togglePlay={() => setIsPlaying(!isPlaying)}
      />

      <div className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>物理动力学可视化实验室</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)' }}>Physics Slider Lab v2.0</p>
          </div>
          
          <div className="tab-bar">
            {[
              { id: 'single', icon: Box, label: '单体斜面' },
              { id: 'belt', icon: ArrowRightLeft, label: '传送带' },
              { id: 'plank', icon: Layers, label: '板块/叠块' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => changeModel(tab.id as ModelType)}
                className={`tab-btn ${modelType === tab.id ? 'active' : ''}`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </header>

        <Visualizer type={modelType} params={params} state={state} />
        <Charts data={history} modelType={modelType} />
      </div>
    </div>
  );
}

export default App;
