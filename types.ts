export enum Domain {
  PON = 'PON',
  DOCSIS = 'DOCSIS',
  FWA = 'FWA',
  MDU = 'MDU',
  MESH = 'MESH'
}

export type KernelType = 'drift' | 'stability' | 'boundary' | 'oscillation';

export interface KernelConfig {
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
    min_switches: number;
    min_unique_states: number;
    metrics: string[]; // for categorical or values
  };
}

// Telemetry Data Points
export interface TelemetryPoint {
  timestamp: number;
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