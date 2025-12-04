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
      cell_id,
      mesh_hops
    });
  }

  return points;
};