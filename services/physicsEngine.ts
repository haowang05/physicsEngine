import { SimulationParams, SimulationState, ModelType } from "../types";
import { DT } from "../constants";

const TOLERANCE = 0.001;

export const initializeState = (type: ModelType, params: SimulationParams): SimulationState => {
  return {
    t: 0,
    x1: params.x0,
    v1: params.v0,
    a1: 0,
    x2: type === 'plank' ? params.x0 : 0, // Plank starts aligned with block usually
    v2: type === 'plank' ? params.v0_plank : 0,
    a2: 0,
    forces: {
      friction1: 0,
      friction2: 0,
      normal1: 0,
      normal2: 0,
      gravity1: 0,
      gravity2: 0,
      external1: 0,
      external2: 0,
    },
    status: '准备就绪',
  };
};

export const stepSimulation = (
  type: ModelType,
  current: SimulationState,
  params: SimulationParams
): SimulationState => {
  const next = { ...current, t: current.t + DT };
  const rad = (params.theta * Math.PI) / 180;
  const sinTheta = Math.sin(rad);
  const cosTheta = Math.cos(rad);

  if (type === 'single') {
    // --- Model 1: Single Body on Incline ---
    const F_ext_x = params.F_mag * Math.cos((params.F_angle * Math.PI) / 180);
    const F_ext_y = params.F_mag * Math.sin((params.F_angle * Math.PI) / 180);

    const N = params.mass * params.g * cosTheta - F_ext_y;
    // Normal force must be non-negative (constraint: block stays on slope)
    const validN = Math.max(0, N);
    
    // Max static friction
    const f_max = params.mu * validN;

    // Driving force along slope (positive down slope usually, but let's define x positive up slope for consistency with user inputs?)
    // Let's standard: x positive is UP the slope for incline problems if theta > 0, or RIGHT for flat.
    // Actually, usually gravity pulls negative X (down).
    // Let's define x=0 bottom. x positive goes UP.
    // Gravity along slope: -mg*sin(theta)
    
    const F_net_driving = F_ext_x - params.mass * params.g * sinTheta;

    let friction = 0;
    let a = 0;

    if (Math.abs(current.v1) > TOLERANCE) {
      // Kinetic Friction: opposes velocity
      const dir = current.v1 > 0 ? -1 : 1;
      friction = dir * f_max;
      const F_total = F_net_driving + friction;
      a = F_total / params.mass;
    } else {
      // Static Friction check
      if (Math.abs(F_net_driving) <= f_max) {
        friction = -F_net_driving; // Balances force
        a = 0;
        next.v1 = 0; // Lock velocity
      } else {
        // Break static friction
        const dir = F_net_driving > 0 ? -1 : 1;
        friction = dir * f_max;
        const F_total = F_net_driving + friction;
        a = F_total / params.mass;
      }
    }

    next.a1 = a;
    next.v1 = current.v1 + a * DT;
    next.x1 = current.x1 + next.v1 * DT;

    next.forces = {
      friction1: friction,
      friction2: 0,
      normal1: validN,
      normal2: 0,
      gravity1: params.mass * params.g,
      gravity2: 0,
      external1: params.F_mag,
      external2: 0
    };
    next.status = Math.abs(next.v1) < TOLERANCE ? "静止" : (next.v1 > 0 ? "向上运动" : "向下运动");
  
  } else if (type === 'belt') {
    // --- Model 2: Conveyor Belt ---
    // Define x positive = Right.
    // Belt velocity v_belt.
    
    const N = params.mass * params.g * cosTheta;
    const gravityAlong = params.mass * params.g * sinTheta; // Usually theta=0 for belt, if theta>0 assume belt goes up/down slope.
    // Let's assume positive x is UP slope/RIGHT.
    // Gravity pulls DOWN (-x).
    
    const f_max = params.mu * N;
    let friction = 0;
    let a = 0;

    // Relative velocity: v_rel = v_block - v_belt
    const v_rel = current.v1 - params.v_belt;

    if (Math.abs(v_rel) > TOLERANCE) {
      // Kinetic friction opposes relative motion
      // If v_block > v_belt, friction points Left (-).
      // If v_block < v_belt, friction points Right (+).
      friction = (v_rel > 0 ? -1 : 1) * f_max;
      
      const F_net = friction - gravityAlong;
      a = F_net / params.mass;
    } else {
      // Co-velocity (Relative static)
      // Can friction hold it against gravity?
      if (Math.abs(gravityAlong) <= f_max) {
        friction = gravityAlong; // Balance gravity
        a = 0;
        next.v1 = params.v_belt; // Lock to belt speed
      } else {
        // Gravity wins (e.g., steep belt), it slides relative to belt even if momentarily same speed
        const dir = -1 * Math.sign(gravityAlong); // Friction opposes gravity
        friction = dir * f_max;
        const F_net = friction - gravityAlong;
        a = F_net / params.mass;
      }
    }

    next.a1 = a;
    next.v1 = current.v1 + a * DT;
    next.x1 = current.x1 + next.v1 * DT;

    next.forces = {
      friction1: friction,
      friction2: 0,
      normal1: N,
      normal2: 0,
      gravity1: params.mass * params.g,
      gravity2: 0,
      external1: 0,
      external2: 0
    };

    next.status = Math.abs(current.v1 - params.v_belt) < 0.05 ? "共速 (相对静止)" : "相对滑动";

  } else if (type === 'plank') {
    // --- Model 3: Block-Plank ---
    // x positive = Right.
    // m = params.mass (Block), M = params.M_plank (Plank)
    // F1 = params.F_block, F2 = params.F_plank
    
    const m = params.mass;
    const M = params.M_plank;
    
    // Normal forces
    const N1 = m * params.g; // Block on Plank
    const N2 = (m + M) * params.g; // Plank on Ground
    
    // Friction Limits
    const f1_max = params.mu_block * N1; // Max friction between m and M
    const f2_max = params.mu_ground * N2; // Max friction between M and Ground

    let f1 = 0; // Force by Plank ON Block (Block feels this)
    let f2 = 0; // Force by Ground ON Plank (Plank feels this)
    
    const v_rel = current.v1 - current.v2;
    
    // Assume Kinetic f1 first if v_rel != 0
    let isSlidingRel = Math.abs(v_rel) > TOLERANCE;
    
    if (isSlidingRel) {
      // Kinetic f1: Opposes v_rel. 
      // If v1 > v2, f1 on block is Left (-). Plank feels Right (+).
      f1 = (v_rel > 0 ? -1 : 1) * f1_max;
    } else {
      // Static f1? We don't know value yet.
      f1 = 0; // Placeholder
    }

    // Now solve Plank dynamics to find f2.
    // If v2 != 0, f2 is kinetic opposing v2.
    let isPlankMoving = Math.abs(current.v2) > TOLERANCE;
    
    if (isPlankMoving) {
       f2 = (current.v2 > 0 ? -1 : 1) * f2_max;
    } else {
       f2 = 0; // Placeholder for static ground friction
    }

    // CASE 1: Relative Sliding (Known f1 magnitude, Known direction)
    if (isSlidingRel) {
       // Block Equation: F_block + f1 = m*a1
       const F_net_1 = params.F_block + f1;
       next.a1 = F_net_1 / m;
       
       // Plank Equation: F_plank - f1 + f2 = M*a2
       // Note: Plank feels -f1. 
       
       const F_drive_plank = params.F_plank - f1; // Force trying to move plank (excluding ground friction)
       
       if (isPlankMoving) {
          // Kinetic ground friction
          const F_net_2 = F_drive_plank + f2;
          next.a2 = F_net_2 / M;
       } else {
          // Plank static check
          if (Math.abs(F_drive_plank) <= f2_max) {
             f2 = -F_drive_plank;
             next.a2 = 0;
             next.v2 = 0;
          } else {
             f2 = (F_drive_plank > 0 ? -1 : 1) * f2_max;
             const F_net_2 = F_drive_plank + f2;
             next.a2 = F_net_2 / M;
          }
       }
    } 
    // CASE 2: Moving Together (or trying to)
    else {
      // Treat as system mass (m+M) for ground interaction check
      // Internal friction f1 is static and internal.
      
      const F_total_ext = params.F_block + params.F_plank;
      
      // Determine Ground Friction f2
      if (Math.abs(current.v2) > TOLERANCE) {
         f2 = (current.v2 > 0 ? -1 : 1) * f2_max;
      } else {
         // System static check against ground
         if (Math.abs(F_total_ext) <= f2_max) {
            f2 = -F_total_ext; // System stays put
            next.a1 = 0;
            next.a2 = 0;
            next.v1 = 0;
            next.v2 = 0;
            // Internal f1 balances forces on block? F_block + f1 = 0 => f1 = -F_block
            f1 = -params.F_block;
            // Validation: is |f1| <= f1_max?
            if (Math.abs(params.F_block) > f1_max) {
               // Slide happens! Back to Slide logic manually
               // Reset to sliding case logic effectively
               f1 = (params.F_block > 0 ? -1 : 1) * f1_max;
               next.a1 = (params.F_block + f1) / m;
               next.a2 = 0; // Plank held by ground
            } 
         } else {
             // System accelerates? 
             // We assume they stick first, calculate 'a_common'
             f2 = (F_total_ext > 0 ? -1 : 1) * f2_max;
             const a_common = (F_total_ext + f2) / (m + M);
             
             // Check if required f1 exceeds max static
             // Block needs: F_block + f1 = m * a_common  => f1_req = m*a_common - F_block
             const f1_req = m * a_common - params.F_block;
             
             if (Math.abs(f1_req) <= f1_max) {
                // Sticking confirmed
                f1 = f1_req;
                next.a1 = a_common;
                next.a2 = a_common;
             } else {
                // Rupture! They slide relative to each other.
                f1 = (f1_req > 0 ? 1 : -1) * f1_max; // Max static value becomes kinetic limit direction approx
                
                next.a1 = (params.F_block + f1) / m;
                // Plank: F_plank - f1 + f2 = M*a2
                next.a2 = (params.F_plank - f1 + f2) / M;
             }
         }
      }
      
      // If we fell through to a static ground case above but didn't return, we handle system movement.
      if (next.a1 === undefined) { 
         // System moves together
         const a_common = (F_total_ext + f2) / (m + M);
         // Check f1 required again
         const f1_req = m * a_common - params.F_block;
          if (Math.abs(f1_req) <= f1_max) {
             next.a1 = a_common;
             next.a2 = a_common;
             f1 = f1_req;
          } else {
             // Slide
             f1 = (f1_req > 0 ? 1 : -1) * f1_max; 
             next.a1 = (params.F_block + f1) / m;
             next.a2 = (params.F_plank - f1 + f2) / M;
          }
      }
    }

    // Integrate
    next.v1 = current.v1 + next.a1 * DT;
    next.x1 = current.x1 + next.v1 * DT;
    next.v2 = current.v2 + next.a2 * DT;
    next.x2 = current.x2 + next.v2 * DT;

    // Check Detachment
    const detached = Math.abs(next.x1 - next.x2) > params.L_plank / 2;

    next.forces = {
      friction1: f1, // Force on block
      friction2: f2, // Force on plank
      normal1: N1,
      normal2: N2,
      gravity1: m * params.g,
      gravity2: M * params.g,
      external1: params.F_block,
      external2: params.F_plank
    };
    
    if (detached) {
       next.status = "滑块脱离!";
       next.a1 = 0; next.a2 = 0; 
    } else {
       next.status = Math.abs(next.v1 - next.v2) < 0.05 ? "共速 (相对静止)" : "相对滑动";
    }
  }

  return next;
};