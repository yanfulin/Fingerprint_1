import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceLine, Legend, Brush
} from 'recharts';
import { TelemetryPoint, DemoScenario } from '../types';

interface Props {
  data: TelemetryPoint[];
  scenario: DemoScenario;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl">
        <p className="text-slate-400 text-xs mb-2">{new Date(label).toLocaleTimeString()}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 text-sm font-mono">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
            <span className="text-slate-300">{p.name}:</span>
            <span className="font-bold text-white">
              {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const VisualizationPanel: React.FC<Props> = ({ data, scenario }) => {
  const metrics = scenario.primaryMetrics;
  
  // State to track which metrics are hidden via the legend toggle
  const [hiddenMetrics, setHiddenMetrics] = useState<Set<string>>(new Set());

  // Reset hidden metrics when scenario changes
  useEffect(() => {
    setHiddenMetrics(new Set());
  }, [scenario.id]);

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
  
  // Decide chart type based on kernel focus
  const isOscillation = scenario.kernelFocus === 'oscillation';
  const isBoundary = scenario.kernelFocus === 'boundary';

  const brushProps = {
    dataKey: "timestamp",
    height: 30,
    stroke: "#475569",
    fill: "#1e293b",
    tickFormatter: (t: number) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
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
        <div className="text-xs px-3 py-1 bg-slate-900 rounded-full border border-slate-700 text-slate-400 font-mono">
          KERNEL: {scenario.kernelFocus.toUpperCase()}
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {isOscillation && typeof data[0]?.[metrics[0]] === 'string' ? (
             /* Oscillation Chart for Categorical (State) data like ID */
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})} 
                stroke="#64748b"
                tick={{fontSize: 12}}
              />
              <YAxis type="category" dataKey={metrics[0]} stroke="#64748b" tick={{fontSize: 12}} />
              {metrics[1] && <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{fontSize: 12}} />}
              
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
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorMetric1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMetric2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                stroke="#64748b"
                tick={{fontSize: 11}}
                minTickGap={30}
              />
              <YAxis stroke="#64748b" tick={{fontSize: 11}} domain={['auto', 'auto']} />
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

              {/* Boundary visualization hint */}
              {isBoundary && (
                <ReferenceLine y={90} label="Critical" stroke="red" strokeDasharray="3 3" opacity={0.5} />
              )}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};