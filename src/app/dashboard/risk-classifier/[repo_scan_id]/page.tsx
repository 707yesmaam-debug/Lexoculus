'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Scale, ArrowRight, Lock, Eye, Globe, Shield, AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';
import RiskClassificationCard from '@/components/RiskClassificationCard';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { PURPOSE_OPTIONS } from '@/lib/compliance/eu-ai-act/purpose-categories';

type RiskClassification = 'UNACCEPTABLE' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK';

interface MatchedArticle {
    article: string;
    category: string;
    description: string;
    applicable: boolean | 'conditional';
    riskTier: RiskClassification;
    reasoning: string;
    requirements?: string[];
}

interface AssessmentData {
    assessment_id: string;
    repo_scan_id: string;
    risk_classification: RiskClassification;
    risk_score: number;
    risk_narrative: string;
    matched_annex_iii_articles: MatchedArticle[];
    unmatched_risk_indicators: string[];
    key_findings: string[];
    preliminary_assessment: {
        is_unacceptable: boolean;
        is_high_risk: boolean;
        is_limited_risk: boolean;
        is_minimal_risk: boolean;
    };
    manual_review_needed: boolean;
    manual_review_reason?: string;
    assessed_at: string;
    gpai_classification?: {
        is_gpai_deployer: boolean;
        is_gpai_provider: boolean;
        is_systemic_risk: boolean;
        detected_providers: {
            provider_name: string;
            matched_by: string;
            confidence: number;
            systemic_risk: boolean;
            open_source: boolean;
        }[];
        detected_models: string[];
        open_source_exception: boolean;
        obligations: {
            article: string;
            title: string;
            description: string;
            annex_reference?: string;
            applies_to: string;
            deadline: string;
            systemic_risk_only: boolean;
        }[];
        transparency_requirements: string[];
        article_references: string[];
        summary: string;
    };
    evidence?: any[];
    previous_classification?: string | null;
    previous_score?: number | null;
    classification_changed?: boolean;
    reclassified?: boolean;
    intended_purpose?: string;
    purpose_changed_from?: string | null;
}

interface AnalysisData {
    repo_scan_id: string;
    repo_name: string;
    repo_owner: string;
    primary_language: string;
    is_ai_system: boolean;
    confidence_score: number;
}

