import { Domain, DemoScenario, TelemetryPoint } from '../types';

/**
 * Generates synthetic telemetry data based on the chosen scenario.
 * It simulates specific patterns like drift, oscillation, or boundary hits.
 */
export const generateHistoricalData = (scenario: DemoScenario): TelemetryPoint[] => {
  const now = Date.now();
  const points: TelemetryPoint[] = [];
  const sampleCount = 200; // Last 200 samples
  const intervalMs = 30000; // 30 seconds

  // Initial Baselines
  let rx_power_dBm = -18.0;
  let tx_bias_mA = 30.0;
  let laser_temp_C = 45.0;
  let us_snr_dB = 36.0;
  let minislot_errors = 0;
  let rsrp_dBm = -95.0;
  let sinr_dB = 18.0;
  let client_rssi_dBm = -65.0;
  let retry_rate = 0.05;
  let backhaul_rssi_dBm = -55.0;
  let parent_id = "Node_A";
  let cell_id = "Cell_101";
  let mesh_hops = 1;

  for (let i = 0; i < sampleCount; i++) {
    const time = now - (sampleCount - i) * intervalMs;
    const progress = i / sampleCount; // 0.0 to 1.0

    // Add some natural noise
    const noise = (Math.random() - 0.5) * 0.5;

    // --- LOGIC PER SCENARIO ---

    // PON-1: LOS Early Warning (Drift Down)
    if (scenario.id === 'PON-1') {
      rx_power_dBm -= 0.05; // Gradual decay
      rx_power_dBm += noise;
      if (i > 150) rx_power_dBm -= 0.2; // Acceleration at end
    }
    // PON-2: Temp Driven Drift (Correlation)
    else if (scenario.id === 'PON-2') {
      laser_temp_C += 0.04 + noise * 0.5;
      tx_bias_mA = 30 + (laser_temp_C - 45) * 1.5 + noise; // Correlated rise
    }
    // DOC-2: Periodic Noise (Boundary)
    else if (scenario.id === 'DOC-2') {
      // Spike every 20 samples
      if (i % 25 > 20) {
        minislot_errors = Math.floor(Math.random() * 100) + 50;
      } else {
        minislot_errors = Math.floor(Math.random() * 5);
      }
    }
    // FWA-1: Cell Edge Oscillation
    else if (scenario.id === 'FWA-1') {
      // Sine wave oscillation
      rsrp_dBm = -100 + Math.sin(i * 0.2) * 5 + noise;
      sinr_dB = 10 + Math.sin(i * 0.2) * 8 + noise;
    }
    // FWA-3: Handover (ID Switch)
    else if (scenario.id === 'FWA-3') {
      // Flap every 30 samples
      if (Math.sin(i * 0.1) > 0) {
        cell_id = "Cell_101";
        rsrp_dBm = -90 + noise;
      } else {
        cell_id = "Cell_205";
        rsrp_dBm = -92 + noise;
      }
    }
    // MDU-1: Weak Units (Low values)
    else if (scenario.id === 'MDU-1') {
      client_rssi_dBm = -78 + noise * 2; // Bad RSSI
    }
    // MESH-1: Parent Flapping
    else if (scenario.id === 'MESH-1') {
      // Rapid switching
      if (i % 10 === 0) {
        parent_id = parent_id === "Node_A" ? "Node_B" : "Node_A";
        mesh_hops = parent_id === "Node_A" ? 1 : 2;
      }
    }
    // MESH-2: Backhaul Degradation
    else if (scenario.id === 'MESH-2') {
      backhaul_rssi_dBm -= 0.08; // Steady decline
      backhaul_rssi_dBm += noise;
    }
    // Generic Logic for others
    else {
      rx_power_dBm += noise;
      us_snr_dB += noise;
      rsrp_dBm += noise;
      client_rssi_dBm += noise;
      backhaul_rssi_dBm += noise;
    }

    // Push Point
    points.push({
      timestamp: time,
      rx_power_dBm: parseFloat(rx_power_dBm.toFixed(2)),
      tx_bias_mA: parseFloat(tx_bias_mA.toFixed(2)),
      laser_temp_C: parseFloat(laser_temp_C.toFixed(2)),
      us_snr_dB: parseFloat(us_snr_dB.toFixed(2)),
      minislot_errors,
      rsrp_dBm: parseFloat(rsrp_dBm.toFixed(2)),
      sinr_dB: parseFloat(sinr_dB.toFixed(2)),
      client_rssi_dBm: parseFloat(client_rssi_dBm.toFixed(2)),
      retry_rate: parseFloat(retry_rate.toFixed(3)),
      backhaul_rssi_dBm: parseFloat(backhaul_rssi_dBm.toFixed(2)),
      parent_id,
    });
  }

  return points;
};

