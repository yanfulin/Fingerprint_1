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
// FP KERNEL MATH (Ported from FP_cal_v2.py)
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
  k1: number;
  k2: number;
  k3: number;
  k4: number;
  riskScore: number;
  signals?: { [key: string]: KernelResult }; // For multi-signal breakdown
}

const getStats = (arr: number[]) => {
  if (arr.length === 0) return { mean: 0.0, std: 0.0 };
  const sum = arr.reduce((a, b) => a + b, 0);
  const mean = sum / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(arr.length - 1, 1);
  return { mean, std: Math.sqrt(variance) };
};

// K1: Drift
export const calculateK1Drift = (shortVals: number[], longVals: number[], eps = 1e-6): number => {
  const { mean: sMean } = getStats(shortVals);
  const { mean: lMean, std: lStd } = getStats(longVals);
  return Math.abs(sMean - lMean) / (lStd + eps);
};

// K2: Stability
export const calculateK2Stability = (window: number[], eps = 1e-6): number => {
  if (window.length < 2) return 1.0;
  const { std: stdDev } = getStats(window);
  const rVal = Math.max(...window) - Math.min(...window);
  const instability = stdDev / (rVal + eps);
  return 1.0 - Math.min(1.0, instability);
};

// K3: Boundary
export const calculateK3Boundary = (
  values: number[],
  minVal: number | null,
  maxVal: number | null,
  maxDerivative: number | null
): number => {
  if (values.length === 0) return 0;

  let hits = 0;
  let prev: number | null = null;

  for (const v of values) {
    let violated = false;
    if (minVal !== null && v < minVal) violated = true;
    if (maxVal !== null && v > maxVal) violated = true;

    if (prev !== null && maxDerivative !== null) {
      if (Math.abs(v - prev) > maxDerivative) violated = true;
    }

    if (violated) hits++;
    prev = v;
  }
  return hits;
};

// K4: Oscillation
export const calculateK4OscillationDynamic = (shortWindow: number[], longWindow: number[]): number => {
  if (shortWindow.length < 2 || longWindow.length === 0) return 0.0;

  const { mean: muRef } = getStats(longWindow);
  const states = shortWindow.map(v => v > muRef ? 1 : 0);

  let switches = 0;
  for (let i = 1; i < states.length; i++) {
    if (states[i] !== states[i - 1]) switches++;
  }

  const maxSwitches = states.length - 1;
  return maxSwitches > 0 ? switches / maxSwitches : 0.0;
};

// Risk Formula
export const calculateRiskScore = (
  k1_rssi: number, k1_latency: number, k1_txerr: number,
  k2_rssi: number, k2_latency: number, k2_txerr: number,
  k3_latency: number,
  k4_latency: number, k4_txerr: number
): number => {
  return (0.3 * (1 - k2_rssi)
    + 0.3 * (1 - k2_latency)
    + 0.1 * (1 - k2_txerr)
    + 0.05 * (k1_rssi + k1_latency + k1_txerr)
    + 0.05 * (k4_latency + k4_txerr)
    + 0.02 * k3_latency);
};

export const judgeDrift = (score: number): DriftStatus => {
  if (score < 1.0) return "STABLE";
  if (score < 2.0) return "MILD_DRIFT";
  if (score < 3.0) return "MODERATE_DRIFT";
  return "SEVERE_DRIFT";
};

export const judgeStability = (k2_score: number): StabilityStatus => {
  if (k2_score > 0.9) return "GOOD";
  if (k2_score > 0.7) return "MARGINAL";
  return "UNSTABLE";
};

export const judgeOscillation = (k4_score: number): OscillationLevel => {
  if (k4_score < 0.2) return "LOW";
  if (k4_score < 0.5) return "MEDIUM";
  return "HIGH";
};


/**
 * Main Analysis Function
 * Calculates metrics for a specific point in time by looking at the windows ending at that point.
 */
