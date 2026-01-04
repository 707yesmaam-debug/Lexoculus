'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Scale, ArrowRight } from 'lucide-react';
import RiskClassificationCard from '@/components/RiskClassificationCard';

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
                        confidence_score: 0, // Will be fetched separately if needed
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

        if (repo_scan_id) {
            fetchData();
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
            <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mb-4" />
                <p className="text-zinc-500">Loading analysis data...</p>
            </div>
        );
    }

    // Error state
    if (error && !analysis) {
        return (
            <div className="max-w-4xl mx-auto py-16">
                <div className="bg-red-950/20 border border-red-900/50 p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
                    <p className="text-zinc-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard/scanner')}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                        Back to Scanner
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.push(`/dashboard/analyzer/${repo_scan_id}`)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Capability Analysis
                </button>

                <h1 className="text-3xl font-bold text-zinc-100 tracking-tight mb-2">
                    Risk Classification
                </h1>
                <p className="text-zinc-500">
                    EU AI Act Annex III Risk Mapping
                </p>
            </div>

            {/* Repo Info */}
            {analysis && (
                <div className="border border-zinc-800 bg-zinc-950/50 mb-8">
                    <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-100">
                                {analysis.repo_owner}/{analysis.repo_name}
                            </h2>
                            <p className="text-zinc-500 text-sm mt-1">
                                {analysis.primary_language || 'Unknown language'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-zinc-400" />
                            <span className="text-zinc-400 text-sm">Annex III Assessment</span>
                        </div>
                    </div>

                    {/* Classification Actions */}
                    {!assessment && (
                        <div className="px-6 py-4">
                            <button
                                onClick={handleClassify}
                                disabled={isClassifying}
                                className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isClassifying ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Classifying...
                                    </>
                                ) : (
                                    <>
                                        <Scale className="w-5 h-5" />
                                        Classify Risk
                                    </>
                                )}
                            </button>

                            {isClassifying && (
                                <p className="text-zinc-500 text-sm mt-2">
                                    Mapping capabilities against EU AI Act Annex III articles...
                                </p>
                            )}
                        </div>
                    )}

                    {/* Assessment exists - show proceed button */}
                    {assessment && (
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div className="text-sm text-zinc-500">
                                Assessed: {new Date(assessment.assessed_at).toLocaleString()}
                            </div>
                            <button
                                onClick={() => router.push(`/dashboard/context-verifier/${repo_scan_id}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                            >
                                Next: Verify Context
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="mb-8 bg-red-950/20 border border-red-900/50 p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-400 font-medium">Classification Failed</p>
                        <p className="text-zinc-400 text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Assessment Results */}
            {assessment && (
                <RiskClassificationCard
                    classification={assessment.risk_classification}
                    score={assessment.risk_score}
                    narrative={assessment.risk_narrative}
                    matchedArticles={assessment.matched_annex_iii_articles}
                    keyFindings={assessment.key_findings}
                    manualReviewNeeded={assessment.manual_review_needed}
                    manualReviewReason={assessment.manual_review_reason}
                />
            )}
        </div>
    );
}
