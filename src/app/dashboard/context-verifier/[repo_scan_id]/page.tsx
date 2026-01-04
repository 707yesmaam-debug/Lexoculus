'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import QuestionSet from '@/components/QuestionSet';
import FinalAssessmentCard from '@/components/FinalAssessmentCard';

type RiskClassification = 'UNACCEPTABLE' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK';

interface QuestionSetData {
    set_id: string;
    title: string;
    description?: string;
    required: boolean;
    questions: {
        id: string;
        question: string;
        type: string;
        options?: { value: string; label: string; riskImpact?: string }[];
        required: boolean;
        helpText?: string;
    }[];
}

interface ContextQuestionsData {
    risk_assessment_id: string;
    repo_scan_id: string;
    repo_name: string;
    repo_owner: string;
    preliminary_classification: RiskClassification;
    preliminary_score: number;
    question_sets: QuestionSetData[];
}

interface FinalAssessmentData {
    final_risk_assessment_id: string;
    final_risk_classification: RiskClassification;
    final_risk_score: number;
    final_narrative: string;
    context_verified: boolean;
    context_summary: {
        intended_use: string;
        target_users: string;
        deployment_region: string;
        has_human_oversight: boolean;
        has_testing_procedure: boolean;
        has_transparency_statement: boolean;
        has_appeal_mechanism: boolean;
        has_data_safeguards: boolean;
    };
    evidence_items: {
        category: string;
        description: string;
        supports_classification: string;
        regulatory_reference?: string;
        confidence: 'HIGH' | 'MEDIUM' | 'LOW';
        action_item?: string;
    }[];
    compliance_readiness: {
        overall_readiness: string;
        requirements_met: string[];
        requirements_pending: string[];
        developer_action_items: string[];
    };
    approved_for_report: boolean;
    requires_manual_review: boolean;
    escalation_reason?: string;
}

export default function ContextVerifierPage() {
    const params = useParams();
    const router = useRouter();
    const repo_scan_id = params.repo_scan_id as string;

    const [questionsData, setQuestionsData] = useState<ContextQuestionsData | null>(null);
    const [finalAssessment, setFinalAssessment] = useState<FinalAssessmentData | null>(null);
    const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch questions or existing assessment
    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);

                // First check for existing final assessment
                const finalResponse = await fetch(`/api/final-risk-assessment/${repo_scan_id}`);
                if (finalResponse.ok) {
                    const finalData = await finalResponse.json();
                    setFinalAssessment(finalData);
                    setIsLoading(false);
                    return;
                }

                // Get risk assessment ID from preliminary assessment
                const riskResponse = await fetch(`/api/risk-assessment/${repo_scan_id}`);
                if (!riskResponse.ok) {
                    throw new Error('Risk assessment not found. Please complete Feature 3 first.');
                }
                const riskData = await riskResponse.json();

                // Fetch context questions
                const questionsResponse = await fetch(`/api/context-questions/${riskData.assessment_id}`);
                if (!questionsResponse.ok) {
                    const data = await questionsResponse.json();
                    throw new Error(data.error || 'Failed to fetch questions');
                }
                const questionsData = await questionsResponse.json();
                setQuestionsData(questionsData);

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

    // Handle answer change
    const handleAnswerChange = (questionId: string, value: string | boolean) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    // Calculate completion percentage
    const totalQuestions = questionsData?.question_sets.reduce(
        (sum, set) => sum + set.questions.length, 0
    ) || 0;
    const answeredQuestions = Object.keys(answers).filter(k => answers[k] !== '').length;
    const completionPercentage = totalQuestions > 0
        ? Math.round((answeredQuestions / totalQuestions) * 100)
        : 0;

    // Check if form is complete
    const isComplete = questionsData?.question_sets.every(set =>
        set.questions.every(q => !q.required || answers[q.id] !== undefined)
    );

    // Submit verification
    const handleSubmit = async () => {
        if (!questionsData) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const response = await fetch('/api/verify-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    risk_assessment_id: questionsData.risk_assessment_id,
                    repo_scan_id: questionsData.repo_scan_id,
                    context_answers: answers,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            setFinalAssessment(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mb-4" />
                <p className="text-zinc-500">Loading verification data...</p>
            </div>
        );
    }

    // Error state
    if (error && !questionsData && !finalAssessment) {
        return (
            <div className="max-w-4xl mx-auto py-16">
                <div className="bg-red-950/20 border border-red-900/50 p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
                    <p className="text-zinc-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.push(`/dashboard/risk-classifier/${repo_scan_id}`)}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                        Back to Risk Classifier
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
                    onClick={() => router.push(`/dashboard/risk-classifier/${repo_scan_id}`)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Risk Classification
                </button>

                <h1 className="text-3xl font-bold text-zinc-100 tracking-tight mb-2">
                    Context Verification
                </h1>
                <p className="text-zinc-500">
                    Verify your AI system context for accurate compliance assessment
                </p>
            </div>

            {/* Show Final Assessment if exists */}
            {finalAssessment && (
                <>
                    {/* Repo Info */}
                    <div className="border border-zinc-800 bg-zinc-950/50 mb-8">
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-100">
                                    {questionsData?.repo_owner || 'repo'}/{questionsData?.repo_name || 'name'}
                                </h2>
                                <p className="text-zinc-500 text-sm mt-1">
                                    Context verification complete
                                </p>
                            </div>
                            {finalAssessment.approved_for_report && (
                                <button
                                    onClick={() => router.push(`/dashboard/report/${repo_scan_id}`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    Generate Report
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <FinalAssessmentCard
                        finalClassification={finalAssessment.final_risk_classification}
                        finalScore={finalAssessment.final_risk_score}
                        finalNarrative={finalAssessment.final_narrative}
                        contextSummary={finalAssessment.context_summary}
                        evidenceItems={finalAssessment.evidence_items}
                        complianceReadiness={finalAssessment.compliance_readiness}
                        approvedForReport={finalAssessment.approved_for_report}
                        requiresManualReview={finalAssessment.requires_manual_review}
                        escalationReason={finalAssessment.escalation_reason}
                    />
                </>
            )}

            {/* Show Questionnaire if no final assessment */}
            {!finalAssessment && questionsData && (
                <>
                    {/* Repo Info Card */}
                    <div className="border border-zinc-800 bg-zinc-950/50 mb-8">
                        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-100">
                                    {questionsData.repo_owner}/{questionsData.repo_name}
                                </h2>
                                <p className="text-zinc-500 text-sm mt-1">
                                    Preliminary: {questionsData.preliminary_classification.replace('_', ' ')}
                                    (Score: {questionsData.preliminary_score})
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-zinc-400" />
                                <span className="text-zinc-400 text-sm">Context Verification</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-zinc-400">Progress</span>
                                <span className="text-zinc-200 font-mono">{completionPercentage}%</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                            <p className="text-zinc-600 text-xs mt-2">
                                {answeredQuestions} of {totalQuestions} questions answered
                            </p>
                        </div>
                    </div>

                    {/* Question Sets */}
                    <div className="space-y-4 mb-8">
                        {questionsData.question_sets.map((set, idx) => (
                            <QuestionSet
                                key={set.set_id}
                                questionSet={set}
                                answers={answers}
                                onAnswerChange={handleAnswerChange}
                                isExpanded={idx === 0}
                            />
                        ))}
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-8 bg-red-950/20 border border-red-900/50 p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-400 font-medium">Verification Failed</p>
                                <p className="text-zinc-400 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={!isComplete || isSubmitting}
                            className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Complete Verification
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
