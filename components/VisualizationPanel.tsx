import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, Legend, Brush, ComposedChart
} from 'recharts';
import { TelemetryPoint, DemoScenario } from '../types';

interface Props {
  data: TelemetryPoint[];
  scenario: DemoScenario;
  windowShort?: number;
  windowMid?: number;
  windowLong?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl z-50">
        <p className="text-slate-400 text-xs mb-2">{new Date(label).toLocaleTimeString()}</p>
        {payload.map((p: any) => {
          if (p.name === 'timestamp') return null;
          return (
            <div key={p.name} className="flex items-center gap-2 text-sm font-mono">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
              <span className="text-slate-300">{p.name}:</span>
              <span className="font-bold text-white">
                {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// Reusable Component for a Single Signal Analysis View
const SignalAnalysisRow = ({ title, data, color, windowShort, windowMid, windowLong }: any) => {
  return (
    <div className="mb-8 border-t border-slate-700/50 pt-6">
      <h3 className={`text-sm font-bold mb-4 uppercase tracking-wide flex items-center gap-2`} style={{ color }}>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
        {title} Analysis
      </h3>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* 1. Raw Signal & Windows */}
        <div className="bg-slate-900/50 rounded border border-slate-700/50 p-2 xl:col-span-2">
          <h4 className="text-[10px] text-slate-500 uppercase font-mono mb-2">Signal & Weighted Windows</h4>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} syncId="multiSync">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="raw" stroke={color} strokeWidth={2} dot={false} name="Raw Signal" />
                <Line type="monotone" dataKey="meanShort" stroke="#f472b6" strokeWidth={1} dot={false} name={`Short (N=${windowShort})`} />
                <Line type="monotone" dataKey="meanMid" stroke="#818cf8" strokeWidth={1} dot={false} name={`Mid (N=${windowMid})`} />
                <Line type="monotone" dataKey="meanLong" stroke="#fbbf24" strokeWidth={1} strokeDasharray="5 5" dot={false} name={`Long (N=${windowLong})`} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Drift */}
        <div className="bg-slate-900/50 rounded border border-slate-700/50 p-2">
          <h4 className="text-[10px] text-amber-500 uppercase font-mono mb-2">Drift (K1)</h4>
          <div className="h-[120px]">
            <ResponsiveContainer>
              <AreaChart data={data} syncId="multiSync">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="timestamp" hide />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="driftScore" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.1} strokeWidth={2} name="Drift Score" />
                <ReferenceLine y={1.0} stroke="#fcd34d" strokeDasharray="2 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Stability */}
        <div className="bg-slate-900/50 rounded border border-slate-700/50 p-2">
          <h4 className="text-[10px] text-indigo-500 uppercase font-mono mb-2">Stability (K2)</h4>
          <div className="h-[120px]">
            <ResponsiveContainer>
              <AreaChart data={data} syncId="multiSync">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="timestamp" hide />
                <YAxis hide domain={[0, 1.0]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="stabilityScore" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} name="Stability Score" />
                <ReferenceLine y={0.5} stroke="#818cf8" strokeDasharray="2 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Oscillation */}
        <div className="bg-slate-900/50 rounded border border-slate-700/50 p-2">
          <h4 className="text-[10px] text-pink-500 uppercase font-mono mb-2">Oscillation (K4)</h4>
          <div className="h-[120px]">
            <ResponsiveContainer>
              <AreaChart data={data} syncId="multiSync">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="timestamp" hide />
                <YAxis hide domain={[0, 1.0]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="stepPost" dataKey="oscillationVal" stroke="#ec4899" fill="#ec4899" fillOpacity={0.1} strokeWidth={2} name="Oscillation Value" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Boundary */}
        <div className="bg-slate-900/50 rounded border border-slate-700/50 p-2">
          <h4 className="text-[10px] text-orange-500 uppercase font-mono mb-2">Boundary Hits (K3)</h4>
          <div className="h-[120px]">
            <ResponsiveContainer>
              <AreaChart data={data} syncId="multiSync">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="timestamp" hide />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="step" dataKey="boundaryHits" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} name="Boundary Hits" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};


export const VisualizationPanel: React.FC<Props> = ({ data, scenario, windowShort, windowMid, windowLong }) => {
  const metrics = scenario.primaryMetrics;
  const isMultiSignal = data.length > 0 && !!(data[data.length - 1] as any).signals;

  const [hiddenMetrics, setHiddenMetrics] = useState<Set<string>>(new Set());

  // --- MULTI SIGNAL DATA PREP ---
  const multiSignalData = useMemo(() => {
    if (!isMultiSignal) return null;
    return {
      rssi: data.map((d: any) => ({
        timestamp: d.timestamp,
        raw: d.rssi_dBm ?? d.rx_power_dBm,
        ...d.signals?.RSSI,
        driftScore: d.signals?.RSSI?.k1,
        stabilityScore: d.signals?.RSSI?.k2,
        oscillationVal: d.signals?.RSSI?.k4,
        boundaryHits: d.signals?.RSSI?.k3
      })),
      latency: data.map((d: any) => ({
        timestamp: d.timestamp,
        raw: d.latency_p95,
        ...d.signals?.Latency,
        driftScore: d.signals?.Latency?.k1,
        stabilityScore: d.signals?.Latency?.k2,
        oscillationVal: d.signals?.Latency?.k4,
        boundaryHits: d.signals?.Latency?.k3
      })),
      tx: data.map((d: any) => ({
        timestamp: d.timestamp,
        raw: d.loss_rate ?? d.tx_err,
        ...d.signals?.TxErr,
        driftScore: d.signals?.TxErr?.k1,
        stabilityScore: d.signals?.TxErr?.k2,
        oscillationVal: d.signals?.TxErr?.k4,
        boundaryHits: d.signals?.TxErr?.k3
      })),
      overall: data.map((d: any) => ({
        timestamp: d.timestamp,
        riskScore: d.riskScore // Raw score 0-1+
      }))
    };
  }, [data, isMultiSignal]);

  // --- SINGLE SIGNAL LEGACY PLOTTING DATA ---
  const plottingData = useMemo(() => {
    if (isMultiSignal) return [];
    return data.map((point, index, array) => {
      // Simple mapping for single view
      const driftNorm = Math.min((point.driftScore || 0) / 0.30, 1) * 100;
      const stabilityNorm = Math.min((point.stabilityScore || 0) / 0.20, 1) * 100;
      let boundaryVal = 0;
      if (point.boundaryStatus === 'WARNING') boundaryVal = 50;
      if (point.boundaryStatus === 'YES') boundaryVal = 100;
      let oscillationVal = 0;
      if (point.oscillationLevel === 'MEDIUM') oscillationVal = 50;
      if (point.oscillationLevel === 'HIGH') oscillationVal = 100;

      return {
        ...point,
        vizDrift: driftNorm,
        vizStability: stabilityNorm,
        boundaryNumeric: boundaryVal,
        oscillationNumeric: oscillationVal,
        rollingDrift: point.driftScore // Simplification
      };
    });
  }, [data, isMultiSignal, metrics]);


  if (isMultiSignal && multiSignalData) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Multi-Signal Risk Analysis</h2>
          <div className="flex gap-2 text-[10px] text-slate-500 font-mono">
            <span>Short:{windowShort}</span> |
            <span>Mid:{windowMid}</span> |
            <span>Long:{windowLong}</span>
          </div>
        </div>

        {/* Global Risk */}
        <div className="mb-8 p-4 bg-slate-900 rounded border border-slate-800">
          <h3 className="text-xs font-bold text-red-500 uppercase mb-2">Overall Risk Score (Weighted)</h3>
          <div className="h-[100px]">
            <ResponsiveContainer>
              <AreaChart data={multiSignalData.overall} syncId="multiSync">
                <XAxis dataKey="timestamp" hide />
                <YAxis domain={[0, 1.2]} hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="riskScore" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} name="Total Risk" />
                <ReferenceLine y={0.8} stroke="#ef4444" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Signal Sections */}
        <SignalAnalysisRow
          title="RSSI (Signal Strength)"
          data={multiSignalData.rssi}
          color="#3b82f6"
          windowShort={windowShort} windowMid={windowMid} windowLong={windowLong}
        />

