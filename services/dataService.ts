import { Domain, DemoScenario, TelemetryPoint } from '../types';
import { DOMAIN_CONFIGS } from '../constants'; // Import config

/**
 * Generates synthetic telemetry data based on the chosen scenario.
 * It simulates specific patterns like drift, oscillation, or boundary hits.
 */
export const generateHistoricalData = (scenario: DemoScenario): TelemetryPoint[] => {
  const now = Date.now();
  const points: TelemetryPoint[] = [];

  // Get Configuration for Domain
  const config = DOMAIN_CONFIGS[scenario.domain];

  // Determine sample interval and count based on W_long requirements
  const intervalMs = (config.sample_interval_sec || 30) * 1000;

  // We need enough history for the longest window + some buffer
  const longWindowSamples = config.drift.long_window_samples || 720;
  // Generate at least 1.5x long window to allow for full analysis at the end
  const sampleCount = Math.ceil(longWindowSamples * 1.5);

  // Initial Baselines
  let rx_power_dBm = -18.0;
  let tx_bias_mA = 30.0;
  let laser_temp_C = 45.0;

  // DOCSIS
  let us_snr_dB = 36.0;
  let ds_snr_dB = 38.0;
  let us_mer_dB = 36.0;
  let ds_mer_dB = 40.0;
  let us_utilization = 40.0;
  let ds_utilization = 60.0;
  let corrected_cw = 0;
  let uncorrectable_cw = 0;
  let t3_timeout_count = 0;
  let t4_timeout_count = 0;
  let profile_change_count = 0;

  // FWA
  let rsrp_dBm = -95.0;
  let sinr_dB = 18.0;
  let bler_dl = 0.5; // %
  let prb_utilization_dl = 30.0;
  let prb_utilization_ul = 15.0;
  let throughput_dl_mbps = 150.0;
  let handover_count = 0;
  let beam_switch_count = 0;
  let harq_retx_dl = 0;

  // WIFI / MDU
  let rssi_dBm = -65.0; // was client/backhaul generic
  let snr_dB = 35.0;
  let retry_rate = 0.05;
  let channel_utilization = 30.0;
  let client_count = 5;
  let roam_count = 0;
  let dfs_event_count = 0;
  let channel_change_count = 0;
  let mcs = 7;
  let vht_rate_mbps = 600.0;
  let mesh_hops = 1;
  let parent_id = "Node_A";

  // Common
  let latency_p95 = 15.0;
  let loss_rate = 0.0;


  for (let i = 0; i < sampleCount; i++) {
    const time = now - (sampleCount - i) * intervalMs;
    const progress = i / sampleCount; // 0.0 to 1.0

    // Add some natural noise
    const noise = (Math.random() - 0.5) * 0.5;

    // Reset event counts (they are point-in-time or cumulative steps? Usually counts are cumulative in counters, but rates in windows. 
    // The prompt asks for 'count'. Using instantaneous counts for 'events in last interval' simulation.)
    handover_count = 0;
    beam_switch_count = 0;
    roam_count = 0;
    dfs_event_count = 0;
    channel_change_count = 0;
    t3_timeout_count = 0;
    t4_timeout_count = 0;
    profile_change_count = 0;

    // --- LOGIC PER SCENARIO ---

    // PON-1: LOS Early Warning (Drift Down)
    if (scenario.id === 'PON-1') {
      rx_power_dBm -= 0.05; // Gradual decay
      rx_power_dBm += noise;
      if (i > sampleCount * 0.75) rx_power_dBm -= 0.2; // Acceleration at end
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
        corrected_cw = Math.floor(Math.random() * 1000) + 500;
        uncorrectable_cw = Math.floor(Math.random() * 50);
        us_mer_dB = 25 + noise * 5;
      } else {
        corrected_cw = Math.floor(Math.random() * 10);
        uncorrectable_cw = 0;
        us_mer_dB = 36 + noise;
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
        handover_count = 1;
        rsrp_dBm = -90 + noise;
      } else {
        rsrp_dBm = -92 + noise;
      }
    }
    // WIFI-1: Parent Flapping
    else if (scenario.id === 'WIFI-1') {
      // Rapid switching
      if (i % 10 === 0) {
        parent_id = parent_id === "Node_A" ? "Node_B" : "Node_A";
        roam_count = 1;
        mesh_hops = parent_id === "Node_A" ? 1 : 2;
      }
    }
    // WIFI-2: Backhaul Degradation
    else if (scenario.id === 'WIFI-2') {
      rssi_dBm -= 0.08; // Steady decline (was backhaul_rssi)
      rssi_dBm += noise;
      vht_rate_mbps -= 1.0;
    }
    // Generic Logic for others
    else {
      rx_power_dBm += noise;
      us_snr_dB += noise;
      rsrp_dBm += noise;
      rssi_dBm += noise;
    }

    // Update correlated fields logic roughly
    // FWA correlated
    throughput_dl_mbps = Math.max(0, 150 + (sinr_dB - 18) * 5 + noise * 10);

    // DOCSIS correlated
    ds_snr_dB = us_snr_dB + 2 + noise;

    // WIFI correlated
    vht_rate_mbps = Math.max(0, 600 + (rssi_dBm + 65) * 10);

    // Push Point
    points.push({
      timestamp: time,
      // PON
      rx_power_dBm: parseFloat(rx_power_dBm.toFixed(2)),
      tx_bias_mA: parseFloat(tx_bias_mA.toFixed(2)),
      laser_temp_C: parseFloat(laser_temp_C.toFixed(2)),

      // DOCSIS
      us_snr_dB: parseFloat(us_snr_dB.toFixed(2)),
      ds_snr_dB: parseFloat(ds_snr_dB.toFixed(2)),
      us_mer_dB: parseFloat(us_mer_dB.toFixed(2)),
      ds_mer_dB: parseFloat(ds_mer_dB.toFixed(2)),
      us_utilization: parseFloat(us_utilization.toFixed(1)),
      ds_utilization: parseFloat(ds_utilization.toFixed(1)),
      corrected_cw,
      uncorrectable_cw,
      t3_timeout_count,
      t4_timeout_count,
      profile_change_count,

      // FWA
      rsrp_dBm: parseFloat(rsrp_dBm.toFixed(2)),
      sinr_dB: parseFloat(sinr_dB.toFixed(2)),
      bler_dl: parseFloat(bler_dl.toFixed(2)),
      prb_utilization_dl: parseFloat(prb_utilization_dl.toFixed(1)),
      prb_utilization_ul: parseFloat(prb_utilization_ul.toFixed(1)),
      throughput_dl_mbps: parseFloat(throughput_dl_mbps.toFixed(1)),
      handover_count,
      beam_switch_count,
      harq_retx_dl,

      // WIFI
      rssi_dBm: parseFloat(rssi_dBm.toFixed(2)),
      snr_dB: parseFloat(snr_dB.toFixed(2)), // WIFI SNR
      retry_rate: parseFloat(retry_rate.toFixed(3)),
      channel_utilization: parseFloat(channel_utilization.toFixed(1)),
      client_count,
      roam_count,
      dfs_event_count,
      channel_change_count,
      mcs,
      vht_rate_mbps: parseFloat(vht_rate_mbps.toFixed(1)),
      mesh_hops,
      parent_id,

      // Common
      latency_p95: parseFloat(latency_p95.toFixed(1)),
      loss_rate: parseFloat(loss_rate.toFixed(3)),

      // Legacy Mappings if needed for scenarios that weren't updated in this pass
      minislot_errors: uncorrectable_cw,
      client_rssi_dBm: rssi_dBm,
      backhaul_rssi_dBm: rssi_dBm,
      backhaul_rate_Mbps: vht_rate_mbps,
      cell_id: "Cell_1"
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
  meanLong: number;
  meanMid: number;
  meanShort: number;
}

const mean = (vals: number[]) => vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
const max = (vals: number[]) => Math.max(...vals);
const min = (vals: number[]) => Math.min(...vals);

// 1. Drift - Uses Long Window vs Short Window
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

// 2. Stability - Uses Mid Window
export const computeStability = (midWindow: number[], eps = 1e-6) => {
  if (midWindow.length < 2) return 0.0;
  const mu = mean(midWindow);
  const variance = midWindow.reduce((acc, val) => acc + Math.pow(val - mu, 2), 0) / midWindow.length;
  const sigma = Math.sqrt(variance);
  const rng = max(midWindow) - min(midWindow);

  return sigma / (3 * rng + eps);
};

export const judgeStability = (score: number): StabilityStatus => {
  if (score < 0.08) return "GOOD";
  if (score < 0.20) return "MARGINAL";
  return "UNSTABLE";
};

// 3. Boundary - Uses Mid Window
export const computeBoundaryHit = (vals: number[], threshold = 30.0, margin = 20.0): BoundaryStatus => {
  const maxVal = max(vals);
  if (maxVal > threshold) return "YES";
  if (maxVal > margin) return "WARNING";
  return "NO";
};

// 4. Oscillation - Uses Short Window
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
  longSize: number = 720,
  midSize: number = 60,
  shortSize: number = 20
): KernelResult | null => {
  // Basic validation
  if (currentIndex < 0 || currentIndex >= fullSeries.length) return null;
  // We need enough data for at least the short window to start analysis
  // But ideally we want to see if we have enough for Long/Mid too
  // If we don't have enough for Long, we can't compute drift accurately compared to full history
  // But let's fallback: use available data up to start?
  // For strict windowing implementation:

  if (currentIndex < shortSize) return null; // Can't even do short window

  // Define Windows (Ending at currentIndex)

  // 1. Long Window (Drift)
  // Logic: W_long is the baseline window. We use [Current - Long, Current].
  const longStart = Math.max(0, currentIndex - longSize + 1);
  const longWindow = fullSeries.slice(longStart, currentIndex + 1);

  // 2. Mid Window (Stability / Boundary)
  const midStart = Math.max(0, currentIndex - midSize + 1);
  const midWindow = fullSeries.slice(midStart, currentIndex + 1);

  // 3. Short Window (Oscillation)
  const shortStart = Math.max(0, currentIndex - shortSize + 1);
  const shortWindow = fullSeries.slice(shortStart, currentIndex + 1);

  // Compute Metrics
  const driftScore = computeDrift(longWindow, shortWindow);
  const driftStatus = judgeDrift(driftScore);

  const stabilityScore = computeStability(midWindow); // Use Mid Window
  const stabilityStatus = judgeStability(stabilityScore);

  // Note: Thresholds strictly from prompt default (30, 20). 
  // In production, pass these in via config.
  const boundaryStatus = computeBoundaryHit(midWindow, 30.0, 20.0); // Use Mid Window

  const oscillationLevel = computeOscillation(shortWindow); // Use Short Window

  const overallRisk = computeRisk(driftScore, stabilityStatus, boundaryStatus, oscillationLevel);

  // Calculate Rolling Averages for Visualization
  const meanLong = mean(longWindow);
  const meanMid = mean(midWindow);
  const meanShort = mean(shortWindow);

  return {
    driftScore,
    driftStatus,
    stabilityScore,
    stabilityStatus,
    boundaryStatus,
    oscillationLevel,
    overallRisk,
    meanLong,
    meanMid,
    meanShort
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