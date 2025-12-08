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
    // Force immediate reset via effect dependency later, or manually:
    setIsPlaying(false);
    setHistory([]);
    setState(initializeState(type, DEFAULT_PARAMS[type]));
  };

  const updateLoop = useCallback(() => {
    if (!isPlaying) return;

    setState(prev => {
      const next = stepSimulation(modelType, prev, params);
      return next;
    });

    requestRef.current = requestAnimationFrame(updateLoop);
  }, [isPlaying, modelType, params]);

  // Effect to sync history with state changes
  useEffect(() => {
    if (state.t === 0 && history.length > 0) return; // Don't add reset state if not needed
    
    setHistory(prev => {
       // Optimization: Limit history size if needed
       if (prev.length > 0 && prev[prev.length-1].time === state.t) return prev;
       
       const newData: DataPoint = {
         time: state.t,
         x1: state.x1,
         x2: modelType === 'plank' ? state.x2 : undefined,
         v1: state.v1,
         v2: modelType === 'belt' ? params.v_belt : state.v2,
         a1: state.a1,
         a2: state.a2,
         Ek: 0.5 * params.mass * state.v1 * state.v1,
         Q: 0 // TODO: calculate heat
       };
       return [...prev, newData];
    });
  }, [state, params, modelType]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(updateLoop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, updateLoop]);


  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Controls */}
      <Controls 
        modelType={modelType} 
        params={params} 
        setParams={setParams} 
        onReset={handleReset}
        isPlaying={isPlaying}
        togglePlay={() => setIsPlaying(!isPlaying)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        
        {/* Header / Tabs */}
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">高中物理滑块动力学可视化</h1>
            <p className="text-slate-400 text-sm">Interactive visualization of classical mechanics problems</p>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => changeModel('single')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${modelType === 'single' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Box size={16} /> 单体/斜面
            </button>
            <button 
              onClick={() => changeModel('belt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${modelType === 'belt' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <ArrowRightLeft size={16} /> 传送带
            </button>
            <button 
              onClick={() => changeModel('plank')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${modelType === 'plank' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers size={16} /> 板块/叠块
            </button>
          </div>
        </header>

        {/* Visualization Area */}
        <main className="flex-1 flex flex-col gap-6">
          <Visualizer type={modelType} params={params} state={state} />
          <Charts data={history} modelType={modelType} />
        </main>

      </div>
    </div>
  );
}

export default App;