        <SignalAnalysisRow
          title="Latency (P95)"
          data={multiSignalData.latency}
          color="#a855f7"
          windowShort={windowShort} windowMid={windowMid} windowLong={windowLong}
        />

        <SignalAnalysisRow
          title="Packet Loss / Tx Error"
          data={multiSignalData.tx}
          color="#ef4444"
          windowShort={windowShort} windowMid={windowMid} windowLong={windowLong}
        />
      </div>
    );
  }

  // --- EXISTING SINGLE SIGNAL VIEW ---

  const handleLegendClick = (e: any) => {
    const { dataKey } = e;
    setHiddenMetrics(prev => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        next.delete(dataKey);
      } else {
        next.add(dataKey);
      }
      return next;
    });
  };

  const isOscillation = scenario.kernelFocus === 'oscillation';
  const brushProps = {
    dataKey: "timestamp",
    height: 30,
    stroke: "#475569",
    fill: "#1e293b",
    tickFormatter: (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    travellerWidth: 10,
    tick: { fontSize: 10, fill: "#94a3b8" }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Visual Analysis: {scenario.title}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{scenario.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-xs px-3 py-1 bg-slate-900 rounded-full border border-slate-700 text-slate-400 font-mono">
            KERNEL: {scenario.kernelFocus.toUpperCase()}
          </div>
          {(windowShort || windowMid || windowLong) && (
            <div className="flex gap-2 text-[10px] text-slate-500 font-mono">
              {windowShort && <span>S:{windowShort}</span>}
              {windowMid && <span>M:{windowMid}</span>}
              {windowLong && <span>L:{windowLong}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="h-[400px] w-full mb-8">
        <ResponsiveContainer width="100%" height="100%">
          {isOscillation && typeof data[0]?.[metrics[0]] === 'string' ? (
            /* Oscillation Chart for Categorical (State) data like ID */
            <LineChart data={plottingData} syncId="kernelSync">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />
              <YAxis type="category" dataKey={metrics[0]} stroke="#64748b" tick={{ fontSize: 12 }} />
              {metrics[1] && <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 12 }} />}

              <Tooltip content={<CustomTooltip />} />
              <Legend onClick={handleLegendClick} wrapperStyle={{ cursor: 'pointer' }} />
              <Brush {...brushProps} y={360} />

              <Line
                type="step"
                dataKey={metrics[0]}
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                animationDuration={500}
                hide={hiddenMetrics.has(metrics[0])}
              />
              {metrics[1] && (
                <Line
                  type="step"
                  yAxisId="right"
                  dataKey={metrics[1]}
                  stroke="#38bdf8"
                  strokeDasharray="3 3"
                  hide={hiddenMetrics.has(metrics[1])}
                />
              )}
            </LineChart>
          ) : (
            /* Standard Numerical Chart (Drift/Stability/Boundary) */
            <AreaChart data={plottingData} syncId="kernelSync">
              <defs>
                <linearGradient id="colorMetric1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMetric2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                minTickGap={30}
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                onClick={handleLegendClick}
                wrapperStyle={{ cursor: 'pointer', userSelect: 'none' }}
              />
              <Brush {...brushProps} />

              <Area
                type="monotone"
                dataKey={metrics[0]}
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMetric1)"
                animationDuration={1000}
                isAnimationActive={true}
                hide={hiddenMetrics.has(metrics[0])}
              />

              {metrics[1] && (
                <Area
                  type="monotone"
                  dataKey={metrics[1]}
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMetric2)"
                  animationDuration={1000}
                  isAnimationActive={true}
                  hide={hiddenMetrics.has(metrics[1])}
                />
              )}

            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* --- DRIFT & STABILITY (Split Row) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* DRIFT */}
        <div className="bg-slate-900/50 rounded border border-slate-700/50 p-2">
          <h3 className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wide px-2">Drift Level (W_Long)</h3>
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={plottingData} syncId="kernelSync">
                <defs>
                  <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                <XAxis dataKey="timestamp" hide />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="driftScore"
                  stroke="#fbbf24"
                  fill="url(#colorDrift)"
                  strokeWidth={2}
                  name="Drift Score"
                />
                <ReferenceLine y={0.15} stroke="#fcd34d" strokeDasharray="3 3" />
                <ReferenceLine y={0.30} stroke="#f59e0b" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="rollingDrift"
                  stroke="#e2e8f0"
                  fill="transparent"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Rolling Avg (20)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STABILITY */}
        <div className="bg-slate-900/50 rounded border border-slate-700/50 p-2">
          <h3 className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wide px-2">Stability Score (W_Mid)</h3>
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={plottingData} syncId="kernelSync">
                <defs>
                  <linearGradient id="colorStability" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                <XAxis dataKey="timestamp" hide />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="stabilityScore"
                  stroke="#6366f1"
                  fill="url(#colorStability)"
                  strokeWidth={2}
                  name="Stability Score"
                />
                <ReferenceLine y={0.08} stroke="#818cf8" strokeDasharray="3 3" />
                <ReferenceLine y={0.20} stroke="#4f46e5" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- BOUNDARY & OSCILLATION (Split Row) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* BOUNDARY */}
        <div className="bg-slate-900/50 rounded border border-slate-700/50 p-2">
          <h3 className="text-xs font-bold text-orange-400 mb-2 uppercase tracking-wide px-2">Boundary Status (W_Mid)</h3>
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={plottingData} syncId="kernelSync">
                <defs>
                  <linearGradient id="colorBoundary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                <XAxis dataKey="timestamp" hide />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} ticks={[0, 50, 100]} />
                <YAxis yAxisId="right" orientation="right" stroke="#f97316" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="stepPost"
                  dataKey="boundaryNumeric"
                  stroke="#f97316"
                  fill="url(#colorBoundary)"
                  strokeWidth={2}
                  name="Boundary Level"
                />

                {/* Visualizing the raw signal against thresholds */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="boundarySignal"
                  stroke="#f97316"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "#f97316" }}
                  connectNulls
                  name="Signal Value"
                />


              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OSCILLATION */}
        <div className="bg-slate-900/50 rounded border border-slate-700/50 p-2">
          <h3 className="text-xs font-bold text-pink-400 mb-2 uppercase tracking-wide px-2">Oscillation Level (W_Short)</h3>
          <div className="h-[160px] w-full">
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={plottingData} syncId="kernelSync">
                  <defs>
                    <linearGradient id="colorOsc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} ticks={[0, 50, 100]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#facc15" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="stepPost"
                    dataKey="oscillationNumeric"
                    stroke="#ec4899"
                    fill="url(#colorOsc)"
                    strokeWidth={2}
                    name="Oscillation Level"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="oscillationChange"
                    stroke="#facc15"
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#facc15" }}
                    connectNulls
                    name="Oscillation Changes"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Overall Risk Level</h3>
      <div className="h-[200px] w-full bg-slate-900/50 rounded border border-slate-700/50 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={plottingData} syncId="kernelSync">
            <defs>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              stroke="#64748b"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              domain={[0, 100]}
              ticks={[0, 50, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />

            <Area
              type="stepPost"
              dataKey="riskScore"
              stroke="#ef4444"
              fill="url(#colorRisk)"
              strokeWidth={2}
              name="Overall Risk"
            />

            {/* Indicator Lines */}
            <Line
              type="monotone"
              dataKey="vizDrift"
              stroke="#fbbf24" // Amber for Drift
              strokeWidth={2}
              dot={false}
              name="Drift"
            />
            <Line
              type="monotone"
              dataKey="vizStability"
              stroke="#6366f1" // Indigo for Stability
              strokeWidth={2}
              dot={false}
              name="Stability"
            />
            <Line
              type="stepPost"
              dataKey="boundaryNumeric"
              stroke="#f97316" // Orange for Boundary
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="Boundary"
            />
            <Line
              type="stepPost"
              dataKey="oscillationNumeric"
              stroke="#ec4899" // Pink for Oscillation
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="Oscillation"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* --- WINDOW ANALYSIS CHART --- */}
      <h3 className="text-sm font-bold text-slate-400 mb-2 mt-6 uppercase tracking-wide">Window Analysis (Rolling Averages)</h3>
      <div className="h-[200px] w-full bg-slate-900/50 rounded border border-slate-700/50 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={plottingData} syncId="kernelSync">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              stroke="#64748b"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" iconType="circle" />

            <Line
              type="monotone"
              dataKey="meanShort"
              stroke="#f472b6" // Pink-400
              strokeWidth={2}
              dot={false}
              name={`Short Window (N=${windowShort || '?'})`}
              animationDuration={500}
            />
            <Line
              type="monotone"
              dataKey="meanMid"
              stroke="#818cf8" // Indigo-400
              strokeWidth={2}
              dot={false}
              name={`Mid Window (N=${windowMid || '?'})`}
              animationDuration={500}
            />
            <Line
              type="monotone"
              dataKey="meanLong"
              stroke="#fbbf24" // Amber-400
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name={`Long Window (N=${windowLong || '?'})`}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};