// ==========================================
// FP KERNEL MATH (Ported from Reference)
// ==========================================

export type DriftStatus = "STABLE" | "MILD_DRIFT" | "MODERATE_DRIFT" | "SEVERE_DRIFT";
export type StabilityStatus = "GOOD" | "MARGINAL" | "UNSTABLE";
export type BoundaryStatus = "YES" | "WARNING" | "NO";
export type OscillationLevel = "LOW" | "MEDIUM" | "HIGH";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface KernelResult {
  driftScore: number;
  driftStatus: DriftStatus;
  stabilityScore: number;
  stabilityStatus: StabilityStatus;
  boundaryStatus: BoundaryStatus;
  oscillationLevel: OscillationLevel;
  overallRisk: RiskLevel;
}

const mean = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / vals.length;
const max = (vals: number[]) => Math.max(...vals);
const min = (vals: number[]) => Math.min(...vals);

// 1. Drift
export const computeDrift = (longWindow: number[], shortWindow: number[], eps = 1e-6) => {
  const muLong = mean(longWindow);
  const muShort = mean(shortWindow);
  const rangeLong = max(longWindow) - min(longWindow);

  // Avoid division by zero if range is 0 (flatline) using eps
  return Math.abs(muShort - muLong) / (2 * rangeLong + eps);
};

export const judgeDrift = (score: number): DriftStatus => {
  if (score < 0.05) return "STABLE";
  if (score < 0.15) return "MILD_DRIFT";
  if (score < 0.30) return "MODERATE_DRIFT";
  return "SEVERE_DRIFT";
};

// 2. Stability
export const computeStability = (shortWindow: number[], eps = 1e-6) => {
  if (shortWindow.length < 2) return 0.0;
  const mu = mean(shortWindow);
  const variance = shortWindow.reduce((acc, val) => acc + Math.pow(val - mu, 2), 0) / shortWindow.length;
  const sigma = Math.sqrt(variance);
  const rng = max(shortWindow) - min(shortWindow);

  return sigma / (3 * rng + eps);
};

export const judgeStability = (score: number): StabilityStatus => {
  if (score < 0.08) return "GOOD";
  if (score < 0.20) return "MARGINAL";
  return "UNSTABLE";
};

// 3. Boundary
export const computeBoundaryHit = (vals: number[], threshold = 30.0, margin = 20.0): BoundaryStatus => {
  const maxVal = max(vals);
  if (maxVal > threshold) return "YES";
  if (maxVal > margin) return "WARNING";
  return "NO";
};

// 4. Oscillation
export const computeOscillation = (vals: number[]): OscillationLevel => {
  if (vals.length < 3) return "LOW";

  const diffs: number[] = [];
  for (let i = 0; i < vals.length - 1; i++) {
    diffs.push(vals[i + 1] - vals[i]);
  }

  const sign = (x: number) => x > 0 ? 1 : (x < 0 ? -1 : 0);
  const signs = diffs.map(sign).filter(s => s !== 0);

  if (signs.length < 2) return "LOW";

  let changes = 0;
  for (let i = 0; i < signs.length - 1; i++) {
    if (signs[i] * signs[i + 1] < 0) changes++;
  }

  if (changes === 0) return "LOW";
  if (changes <= 2) return "MEDIUM";
  return "HIGH";
};

// 5. Overall Risk
export const computeRisk = (
  driftScore: number,
  stability: StabilityStatus,
  boundary: BoundaryStatus,
  oscillation: OscillationLevel
): RiskLevel => {
  let score = 0;

  if (boundary === "YES") score += 2;
  else if (boundary === "WARNING") score += 1;

  if (driftScore > 0.30) score += 2;
  else if (driftScore > 0.15) score += 1;

  if (stability === "UNSTABLE") score += 2;
  else if (stability === "MARGINAL") score += 1;

  if (oscillation === "HIGH") score += 2;
  else if (oscillation === "MEDIUM") score += 1;

  if (score <= 2) return "LOW";
  if (score <= 4) return "MEDIUM";
  return "HIGH";
};

/**
 * Main Analysis Function
 * Calculates metrics for a specific point in time by looking at the windows ending at that point.
 */
