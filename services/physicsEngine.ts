
import { SimulationParams, SimulationState, ModelType } from "../types";
import { DT } from "../constants";

const TOLERANCE = 0.005;

export const calculateCriticalForce = (params: SimulationParams): { F1c: number; F2c: number } => {
  const { mass: m, M_plank: M, mu_block: mu1, mu_ground: mu2, g } = params;
  if (!m || !M) return { F1c: 0, F2c: 0 };
  const f1_max = mu1 * m * g;
  const f2_max = mu2 * (m + M) * g;
  const F1c = f1_max * (m + M) / M + f2_max;
  const F2c = f1_max * (m + M) / m + f2_max;
  return { F1c: Math.max(0, F1c), F2c: Math.max(0, F2c) };
};

export const initializeState = (type: ModelType, params: SimulationParams): SimulationState => {
  return {
    t: 0,
    x1: 0,
    v1: params.v0,
    a1: 0,
    s1: 0,
    x2: 0,
    v2: type === 'plank' ? params.v0_plank : 0,
    a2: 0,
    s2: 0,
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
    status: '实验开始',
  };
};

export const stepSimulation = (
  type: ModelType,
  current: SimulationState,
  params: SimulationParams
): SimulationState => {
  if (current.status.includes("脱离")) return current;

  const next = { ...current, t: current.t + DT };
  const rad = (params.theta * Math.PI) / 180;
  const sinTheta = Math.sin(rad);
  const cosTheta = Math.cos(rad);

  if (type === 'single') {
    const F_ext_x = params.F_mag * Math.cos((params.F_angle * Math.PI) / 180);
    const F_ext_y = params.F_mag * Math.sin((params.F_angle * Math.PI) / 180);
    const N = Math.max(0, params.mass * params.g * cosTheta - F_ext_y);
    const f_max = params.mu * N;
    const F_driving = F_ext_x - params.mass * params.g * sinTheta;

    let friction = 0, a = 0;
    if (Math.abs(current.v1) > TOLERANCE) {
      friction = (current.v1 > 0 ? -1 : 1) * f_max;
      a = (F_driving + friction) / params.mass;
      next.status = "滑动摩擦";
    } else {
      if (Math.abs(F_driving) <= f_max + 0.0001) {
        friction = -F_driving;
        a = 0;
        next.v1 = 0;
        next.status = "静摩擦(静止)";
      } else {
        friction = (F_driving > 0 ? -1 : 1) * f_max;
        a = (F_driving + friction) / params.mass;
        next.status = "突破静摩擦";
      }
    }
    next.a1 = a;
    next.v1 = current.v1 + a * DT;
    next.x1 = current.x1 + next.v1 * DT;
    next.s1 = current.s1 + Math.abs(next.v1 * DT);
    next.forces = { friction1: friction, friction2: 0, normal1: N, normal2: 0, gravity1: params.mass * params.g, gravity2: 0, external1: params.F_mag, external2: 0 };

  } else if (type === 'belt') {
    const N = params.mass * params.g * cosTheta;
    const f_max = params.mu * N;
    const g_para = params.mass * params.g * sinTheta;
    const v_rel = current.v1 - params.v_belt;

    let a = 0, friction = 0;
    if (Math.abs(v_rel) > TOLERANCE) {
      friction = (v_rel > 0 ? -1 : 1) * f_max;
      a = (friction - g_para) / params.mass;
      next.status = "滑动摩擦(相对滑动)";
    } else {
      if (Math.abs(g_para) <= f_max + 0.0001) {
        friction = g_para;
        a = 0;
        next.v1 = params.v_belt;
        next.status = "静摩擦(共速)";
      } else {
        friction = (g_para > 0 ? 1 : -1) * f_max;
        a = (friction - g_para) / params.mass;
        next.status = "相对滑动(重力占优)";
      }
    }
    next.a1 = a;
    next.v1 = current.v1 + a * DT;
    next.x1 = current.x1 + next.v1 * DT;
    next.s1 = current.s1 + Math.abs(next.v1 * DT);
    next.forces = { friction1: friction, friction2: 0, normal1: N, normal2: 0, gravity1: params.mass * params.g, gravity2: 0, external1: 0, external2: 0 };

  } else if (type === 'plank') {
    const { mass: m, M_plank: M, mu_block: mu1, mu_ground: mu2, g, F_block: F1, F_plank: F2, L_plank: L } = params;
    const N1 = m * g;
    const N2 = (m + M) * g;
    const f1_max = mu1 * N1;
    const f2_max = mu2 * N2;

    let a1 = 0, a2 = 0, f1 = 0, f2 = 0;
    const v_rel = current.v1 - current.v2;

    if (Math.abs(current.v2) > TOLERANCE) {
      f2 = (current.v2 > 0 ? -1 : 1) * f2_max;
    } else {
      const F_net_ext = F1 + F2;
      f2 = Math.abs(F_net_ext) <= f2_max ? -F_net_ext : (F_net_ext > 0 ? -1 : 1) * f2_max;
    }

    if (Math.abs(v_rel) > TOLERANCE) {
      f1 = (v_rel > 0 ? -1 : 1) * f1_max;
      a1 = (F1 + f1) / m;
      a2 = (F2 - f1 + f2) / M;
      next.status = "相对滑动中";
    } else {
      const a_co = (F1 + F2 + f2) / (m + M);
      const f1_req = m * a_co - F1;
      if (Math.abs(f1_req) <= f1_max + 0.0001) {
        a1 = a2 = a_co;
        f1 = f1_req;
        next.status = (Math.abs(a1) < TOLERANCE) ? "相对静止" : "共同运动(静摩擦)";
      } else {
        f1 = (f1_req > 0 ? 1 : -1) * f1_max;
        a1 = (F1 + f1) / m;
        a2 = (F2 - f1 + f2) / M;
        next.status = "突发相对滑动";
      }
    }

    next.a1 = a1; next.a2 = a2;
    next.v1 = current.v1 + a1 * DT;
    next.v2 = current.v2 + a2 * DT;
    next.x1 = current.x1 + next.v1 * DT;
    next.x2 = current.x2 + next.v2 * DT;
    next.s1 = current.s1 + Math.abs(next.v1 * DT);
    next.s2 = current.s2 + Math.abs(next.v2 * DT);

    if (Math.abs(next.x1 - next.x2) > L / 2 + 0.05) {
      next.status = "滑块已脱离";
    }

    next.forces = { friction1: f1, friction2: f2, normal1: N1, normal2: N2, gravity1: m * g, gravity2: M * g, external1: F1, external2: F2 };
  }

  return next;
};
