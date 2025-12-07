import React, { useState, useEffect, useMemo } from 'react';
import { Domain, DemoScenario, TelemetryPoint } from './types';
import { DOMAIN_CONFIGS, DEMO_SCENARIOS } from './constants';
import { generateHistoricalData } from './services/dataService';
import { KernelConfigView } from './components/KernelConfigView';
import { VisualizationPanel } from './components/VisualizationPanel';
import { DataTable } from './components/DataTable';
import { LoginPage } from './components/LoginPage';
import { DataGeneratorConfig } from './components/DataGeneratorConfig';
import {
  Network, Radio, Zap, Home, Wifi,
  LayoutDashboard, Server, Settings, Activity
} from 'lucide-react';

const DomainIcon = ({ domain, active }: { domain: Domain; active: boolean }) => {
  const color = active ? "text-white" : "text-slate-400";
  switch (domain) {
    case Domain.PON: return <Network className={color} size={18} />;
    case Domain.DOCSIS: return <Server className={color} size={18} />;
    case Domain.FWA: return <Radio className={color} size={18} />;
    case Domain.MDU: return <Home className={color} size={18} />;
    case Domain.MESH: return <Wifi className={color} size={18} />;
    default: return <Activity className={color} size={18} />;
  }
};

type ViewMode = 'dashboard' | 'config';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedDomain, setSelectedDomain] = useState<Domain>(Domain.PON);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');

  // Custom Data State
  const [customData, setCustomData] = useState<TelemetryPoint[] | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Set initial scenario when domain changes
  useEffect(() => {
    if (!isCustomMode) {
      const firstScenario = DEMO_SCENARIOS.find(s => s.domain === selectedDomain);
      if (firstScenario) {
        setSelectedScenarioId(firstScenario.id);
      }
    }
  }, [selectedDomain, isCustomMode]);

  const activeScenario = useMemo(() =>
    DEMO_SCENARIOS.find(s => s.id === selectedScenarioId) || DEMO_SCENARIOS[0],
    [selectedScenarioId]
  );

  const displayedData = useMemo(() => {
    if (isCustomMode && customData) {
      return customData;
    }
    return generateHistoricalData(activeScenario);
  }, [activeScenario, isCustomMode, customData]);

  // Determine metrics to show
  const currentMetrics = useMemo(() => {
    if (isCustomMode && customData && customData.length > 0) {
      // Exclude timestamp from metrics list
      return Object.keys(customData[0]).filter(k => k !== 'timestamp');
    }
    return activeScenario.primaryMetrics;
  }, [isCustomMode, customData, activeScenario]);

  const handleCustomDataGenerated = (data: TelemetryPoint[]) => {
    setCustomData(data);
    setIsCustomMode(true);
    setCurrentView('dashboard');
  };

  const domainScenarios = DEMO_SCENARIOS.filter(s => s.domain === selectedDomain);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <LayoutDashboard className="text-blue-500" />
            FP Kernel <span className="text-slate-500 text-sm font-normal">v0.9</span>
          </h1>
          <p className="text-xs text-slate-500 mt-2">Fault Prediction & Diagnostics</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-3 ml-2">Domains</div>
          {Object.values(Domain).map((d) => (
            <button
              key={d}
              onClick={() => {
                setSelectedDomain(d);
                setIsCustomMode(false);
                setCurrentView('dashboard');
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${selectedDomain === d && !isCustomMode && currentView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <DomainIcon domain={d} active={selectedDomain === d && !isCustomMode && currentView === 'dashboard'} />
              {d}
            </button>
          ))}

          <div className="mt-8 border-t border-slate-800 pt-4">
            <button
              onClick={() => setCurrentView('config')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-all ${currentView === 'config'
                ? 'text-white bg-slate-800 rounded-md'
                : 'text-slate-400 hover:text-white'}`}
            >
              <Settings size={18} /> Configuration
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header / Scenario Selector (Only show in dashboard) */}
        {currentView === 'dashboard' && (
          <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm font-mono">SCENARIO:</span>

              {isCustomMode ? (
                <div className="bg-purple-900/30 text-purple-200 border border-purple-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} /> Custom Generator Data
                  <button onClick={() => setIsCustomMode(false)} className="ml-2 hover:text-white text-purple-400">✕</button>
                </div>
              ) : (
                <div className="flex bg-slate-800 rounded-lg p-1">
                  {domainScenarios.map(sc => (
                    <button
                      key={sc.id}
                      onClick={() => setSelectedScenarioId(sc.id)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${selectedScenarioId === sc.id
                        ? 'bg-slate-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                      {sc.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-emerald-400 font-mono">LIVE CONNECTED</span>
            </div>
          </header>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth bg-slate-950">

          {currentView === 'config' ? (
            <DataGeneratorConfig onGenerate={handleCustomDataGenerated} />
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* 1. Kernel Config View (Read-Only) - Hide in custom mode if irrelevant? Or keep? Let's keep for context or hide if custom */}
              {!isCustomMode && (
                <KernelConfigView
                  config={DOMAIN_CONFIGS[selectedDomain]}
                  domain={selectedDomain}
                />
              )}

              {/* 2. Primary Visualization */}
              <VisualizationPanel
                data={displayedData}
                scenario={isCustomMode ?
                  { ...activeScenario, title: 'Custom Generated Data', description: 'Data generated from configuration utility.' }
                  : activeScenario}
              />

              {/* 3. Historical Data Grid */}
              <DataTable
                data={displayedData}
                metrics={currentMetrics}
              />

              <div className="h-12"></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
