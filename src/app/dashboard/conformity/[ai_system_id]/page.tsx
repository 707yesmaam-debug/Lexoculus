'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Loader2, AlertCircle, CheckCircle2, Circle,
    Clock, Shield, AlertTriangle, ChevronDown, ChevronUp,
    Scale, FileText, ExternalLink, Play, Ban, Printer
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

// Types
interface ConformityStep {
    step_id: string;
    order: number;
    title: string;
    description: string;
    article_reference: string;
    requirements: string[];
    deliverables: string[];
    estimated_duration: string;
    requires_notified_body: boolean;
    status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
    article_url?: string;
}

interface PathwayData {
    applicable_module: string;
    module_name: string;
    module_description: string;
    legal_basis: string;
    requires_notified_body: boolean;
    self_assessment_eligible: boolean;
    steps: ConformityStep[];
    total_steps: number;
    estimated_timeline: string;
    annex_iii_category?: number;
    risk_classification: string;
    gpai_deployer: boolean;
    notes: string[];
}

interface AssessmentData {
    id: string;
    assessment_module: string;
    module_name: string;
    status: string;
    completion_percent: number;
    steps_data: ConformityStep[];
    requires_notified_body: boolean;
    self_assessment_eligible: boolean;
    estimated_timeline: string;
    notes: string[];
}