export const analyzePoint = (
  fullData: TelemetryPoint[] | number[],
  currentIndex: number,
  longSize: number = 720,
  midSize: number = 60,
  shortSize: number = 20,
  primaryKey: string = 'rssi_dBm'
): KernelResult | null => {

  let rssiSeries: number[] = [];
  let latencySeries: number[] = [];
  let txErrSeries: number[] = [];

  const isObjectArray = fullData.length > 0 && typeof fullData[0] === 'object';

  if (isObjectArray) {
    const data = fullData as TelemetryPoint[];
    // Map required fields for Risk Calc
    rssiSeries = data.map(d => d.rssi_dBm ?? (d as any).rx_power_dBm ?? (d as any).rsrp_dBm ?? -60);
    latencySeries = data.map(d => d.latency_p95 ?? 20);
    txErrSeries = data.map(d => d.loss_rate ?? d.retry_rate ?? 0);
  } else {
    // Fallback: Use the provided series for all
    const data = fullData as number[];
    rssiSeries = data;
    latencySeries = data;
    txErrSeries = data.map(_ => 0);
  }

  // Determine current active series
  let targetSeries = rssiSeries;
  if (primaryKey.includes('latency')) targetSeries = latencySeries;
  else if (primaryKey.includes('loss') || primaryKey.includes('err') || primaryKey.includes('retry')) targetSeries = txErrSeries;
  else if (!isObjectArray) targetSeries = fullData as number[];


  // Basic validation
  if (currentIndex < 0 || currentIndex >= targetSeries.length) return null;
  if (currentIndex < shortSize) return null;

  // Helper to extract windows
  const getWindows = (series: number[]) => {
    const longStart = Math.max(0, currentIndex - longSize + 1);
    const midStart = Math.max(0, currentIndex - midSize + 1);
    const shortStart = Math.max(0, currentIndex - shortSize + 1);
    return {
      long: series.slice(longStart, currentIndex + 1),
      mid: series.slice(midStart, currentIndex + 1),
      short: series.slice(shortStart, currentIndex + 1),
      current: series.slice(currentIndex, currentIndex + 1)
    };
  };

  const wRssi = getWindows(rssiSeries);
  const wLat = getWindows(latencySeries);
  const wTx = getWindows(txErrSeries);

  // Calculate K1 (Drift)
  const k1_rssi = calculateK1Drift(wRssi.short, wRssi.long);
  const k1_lat = calculateK1Drift(wLat.short, wLat.long);
  const k1_tx = calculateK1Drift(wTx.short, wTx.long);

  // Calculate K2 (Stability)
  const k2_rssi = calculateK2Stability(wRssi.mid);
  const k2_lat = calculateK2Stability(wLat.mid);
  const k2_tx = calculateK2Stability(wTx.mid);

  // Calculate K3 (Boundary) - Latency Only in risk formula, but we compute generic
  const hits_lat = calculateK3Boundary(wLat.current, 0, 70, 30);

  // Calculate K4 (Oscillation)
  const k4_rssi = calculateK4OscillationDynamic(wRssi.short, wRssi.long);
  // Risk formula uses k4_latency and k4_txerr
  const k4_lat = calculateK4OscillationDynamic(wLat.short, wLat.long);
  const k4_tx = calculateK4OscillationDynamic(wTx.short, wTx.long);

  // Total Risk
  const riskScoreRaw = calculateRiskScore(
    k1_rssi, k1_lat, k1_tx,
    k2_rssi, k2_lat, k2_tx,
    hits_lat,
    k4_lat, k4_tx
  );

  // Normalize Risk to RiskLevel (Simple Thresholds based on typical outputs)
  let overallRisk: RiskLevel = "LOW";
  if (riskScoreRaw > 0.8) overallRisk = "HIGH";
  else if (riskScoreRaw > 0.4) overallRisk = "MEDIUM";

  // Determine K-values for the TARGET series (for individual metric charts)
  const targetWindows = getWindows(targetSeries);
  const driftScore = calculateK1Drift(targetWindows.short, targetWindows.long);
  const stabilityScore = calculateK2Stability(targetWindows.mid);
  const oscillationVal = calculateK4OscillationDynamic(targetWindows.short, targetWindows.long);
  const boundaryHits = calculateK3Boundary(targetWindows.current, null, 30, 20);

  const meanLong = getStats(targetWindows.long).mean;
  const meanMid = getStats(targetWindows.mid).mean;
  const meanShort = getStats(targetWindows.short).mean;

  return {
    driftScore,
    driftStatus: judgeDrift(driftScore),
    stabilityScore,
    stabilityStatus: judgeStability(stabilityScore),
    boundaryStatus: boundaryHits > 0 ? "YES" : "NO",
    oscillationLevel: judgeOscillation(oscillationVal),
    overallRisk,
    meanLong,
    meanMid,
    meanShort,
    k1: driftScore,
    k2: stabilityScore,
    k3: boundaryHits,
    k4: oscillationVal,
    riskScore: riskScoreRaw
  };
};

