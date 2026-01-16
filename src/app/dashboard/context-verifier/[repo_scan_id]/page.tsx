'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, ArrowRight, FileText, Lock } from 'lucide-react';
import QuestionSet from '@/components/QuestionSet';
import FinalAssessmentCard from '@/components/FinalAssessmentCard';
import { Button } from "@/components/ui/button";

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
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-black border-t-[#FF4F00] animate-spin rounded-full" />
                    <p className="font-mono text-sm text-[#555] tracking-widest uppercase">Loading_Questionnaire...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !questionsData && !finalAssessment) {
        return (
            <div className="max-w-5xl mx-auto p-12">
                <div className="bg-[#FFF5F0] border-2 border-[#FF4F00] p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-[#FF4F00] mx-auto mb-6" />
                    <h2 className="font-serif text-3xl font-bold text-black mb-4">Verification Error</h2>
                    <p className="font-mono text-black mb-8">{error}</p>
                    <Button
                        onClick={() => router.push(`/dashboard/risk-classifier/${repo_scan_id}`)}
                        className="bg-black text-white hover:bg-[#FF4F00] rounded-none font-mono uppercase tracking-widest px-8"
                    >
                        Return_To_Classifier
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8 md:p-12">
            {/* Header */}
            <div className="mb-12 border-b-2 border-black pb-8">
                <button
                    onClick={() => router.push(`/dashboard/risk-classifier/${repo_scan_id}`)}
                    className="flex items-center gap-2 text-[#555] hover:text-black transition-colors mb-6 font-mono text-xs uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back_to_Risk_Classification
                </button>

                <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest uppercase">PHASE_04a // CONTEXTUAL_ANALYSIS</div>
                <h1 className="text-5xl font-serif font-bold text-black tracking-tight mb-4">
                    Context Verification.
                </h1>
                <p className="font-mono text-sm text-[#555] max-w-xl leading-relaxed">
                    Verify AI system operational context for accurate regulatory compliance assessment.
                </p>
            </div>

            {/* Show Final Assessment if exists */}
            {finalAssessment && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Repo Info */}
                    <div className="border-2 border-black bg-white mb-12">
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="font-serif text-xl font-bold text-black">
                                    {questionsData?.repo_owner || 'repo'}/{questionsData?.repo_name || 'name'}
                                </h2>
                                <p className="font-mono text-xs text-[#555] mt-1 uppercase tracking-widest">
                                    Verification Complete
                                </p>
                            </div>
                            {finalAssessment.approved_for_report && (
                                <button
                                    onClick={() => router.push(`/dashboard/report/${repo_scan_id}`)}
                                    className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-[#FF4F00] text-white font-mono text-xs uppercase tracking-widest transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                                >
                                    <FileText className="w-4 h-4" />
                                    Generate_Report
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
                </div>
            )}

            {/* Show Questionnaire if no final assessment */}
            {!finalAssessment && questionsData && (
                <>
                    {/* Repo Info Card */}
                    <div className="border-2 border-black bg-white mb-12">
                        <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center justify-between">
                            <div>
                                <h2 className="font-serif text-xl font-bold text-black">
                                    {questionsData.repo_owner}/{questionsData.repo_name}
                                </h2>
                                <p className="font-mono text-xs text-[#555] mt-1 uppercase tracking-widest">
                                    Preliminary: {questionsData.preliminary_classification.replace('_', ' ')}
                                    (Score: {questionsData.preliminary_score})
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-black" />
                                <span className="font-mono text-xs text-black uppercase tracking-widest">Context Verification</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="px-6 py-6">
                            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest mb-2">
                                <span className="text-[#555]">Completion_Status</span>
                                <span className="text-black font-bold">{completionPercentage}%</span>
                            </div>
                            <div className="h-4 border border-black p-0.5 bg-white">
                                <div
                                    className="h-full bg-black transition-all duration-300"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                            <p className="text-[#999] font-mono text-xs mt-2 uppercase tracking-wide">
                                {answeredQuestions} of {totalQuestions} questions answered
                            </p>
                        </div>
                    </div>

                    {/* Question Sets */}
                    <div className="space-y-8 mb-12">
                        {questionsData.question_sets.map((set, idx) => (
                            <QuestionSet
                                key={set.set_id}
                                questionSet={set}
                                answers={answers}
                                onAnswerChange={handleAnswerChange}
                                isExpanded={idx === 0}
                                riskAssessmentId={questionsData.risk_assessment_id}
                            />
                        ))}
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-8 bg-[#FFF5F0] border border-[#FF4F00] p-4 flex items-start gap-4">
                            <AlertCircle className="w-5 h-5 text-[#FF4F00] flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-serif text-lg font-bold text-[#FF4F00]">Verification Failed</p>
                                <p className="font-mono text-xs text-black mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    {/* Submit Button - Fixed Footer */}
                    <div className="fixed bottom-0 left-0 md:left-[350px] right-0 p-6 bg-white border-t-2 border-black flex justify-end z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        <button
                            onClick={handleSubmit}
                            disabled={!isComplete || isSubmitting}
                            className="flex items-center gap-3 px-8 py-4 bg-black hover:bg-[#FF4F00] text-white font-mono text-sm uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#999] shadow-[6px_6px_0px_0px_rgba(255,255,255,1),_6px_6px_0px_2px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1),_2px_2px_0px_2px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting_Analysis...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Finalize_Verification
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

            {/* Spacer for fixed footer */}
            {!finalAssessment && questionsData && <div className="h-24" />}
        </div>
    );

