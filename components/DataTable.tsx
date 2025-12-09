import React, { useState, useMemo, useEffect } from 'react';
import { TelemetryPoint } from '../types';
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react';

interface Props {
  data: TelemetryPoint[];
  metrics: string[];
}

type SortDirection = 'asc' | 'desc';

export const DataTable: React.FC<Props> = ({ data, metrics }) => {
  const [sortKey, setSortKey] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState('');

  // Reset sort if the selected metric key no longer exists (e.g., scenario change)
  useEffect(() => {
    if (sortKey !== 'timestamp' && !metrics.includes(sortKey)) {
      setSortKey('timestamp');
      setSortDirection('desc');
    }
  }, [metrics, sortKey]);

  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(row => {
        // Check timestamp match
        if (new Date(row.timestamp).toLocaleTimeString().toLowerCase().includes(lowerFilter)) return true;
        // Check metrics match
        return metrics.some(m => String(row[m]).toLowerCase().includes(lowerFilter));
      });
    }

    // 2. Sort
    result.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, filter, sortKey, sortDirection, metrics]);

  // Pre-calculate analysis for all points to ensure consistency
  // (MOVED TO App.tsx) -> analysisMap removed.

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc'); // Default to descending for new columns (better for values/dates)
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortKey !== column) return <ArrowUpDown size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === 'asc' ? <ArrowUp size={14} className="text-blue-400" /> : <ArrowDown size={14} className="text-blue-400" />;
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold">Historical Data Log</h3>
          <span className="text-slate-400 text-xs font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
            {processedData.length} records
          </span>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={14} />
          <input
            type="text"
            placeholder="Search values..."
            className="bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-64 transition-all placeholder:text-slate-600"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-400 font-mono">
          <thead className="bg-slate-950 text-xs uppercase sticky top-0 z-10 shadow-sm">
            <tr>
              <th
                className="px-4 py-3 font-semibold text-slate-300 border-b border-slate-700 cursor-pointer hover:bg-slate-900 transition-colors select-none group"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center gap-2">
                  Timestamp
                  <SortIcon column="timestamp" />
                </div>
              </th>
              {metrics.map(m => (
                <th
                  key={m}
                  className="px-4 py-3 font-semibold text-slate-300 border-b border-slate-700 cursor-pointer hover:bg-slate-900 transition-colors select-none group"
                  onClick={() => handleSort(m)}
                >
                  <div className="flex items-center gap-2">
                    {m}
                    <SortIcon column={m} />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-slate-300 border-b border-slate-700 cursor-default">
                Drift Level
              </th>
              <th className="px-4 py-3 font-semibold text-slate-300 border-b border-slate-700 cursor-default">
                Risk Level
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {processedData.length > 0 ? (
              processedData.map((row) => (
                <tr key={row.timestamp} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                    {new Date(row.timestamp).toLocaleTimeString()}
                    <span className="text-[10px] text-slate-600 ml-1">.{String(new Date(row.timestamp).getMilliseconds()).padStart(3, '0')}</span>
                  </td>
                  {metrics.map(m => (
                    <td key={m} className="px-4 py-2 text-slate-200">
                      {row[m]}
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    {(() => {
                      // Pre-calculated in App.tsx
                      const driftScore = row.driftScore as number;
                      const driftStatus = row.driftStatus as string;

                      if (driftScore === undefined || !driftStatus) return <span className="text-slate-600 text-xs italic">-</span>;

                      const isDriftHigh = driftScore > 0.15;
                      return (
                        <div className="flex flex-col">
                          <span className={`font-mono font-bold ${isDriftHigh ? 'text-amber-400' : 'text-slate-400'}`}>
                            {driftScore.toFixed(3)}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">
                            {driftStatus.replace('_DRIFT', '')}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2">
                    {(() => {
                      const overallRisk = row.overallRisk as string;
                      if (!overallRisk) return <span className="text-slate-600 text-xs italic">Pending...</span>;

                      const oscillationLevel = row.oscillationLevel as string;
                      const boundaryStatus = row.boundaryStatus as string;
                      const stabilityStatus = row.stabilityStatus as string;

                      return (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] tracking-wider ${overallRisk === 'HIGH' ? 'bg-red-900/30 text-red-400 border border-red-900' :
                              overallRisk === 'MEDIUM' ? 'bg-amber-900/30 text-amber-400 border border-amber-900' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-900'
                              }`}>
                              {overallRisk}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-tight flex gap-2 mt-1">
                            {oscillationLevel !== 'LOW' && <span className="text-purple-400 font-semibold" title="Oscillation">OSC</span>}
                            {boundaryStatus !== 'NO' && <span className="text-orange-400 font-semibold" title="Boundary Hit">BND</span>}
                            {stabilityStatus !== 'GOOD' && <span className="text-blue-400 font-semibold" title="Stability">STB</span>}
                            {overallRisk === 'LOW' && oscillationLevel === 'LOW' && boundaryStatus === 'NO' && stabilityStatus === 'GOOD' &&
                              <span className="text-slate-600">-</span>
                            }
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))
            ) : (

              <tr>
                <td colSpan={metrics.length + 3} className="px-4 py-8 text-center text-slate-500 italic">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};