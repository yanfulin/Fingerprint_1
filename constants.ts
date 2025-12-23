import { Domain, DemoScenario, KernelConfig } from './types';

// Global defaults (Fallback)
export const GLOBAL_DEFAULTS: KernelConfig = {
  sample_interval_sec: 30,
  drift: {
    short_window_samples: 20,
    long_window_samples: 720,
    thresholds: { warning: 0.2, alert: 0.4, critical: 0.7 },
    metrics: []
  },
  stability: {
    window_samples: 60,
    variance_threshold: 0.25,
    min_samples: 20,
    smoothing_factor: 0.2,
    metrics: []
  },
  boundary: {
    window_samples: 60,
    high_percentile: 0.98,
    derivative_threshold: 3.0,
    min_consecutive_hits: 3,
    metrics: []
  },
  oscillation: {
    window_seconds: 600,
    window_samples: 20,
    min_switches: 3,
    min_unique_states: 2,
    max_idle_gap_sec: 240,
    metrics: []
  }
} as any;

// Domain specific overrides based on Engineering Whitepaper
export const DOMAIN_CONFIGS: Record<Domain, KernelConfig> = {
  [Domain.PON]: {
    ...GLOBAL_DEFAULTS,
    drift: { ...GLOBAL_DEFAULTS.drift, metrics: ["rx_power_dBm", "tx_bias_mA", "laser_temp_C"] },
    stability: { ...GLOBAL_DEFAULTS.stability, metrics: ["rx_power_dBm", "laser_temp_C"] },
    boundary: { ...GLOBAL_DEFAULTS.boundary, metrics: ["rx_power_dBm", "tx_bias_mA"] },
    oscillation: { ...GLOBAL_DEFAULTS.oscillation, metrics: [] }
  },

  // A) DOCSIS Configuration
  // Sample: 30s
  // W_short: 300-600s (10-20 samples) -> Start: 10
  // W_mid: 1800-3600s (60-120 samples) -> Start: 60
  // W_long: 21600-86400s (720-2880 samples) -> Start: 720
  [Domain.DOCSIS]: {
    ...GLOBAL_DEFAULTS,
    sample_interval_sec: 30,
    drift: {
      ...GLOBAL_DEFAULTS.drift,
      short_window_samples: 10,
      long_window_samples: 720,
      metrics: ["us_snr_dB", "ds_snr_dB", "us_mer_dB", "ds_mer_dB", "corrected_cw", "uncorrectable_cw"]
    },
    stability: {
      ...GLOBAL_DEFAULTS.stability,
      window_samples: 60,
      metrics: ["us_snr_dB", "us_mer_dB", "latency_p95", "t3_timeout_count", "t4_timeout_count"]
    },
    boundary: {
      ...GLOBAL_DEFAULTS.boundary,
      window_samples: 60,
      metrics: ["us_utilization", "ds_utilization", "uncorrectable_cw", "latency_p95"]
    },
    oscillation: {
      ...GLOBAL_DEFAULTS.oscillation,
      window_seconds: 300,
      window_samples: 10,
      metrics: ["profile_change_count", "t3_timeout_count"]
    }
  },

  // C) FWA Configuration
  // Sample: 10s
  // W_short: 60-300s (6-30 samples) -> Start: 6
  // W_mid: 900-3600s (90-360 samples) -> Start: 90
  // W_long: 7200-86400s (720-8640 samples) -> Start: 720
  [Domain.FWA]: {
    ...GLOBAL_DEFAULTS,
    sample_interval_sec: 10,
    drift: {
      ...GLOBAL_DEFAULTS.drift,
      short_window_samples: 6,
      long_window_samples: 720,
      metrics: ["rsrp_dBm", "sinr_dB", "bler_dl", "throughput_dl_mbps", "prb_utilization_dl"]
    },
    stability: {
      ...GLOBAL_DEFAULTS.stability,
      window_samples: 90,
      metrics: ["sinr_dB", "rsrp_dBm", "latency_p95", "harq_retx_dl"]
    },
    boundary: {
      ...GLOBAL_DEFAULTS.boundary,
      window_samples: 90,
      metrics: ["prb_utilization_dl", "prb_utilization_ul", "throughput_dl_mbps", "latency_p95"]
    },
    oscillation: {
      ...GLOBAL_DEFAULTS.oscillation,
      window_seconds: 60,
      window_samples: 6,
      metrics: ["handover_count", "beam_switch_count", "sinr_dB"]
    }
  },

  [Domain.MDU]: {
    ...GLOBAL_DEFAULTS,
    sample_interval_sec: 5,
    drift: {
      ...GLOBAL_DEFAULTS.drift,
      short_window_samples: 24,
      long_window_samples: 2160,
      metrics: ["rssi_dBm", "snr_dB", "channel_utilization"]
    },
    stability: {
      ...GLOBAL_DEFAULTS.stability,
      window_samples: 120,
      metrics: ["rssi_dBm", "channel_utilization", "retry_rate"]
    },
    boundary: {
      ...GLOBAL_DEFAULTS.boundary,
      window_samples: 120,
      metrics: ["channel_utilization", "retry_rate"]
    },
    oscillation: {
      ...GLOBAL_DEFAULTS.oscillation,
      window_seconds: 120,
      window_samples: 24,
      metrics: []
    }
  },

  // B) WIFI Configuration (was MESH)
  // Sample: 5s
  // W_short: 30-120s (6-24 samples) -> Start: 6 (Let's align with min)
  // W_mid: 300-900s (60-180 samples) -> Start: 60
  // W_long: 3600-21600s (720-4320 samples) -> Start: 720
  [Domain.WIFI]: {
    ...GLOBAL_DEFAULTS,
    sample_interval_sec: 5,
    drift: {
      ...GLOBAL_DEFAULTS.drift,
      short_window_samples: 6,
      long_window_samples: 720,
      metrics: ["rssi_dBm", "snr_dB", "mcs", "vht_rate_mbps"]
    },
    stability: {
      ...GLOBAL_DEFAULTS.stability,
      window_samples: 60,
      metrics: ["rssi_dBm", "snr_dB", "latency_p95", "retry_rate"]
    },
    boundary: {
      ...GLOBAL_DEFAULTS.boundary,
      window_samples: 60,
      metrics: ["channel_utilization", "client_count", "latency_p95"]
    },
    oscillation: {
      ...GLOBAL_DEFAULTS.oscillation,
      window_seconds: 30,
      window_samples: 6,
      metrics: ["roam_count", "dfs_event_count", "channel_change_count"]
    }
  }
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  // PON
  { id: 'PON-1', domain: Domain.PON, title: 'LOS Early Warning', description: 'Detect fiber aging / dirty connectors before failure.', kernelFocus: 'drift', primaryMetrics: ['rx_power_dBm', 'tx_bias_mA'] },
  { id: 'PON-2', domain: Domain.PON, title: 'Temperature-Driven Drift', description: 'Laser temp increases → bias rises → rx-power fluctuates.', kernelFocus: 'drift', primaryMetrics: ['laser_temp_C', 'tx_bias_mA'] },
  { id: 'PON-3', domain: Domain.PON, title: 'Splitter Imbalance', description: 'Abnormal drift profile on specific splitters.', kernelFocus: 'stability', primaryMetrics: ['rx_power_dBm'] },

  // DOCSIS
  { id: 'DOC-1', domain: Domain.DOCSIS, title: 'Rogue Modem Signature', description: 'Detect abnormal periodic bursts.', kernelFocus: 'boundary', primaryMetrics: ['us_snr_dB', 'uncorrectable_cw'] },
  { id: 'DOC-2', domain: Domain.DOCSIS, title: 'Periodic Ingress / Noise', description: 'Boundary kernel picks repeating noise intervals.', kernelFocus: 'boundary', primaryMetrics: ['us_mer_dB', 'corrected_cw'] },
  { id: 'DOC-3', domain: Domain.DOCSIS, title: 'Aging Drop Cable', description: 'SNR drift + errors indicating physical decay.', kernelFocus: 'drift', primaryMetrics: ['us_snr_dB', 'ds_snr_dB'] },

  // FWA
  { id: 'FWA-1', domain: Domain.FWA, title: 'Cell-Edge Oscillation', description: 'RSSI / RSRP seesaw → throughput collapse.', kernelFocus: 'oscillation', primaryMetrics: ['rsrp_dBm', 'sinr_dB'] },
  { id: 'FWA-2', domain: Domain.FWA, title: 'Weather-Driven Boundary', description: 'Rain / fog degrade SINR → predictable patterns.', kernelFocus: 'boundary', primaryMetrics: ['sinr_dB', 'rsrp_dBm'] },
  { id: 'FWA-3', domain: Domain.FWA, title: 'Multi-Carrier Handover', description: 'Device flaps between eNBs/NR cells.', kernelFocus: 'oscillation', primaryMetrics: ['handover_count', 'rsrp_dBm'] },

  // MDU
  { id: 'MDU-1', domain: Domain.MDU, title: 'Weak Units Detection', description: 'Identify unstable rooms before tenants move in.', kernelFocus: 'drift', primaryMetrics: ['rssi_dBm'] },
  { id: 'MDU-2', domain: Domain.MDU, title: 'Interference Cluster', description: 'Shared-walls where RSSI/SNR consistently degrade.', kernelFocus: 'stability', primaryMetrics: ['retry_rate', 'snr_dB'] },
  { id: 'MDU-3', domain: Domain.MDU, title: 'Aging Wi-Fi Zones', description: 'Track drifting areas (kitchens, closets).', kernelFocus: 'drift', primaryMetrics: ['rssi_dBm', 'channel_utilization'] },

  // WIFI
  { id: 'WIFI-1', domain: Domain.WIFI, title: 'Parent Flapping', description: 'Nodes switching parent every 20–90 sec.', kernelFocus: 'oscillation', primaryMetrics: ['roam_count', 'rssi_dBm'] },
  { id: 'WIFI-2', domain: Domain.WIFI, title: 'Backhaul Degradation', description: 'RSSI & throughput drift → predict collapse.', kernelFocus: 'drift', primaryMetrics: ['rssi_dBm', 'vht_rate_mbps'] },
  { id: 'WIFI-3', domain: Domain.WIFI, title: 'Auto-Stabilization', description: 'Corrective actions (power, topology) impact.', kernelFocus: 'stability', primaryMetrics: ['rssi_dBm', 'retry_rate'] },
];

export const APP_PASSWORD = 'ubeeadmin';