export const analyzePoint = (
  fullSeries: number[],
  currentIndex: number,
  longSize: number = 20,
  shortSize: number = 5
): KernelResult | null => {
  // Basic validation
  if (currentIndex < 0 || currentIndex >= fullSeries.length) return null;
  if (fullSeries.length < longSize) return null;

  // Define Windows
  // Long Window = Baseline (first N samples)
  const longWindow = fullSeries.slice(0, longSize);

  // Short Window = Current context (ending at currentIndex)
  // Ensure we have enough data precedent to currentIndex
  const startIndex = currentIndex - shortSize + 1;
  if (startIndex < 0) return null; // Not enough history for this point

  const shortWindow = fullSeries.slice(startIndex, currentIndex + 1);

  const driftScore = computeDrift(longWindow, shortWindow);
  const driftStatus = judgeDrift(driftScore);

  const stabilityScore = computeStability(shortWindow);
  const stabilityStatus = judgeStability(stabilityScore);

  // Note: Thresholds strictly from prompt default (30, 20). 
  // In production, pass these in via config.
  const boundaryStatus = computeBoundaryHit(shortWindow, 30.0, 20.0);

  const oscillationLevel = computeOscillation(shortWindow);

  const overallRisk = computeRisk(driftScore, stabilityStatus, boundaryStatus, oscillationLevel);

  return {
    driftScore,
    driftStatus,
    stabilityScore,
    stabilityStatus,
    boundaryStatus,
    oscillationLevel,
    overallRisk
  };
};


// --- Flexible Data Generator ---

export type DataPattern = 'constant' | 'linear' | 'sine' | 'random' | 'categorical' | 'spike';

export interface FieldGenConfig {
  pattern: DataPattern;
  initial: number | string;
  // Common
  noise?: number;
  // Linear
  slope?: number; // per step
  // Sine
  amplitude?: number;
  period?: number; // in steps
  phase?: number;
  // Categorical
  options?: any[];
  switchProb?: number;
  // Spike
  spikeProb?: number;
  spikeVal?: number | [number, number]; // value or range
}

export interface DataGenConfig {
  sampleCount: number;
  intervalMs: number;
  fields: { [key: string]: FieldGenConfig };
}

/**
 * Generates data based on a configuration object.
 * Allows full control over the variables for each field.
 */
export const generateFlexibleData = (config: DataGenConfig): TelemetryPoint[] => {
  const now = Date.now();
  const points: TelemetryPoint[] = [];
  const { sampleCount, intervalMs, fields } = config;

  // Initialize current state
  let currentState: { [key: string]: any } = {};
  Object.keys(fields).forEach(k => {
    currentState[k] = fields[k].initial;
  });

  for (let i = 0; i < sampleCount; i++) {
    const time = now - (sampleCount - i) * intervalMs;
    const point: TelemetryPoint = { timestamp: time };

    Object.keys(fields).forEach(key => {
      const cfg = fields[key];
      let val = currentState[key]; // From previous step (or initial)

      // Calculate base value based on pattern
      if (cfg.pattern === 'constant') {
        val = cfg.initial;
      }
      else if (cfg.pattern === 'linear') {
        // Deterministic linear trend: use index or accumulate without noise?
        // Let's use accumulation on the 'clean' value to ensure slope is exact.
        // If we want random walk, we'd need another pattern.
        // Here: currentState holds the CLEAN value.
        val = (val as number) + (cfg.slope || 0);
        currentState[key] = val;
      }
      else if (cfg.pattern === 'sine') {
        const amp = cfg.amplitude || 10;
        const per = cfg.period || 50;
        const phase = cfg.phase || 0;
        const base = (cfg.initial as number);
        // Sine is stateless relative to 'i', so we ignore currentState usually, 
        // unless we want to combine. Let's keep it simple: f(t).
        val = base + Math.sin(((i + phase) * 2 * Math.PI) / per) * amp;
      }
      else if (cfg.pattern === 'random') {
        // Independent random around initial
        val = (cfg.initial as number);
      }
      else if (cfg.pattern === 'categorical') {
        // Stateful switch
        if (cfg.options && cfg.options.length > 0) {
          if (Math.random() < (cfg.switchProb || 0.1)) {
            const idx = Math.floor(Math.random() * cfg.options.length);
            val = cfg.options[idx];
          }
        }
        currentState[key] = val;
      }
      else if (cfg.pattern === 'spike') {
        val = cfg.initial;
        if (Math.random() < (cfg.spikeProb || 0.01)) {
          if (Array.isArray(cfg.spikeVal)) {
            val = cfg.spikeVal[0] + Math.random() * (cfg.spikeVal[1] - cfg.spikeVal[0]);
          } else {
            // @ts-ignore
            val = cfg.spikeVal || 0;
          }
        }
      }

      // Add Noise (Numeric only)
      let finalVal = val;
      if (typeof val === 'number' && cfg.noise) {
        finalVal += (Math.random() - 0.5) * 2 * cfg.noise;
      }

      // Store in point
      if (typeof finalVal === 'number') {
        point[key] = parseFloat(finalVal.toFixed(2));
      } else {
        point[key] = finalVal;
      }
    });

    points.push(point);
  }

  return points;
};