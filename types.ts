export enum Domain {
  PON = 'PON',
  DOCSIS = 'DOCSIS',
  FWA = 'FWA',
  MDU = 'MDU',
  WIFI = 'WIFI'
}

export type KernelType = 'drift' | 'stability' | 'boundary' | 'oscillation';

export interface KernelConfig {
  sample_interval_sec: number; // Added to support correct time-based windowing
  drift: {
    short_window_samples: number;
    long_window_samples: number;
    metrics: string[];
    thresholds: {
      warning: number;
      alert: number;
      critical: number;
    };
  };
  stability: {
    window_samples: number;
    metrics: string[];
    variance_threshold: number;
    min_samples: number;
    smoothing_factor: number;
  };
  boundary: {
    window_samples: number;
    metrics: string[];
    high_percentile: number;
    derivative_threshold: number;
    min_consecutive_hits: number;
  };
  oscillation: {
    window_seconds: number;
    window_samples?: number; // Optional derived value
    min_switches: number;
    min_unique_states: number;
    metrics: string[]; // for categorical or values
  };
}

// Telemetry Data Points
export interface TelemetryPoint {
  timestamp: number;
  // Common / Multiple Domains
  latency_p95?: number;
  loss_rate?: number;
  jitter?: number;

  // DOCSIS
  us_snr_dB?: number;
  ds_snr_dB?: number;
  us_mer_dB?: number;
  ds_mer_dB?: number;
  us_utilization?: number;
  ds_utilization?: number;
  corrected_cw?: number;
  uncorrectable_cw?: number;
  profile_change_count?: number;
  t3_timeout_count?: number;
  t4_timeout_count?: number;

  // WIFI
  rssi_dBm?: number;
  snr_dB?: number;
  retry_rate?: number;
  mcs?: number;
  vht_rate_mbps?: number;
  channel_utilization?: number;
  client_count?: number;
  roam_count?: number;
  dfs_event_count?: number;
  channel_change_count?: number;

  // FWA
  rsrp_dBm?: number;
  rsrq_dB?: number;
  sinr_dB?: number;
  cqi?: number;
  bler_dl?: number;
  bler_ul?: number;
  harq_retx_dl?: number;
  prb_utilization_dl?: number;
  prb_utilization_ul?: number;
  throughput_dl_mbps?: number;
  handover_count?: number;
  beam_switch_count?: number;

  // PON / Existing
  rx_power_dBm?: number;
  tx_bias_mA?: number;
  laser_temp_C?: number;

  [key: string]: any;
}

export interface DemoScenario {
  id: string;
  domain: Domain;
  title: string;
  description: string;
  kernelFocus: KernelType;
  primaryMetrics: string[];
}