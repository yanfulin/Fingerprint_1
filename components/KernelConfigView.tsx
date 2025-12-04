import React from 'react';
import { KernelConfig, Domain } from '../types';
import { Activity, Anchor, AlertTriangle, GitCommit } from 'lucide-react';

interface Props {
  config: KernelConfig;
  domain: Domain;
}

const ConfigSection: React.FC<{ title: string; icon: React.ReactNode; data: any; color: string }> = ({ title, icon, data, color }) => (
  <div className={`border border-slate-700 rounded-lg p-4 bg-slate-900/50 flex-1 min-w-[250px]`}>
    <div className={`flex items-center gap-2 mb-3 ${color} font-semibold uppercase tracking-wider text-xs`}>
      {icon}
      {title}
    </div>
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => {
        if (key === 'metrics' || key === 'thresholds') return null; // Handle separately if needed
        return (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-slate-400 font-mono text-xs">{key}</span>
            <span className="text-slate-200 font-mono">{String(value)}</span>
          </div>
        );
      })}
      {/* Metrics List */}
      {data.metrics && (
        <div className="mt-3 pt-2 border-t border-slate-800">
           <span className="text-slate-500 text-xs font-mono block mb-1">Target Metrics</span>
           <div className="flex flex-wrap gap-1">
             {(data.metrics as string[]).map(m => (
               <span key={m} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700 font-mono">
                 {m}
               </span>
             ))}
           </div>
        </div>
      )}
      {/* Thresholds Special Display */}
      {data.thresholds && (
         <div className="mt-3 pt-2 border-t border-slate-800 grid grid-cols-3 gap-1 text-center">
            <div className="bg-yellow-900/30 text-yellow-500 text-xs rounded py-1">Warn: {data.thresholds.warning}</div>
            <div className="bg-orange-900/30 text-orange-500 text-xs rounded py-1">Alert: {data.thresholds.alert}</div>
            <div className="bg-red-900/30 text-red-500 text-xs rounded py-1">Crit: {data.thresholds.critical}</div>
         </div>
      )}
    </div>
  </div>
);

export const KernelConfigView: React.FC<Props> = ({ config, domain }) => {
  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2">
        Kernel Configuration (Domain: {domain})
      </h3>
      <div className="flex flex-wrap gap-4">
        <ConfigSection 
          title="Drift" 
          icon={<Activity size={14}/>} 
          data={config.drift} 
          color="text-blue-400" 
        />
        <ConfigSection 
          title="Stability" 
          icon={<Anchor size={14}/>} 
          data={config.stability} 
          color="text-emerald-400" 
        />
        <ConfigSection 
          title="Boundary" 
          icon={<AlertTriangle size={14}/>} 
          data={config.boundary} 
          color="text-amber-400" 
        />
        <ConfigSection 
          title="Oscillation" 
          icon={<GitCommit size={14}/>} 
          data={config.oscillation} 
          color="text-purple-400" 
        />
      </div>
    </div>
  );
};