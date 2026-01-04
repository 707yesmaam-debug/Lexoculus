'use client';

import { Brain, Code2, Database, Cpu, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface RiskIndicators {
    uses_computer_vision?: boolean;
    uses_biometric_processing?: boolean;
    uses_emotion_recognition?: boolean;
    uses_critical_infrastructure?: boolean;
    uses_generative_ai?: boolean;
    uses_nlp?: boolean;
    uses_nlp_decision_making?: boolean;
    targets_vulnerable_persons?: boolean;
    high_impact_decision_making?: boolean;
}

interface CapabilityCardProps {
    capabilities: string[];
    frameworks: string[];
    libraries: string[];
    languages: string[];
    modelTypes: string[];
    riskIndicators: RiskIndicators;
    hasMLPipeline: boolean;
    hasTrainingCode: boolean;
    hasInferenceCode: boolean;
    hasDataProcessing: boolean;
    hasModelSerialization: boolean;
}

function RiskIndicatorRow({ label, value }: { label: string; value: boolean }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors px-2">
            <span className="text-zinc-400 text-sm">{label}</span>
            {value ? (
                <span className="flex items-center gap-1.5 text-amber-400 text-sm font-mono tracking-tight">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    DETECTED
                </span>
            ) : (
                <span className="flex items-center gap-1.5 text-zinc-700 text-sm font-mono tracking-tight opacity-50">
                    <XCircle className="w-3.5 h-3.5" />
                    NULL
                </span>
            )}
        </div>
    );
}

function CodeIndicator({ label, active }: { label: string; active: boolean }) {
    return (
        <div className={`px-3 py-2 border text-sm font-mono tracking-tight transition-all ${active
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
            : 'bg-zinc-950/30 border-white/5 text-zinc-600'
            }`}>
            {active ? <CheckCircle className="w-3.5 h-3.5 inline mr-2" /> : null}
            {label}
        </div>
    );
}

export default function CapabilityCard({
    capabilities,
    frameworks,
    libraries,
    languages,
    modelTypes,
    riskIndicators,
    hasMLPipeline,
    hasTrainingCode,
    hasInferenceCode,
    hasDataProcessing,
    hasModelSerialization,
}: CapabilityCardProps) {
    const riskIndicatorLabels: { key: keyof RiskIndicators; label: string }[] = [
        { key: 'uses_computer_vision', label: 'Computer Vision' },
        { key: 'uses_biometric_processing', label: 'Biometric Processing' },
        { key: 'uses_emotion_recognition', label: 'Emotion Recognition' },
        { key: 'uses_critical_infrastructure', label: 'Critical Infrastructure' },
        { key: 'uses_generative_ai', label: 'Generative AI' },
        { key: 'uses_nlp', label: 'Natural Language Processing' },
        { key: 'uses_nlp_decision_making', label: 'NLP Decision Making' },
        { key: 'targets_vulnerable_persons', label: 'Targets Vulnerable Persons' },
        { key: 'high_impact_decision_making', label: 'High-Impact Decisions' },
    ];

    const detectedRisks = riskIndicatorLabels.filter(r => riskIndicators[r.key]);

    return (
        <div className="space-y-6">
            {/* Capabilities Section */}
            <div className="glass-panel rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <h3 className="text-zinc-200 font-medium tracking-wide text-sm uppercase">Detailed Capabilities</h3>
                    <span className="ml-auto text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {capabilities.length} SIGNALS
                    </span>
                </div>
                <div className="p-4">
                    {capabilities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {capabilities.map((cap, i) => (
                                <span key={i} className="px-3 py-1 bg-blue-500/5 border border-blue-500/20 text-blue-300 text-xs font-mono hover:bg-blue-500/10 transition-colors cursor-default">
                                    {cap}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-600 text-sm italic font-mono">No specific AI capabilities signature detected.</p>
                    )}
                </div>
            </div>

            {/* Frameworks & Libraries */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Frameworks */}
                <div className="glass-panel rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-purple-400" />
                        <h3 className="text-zinc-200 font-medium tracking-wide text-sm uppercase">Core Frameworks</h3>
                    </div>
                    <div className="p-4">
                        {frameworks.length > 0 ? (
                            <ul className="space-y-1">
                                {frameworks.map((fw, i) => (
                                    <li key={i} className="text-zinc-300 text-sm flex items-center gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded">
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                        {fw}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-zinc-600 text-sm italic font-mono">No frameworks detected.</p>
                        )}
                    </div>
                </div>

                {/* Libraries */}
                <div className="glass-panel rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                        <Database className="w-5 h-5 text-zinc-400" />
                        <h3 className="text-zinc-200 font-medium tracking-wide text-sm uppercase">Dependencies</h3>
                    </div>
                    <div className="p-4">
                        {libraries.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {libraries.slice(0, 12).map((lib, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-black/20 border border-white/10 text-zinc-400 text-[10px] font-mono hover:text-white transition-colors">
                                        {lib}
                                    </span>
                                ))}
                                {libraries.length > 12 && (
                                    <span className="px-2 py-0.5 text-zinc-600 text-[10px] font-mono">
                                        +{libraries.length - 12} more
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="text-zinc-600 text-sm italic font-mono">No AI libraries detected.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Code Structure Indicators */}
            <div className="glass-panel rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-zinc-200 font-medium tracking-wide text-sm uppercase">Architecture Patterns</h3>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <CodeIndicator label="ML Pipeline" active={hasMLPipeline} />
                    <CodeIndicator label="Training" active={hasTrainingCode} />
                    <CodeIndicator label="Inference" active={hasInferenceCode} />
                    <CodeIndicator label="Data Proc" active={hasDataProcessing} />
                    <CodeIndicator label="Serialization" active={hasModelSerialization} />
                </div>
            </div>

            {/* Risk Indicators */}
            <div className="glass-panel rounded-lg overflow-hidden border-orange-500/20">
                <div className="px-4 py-3 border-b border-white/5 bg-orange-500/[0.02] flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <h3 className="text-orange-200 font-medium tracking-wide text-sm uppercase">EU AI Act • Risk Triggers</h3>
                    {detectedRisks.length > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-mono uppercase">
                            {detectedRisks.length} Risk Signals
                        </span>
                    )}
                </div>
                <div className="p-4">
                    {riskIndicatorLabels.map((indicator) => (
                        <RiskIndicatorRow
                            key={indicator.key}
                            label={indicator.label}
                            value={riskIndicators[indicator.key] || false}
                        />
                    ))}
                </div>
            </div>

            {/* Languages & Model Types (compact) */}
            <div className="flex flex-wrap gap-6 text-xs font-mono uppercase tracking-wider opacity-70">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-500">primary_lang:</span>
                    <span className="text-blue-300">{languages.join(', ') || 'UNKNOWN'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-zinc-500">model_arch:</span>
                    <span className="text-purple-300">{modelTypes.join(', ') || 'NONE_DETECTED'}</span>
                </div>
            </div>
        </div>
    );
}
