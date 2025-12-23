# Implementation Plan - Multi-Signal Risk Analysis & Visualization

## Objective
Implement a "Multi-Signal" risk calculation mode mirroring the logic in `FP_cal_v2.py` and update the frontend to visualize metrics (Drift, Stability, Boundary, Oscillation) for multiple signals (RSSI, Latency, TxErr) simultaneously.

## Context
Currently, the application analyzes a single "Primary Metric" based on the scenario. The user wants an option to switch to a "Multi-Signal" mode where the Risk Level is calculated using a specific weighted formula combining RSSI, Latency, and TxErr (Loss Rate) metrics.

## Proposed Changes

### 1. Data Service Updates (`services/dataService.ts`)

*   **Helper Functions**: Port exact Python logic for K1-K4 kernels.
    *   `calculate_k1_drift(short, long)`: `abs(s_mean - l_mean) / (l_std + eps)`
    *   `calculate_k2_stability(window)`: `1.0 - min(1.0, std / (range + eps))`
    *   `calculate_k3_boundary(window)`: Check thresholds (Min/Max/Derivative).
    *   `calculate_k4_oscillation(short, long)`: Crossing count of Long Mean.
*   **Stats Helper**: Implement `computeStats(arr)` returning `{ mean, std }`.
*   **Risk Calculation**: Implement `computeMultiSignalRisk(...)` using the weighted formula:
    ```typescript
    risk = 0.3 * (1 - k2_rssi) + 0.3 * (1 - k2_latency) + 0.1 * (1 - k2_txerr)
         + 0.05 * (k1_rssi + k1_latency + k1_txerr)
         + 0.05 * (k4_latency + k4_txerr)
         + 0.02 * k3_latency
    ```
*   **Analysis Function**: Create `analyzeMultiSignalPoint(...)` that:
    1.  Extracts windows for all 3 signals (RSSI, Latency, Loss).
    2.  Computes K1-K4 for each.
    3.  Computes Aggregate Risk.
    4.  Returns a structured object containing all these metrics.

### 2. State & Logic Updates (`App.tsx`)

*   **State**: Add `riskCalculationMode` state (`'single' | 'multi'`).
*   **UI**: Add a toggle switch in the Header (e.g., "Risk Mode: Single | Multi").
*   **Data Processing**:
    *   Update `analyzedData` `useMemo`.
    *   Check `riskCalculationMode`.
    *   If `multi`, call `analyzeMultiSignalPoint` for every point.
    *   If `single`, maintain existing behavior.

### 3. Visualization Updates (`components/VisualizationPanel.tsx`)

*   **Layout Change**:
    *   If `riskCalculationMode === 'multi'`:
        *   Display **Aggregate Risk Gauge**.
        *   Render a **Grid or Stacked Layout** showing metrics for all 3 signals.
        *   **Grouping**:
            *   *Row 1 (RSSI)*: Drift Chart, Stability Chart, Boundary Status, Oscillation Chart.
            *   *Row 2 (Latency)*: ...
            *   *Row 3 (Loss/TxErr)*: ...
    *   If `single`: Keep existing focused view.

*   **Component Refactoring**:
    *   Extract the "Metric Charts Group" (Drift/Stab/Bound/Osc) into a reusable sub-component (e.g., `SignalMetricsRow`) to easily repeat it for RSSI, Latency, and Loss.

## Verification Plan
1.  **Unit Logic**: Verify `calculate_k...` functions produce expected values from known inputs.
2.  **Risk Score**: Verify the aggregate risk formula outputs ~0.0-1.0 and reacts to changes in all signals.
3.  **UI**: Ensure toggle works and view switches correctly between Single and Multi modes.