export default function RiskClassifierPage() {
    const params = useParams();
    const router = useRouter();
    const repo_scan_id = params.repo_scan_id as string;

    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [assessment, setAssessment] = useState<AssessmentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClassifying, setIsClassifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPro, setIsPro] = useState(false);
    const [isReclassifying, setIsReclassifying] = useState(false);
    const [intendedPurpose, setIntendedPurpose] = useState<string>('');

    // Fetch capability analysis data
    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);

                // Check for existing assessment first
                const assessmentResponse = await fetch(`/api/risk-assessment/${repo_scan_id}`);
                if (assessmentResponse.ok) {
                    const assessmentData = await assessmentResponse.json();
                    setAssessment(assessmentData);
                    setAnalysis({
                        repo_scan_id: assessmentData.repo_scan_id,
                        repo_name: assessmentData.repo_name,
                        repo_owner: assessmentData.repo_owner,
                        primary_language: assessmentData.primary_language,
                        is_ai_system: true, // If assessment exists, it's an AI system
                        confidence_score: 0,
                    });
                } else {
                    // Fetch capability analysis
                    const analysisResponse = await fetch(`/api/capability-analysis/${repo_scan_id}`);
                    if (!analysisResponse.ok) {
                        const data = await analysisResponse.json();
                        throw new Error(data.error || 'Failed to fetch analysis');
                    }
                    const analysisData = await analysisResponse.json();
                    setAnalysis({
                        repo_scan_id: analysisData.repo_scan_id,
                        repo_name: analysisData.repo_name,
                        repo_owner: analysisData.repo_owner,
                        primary_language: analysisData.primary_language,
                        is_ai_system: analysisData.is_ai_system,
                        confidence_score: analysisData.confidence_score,
                    });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setIsLoading(false);
            }
        }

        async function fetchSubscriptionStatus() {
            try {
                const res = await fetch('/api/subscription/status');
                if (res.ok) {
                    const data = await res.json();
                    setIsPro(data.is_pro || data.limits?.features?.pdf_reports);
                }
            } catch (e) {
                console.error('Failed to fetch subscription', e);
            }
        }

        if (repo_scan_id) {
            fetchData();
            fetchSubscriptionStatus();
        }
    }, [repo_scan_id]);

    // Classify risk
    const handleClassify = async () => {
        try {
            setIsClassifying(true);
            setError(null);

            const response = await fetch('/api/classify-risk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo_scan_id, intended_purpose: intendedPurpose || undefined }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Classification failed');
            }

            setAssessment(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Classification failed');
        } finally {
            setIsClassifying(false);
        }
    };

    // Force re-classify
    const handleReclassify = async () => {
        try {
            setIsReclassifying(true);
            setError(null);

            const response = await fetch('/api/classify-risk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo_scan_id, force: true, intended_purpose: intendedPurpose || undefined }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Re-classification failed');
            }

            setAssessment(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Re-classification failed');
        } finally {
            setIsReclassifying(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-black border-t-[#FF4F00] animate-spin rounded-full" />
                    <p className="font-mono text-sm text-[#555] tracking-widest uppercase">Initializing_Risk_Matrix...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !analysis) {
        return (
            <div className="max-w-5xl mx-auto p-12">
                <div className="bg-[#FFF5F0] border-2 border-[#FF4F00] p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-[#FF4F00] mx-auto mb-6" />
                    <h2 className="font-serif text-3xl font-bold text-black mb-4">Assessment Error</h2>
                    <p className="font-mono text-black mb-8">{error}</p>
                    <Button
                        onClick={() => router.push('/dashboard/scanner')}
                        className="bg-black text-white hover:bg-[#FF4F00] rounded-none font-mono uppercase tracking-widest px-8"
                    >
                        Return_To_Scanner
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8 md:p-12">
            {/* Header */}
            <div className="mb-12 border-b-2 border-black pb-8">
                <Link href={`/dashboard/analyzer/${repo_scan_id}`} className="inline-flex items-center text-[#555] hover:text-black font-mono text-xs uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back_to_Analysis
                </Link>

                <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                    <div>
                        <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest uppercase">PHASE_04 // RISK_MAPPING</div>
                        <h1 className="font-serif text-5xl font-bold text-black tracking-tight mb-4">
                            Risk Classification.
                        </h1>
                        <p className="font-mono text-sm text-[#555] max-w-xl leading-relaxed">
                            EU AI Act Annex III alignment and heuristic risk tier determination.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={() => {
                                if (isPro) {
                                    window.open(`/api/reports/trust-pack/${repo_scan_id}`, '_blank');
                                } else {
                                    router.push('/pricing');
                                }
                            }}
                            className={`rounded-none font-mono text-xs uppercase tracking-widest border border-black h-10 px-6 ${isPro
                                ? 'bg-black text-white hover:bg-[#FF4F00]'
                                : 'bg-white text-[#999] hover:text-black hover:border-black'
                                }`}
                        >
                            {isPro ? (
                                <>Download_Trust_Pack</>
                            ) : (
                                <><Lock className="w-3 h-3 mr-2" /> Upgrade_To_Access</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Repo Info */}
            {analysis && (
                <div className="border-2 border-black bg-white mb-12">
                    <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="font-serif text-2xl font-bold text-black items-center flex gap-2 break-all">
                                {analysis.repo_owner} <span className="text-[#999]">/</span> {analysis.repo_name}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3 self-start md:self-auto">
                            <Scale className="w-5 h-5 text-black" />
                            <span className="font-mono text-xs text-black uppercase tracking-widest whitespace-nowrap">Annex III Assessment</span>
                        </div>
                    </div>

                    {/* Classification Actions */}
                    {!assessment && (
                        <div className="p-8 flex flex-col items-center text-center">
                            <Scale className="w-16 h-16 text-black mb-6" />
                            <h3 className="font-serif text-2xl font-bold text-black mb-2">Ready to Classify</h3>
                            <p className="font-mono text-sm text-[#555] mb-6 max-w-md">
                                Perform risk mapping against EU AI Act Database of High-Risk Systems.
                            </p>

                            <div className="w-full max-w-xs mb-8 text-left">
                                <label className="block font-mono text-xs font-bold text-black uppercase tracking-widest mb-2">
                                    Intended Purpose
                                </label>
                                <select
                                    value={intendedPurpose}
                                    onChange={(e) => setIntendedPurpose(e.target.value)}
                                    className="w-full h-12 border-2 border-black bg-white px-3 font-mono text-sm text-black focus:outline-none focus:border-[#FF4F00]"
                                >
                                    {PURPOSE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <p className="font-mono text-[10px] text-[#555] mt-2">
                                    EU AI Act classifies risk based on intended purpose.
                                </p>
                            </div>

                            <Button
                                onClick={handleClassify}
                                disabled={isClassifying}
                                className="bg-black hover:bg-[#FF4F00] text-white rounded-none h-12 px-8 font-mono text-sm uppercase tracking-widest w-full max-w-xs transition-all"
                            >
                                {isClassifying ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        MAPPING_RISKS...
                                    </>
                                ) : (
                                    <>
                                        INITIATE_RISK_MAPPING
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Assessment exists - show proceed button */}
                    {assessment && (
                        <div className="p-6 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2 font-mono text-xs text-[#555] mb-2">
                                        <span>ASSESSED:</span>
                                        <span>{new Date(assessment.assessed_at).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] uppercase tracking-widest text-[#999]">Purpose:</span>
                                        <span className="font-mono text-xs font-bold text-black bg-[#F5F5F5] px-2 py-1">
                                            {PURPOSE_OPTIONS.find(p => p.value === assessment.intended_purpose)?.label || 'General Purpose / Other'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-3">
                                <div className="flex items-center gap-2 bg-[#F5F5F5] border border-[#E5E5E5] p-1 pr-2">
                                    <select
                                        value={intendedPurpose}
                                        onChange={(e) => setIntendedPurpose(e.target.value)}
                                        className="h-8 border-none bg-transparent px-2 font-mono text-xs text-black focus:outline-none max-w-[150px] truncate"
                                    >
                                        <option value="" disabled>Change Purpose...</option>
                                        {PURPOSE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label.split('/')[0].trim()}</option>
                                        ))}
                                    </select>
                                </div>

                                <Button
                                    onClick={handleReclassify}
                                    disabled={isReclassifying || isClassifying}
                                    variant="outline"
                                    className="rounded-none h-10 px-4 font-mono text-xs uppercase tracking-widest border-black hover:bg-[#F5F5F5] transition-all"
                                >
                                    {isReclassifying ? (
                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />Re-classifying...</>
                                    ) : (
                                        <><RefreshCw className="w-4 h-4 mr-2" />Re-classify</>
                                    )}
                                </Button>

                                <Button
                                    onClick={() => router.push(`/dashboard/context-verifier/${repo_scan_id}`)}
                                    className="bg-[#FF4F00] hover:bg-black text-white rounded-none h-10 px-6 font-mono text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                >
                                    Verify_Context <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="mb-12 bg-[#FFF5F0] border-l-4 border-[#FF4F00] p-6 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-[#FF4F00] flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-serif text-lg font-bold text-[#FF4F00]">Classification Failed</h3>
                        <p className="font-mono text-xs text-black mt-1 mb-0">{error}</p>
                    </div>
                </div>
            )}

            {/* Classification Change Banner */}
            {assessment?.purpose_changed_from && (
                <div className="mb-8 border-2 border-[#FF4F00] bg-[#FFF5F0] p-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-[#FF4F00] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-serif text-lg font-bold text-[#FF4F00] mb-2">Purpose Modification Detected</h4>
                            <p className="font-mono text-xs text-black">
                                The AI system's intended purpose was changed from <strong>{assessment.purpose_changed_from}</strong> to <strong>{assessment.intended_purpose}</strong>. 
                                The risk mapping has been updated accordingly.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {assessment?.classification_changed && assessment.previous_classification && (
                <div className="mb-8 border-2 border-[#FF4F00] bg-[#FFF5F0] p-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-[#FF4F00] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-serif text-lg font-bold text-[#FF4F00] mb-2">Classification Changed</h4>
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white border border-[#E5E5E5] px-3 py-2 text-center">
                                        <p className="font-mono text-[10px] text-[#999] uppercase tracking-widest">Previous</p>
                                        <p className="font-mono text-sm font-bold text-black">{assessment.previous_classification?.replace('_', ' ')}</p>
                                        {assessment.previous_score != null && (
                                            <p className="font-mono text-xs text-[#555]">Score: {assessment.previous_score}</p>
                                        )}
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-[#FF4F00]" />
                                    <div className="bg-white border-2 border-[#FF4F00] px-3 py-2 text-center">
                                        <p className="font-mono text-[10px] text-[#FF4F00] uppercase tracking-widest">Current</p>
                                        <p className="font-mono text-sm font-bold text-[#FF4F00]">{assessment.risk_classification.replace('_', ' ')}</p>
                                        <p className="font-mono text-xs text-[#555]">Score: {assessment.risk_score}</p>
                                    </div>
                                </div>
                                <p className="font-mono text-xs text-black">
                                    Risk classification has changed since the last scan. Review the updated findings and verify context if necessary.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assessment Results */}
            {assessment && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <RiskClassificationCard
                        classification={assessment.risk_classification}
                        score={assessment.risk_score}
                        narrative={assessment.risk_narrative}
                        matchedArticles={assessment.matched_annex_iii_articles}
                        keyFindings={assessment.key_findings}
                        manualReviewNeeded={assessment.manual_review_needed}
                        manualReviewReason={assessment.manual_review_reason}
                        evidence={assessment.evidence}
                    />
                </div>
            )}

            {/* GPAI Classification Panel */}
            {assessment?.gpai_classification && (assessment.gpai_classification.is_gpai_deployer || assessment.gpai_classification.is_gpai_provider) && (
                <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <div className="border-2 border-black bg-white">
                        {/* GPAI Header */}
                        <div className="px-6 py-4 border-b-2 border-black bg-gradient-to-r from-[#1a1a2e] to-[#16213e] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-[#FF4F00]" />
                                <h2 className="font-serif text-xl font-bold text-white tracking-tight">
                                    GPAI Classification
                                </h2>
                                <span className="font-mono text-[10px] text-[#FF4F00] bg-[#FF4F00]/10 border border-[#FF4F00]/30 px-2 py-0.5 tracking-widest uppercase">
                                    Chapter V
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {assessment.gpai_classification.is_gpai_provider && assessment.gpai_classification.is_systemic_risk ? (
                                    <span className="font-mono text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 tracking-widest uppercase flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Systemic Risk Provider
                                    </span>
                                ) : assessment.gpai_classification.is_gpai_deployer ? (
                                    <span className="font-mono text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 tracking-widest uppercase flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> GPAI Deployer
                                    </span>
                                ) : (
                                    <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 tracking-widest uppercase flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> Standard GPAI
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Plain-language explainer */}
                        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                            <p className="font-mono text-[11px] text-blue-800 leading-relaxed">
                                <strong>What is GPAI?</strong> General-Purpose AI (GPAI) models are AI systems like ChatGPT, Claude, or Gemini that can perform a wide range of tasks.
                                {assessment.gpai_classification.is_gpai_deployer && !assessment.gpai_classification.is_gpai_provider && (
                                    <> You integrate these models via API — making you a <strong>GPAI Deployer</strong>. Your obligations are limited to <strong>Article 50 transparency</strong>: inform users they are interacting with AI. Article 53/55 obligations (technical docs, adversarial testing) apply to the model <strong>provider</strong> (e.g. OpenAI, Anthropic), not to you.</>
                                )}
                                {assessment.gpai_classification.is_gpai_provider && (
                                    <> You train or host AI models — making you a <strong>GPAI Provider</strong>. You have significant obligations under Articles 53–55 of the EU AI Act.</>
                                )}
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Role Badge */}
                            <div className="flex flex-wrap gap-3">
                                {assessment.gpai_classification.is_gpai_deployer && (
                                    <div className="border-2 border-[#FF4F00] bg-[#FFF5F0] px-4 py-3">
                                        <span className="font-mono text-xs font-bold text-[#FF4F00] tracking-widest uppercase">GPAI Deployer</span>
                                        <p className="font-mono text-[10px] text-[#555] mt-1 leading-relaxed max-w-xs">Your app calls an external AI model (e.g. via API). You must inform users they&apos;re interacting with AI and comply with transparency rules.</p>
                                    </div>
                                )}
                                {assessment.gpai_classification.is_gpai_provider && (
                                    <div className="border-2 border-black bg-[#F5F5F5] px-4 py-3">
                                        <span className="font-mono text-xs font-bold text-black tracking-widest uppercase">GPAI Provider</span>
                                        <p className="font-mono text-[10px] text-[#555] mt-1 leading-relaxed max-w-xs">You train or host your own AI models. You must provide technical documentation and a training data summary.</p>
                                    </div>
                                )}
                                {assessment.gpai_classification.open_source_exception && (
                                    <div className="border-2 border-emerald-600 bg-emerald-50 px-4 py-3">
                                        <span className="font-mono text-xs font-bold text-emerald-700 tracking-widest uppercase">Open-Source Exception</span>
                                        <p className="font-mono text-[10px] text-emerald-600 mt-1 leading-relaxed max-w-xs">The GPAI models you use are open-source. This may reduce your compliance burden under Article 53(2), but transparency rules still apply.</p>
                                    </div>
                                )}
                            </div>

                            {/* Detected Providers */}
                            {assessment.gpai_classification.detected_providers.length > 0 && (
                                <div>
                                    <h3 className="font-mono text-xs text-[#555] uppercase tracking-widest mb-3">Detected_Providers</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {assessment.gpai_classification.detected_providers.map((provider, i) => (
                                            <div key={i} className="border border-black/20 bg-[#FAFAFA] p-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-serif text-sm font-bold text-black">{provider.provider_name}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="font-mono text-[10px] text-[#999] uppercase">{provider.matched_by}</span>
                                                            <span className="font-mono text-[10px] text-[#999]">{Math.round(provider.confidence * 100)}% conf</span>
                                                        </div>
                                                    </div>
                                                    {provider.systemic_risk ? (
                                                        <span className="font-mono text-[8px] bg-red-100 text-red-600 px-2 py-1 uppercase tracking-wider">⚠ High Impact</span>
                                                    ) : provider.open_source ? (
                                                        <span className="font-mono text-[8px] bg-emerald-100 text-emerald-600 px-2 py-1 uppercase tracking-wider">✓ Open Source</span>
                                                    ) : (
                                                        <span className="font-mono text-[8px] bg-gray-100 text-gray-500 px-2 py-1 uppercase tracking-wider">Standard</span>
                                                    )}
                                                </div>
                                                <p className="font-mono text-[10px] text-[#777] mt-2 leading-relaxed">
                                                    {provider.systemic_risk
                                                        ? `${provider.provider_name} is a systemic risk GPAI model (≥10^25 FLOPs). Article 55 obligations (adversarial testing, incident reporting) apply to ${provider.provider_name} as the provider — not to you as a deployer.`
                                                        : provider.open_source
                                                            ? `${provider.provider_name} provides open-source models. Some obligations may be reduced, but Article 50 transparency rules still apply.`
                                                            : `${provider.provider_name} was detected via ${provider.matched_by} analysis. Your obligation as deployer: inform users they are interacting with AI (Article 50).`
                                                    }
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Detected Models */}
                            {assessment.gpai_classification.detected_models.length > 0 && (
                                <div>
                                    <h3 className="font-mono text-xs text-[#555] uppercase tracking-widest mb-2">Detected_Models</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {assessment.gpai_classification.detected_models.map((model, i) => (
                                            <span key={i} className="font-mono text-xs bg-black text-white px-3 py-1">{model}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Obligations */}
                            {assessment.gpai_classification.obligations.length > 0 && (
                                <div>
                                    <h3 className="font-mono text-xs text-[#555] uppercase tracking-widest mb-1">GPAI_Obligations</h3>
                                    <p className="font-mono text-[10px] text-[#999] mb-3">These are the specific rules your app must follow. Each one links to an EU AI Act article.</p>
                                    <div className="space-y-2">
                                        {assessment.gpai_classification.obligations.map((obligation, i) => (
                                            <div key={i} className={`border p-3 ${obligation.systemic_risk_only
                                                ? 'border-red-200 bg-red-50'
                                                : 'border-black/10 bg-[#FAFAFA]'
                                                }`}>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono text-[10px] text-[#FF4F00] font-bold">{obligation.article}</span>
                                                            {obligation.annex_reference && (
                                                                <span className="font-mono text-[10px] text-[#999]">({obligation.annex_reference})</span>
                                                            )}
                                                            {obligation.systemic_risk_only && (
                                                                <span className="font-mono text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 uppercase">Systemic Only</span>
                                                            )}
                                                        </div>
                                                        <p className="font-serif text-sm font-bold text-black">{obligation.title}</p>
                                                        <p className="font-mono text-[11px] text-[#555] mt-1 leading-relaxed">{obligation.description}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <span className={`font-mono text-[10px] uppercase tracking-wider ${new Date(obligation.deadline) < new Date() ? 'text-red-500' : 'text-emerald-600'
                                                            }`}>
                                                            {new Date(obligation.deadline) < new Date() ? 'ACTIVE' : `Due ${new Date(obligation.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                                        </span>
                                                        <br />
                                                        <span className="font-mono text-[10px] text-[#999] uppercase">{obligation.applies_to}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Transparency Requirements */}
                            {assessment.gpai_classification.transparency_requirements.length > 0 && (
                                <div className="border-t border-black/10 pt-4">
                                    <h3 className="font-mono text-xs text-[#555] uppercase tracking-widest mb-1">Article_50_Transparency</h3>
                                    <p className="font-mono text-[10px] text-[#999] mb-3">Users must know they are interacting with AI. These rules apply to chatbots, AI-generated content, and deepfakes.</p>
                                    <div className="bg-[#FFFCE6] border border-[#E6D95E] p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Eye className="w-4 h-4 text-[#8B7E00]" />
                                            <span className="font-mono text-[10px] text-[#8B7E00] uppercase tracking-widest font-bold">Effective: 2 August 2026</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {assessment.gpai_classification.transparency_requirements.map((req, i) => (
                                                <li key={i} className="font-mono text-[11px] text-[#555] flex items-start gap-2">
                                                    <span className="text-[#FF4F00] mt-0.5">→</span>
                                                    {req}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="border-t border-black/10 pt-4">
                                <p className="font-mono text-xs text-[#555] leading-relaxed">
                                    {assessment.gpai_classification.summary}
                                </p>
                            </div>

                            {/* Article References */}
                            {assessment.gpai_classification.article_references.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {assessment.gpai_classification.article_references.map((ref, i) => (
                                        <span key={i} className="font-mono text-[9px] text-[#999] bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-0.5">{ref}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