export default function ConformityAssessmentPage() {
    const params = useParams();
    const router = useRouter();
    const ai_system_id = params.ai_system_id as string;

    const [pathway, setPathway] = useState<PathwayData | null>(null);
    const [assessment, setAssessment] = useState<AssessmentData | null>(null);
    const [aiSystemName, setAiSystemName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isInitializing, setIsInitializing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedStep, setExpandedStep] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetch(`/api/conformity-assessment/${ai_system_id}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to load');

            if (data.assessment) {
                setAssessment(data.assessment);
            }
            if (data.pathway) {
                setPathway(data.pathway);
            }
            if (data.ai_system) {
                setAiSystemName(data.ai_system.name);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setIsLoading(false);
        }
    }, [ai_system_id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleInitialize = async () => {
        try {
            setIsInitializing(true);
            setError(null);

            const res = await fetch(`/api/conformity-assessment/${ai_system_id}`, {
                method: 'POST',
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to initialize');

            setAssessment(data.assessment);
            if (data.pathway) setPathway(data.pathway);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize');
        } finally {
            setIsInitializing(false);
        }
    };

    const handleStepUpdate = async (stepId: string, status: string) => {
        try {
            const res = await fetch(`/api/conformity-assessment/${ai_system_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step_id: stepId, status }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to update');

            setAssessment(data.assessment);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update step');
        }
    };

    const steps = assessment?.steps_data || pathway?.steps || [];
    const completionPercent = assessment?.completion_percent || 0;
    const moduleName = assessment?.module_name || pathway?.module_name || '';
    const requiresNB = assessment?.requires_notified_body || pathway?.requires_notified_body || false;
    const selfAssessment = assessment?.self_assessment_eligible || pathway?.self_assessment_eligible || false;
    const notes = (assessment?.notes || pathway?.notes || []) as string[];
    const estimatedTimeline = assessment?.estimated_timeline || pathway?.estimated_timeline || '';
    const isProhibited = pathway?.applicable_module === 'NOT_REQUIRED' && pathway?.risk_classification === 'UNACCEPTABLE';

    // Status icon helper
    const StepIcon = ({ status }: { status: string }) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
            case 'in_progress':
                return <Play className="w-5 h-5 text-[#FF4F00]" />;
            case 'blocked':
                return <Ban className="w-5 h-5 text-red-500" />;
            default:
                return <Circle className="w-5 h-5 text-[#CCC]" />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-black border-t-[#FF4F00] animate-spin rounded-full" />
                    <p className="font-mono text-sm text-[#555] tracking-widest uppercase">Loading_Conformity_Pathway...</p>
                </div>
            </div>
        );
    }

    if (error && !pathway && !assessment) {
        return (
            <div className="max-w-5xl mx-auto p-12">
                <div className="bg-[#FFF5F0] border-2 border-[#FF4F00] p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-[#FF4F00] mx-auto mb-6" />
                    <h2 className="font-serif text-3xl font-bold text-black mb-4">Assessment Error</h2>
                    <p className="font-mono text-black mb-8">{error}</p>
                    <Button
                        onClick={() => router.push('/dashboard/registry')}
                        className="bg-black text-white hover:bg-[#FF4F00] rounded-none font-mono uppercase tracking-widest px-8"
                    >
                        Return_To_Registry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8 md:p-12">
            {/* Header */}
            <div className="mb-12 border-b-2 border-black pb-8">
                <Link href="/dashboard/registry" className="inline-flex items-center text-[#555] hover:text-black font-mono text-xs uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back_to_Registry
                </Link>

                <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                    <div>
                        <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest uppercase">PHASE_05 // CONFORMITY_ASSESSMENT</div>
                        <h1 className="font-serif text-4xl md:text-5xl font-bold text-black tracking-tight mb-2">
                            Conformity Pathway.
                        </h1>
                        {aiSystemName && (
                            <p className="font-mono text-sm text-[#555]">{aiSystemName}</p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {requiresNB && (
                            <span className="font-mono text-[10px] bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 tracking-widest uppercase flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Notified Body Required
                            </span>
                        )}
                        {selfAssessment && (
                            <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 tracking-widest uppercase flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Self-Assessment Eligible
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end mb-8 no-print">
                    <Button
                        onClick={() => window.print()}
                        variant="outline"
                        className="border-black text-black hover:bg-black hover:text-white rounded-none font-mono text-xs uppercase tracking-widest gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        EXPORT_REPORT
                    </Button>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 2cm; }
                    body { background: white; }
                    .no-print, header, nav, footer, button { display: none !important; }
                    .print-only { display: block !important; }
                    .border-2 { border-width: 1px !important; }
                }
            `}</style>

            {/* Module Info Card */}
            <div className="border-2 border-black bg-white mb-8">
                <div className="px-6 py-4 border-b-2 border-black bg-gradient-to-r from-[#1a1a2e] to-[#16213e] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Scale className="w-5 h-5 text-[#FF4F00]" />
                        <h2 className="font-serif text-xl font-bold text-white">{moduleName}</h2>
                    </div>
                    {estimatedTimeline && (
                        <div className="flex items-center gap-2 text-white/70">
                            <Clock className="w-4 h-4" />
                            <span className="font-mono text-[10px] uppercase tracking-widest">{estimatedTimeline}</span>
                        </div>
                    )}
                </div>

                <div className="p-6">
                    <p className="font-mono text-sm text-[#555] leading-relaxed mb-4">
                        {pathway?.module_description || assessment?.module_name}
                    </p>

                    {/* Legal basis */}
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-[#999]" />
                        <span className="font-mono text-xs text-[#999]">Legal Basis: {pathway?.legal_basis || assessment?.assessment_module}</span>
                    </div>

                    {/* Progress bar */}
                    {steps.length > 0 && !isProhibited && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-xs text-[#555] uppercase tracking-widest">Progress</span>
                                <span className="font-mono text-xs font-bold text-black">{completionPercent}%</span>
                            </div>
                            <div className="h-2 bg-[#F0F0F0] border border-black/10">
                                <div
                                    className="h-full bg-[#FF4F00] transition-all duration-500"
                                    style={{ width: `${completionPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Initialize button if no assessment yet */}
                    {!assessment && !isProhibited && steps.length > 0 && (
                        <div className="mt-6 text-center">
                            <Button
                                onClick={handleInitialize}
                                disabled={isInitializing}
                                className="bg-black hover:bg-[#FF4F00] text-white rounded-none h-12 px-8 font-mono text-sm uppercase tracking-widest transition-all"
                            >
                                {isInitializing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        INITIALIZING...
                                    </>
                                ) : (
                                    <>START_CONFORMITY_TRACKING</>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="mb-8 bg-[#FFF5F0] border-l-4 border-[#FF4F00] p-6 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-[#FF4F00] flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-serif text-lg font-bold text-[#FF4F00]">Error</h3>
                        <p className="font-mono text-xs text-black mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Steps */}
            {steps.length > 0 && !isProhibited && (
                <div className="space-y-3">
                    {steps.map((step: ConformityStep, index: number) => {
                        const isExpanded = expandedStep === step.step_id;
                        return (
                            <div key={step.step_id} className={`border-2 ${step.status === 'completed'
                                ? 'border-emerald-200 bg-emerald-50/30'
                                : step.status === 'in_progress'
                                    ? 'border-[#FF4F00]/40 bg-[#FFF5F0]'
                                    : 'border-black/10 bg-white'
                                }`}>
                                {/* Step Header */}
                                <button
                                    onClick={() => setExpandedStep(isExpanded ? null : step.step_id)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <StepIcon status={step.status} />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[10px] text-[#999] uppercase">Step {step.order}</span>
                                                {step.requires_notified_body && (
                                                    <span className="font-mono text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 uppercase">NB Required</span>
                                                )}
                                            </div>
                                            <h3 className="font-serif text-lg font-bold text-black">{step.title}</h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-[10px] text-[#999] uppercase hidden md:block">{step.estimated_duration}</span>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[#999]" /> : <ChevronDown className="w-4 h-4 text-[#999]" />}
                                    </div>
                                </button>

                                {/* Step Details (expanded) */}
                                {isExpanded && (
                                    <div className="px-6 pb-6 border-t border-black/10 pt-4 space-y-4">
                                        <p className="font-mono text-xs text-[#555] leading-relaxed">{step.description}</p>

                                        {step.article_url ? (
                                            <a
                                                href={step.article_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
                                            >
                                                <ExternalLink className="w-3 h-3 text-[#FF4F00]" />
                                                <span className="font-mono text-[10px] text-[#FF4F00] underline decoration-[#FF4F00] underline-offset-2">
                                                    {step.article_reference}
                                                </span>
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <ExternalLink className="w-3 h-3 text-[#FF4F00]" />
                                                <span className="font-mono text-[10px] text-[#FF4F00]">{step.article_reference}</span>
                                            </div>
                                        )}

                                        {/* Requirements */}
                                        <div>
                                            <h4 className="font-mono text-[10px] text-[#555] uppercase tracking-widest mb-2">Requirements</h4>
                                            <ul className="space-y-1">
                                                {step.requirements.map((req, i) => (
                                                    <li key={i} className="font-mono text-[11px] text-[#555] flex items-start gap-2">
                                                        <span className="text-[#FF4F00] mt-0.5">→</span>
                                                        {req}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Deliverables */}
                                        <div>
                                            <h4 className="font-mono text-[10px] text-[#555] uppercase tracking-widest mb-2">Deliverables</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {step.deliverables.map((del, i) => (
                                                    <span key={i} className="font-mono text-[10px] bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-1">{del}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Status Actions - Checklist Mode */}
                                        {assessment && (
                                            <div className="pt-4 border-t border-black/5 mt-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStepUpdate(step.step_id, step.status === 'completed' ? 'not_started' : 'completed');
                                                    }}
                                                    className={`
                                                        group flex items-center gap-3 px-4 py-2 border transition-all w-full md:w-auto
                                                        ${step.status === 'completed'
                                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                            : 'bg-white border-black/10 hover:border-black/30 text-[#555] hover:bg-gray-50'}
                                                    `}
                                                >
                                                    <div className={`
                                                        w-4 h-4 border flex items-center justify-center transition-colors
                                                        ${step.status === 'completed' ? 'bg-emerald-600 border-emerald-600' : 'border-black/20 bg-white group-hover:border-black/40'}
                                                    `}>
                                                        {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="font-mono text-[11px] uppercase tracking-widest font-medium">
                                                        {step.status === 'completed' ? 'Step Completed' : 'Mark as Complete'}
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Notes */}
            {notes.length > 0 && (
                <div className="mt-8 border border-black/10 bg-[#FAFAFA] p-6">
                    <h3 className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">Regulatory_Notes</h3>
                    <ul className="space-y-2">
                        {notes.map((note: string, i: number) => (
                            <li key={i} className="font-mono text-[11px] text-[#555] flex items-start gap-2">
                                <span className="text-[#FF4F00] mt-0.5 flex-shrink-0">•</span>
                                {note}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
