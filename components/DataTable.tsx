import React from 'react';
import { TelemetryPoint } from '../types';

interface Props {
  data: TelemetryPoint[];
  metrics: string[];
}

export const DataTable: React.FC<Props> = ({ data, metrics }) => {
  // We reverse the data to show newest first for the table
  const reversedData = [...data].reverse();

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-white font-semibold">Historical Data Log</h3>
        <span className="text-slate-400 text-xs font-mono">{data.length} records</span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm text-slate-400 font-mono">
          <thead className="bg-slate-950 text-xs uppercase sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-300 border-b border-slate-700">Timestamp</th>
              {metrics.map(m => (
                <th key={m} className="px-4 py-3 font-semibold text-slate-300 border-b border-slate-700">{m}</th>
              ))}
              <th className="px-4 py-3 font-semibold text-slate-300 border-b border-slate-700">Drift Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {reversedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                  {new Date(row.timestamp).toLocaleTimeString()} <span className="text-[10px] text-slate-600">.{new Date(row.timestamp).getMilliseconds()}</span>
                </td>
                {metrics.map(m => (
                  <td key={m} className="px-4 py-2 text-slate-200">
                    {row[m]}
                  </td>
                ))}
                {/* Simulated computed column */}
                <td className="px-4 py-2">
                   {Math.random() > 0.8 ? 
                    <span className="text-red-400">0.82</span> : 
                    <span className="text-emerald-500">0.12</span>
                   }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};