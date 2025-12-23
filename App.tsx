import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Domain, DemoScenario, TelemetryPoint } from './types';
import { DOMAIN_CONFIGS, DEMO_SCENARIOS } from './constants';
import { generateHistoricalData, analyzePoint, analyzeMultiSignalPoint } from './services/dataService';
import { KernelConfigView } from './components/KernelConfigView';
import { VisualizationPanel } from './components/VisualizationPanel';
import { DataTable } from './components/DataTable';
import { LoginPage } from './components/LoginPage';
import { DataGeneratorConfig } from './components/DataGeneratorConfig';
import {
  Network, Radio, Zap, Home, Wifi,
  LayoutDashboard, Server, Settings, Activity, SlidersHorizontal, Upload
} from 'lucide-react';

const DomainIcon = ({ domain, active }: { domain: Domain; active: boolean }) => {
  const color = active ? "text-white" : "text-slate-400";
  switch (domain) {
    case Domain.PON: return <Network className={color} size={18} />;
    case Domain.DOCSIS: return <Server className={color} size={18} />;
    case Domain.FWA: return <Radio className={color} size={18} />;
    case Domain.MDU: return <Home className={color} size={18} />;
    case Domain.WIFI: return <Wifi className={color} size={18} />;
    default: return <Activity className={color} size={18} />;
  }
};

