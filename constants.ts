import { SimulationParams } from "./types";

export const DT = 0.016; // Time step (approx 60fps)

export const DEFAULT_PARAMS: Record<string, SimulationParams> = {
  single: {
    g: 9.8,
    theta: 30,
    mu: 0.2,
    mass: 2,
    v0: 0,
    x0: 1,
    F_mag: 0,
    F_angle: 0,
    beltLength: 10,
    v_belt: 0,
    M_plank: 0,
    L_plank: 0,
    mu_ground: 0,
    mu_block: 0,
    v0_plank: 0,
    F_block: 0,
    F_plank: 0,
  },
  belt: {
    g: 9.8,
    theta: 0,
    mu: 0.5,
    mass: 1,
    v0: 0,
    x0: 0, // Start at left
    F_mag: 0,
    F_angle: 0,
    beltLength: 8,
    v_belt: 4, // Moving right
    M_plank: 0,
    L_plank: 0,
    mu_ground: 0,
    mu_block: 0,
    v0_plank: 0,
    F_block: 0,
    F_plank: 0,
  },
  plank: {
    g: 9.8,
    theta: 0, // Usually horizontal for block-plank
    mu: 0,
    mass: 1, // Block mass (m)
    v0: 4, // Block initial velocity v0
    x0: 0, 
    F_mag: 0,
    F_angle: 0,
    beltLength: 0,
    v_belt: 0,
    M_plank: 2, // Plank mass (M)
    L_plank: 4, // Plank length (L)
    mu_ground: 0.1, // mu2
    mu_block: 0.4, // mu1
    v0_plank: 0,
    F_block: 0,
    F_plank: 2, // Force on plank
  }
};

// Colors for graphs
export const COLORS = {
  block: '#3b82f6', // blue-500
  plank: '#ef4444', // red-500
  energy: '#10b981', // green-500
};