/**
 * Multi-Signal Analysis Function
 * Computes risk based on specific formula involving RSSI, Latency, and TxErr.
 */
export const analyzeMultiSignalPoint = (
  fullData: TelemetryPoint[],
  currentIndex: number,
  longSize: number = 720,
  midSize: number = 60,
  shortSize: number = 20
): KernelResult | null => {
  // Use existing analyzePoint to get metrics for each signal
  // Pass 'rssi_dBm', 'latency_p95', 'loss_rate' as primary keys to target specific signals

  // 1. Analyze RSSI
  const resRssi = analyzePoint(fullData, currentIndex, longSize, midSize, shortSize, 'rssi_dBm');

  // 2. Analyze Latency
  const resLat = analyzePoint(fullData, currentIndex, longSize, midSize, shortSize, 'latency_p95');

  // 3. Analyze TxErr (Loss)
  const resTx = analyzePoint(fullData, currentIndex, longSize, midSize, shortSize, 'loss_rate');

  if (!resRssi || !resLat || !resTx) return null;

  // 4. Compute Combined Risk Score
  const k1_rssi = resRssi.k1;
  const k2_rssi = resRssi.k2;
  // k3_rssi not used in formula
  // k4_rssi not used in formula (but calculated)

  const k1_lat = resLat.k1;
  const k2_lat = resLat.k2;
  const k3_lat = resLat.k3;
  const k4_lat = resLat.k4;

  const k1_tx = resTx.k1;
  const k2_tx = resTx.k2;
  // k3_tx not used
  const k4_tx = resTx.k4;

  const riskScoreRaw = calculateRiskScore(
    k1_rssi, k1_lat, k1_tx,
    k2_rssi, k2_lat, k2_tx,
    k3_lat,
    k4_lat, k4_tx
  );

  let overallRisk: RiskLevel = "LOW";
  if (riskScoreRaw > 0.8) overallRisk = "HIGH";
  else if (riskScoreRaw > 0.4) overallRisk = "MEDIUM";

  return {
    // Top-level stats can just be from the "primary" or maybe average? 
    // Usually usage expects a single set of numbers for the main view if not handling 'signals' property.
    // We will assume the UI handles 'signals' if present.
    // For safety, let's put RSSI as default top level or just zeros?
    // Let's copy RSSI as the "Main" abstract if something blindly reads it, 
    // but overwrite riskScore and overallRisk.
    ...resRssi,
    driftScore: (resRssi.driftScore + resLat.driftScore + resTx.driftScore) / 3, // Avg for summary
    stabilityScore: (resRssi.stabilityScore + resLat.stabilityScore + resTx.stabilityScore) / 3,

    overallRisk,
    riskScore: riskScoreRaw,

    signals: {
      'RSSI': resRssi,
      'Latency': resLat,
      'TxErr': resTx
    }
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