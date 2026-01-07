
export type ModelType = 'single' | 'belt' | 'plank';

export interface Vector {
  x: number;
  y: number;
}

// Configuration Parameters
export interface SimulationParams {
  // Environment
  g: number; // m/s^2
  playbackSpeed: number; // 0.25, 0.5, 1, 2
  
  // Model 1 & 2: Single Body / Belt
  theta: number; // degrees
  mu: number; // friction coefficient
  mass: number; // kg
  v0: number; // m/s
  x0: number; // m
  F_mag: number; // External Force Magnitude (N)
  F_angle: number; // External Force Angle (degrees relative to slope)
  
  // Model 2: Conveyor specific
  beltLength: number; // m
  v_belt: number; // m/s
  
  // Model 3: Block-Plank specific
  M_plank: number; // kg
  L_plank: number; // m
  mu_ground: number; // friction plank-ground
  mu_block: number; // friction block-plank
  v0_plank: number; // m/s
  F_block: number; // N
  F_plank: number; // N
}

// Real-time State
export interface SimulationState {
  t: number;
  
  // Object 1 (Block)
  x1: number;
  v1: number;
  a1: number;
  s1: number; // 累积路程
  
  // Object 2 (Plank - only for model 3)
  x2: number;
  v2: number;
  a2: number;
  s2: number; // 累积路程
  
  // Forces for visualization (Magnitudes)
  forces: {
    friction1: number;
    friction2: number; 
    normal1: number;
    normal2: number;
    gravity1: number;
    gravity2: number;
    external1: number;
    external2: number;
  };

  // Status flags
  status: string;
}

export interface DataPoint {
  time: number;
  x1: number;
  x2?: number;
  s1: number; // 路程
  s2?: number; // 路程
  v1: number;
  v2?: number;
  a1: number;
  a2?: number;
  v_rel?: number; // 相对速度
  Ek: number; 
  Q: number; 
  event?: string; // 记录状态变更
}
