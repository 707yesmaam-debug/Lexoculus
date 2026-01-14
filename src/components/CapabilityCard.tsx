'use client';

import { Brain, Code2, Database, Cpu, AlertTriangle, CheckCircle, XCircle, Square, Info } from 'lucide-react';

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
        <div className={`flex items-center justify-between py-3 border-b border-black last:border-0 px-4 transition-colors ${value ? 'bg-[#FFF5F0]' : 'bg-white'}`}>
            <span className="text-black font-mono text-xs uppercase tracking-wide">{label}</span>
            {value ? (
                <span className="flex items-center gap-2 text-[#FF4F00] text-xs font-bold font-mono tracking-widest uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    DETECTED
                </span>
            ) : (
                <span className="flex items-center gap-2 text-[#999] text-xs font-mono tracking-widest uppercase opacity-50">
                    <Square className="w-3 h-3" />
                    NULL
                </span>
            )}
        </div>
    );
}

function CodeIndicator({ label, active }: { label: string; active: boolean }) {
    return (
        <div className={`px-4 py-3 border border-black text-xs font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${active
            ? 'bg-black text-white'
            : 'bg-white text-[#999] border-[#E5E5E5]'
            }`}>
            {active ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-[#999]" />}
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
        { key: 'uses_computer_vision', label: 'Comp. Vision' },
        { key: 'uses_biometric_processing', label: 'Biometrics' },
        { key: 'uses_emotion_recognition', label: 'Emotion Rec.' },
        { key: 'uses_critical_infrastructure', label: 'Critical Infra' },
        { key: 'uses_generative_ai', label: 'Generative AI' },
        { key: 'uses_nlp', label: 'NLP / LLM' },
        { key: 'uses_nlp_decision_making', label: 'Auto-Decision' },
        { key: 'targets_vulnerable_persons', label: 'Vulnerable Grp' },
        { key: 'high_impact_decision_making', label: 'Hi-Imp Decision' },
    ];

    const detectedRisks = riskIndicatorLabels.filter(r => riskIndicators[r.key]);

    return (
        <div className="space-y-8">
            {/* Capabilities Section */}
            <div className="border-2 border-black bg-white">
                <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center gap-3">
                    <Brain className="w-5 h-5 text-black" />
                    <h3 className="text-black font-serif font-bold text-lg">System Capabilities</h3>
                    <span className="ml-auto text-[10px] text-white bg-black px-2 py-1 font-mono uppercase tracking-widest">
                        {capabilities.length} SIGNALS
                    </span>
                </div>
                <div className="p-6">
                    {capabilities.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {capabilities.map((cap, i) => (
                                <span key={i} className="px-3 py-1.5 border border-black text-black text-xs font-mono uppercase tracking-wide hover:bg-black hover:text-white transition-colors cursor-default">
                                    {cap}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[#999] text-xs font-mono uppercase tracking-widest">No_Signals_Detected</p>
                    )}
                </div>
            </div>

            {/* Frameworks & Libraries */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Frameworks */}
                <div className="border-2 border-black bg-white">
                    <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center gap-3">
                        <Code2 className="w-5 h-5 text-black" />
                        <h3 className="text-black font-serif font-bold text-lg">Core Frameworks</h3>
                        <div className="group relative ml-2">
                            <Info className="w-4 h-4 text-[#999] cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-black text-white text-[10px] font-mono leading-tight z-10 invisible group-hover:visible shadow-xl">
                                A framework is a pre-built, structured foundation with reusable code and tools that provides a template for developing applications.
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        {frameworks.length > 0 ? (
                            <ul className="space-y-2">
                                {frameworks.map((fw, i) => (
                                    <li key={i} className="text-black text-sm flex items-center gap-3 font-mono">
                                        <div className="w-2 h-2 bg-[#FF4F00]" />
                                        {fw}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-[#999] text-xs font-mono uppercase tracking-widest">None_Detected</p>
                        )}
                    </div>
                </div>

                {/* Libraries */}
                <div className="border-2 border-black bg-white">
                    <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center gap-3">
                        <Database className="w-5 h-5 text-black" />
                        <h3 className="text-black font-serif font-bold text-lg">Dependencies</h3>
                    </div>
                    <div className="p-6">
                        {libraries.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {libraries.slice(0, 12).map((lib, i) => (
                                    <span key={i} className="px-2 py-1 bg-[#F5F5F5] border border-[#E5E5E5] text-[#555] text-[10px] font-mono uppercase">
                                        {lib}
                                    </span>
                                ))}
                                {libraries.length > 12 && (
                                    <span className="px-2 py-1 text-black border border-black text-[10px] font-mono bg-black text-white">
                                        +{libraries.length - 12} MORE
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="text-[#999] text-xs font-mono uppercase tracking-widest">No_AI_Libs_Found</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Code Structure Indicators */}
            <div className="border-2 border-black bg-white">
                <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-black" />
                    <h3 className="text-black font-serif font-bold text-lg">Architecture Patterns</h3>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <CodeIndicator label="Pipeline" active={hasMLPipeline} />
                    <CodeIndicator label="Training" active={hasTrainingCode} />
                    <CodeIndicator label="Inference" active={hasInferenceCode} />
                    <CodeIndicator label="Data Proc" active={hasDataProcessing} />
                    <CodeIndicator label="Serializ." active={hasModelSerialization} />
                </div>
            </div>

            {/* Risk Indicators */}
            <div className="border-2 border-black bg-white relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#FF4F00]"></div>
                <div className="px-6 py-4 border-b border-black bg-[#FFF5F0] flex items-center justify-between ml-1">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#FF4F00]" />
                        <h3 className="text-[#FF4F00] font-serif font-bold text-lg">EU AI Act • Risk Triggers</h3>
                    </div>
                    {detectedRisks.length > 0 && (
                        <span className="px-3 py-1 bg-[#FF4F00] text-white text-[10px] font-mono uppercase tracking-widest font-bold">
                            {detectedRisks.length} ALERT(S)
                        </span>
                    )}
                </div>
                <div className="p-0 ml-1">
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
            <div className="flex flex-wrap gap-8 text-xs font-mono uppercase tracking-wider text-[#555] border-t border-black pt-4">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-black">PRIMARY_LANG:</span>
                    <span>{languages.join(', ') || 'UNKNOWN'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-black">MODEL_ARCH:</span>
                    <span>{modelTypes.join(', ') || 'NONE_DETECTED'}</span>
                </div>
            </div>
        </div>
    );
}