type ViewMode = 'dashboard' | 'config';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedDomain, setSelectedDomain] = useState<Domain>(Domain.DOCSIS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [riskMode, setRiskMode] = useState<'single' | 'multi'>('single');

  // Window Sizes State
  const [windowShort, setWindowShort] = useState<number>(20);
  const [windowMid, setWindowMid] = useState<number>(60);
  const [windowLong, setWindowLong] = useState<number>(720);

  // Temporary state for sliders to prevent heavy recalculation while dragging
  const [tempWindowShort, setTempWindowShort] = useState<number>(20);
  const [tempWindowMid, setTempWindowMid] = useState<number>(60);
  const [tempWindowLong, setTempWindowLong] = useState<number>(720);

  // Custom Data State
  const [customData, setCustomData] = useState<TelemetryPoint[] | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial scenario and window defaults when domain changes
  useEffect(() => {
    if (!isCustomMode) {
      const firstScenario = DEMO_SCENARIOS.find(s => s.domain === selectedDomain);
      if (firstScenario) {
        setSelectedScenarioId(firstScenario.id);
      }
    }

    // Reset window sizes to domain defaults
    const config = DOMAIN_CONFIGS[selectedDomain];
    const defShort = config.drift.short_window_samples || 20;
    const defMid = config.stability.window_samples || 60;
    const defLong = config.drift.long_window_samples || 720;

    setWindowShort(defShort);
    setWindowMid(defMid);
    setWindowLong(defLong);

    setTempWindowShort(defShort);
    setTempWindowMid(defMid);
    setTempWindowLong(defLong);
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

  // Pre-calculate Analysis Data (Drift, Risk, etc.) so we can graph it
  const analyzedData = useMemo(() => {
    if (!displayedData.length) return [];

    const dataToSort = [...displayedData];
    // If not sorted by time ascending, sort it
    dataToSort.sort((a, b) => a.timestamp - b.timestamp);

    const primaryKey = currentMetrics[0];
    const numericSeries = dataToSort.map(d => typeof d[primaryKey] === 'number' ? d[primaryKey] : 0);

    return dataToSort.map((point, idx) => {
      // Use state variables for window sizes
      let analysis;
      if (riskMode === 'multi') {
        analysis = analyzeMultiSignalPoint(dataToSort, idx, windowLong, windowMid, windowShort);
      } else {
        analysis = analyzePoint(dataToSort, idx, windowLong, windowMid, windowShort, primaryKey);
      }

      // Map Risk to Number (Scale 0-1.0 to 0-100)
      const mappedRiskScore = analysis ? Math.min(100, Math.max(0, analysis.riskScore * 100)) : 0;

      return {
        ...point,
        ...analysis, // driftScore, stabilityScore, etc.
        riskScore: mappedRiskScore
      };
    });
  }, [displayedData, currentMetrics, windowLong, windowMid, windowShort, riskMode]); // Added dependencies

  const handleCustomDataGenerated = (data: TelemetryPoint[]) => {
    setCustomData(data);
    setIsCustomMode(true);
    setCurrentView('dashboard');
  };

  const domainScenarios = DEMO_SCENARIOS.filter(s => s.domain === selectedDomain);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);

        // Attempt to parse the specific format provided (Group -> Unit -> { rssi, latency, tx_err, Timeline })
        // We will take the first unit found.
        let rawUnitData: any = null;
        let unitName = '';

        const groups = Object.keys(json);
        if (groups.length > 0) {
          const firstGroup = json[groups[0]];
          const units = Object.keys(firstGroup);
          if (units.length > 0) {
            unitName = units[0];
            rawUnitData = firstGroup[unitName];
          }
        }

        if (rawUnitData && rawUnitData.Timeline && Array.isArray(rawUnitData.Timeline)) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const transformedData: TelemetryPoint[] = rawUnitData.Timeline.map((timeStr: string, index: number) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const timestamp = new Date(today);
            timestamp.setHours(hours, minutes, 0, 0);

            // Use generic mapped values, or specific if domain matches.
            // Using rssi -> rssi_dBm, latency -> latency_p95, tx_err -> loss_rate or retry_rate
            return {
              timestamp: timestamp.getTime(),
              rssi_dBm: rawUnitData.rssi?.[index] ?? 0,
              latency_p95: rawUnitData.latency?.[index] ?? 0,
              loss_rate: rawUnitData.tx_err?.[index] ?? 0, // Mapping tx_err to loss_rate for visualization
              // Add other fields if present in the raw data or leave them undefined
            };
          });

          setCustomData(transformedData);
          setIsCustomMode(true);
          setCurrentView('dashboard');

          // Switch to WIFI if the data looks like WIFI (RSSI present)
          if (rawUnitData.rssi) {
            setSelectedDomain(Domain.WIFI);
          }
        } else {
          alert('Invalid JSON structure. Expected Group -> Unit -> Timeline.');
        }

      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset file input so the same file can be selected again if needed
    event.target.value = '';
  };

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
          {([Domain.DOCSIS, Domain.WIFI, Domain.PON, Domain.FWA, Domain.MDU]).map((d) => (
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
          <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur flex flex-col gap-4 py-4 px-6">

            {/* Top Row: Scenarios & Status */}
            <div className="flex items-center justify-between">
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

                {/* File Import Input (Hidden) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />

                {/* Import Button */}
                <button
                  onClick={handleImportClick}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700"
                  title="Import JSON Data"
                >
                  <Upload size={14} />
                  Import Data
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-emerald-400 font-mono">LIVE CONNECTED</span>
              </div>
            </div>

            {/* Bottom Row: Window Settings & Risk Mode */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-400">
                  <SlidersHorizontal size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Window Sizes</span>
                </div>

                {/* Short Window (20) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">W_SHORT:</span>
                  <input
                    type="range"
                    min="5" max="100"
                    value={tempWindowShort}
                    onChange={(e) => setTempWindowShort(Number(e.target.value))}
                    onMouseUp={() => setWindowShort(tempWindowShort)}
                    onTouchEnd={() => setWindowShort(tempWindowShort)}
                    className="w-32 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <input
                    type="number"
                    value={tempWindowShort}
                    onChange={(e) => setTempWindowShort(Number(e.target.value))}
                    onBlur={() => setWindowShort(tempWindowShort)}
                    onKeyDown={(e) => e.key === 'Enter' && setWindowShort(tempWindowShort)}
                    className="text-xs text-blue-400 font-mono w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 focus:border-blue-500 focus:outline-none text-center"
                  />
                </div>

                {/* Mid Window (60) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">W_MID:</span>
                  <input
                    type="range"
                    min="20" max="300"
                    value={tempWindowMid}
                    onChange={(e) => setTempWindowMid(Number(e.target.value))}
                    onMouseUp={() => setWindowMid(tempWindowMid)}
                    onTouchEnd={() => setWindowMid(tempWindowMid)}
                    className="w-32 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <input
                    type="number"
                    value={tempWindowMid}
                    onChange={(e) => setTempWindowMid(Number(e.target.value))}
                    onBlur={() => setWindowMid(tempWindowMid)}
                    onKeyDown={(e) => e.key === 'Enter' && setWindowMid(tempWindowMid)}
                    className="text-xs text-indigo-400 font-mono w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 focus:border-indigo-500 focus:outline-none text-center"
                  />
                </div>

                {/* Long Window (720) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">W_LONG:</span>
                  <input
                    type="range"
                    min="300" max="10000"
                    value={tempWindowLong}
                    onChange={(e) => setTempWindowLong(Number(e.target.value))}
                    onMouseUp={() => setWindowLong(tempWindowLong)}
                    onTouchEnd={() => setWindowLong(tempWindowLong)}
                    className="w-32 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <input
                    type="number"
                    value={tempWindowLong}
                    onChange={(e) => setTempWindowLong(Number(e.target.value))}
                    onBlur={() => setWindowLong(tempWindowLong)}
                    onKeyDown={(e) => e.key === 'Enter' && setWindowLong(tempWindowLong)}
                    className="text-xs text-purple-400 font-mono w-14 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 focus:border-purple-500 focus:outline-none text-center"
                  />
                </div>
              </div>

              {/* Risk Calculation Mode Toggle */}
              <div className="flex items-center gap-3 bg-slate-800 p-1 rounded-lg">
                <span className="text-xs text-slate-400 px-2 font-semibold">RISK MODE</span>
                <button
                  onClick={() => setRiskMode('single')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${riskMode === 'single' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Single Signal
                </button>
                <button
                  onClick={() => setRiskMode('multi')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${riskMode === 'multi' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  Multi-Signal
                </button>
              </div>
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
                  overrideShort={windowShort}
                  overrideMid={windowMid}
                  overrideLong={windowLong}
                />
              )}

              {/* 2. Primary Visualization */}
              <VisualizationPanel
                data={analyzedData}
                scenario={isCustomMode ?
                  {
                    ...(activeScenario || DEMO_SCENARIOS[0]),
                    title: 'Custom Generated Data',
                    description: 'Data imported via JSON file.',
                    primaryMetrics: currentMetrics
                  }
                  : activeScenario}
                windowShort={windowShort}
                windowMid={windowMid}
                windowLong={windowLong}
              />

              {/* 3. Historical Data Grid */}
              <DataTable
                data={analyzedData}
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
