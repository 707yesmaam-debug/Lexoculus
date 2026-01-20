'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Scale, ArrowRight, Lock, Eye } from 'lucide-react';
import RiskClassificationCard from '@/components/RiskClassificationCard';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

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
                body: JSON.stringify({ repo_scan_id }),
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
                            <p className="font-mono text-sm text-[#555] mb-8 max-w-md">
                                Perform risk mapping against EU AI Act Database of High-Risk Systems.
                            </p>

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
                            <div className="flex items-center gap-2 font-mono text-xs text-[#555]">
                                <span>ASSESSED:</span>
                                <span>{new Date(assessment.assessed_at).toLocaleString()}</span>
                            </div>

                            <Button
                                onClick={() => router.push(`/dashboard/context-verifier/${repo_scan_id}`)}
                                className="bg-[#FF4F00] hover:bg-black text-white rounded-none h-10 px-6 font-mono text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                Verify_Context <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
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
                    />
                </div>
            )}
        </div>
    );
}
