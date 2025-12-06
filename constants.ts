import { Domain, DemoScenario, KernelConfig } from './types';

// Global defaults as specified in the prompt
export const GLOBAL_DEFAULTS = {
  drift: {
    short_window_samples: 10,
    long_window_samples: 144,
    thresholds: { warning: 0.2, alert: 0.4, critical: 0.7 }
  },
  stability: {
    window_samples: 60,
    variance_threshold: 0.25,
    min_samples: 20,
    smoothing_factor: 0.2
  },
  boundary: {
    window_samples: 60,
    high_percentile: 0.98,
    derivative_threshold: 3.0,
    min_consecutive_hits: 3
  },
  oscillation: {
    window_seconds: 600,
    min_switches: 3,
    min_unique_states: 2,
    max_idle_gap_sec: 240
  }
};

// Domain specific overrides for metrics
export const DOMAIN_CONFIGS: Record<Domain, KernelConfig> = {
  [Domain.PON]: {
    ...GLOBAL_DEFAULTS,
    drift: { ...GLOBAL_DEFAULTS.drift, metrics: ["rx_power_dBm", "tx_bias_mA", "laser_temp_C"] },
    stability: { ...GLOBAL_DEFAULTS.stability, metrics: ["rx_power_dBm", "laser_temp_C"] },
    boundary: { ...GLOBAL_DEFAULTS.boundary, metrics: ["rx_power_dBm", "tx_bias_mA"] },
    oscillation: { ...GLOBAL_DEFAULTS.oscillation, metrics: [] } // Not primary for PON usually, but defined
  },
  [Domain.DOCSIS]: {
    ...GLOBAL_DEFAULTS,
    drift: { ...GLOBAL_DEFAULTS.drift, metrics: ["us_snr_dB", "minislot_errors", "pre_fec_ber"] },
    stability: { ...GLOBAL_DEFAULTS.stability, metrics: ["us_snr_dB", "pre_fec_ber", "post_fec_ber"] },
    boundary: { ...GLOBAL_DEFAULTS.boundary, metrics: ["minislot_errors", "pre_fec_ber"] },
    oscillation: { ...GLOBAL_DEFAULTS.oscillation, metrics: ["ofdma_profile_id"] }
  },
  [Domain.FWA]: {
    ...GLOBAL_DEFAULTS,
    drift: { ...GLOBAL_DEFAULTS.drift, metrics: ["rsrp_dBm", "rsrq_dB", "sinr_dB"] },
    stability: { ...GLOBAL_DEFAULTS.stability, metrics: ["rsrp_dBm", "sinr_dB"] },
    boundary: { ...GLOBAL_DEFAULTS.boundary, metrics: ["sinr_dB", "rsrp_dBm"] },
    oscillation: { ...GLOBAL_DEFAULTS.oscillation, metrics: ["cell_id"] }
  },
  [Domain.MDU]: {
    ...GLOBAL_DEFAULTS,
    drift: { ...GLOBAL_DEFAULTS.drift, metrics: ["client_rssi_dBm", "client_snr_dB", "airtime_ratio"] },
    stability: { ...GLOBAL_DEFAULTS.stability, metrics: ["client_rssi_dBm", "airtime_ratio", "retry_rate"] },
    boundary: { ...GLOBAL_DEFAULTS.boundary, metrics: ["airtime_ratio", "retry_rate"] },
    oscillation: { ...GLOBAL_DEFAULTS.oscillation, metrics: [] }
  },
  [Domain.MESH]: {
    ...GLOBAL_DEFAULTS,
    drift: { ...GLOBAL_DEFAULTS.drift, metrics: ["backhaul_rssi_dBm", "backhaul_rate_Mbps", "mesh_hops"] },
    stability: { ...GLOBAL_DEFAULTS.stability, metrics: ["backhaul_rssi_dBm", "backhaul_rate_Mbps", "mesh_hops"] },
    boundary: { ...GLOBAL_DEFAULTS.boundary, metrics: ["backhaul_rssi_dBm", "mesh_hops"] },
    oscillation: { ...GLOBAL_DEFAULTS.oscillation, metrics: ["parent_id", "mesh_hops"] }
  }
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  // PON
  { id: 'PON-1', domain: Domain.PON, title: 'LOS Early Warning', description: 'Detect fiber aging / dirty connectors before failure.', kernelFocus: 'drift', primaryMetrics: ['rx_power_dBm', 'tx_bias_mA'] },
  { id: 'PON-2', domain: Domain.PON, title: 'Temperature-Driven Drift', description: 'Laser temp increases → bias rises → rx-power fluctuates.', kernelFocus: 'drift', primaryMetrics: ['laser_temp_C', 'tx_bias_mA'] },
  { id: 'PON-3', domain: Domain.PON, title: 'Splitter Imbalance', description: 'Abnormal drift profile on specific splitters.', kernelFocus: 'stability', primaryMetrics: ['rx_power_dBm'] },

  // DOCSIS
  { id: 'DOC-1', domain: Domain.DOCSIS, title: 'Rogue Modem Signature', description: 'Detect abnormal periodic bursts.', kernelFocus: 'boundary', primaryMetrics: ['us_snr_dB', 'minislot_errors'] },
  { id: 'DOC-2', domain: Domain.DOCSIS, title: 'Periodic Ingress / Noise', description: 'Boundary kernel picks repeating noise intervals.', kernelFocus: 'boundary', primaryMetrics: ['minislot_errors'] },
  { id: 'DOC-3', domain: Domain.DOCSIS, title: 'Aging Drop Cable', description: 'SNR drift + minislot errors indicating physical decay.', kernelFocus: 'drift', primaryMetrics: ['us_snr_dB', 'pre_fec_ber'] },

  // FWA
  { id: 'FWA-1', domain: Domain.FWA, title: 'Cell-Edge Oscillation', description: 'RSSI / RSRP seesaw → throughput collapse.', kernelFocus: 'oscillation', primaryMetrics: ['rsrp_dBm', 'sinr_dB'] },
  { id: 'FWA-2', domain: Domain.FWA, title: 'Weather-Driven Boundary', description: 'Rain / fog degrade SINR → predictable patterns.', kernelFocus: 'boundary', primaryMetrics: ['sinr_dB', 'rsrp_dBm'] },
  { id: 'FWA-3', domain: Domain.FWA, title: 'Multi-Carrier Handover', description: 'Device flaps between eNBs/NR cells.', kernelFocus: 'oscillation', primaryMetrics: ['cell_id', 'rsrp_dBm'] },

  // MDU
  { id: 'MDU-1', domain: Domain.MDU, title: 'Weak Units Detection', description: 'Identify unstable rooms before tenants move in.', kernelFocus: 'drift', primaryMetrics: ['client_rssi_dBm'] },
  { id: 'MDU-2', domain: Domain.MDU, title: 'Interference Cluster', description: 'Shared-walls where RSSI/SNR consistently degrade.', kernelFocus: 'stability', primaryMetrics: ['retry_rate', 'client_snr_dB'] },
  { id: 'MDU-3', domain: Domain.MDU, title: 'Aging Wi-Fi Zones', description: 'Track drifting areas (kitchens, closets).', kernelFocus: 'drift', primaryMetrics: ['client_rssi_dBm', 'airtime_ratio'] },

  // MESH
  { id: 'MESH-1', domain: Domain.MESH, title: 'Parent Flapping', description: 'Nodes switching parent every 20–90 sec.', kernelFocus: 'oscillation', primaryMetrics: ['parent_id', 'mesh_hops'] },
  { id: 'MESH-2', domain: Domain.MESH, title: 'Backhaul Degradation', description: 'RSSI & throughput drift → predict collapse.', kernelFocus: 'drift', primaryMetrics: ['backhaul_rssi_dBm', 'backhaul_rate_Mbps'] },
  { id: 'MESH-3', domain: Domain.MESH, title: 'Auto-Stabilization', description: 'Corrective actions (power, topology) impact.', kernelFocus: 'stability', primaryMetrics: ['backhaul_rssi_dBm'] },
];

export const APP_PASSWORD = 'admin';
