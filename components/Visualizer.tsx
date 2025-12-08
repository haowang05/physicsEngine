import React from 'react';
import { ModelType, SimulationParams, SimulationState } from '../types';

interface VisualizerProps {
  type: ModelType;
  params: SimulationParams;
  state: SimulationState;
}

const SCALE = 40; // Pixels per meter

const Arrow = ({ x, y, angle, length, color, label }: any) => {
  if (Math.abs(length) < 0.1) return null;
  const rad = (angle * Math.PI) / 180;
  const lenPx = length * 5; // Force scale
  const x2 = x + lenPx * Math.cos(rad);
  const y2 = y - lenPx * Math.sin(rad); // SVG y is down
  
  return (
    <g>
      <line x1={x} y1={y} x2={x2} y2={y2} stroke={color} strokeWidth="3" markerEnd={`url(#arrowhead-${color})`} />
      <text x={x2} y={y2} fill={color} fontSize="12" fontWeight="bold" dy="-5">{label}</text>
    </g>
  );
};

const Visualizer: React.FC<VisualizerProps> = ({ type, params, state }) => {
  // SVG ViewBox calculations
  const width = 800;
  const height = 400;
  const groundY = 300;
  const centerX = 200;

  // Slope Logic
  const slopeAngle = type === 'single' ? params.theta : (type === 'belt' ? params.theta : 0);
  const slopeRad = (slopeAngle * Math.PI) / 180;
  
  // Transform x position (meters) to SVG pixels
  const xToPx = (val: number) => val * SCALE;
  
  // Block 1 (Blue)
  const blockW = 60;
  const blockH = 40;
  
  // Calculate Base Position on Slope
  // We treat state.x1 as distance ALONG the slope.
  const slopeLengthPx = 800;
  const startX = 50; 
  const startY = groundY;
  
  // Current Block Pos
  const distPx = xToPx(state.x1) + 100; // Offset 100px so x=0 isn't edge
  
  const getForceArrows = (isBlock: boolean) => {
    const arrows = [];
    
    if (isBlock) {
      // Gravity: Always straight down (Global angle 270 or 90 depending on coord sys)
      arrows.push({ 
        angle: 90 + slopeAngle, 
        length: state.forces.gravity1, 
        color: '#10b981', 
        label: 'mg' 
      });
      
      // Normal: Perpendicular to surface (Up relative to block) -> -90 deg local
      arrows.push({ 
        angle: -90, 
        length: state.forces.normal1, 
        color: '#6366f1', 
        label: 'N1' 
      });
      
      // Friction: Parallel to surface.
      if (state.forces.friction1 !== 0) {
        arrows.push({ 
          angle: state.forces.friction1 > 0 ? 0 : 180, 
          length: Math.abs(state.forces.friction1), 
          color: '#ef4444', 
          label: 'f1' 
        });
      }

      // External
      if (state.forces.external1 !== 0) {
         arrows.push({
            angle: -params.F_angle, 
            length: state.forces.external1,
            color: '#f59e0b',
            label: 'F1'
         });
      }
    } else {
        // Plank Forces
        // Normal N2 (Ground)
        arrows.push({ 
            angle: -90, 
            length: state.forces.normal2, 
            color: '#6366f1', 
            label: 'N2' 
        });
        
        // Gravity M
        arrows.push({ 
            angle: 90, 
            length: state.forces.gravity2, 
            color: '#10b981', 
            label: 'Mg' 
        });

        // Friction f2 (Ground)
         if (state.forces.friction2 !== 0) {
            arrows.push({ 
                angle: state.forces.friction2 > 0 ? 0 : 180, 
                length: Math.abs(state.forces.friction2), 
                color: '#ef4444', 
                label: 'f2' 
            });
        }
        
        // External F2
        if (state.forces.external2 !== 0) {
            arrows.push({
                angle: 0, 
                length: state.forces.external2,
                color: '#f59e0b',
                label: 'F2'
            });
        }

        // Newton's 3rd Law: Block exerts -f1 and -N1 on Plank.
        // N1 pushes DOWN on Plank
        arrows.push({ 
            angle: 90, 
            length: state.forces.normal1, 
            color: '#6366f1', 
            label: "N1'" 
        });
        // f1 reaction opposes f1 on block. If f1 on block is > 0, block is pushed right, so block pushes plank left.
        // Actually f1 in state is force ON BLOCK. Force ON PLANK is -f1.
        const f1_reaction = -state.forces.friction1;
        if (f1_reaction !== 0) {
             arrows.push({ 
                angle: f1_reaction > 0 ? 0 : 180, 
                length: Math.abs(f1_reaction), 
                color: '#ef4444', 
                label: "f1'" 
            });
        }
    }
    return arrows;
  };

  // Plank logic
  const plankW = xToPx(params.L_plank || 4);
  const plankH = 20;
  const plankDistPx = xToPx(state.x2) + 100;
  
  return (
    <div className="w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 relative">
      <div className="absolute top-4 right-4 text-white text-right z-10">
        <div className="font-mono text-sm">时间 t: {state.t.toFixed(2)}s</div>
        <div className="font-mono text-sm">位移 x1: {state.x1.toFixed(2)}m</div>
        {type === 'plank' && <div className="font-mono text-sm">位移 x2: {state.x2.toFixed(2)}m</div>}
        <div className="font-mono text-sm">速度 v1: {state.v1.toFixed(2)}m/s</div>
        {type === 'plank' && <div className="font-mono text-sm">速度 v2: {state.v2.toFixed(2)}m/s</div>}
        <div className={`font-bold mt-1 ${state.status.includes('脱离') ? 'text-red-500' : 'text-green-400'}`}>
           {state.status}
        </div>
      </div>
      
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-80">
        <defs>
          <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
          </marker>
          <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
          <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
          </marker>
           <marker id="arrowhead-#f59e0b" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
          </marker>
             <marker id="arrowhead-#ef4444" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
             <marker id="arrowhead-#10b981" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
          </marker>
             <marker id="arrowhead-#6366f1" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
          </marker>
        </defs>

        {/* Ground / Incline Line */}
        <g transform={`translate(${startX}, ${startY}) rotate(${-slopeAngle})`}>
          <line x1="-1000" y1="0" x2="2000" y2="0" stroke="white" strokeWidth="2" />
          
          {/* Belt markings if belt */}
          {type === 'belt' && (
             <g>
                {[...Array(20)].map((_, i) => {
                    // Moving markers to show belt speed
                    const offset = (state.t * params.v_belt * SCALE) % 100;
                    return <circle key={i} cx={i * 100 + offset - 200} cy="5" r="2" fill="#555" />
                })}
             </g>
          )}

          {/* Model 3: Plank / Lower Block */}
          {type === 'plank' && (
             <g transform={`translate(${plankDistPx - plankW/2}, ${-plankH})`}>
                <rect width={plankW} height={plankH} fill="#78350f" stroke="white" strokeWidth="1"/>
                <text x={plankW - 15} y={plankH/2} fill="white" textAnchor="middle" dominantBaseline="middle" fontSize="10">M</text>
                 <g transform={`translate(${plankW/2}, ${plankH/2})`}>
                  {getForceArrows(false).map((arrow, i) => (
                    <Arrow key={i} {...arrow} />
                  ))}
                </g>
             </g>
          )}

          {/* Block / Upper Block */}
          <g transform={`translate(${distPx - blockW/2}, ${-blockH - (type === 'plank' ? plankH : 0)})`}>
            <rect width={blockW} height={blockH} fill="#3b82f6" stroke="white" strokeWidth="1" />
            <text x={blockW/2} y={blockH/2} fill="white" textAnchor="middle" dominantBaseline="middle" fontSize="10">m</text>
            
            {/* Force Vectors */}
            <g transform={`translate(${blockW/2}, ${blockH/2})`}>
              {getForceArrows(true).map((arrow, i) => (
                <Arrow key={i} {...arrow} />
              ))}
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default Visualizer;