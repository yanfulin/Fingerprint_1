import React, { useState } from 'react';
import { Plus, Trash2, Play, RefreshCw, Save } from 'lucide-react';
import { DataGenConfig, FieldGenConfig, generateFlexibleData, DataPattern } from '../services/dataService';
import { TelemetryPoint } from '../types';

interface DataGeneratorConfigProps {
    onGenerate: (data: TelemetryPoint[]) => void;
}

const DEFAULT_FIELD: FieldGenConfig = {
    pattern: 'linear',
    initial: 0,
    noise: 0,
    slope: 1
};

export const DataGeneratorConfig: React.FC<DataGeneratorConfigProps> = ({ onGenerate }) => {
    const [config, setConfig] = useState<DataGenConfig>({
        sampleCount: 100,
        intervalMs: 1000,
        fields: {
            "metric_1": { ...DEFAULT_FIELD }
        }
    });

    const [jsonError, setJsonError] = useState<string>('');

    const handleGenerate = () => {
        try {
            const data = generateFlexibleData(config);
            onGenerate(data);
        } catch (err) {
            console.error("Generation failed", err);
        }
    };

    const addField = () => {
        const newFieldName = `metric_${Object.keys(config.fields).length + 1}`;
        setConfig(prev => ({
            ...prev,
            fields: {
                ...prev.fields,
                [newFieldName]: { ...DEFAULT_FIELD }
            }
        }));
    };

    const removeField = (key: string) => {
        const newFields = { ...config.fields };
        delete newFields[key];
        setConfig(prev => ({ ...prev, fields: newFields }));
    };

    const updateField = (key: string, updates: Partial<FieldGenConfig>) => {
        setConfig(prev => ({
            ...prev,
            fields: {
                ...prev.fields,
                [key]: { ...prev.fields[key], ...updates }
            }
        }));
    };

    const renameField = (oldKey: string, newKey: string) => {
        if (oldKey === newKey) return;
        const newFields: any = {};
        Object.keys(config.fields).forEach(k => {
            if (k === oldKey) {
                newFields[newKey] = config.fields[oldKey];
            } else {
                newFields[k] = config.fields[k];
            }
        });
        setConfig(prev => ({ ...prev, fields: newFields }));
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Data Generator Configuration</h2>
                    <p className="text-slate-400 mt-1">Design custom telemetry patterns and generate synthetic datasets.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20"
                >
                    <Play size={18} /> Generate & Visualize
                </button>
            </div>

            {/* Global Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Sample Count</label>
                    <input
                        type="number"
                        value={config.sampleCount}
                        onChange={(e) => setConfig({ ...config, sampleCount: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Interval (ms)</label>
                    <input
                        type="number"
                        value={config.intervalMs}
                        onChange={(e) => setConfig({ ...config, intervalMs: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Data Fields</h3>
                    <button
                        onClick={addField}
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <Plus size={16} /> Add Field
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(config.fields).map(([fieldName, fieldConfig]: [string, FieldGenConfig], idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-4 transition-all hover:border-slate-700">
                            <div className="flex items-center gap-4 mb-4">
                                <input
                                    type="text"
                                    value={fieldName}
                                    onChange={(e) => renameField(fieldName, e.target.value)}
                                    className="bg-transparent border-b border-dashed border-slate-600 text-lg font-medium text-blue-300 focus:outline-none focus:border-blue-500 w-48"
                                />
                                <select
                                    value={fieldConfig.pattern}
                                    onChange={(e) => updateField(fieldName, { pattern: e.target.value as DataPattern })}
                                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-300"
                                >
                                    <option value="constant">Constant</option>
                                    <option value="linear">Linear Trend</option>
                                    <option value="sine">Sine Wave</option>
                                    <option value="random">Random Noise</option>
                                    <option value="spike">Spike / Anomaly</option>
                                    <option value="categorical">Categorical</option>
                                </select>
                                <button
                                    onClick={() => removeField(fieldName)}
                                    className="ml-auto text-slate-600 hover:text-red-400"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <label className="block text-slate-500 mb-1">Initial Value</label>
                                    <input
                                        type={fieldConfig.pattern === 'categorical' ? "text" : "number"}
                                        value={fieldConfig.initial}
                                        onChange={(e) => updateField(fieldName, { initial: fieldConfig.pattern === 'categorical' ? e.target.value : parseFloat(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300"
                                    />
                                </div>

                                {fieldConfig.pattern !== 'categorical' && (
                                    <div>
                                        <label className="block text-slate-500 mb-1">Noise (+/-)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={fieldConfig.noise || 0}
                                            onChange={(e) => updateField(fieldName, { noise: parseFloat(e.target.value) })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300"
                                        />
                                    </div>
                                )}

                                {fieldConfig.pattern === 'linear' && (
                                    <div>
                                        <label className="block text-slate-500 mb-1">Slope (per step)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={fieldConfig.slope || 0}
                                            onChange={(e) => updateField(fieldName, { slope: parseFloat(e.target.value) })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300"
                                        />
                                    </div>
                                )}

                                {fieldConfig.pattern === 'sine' && (
                                    <>
                                        <div>
                                            <label className="block text-slate-500 mb-1">Amplitude</label>
                                            <input
                                                type="number"
                                                value={fieldConfig.amplitude || 10}
                                                onChange={(e) => updateField(fieldName, { amplitude: parseFloat(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-500 mb-1">Period (steps)</label>
                                            <input
                                                type="number"
                                                value={fieldConfig.period || 50}
                                                onChange={(e) => updateField(fieldName, { period: parseFloat(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300"
                                            />
                                        </div>
                                    </>
                                )}

                                {fieldConfig.pattern === 'spike' && (
                                    <>
                                        <div>
                                            <label className="block text-slate-500 mb-1">Spike Probability</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                max="1"
                                                value={fieldConfig.spikeProb || 0.01}
                                                onChange={(e) => updateField(fieldName, { spikeProb: parseFloat(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-500 mb-1">Spike Value</label>
                                            <input
                                                type="number"
                                                value={typeof fieldConfig.spikeVal === 'number' ? fieldConfig.spikeVal : 0}
                                                onChange={(e) => updateField(fieldName, { spikeVal: parseFloat(e.target.value) })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300"
                                            />
                                        </div>
                                    </>
                                )}

                                {fieldConfig.pattern === 'categorical' && (
                                    <div className="col-span-2">
                                        <label className="block text-slate-500 mb-1">Options (comma sep)</label>
                                        <input
                                            type="text"
                                            placeholder="OK,Warn,Fail"
                                            value={fieldConfig.options?.join(',') || ''}
                                            onChange={(e) => updateField(fieldName, { options: e.target.value.split(',') })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300"
                                        />
                                        <label className="block text-slate-500 mt-2 mb-1">Switch Prob.</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={fieldConfig.switchProb || 0.1}
                                            onChange={(e) => updateField(fieldName, { switchProb: parseFloat(e.target.value) })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300 w-24"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
