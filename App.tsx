
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ModelType, SimulationParams, SimulationState, DataPoint } from './types';
import { DEFAULT_PARAMS, DT } from './constants';
import { initializeState, stepSimulation } from './services/physicsEngine';
import Controls from './components/Controls';
import Visualizer from './components/Visualizer';
import Charts from './components/Charts';
import { Box, Layers, ArrowRightLeft, GripHorizontal } from 'lucide-react';

function App() {
  const [modelType, setModelType] = useState<ModelType>('single');
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS['single']);
  const [state, setState] = useState<SimulationState>(initializeState('single', DEFAULT_PARAMS['single']));
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 布局状态：Visualizer 的高度
  const [vizHeight, setVizHeight] = useState(350);
  const isResizing = useRef(false);

  const requestRef = useRef<number>(0);
  const timeoutRef = useRef<number>(0);
  const isPlayingRef = useRef(false);
  const lastStatusRef = useRef<string>(state.status);

  // 同步 ref 状态用于闭包安全
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    const newState = initializeState(modelType, params);
    setState(newState);
    setHistory([]);
    lastStatusRef.current = newState.status;
  }, [modelType, params]);

  const changeModel = (type: ModelType) => {
    setModelType(type);
    setParams(DEFAULT_PARAMS[type]);
    handleReset();
  };

  const updateLoop = useCallback(() => {
    if (!isPlayingRef.current) return;
    
    setState(prev => {
      let currentStep = prev;
      const steps = params.playbackSpeed >= 1 ? Math.floor(params.playbackSpeed) : 1;
      for (let i = 0; i < steps; i++) {
        currentStep = stepSimulation(modelType, currentStep, params);
      }
      return currentStep;
    });

    if (params.playbackSpeed < 1) {
      const delay = 16 / params.playbackSpeed;
      timeoutRef.current = window.setTimeout(() => {
        if (isPlayingRef.current) {
          requestRef.current = requestAnimationFrame(updateLoop);
        }
      }, delay - 16);
    } else {
      requestRef.current = requestAnimationFrame(updateLoop);
    }
  }, [modelType, params]);

  useEffect(() => {
    if (state.t === 0 && history.length > 0) return;
    
    setHistory(prev => {
       let eventName: string | undefined = undefined;
       if (state.status !== lastStatusRef.current) {
         eventName = state.status;
         lastStatusRef.current = state.status;
       }

       if (prev.length > 0 && prev[prev.length-1].time === state.t && !eventName) return prev;
       
       const newData: DataPoint = {
         time: state.t,
         x1: state.x1,
         x2: modelType === 'plank' ? state.x2 : undefined,
         s1: state.s1,
         s2: modelType === 'plank' ? state.s2 : undefined,
         v1: state.v1,
         v2: modelType === 'belt' ? params.v_belt : (modelType === 'plank' ? state.v2 : undefined),
         a1: state.a1,
         a2: modelType === 'plank' ? state.a2 : undefined,
         v_rel: state.v1 - (modelType === 'belt' ? params.v_belt : (state.v2 || 0)),
         Ek: 0.5 * params.mass * state.v1 * state.v1,
         Q: 0,
         event: eventName
       };

       const updated = [...prev, newData];
       return updated.slice(-3000);
    });
  }, [state, params.mass, params.v_belt, modelType]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(updateLoop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, updateLoop]);

  // 拖拽调整大小逻辑
  const startResizing = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    // 限制高度范围在 200px 到 700px 之间
    const newHeight = Math.max(200, Math.min(700, e.clientY - 120)); 
    setVizHeight(newHeight);
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, [handleMouseMove]);

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
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>物理动力学可视化实验室</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>Physics Slider Lab v2.7 (Resizable Layout)</p>
          </div>
          
          <div className="tab-bar" style={{ marginBottom: 0 }}>
            {[
              { id: 'single', icon: Box, label: '单体斜面' },
              { id: 'belt', icon: ArrowRightLeft, label: '传送带' },
              { id: 'plank', icon: Layers, label: '板块/叠块' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => changeModel(tab.id as ModelType)}
                className={`tab-btn ${modelType === tab.id ? 'active' : ''}`}
                style={{ padding: '6px 12px' }}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* 可变高度的可视化容器 */}
        <div style={{ height: vizHeight, minHeight: '200px', flexShrink: 0, position: 'relative' }}>
          <Visualizer type={modelType} params={params} state={state} height={vizHeight} />
        </div>

        {/* 拖拽手柄 */}
        <div 
          onMouseDown={startResizing}
          style={{
            height: '12px',
            width: '100%',
            cursor: 'row-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-dim)',
            background: 'var(--bg-main)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            zIndex: 10,
            transition: 'background 0.2s',
          }}
          className="resize-handle"
        >
          <GripHorizontal size={16} />
        </div>

        {/* 滚动图表区域 */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '1rem' }}>
          <Charts data={history} modelType={modelType} />
        </div>
      </div>

      <style>{`
        .resize-handle:hover {
          background: var(--bg-sidebar) !important;
          color: var(--accent) !important;
        }
      `}</style>
    </div>
  );
}

export default App;
