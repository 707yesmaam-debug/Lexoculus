'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import ReportDownloadCard from '@/components/ReportDownloadCard';
import StorageStatus from '@/components/StorageStatus';
import Link from 'next/link';
import FeedbackWidget from '@/components/FeedbackWidget';

interface ReportData {
    report_id: string;
    file_name: string;
    file_url: string;
    file_size: number;
    risk_classification: string;
    risk_score: number;
    repo_name: string;
    repo_owner: string;
    generated_at: string;
    has_signature: boolean;
}

interface AssessmentData {
    final_risk_assessment_id: string;
    final_risk_classification: string;
    final_risk_score: number;
    approved_for_report: boolean;
    requires_manual_review: boolean;
    repo_name?: string;
    repo_owner?: string;
}

export default function ReportGeneratorPage() {
    const params = useParams();
    const router = useRouter();
    const repo_scan_id = params.repo_scan_id as string;

    const [assessment, setAssessment] = useState<AssessmentData | null>(null);
    const [report, setReport] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [isFreeTier, setIsFreeTier] = useState(false);

    // Fetch assessment and existing report
    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);

                // Check subscription status
                const subRes = await fetch('/api/subscription/usage');
                if (subRes.ok) {
                    const subData = await subRes.json();
                    setIsFreeTier(subData.tier === 'free');
                }

                // Get final assessment
                const assessmentRes = await fetch(`/api/final-risk-assessment/${repo_scan_id}`);
                if (!assessmentRes.ok) {
                    throw new Error('Final assessment not found. Please complete context verification first.');
                }
                const assessmentData = await assessmentRes.json();
                setAssessment(assessmentData);

                // Check for existing report
                const reportsRes = await fetch('/api/reports');
                if (reportsRes.ok) {
                    const reportsData = await reportsRes.json();
                    const existingReport = reportsData.reports.find(
                        (r: ReportData) => r.repo_name === assessmentData.repo_name
                    );
                    if (existingReport) {
                        setReport(existingReport);
                    }
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

    // Generate report
    const handleGenerate = async () => {
        if (!assessment) return;

        // Double check for free tier
        if (isFreeTier) {
            window.location.href = '/pricing';
            return;
        }

        try {
            setIsGenerating(true);
            setError(null);
            setProgress(10);

            // ... (rest of generation logic)
            const progressInterval = setInterval(() => {
                setProgress(p => Math.min(p + 10, 90));
            }, 500);

            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    final_risk_assessment_id: assessment.final_risk_assessment_id,
                    repo_scan_id,
                }),
            });

            clearInterval(progressInterval);
            setProgress(100);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate report');
            }

            setReport({
                report_id: data.report_id,
                file_name: data.file_name,
                file_url: data.file_url,
                file_size: data.file_size,
                risk_classification: assessment.final_risk_classification,
                risk_score: assessment.final_risk_score,
                repo_name: assessment.repo_name || 'repo',
                repo_owner: assessment.repo_owner || 'owner',
                generated_at: data.generated_at,
                has_signature: true,
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
            setProgress(0);
        }
    };

    // Handle report deletion
    const handleReportDeleted = () => {
        setReport(null);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-black border-t-[#FF4F00] animate-spin rounded-full" />
                    <p className="font-mono text-sm text-[#555] tracking-widest uppercase">Initializing_Generator...</p>
                </div>
            </div>
        );
    }

    // Error state (no assessment)
    if (error && !assessment) {
        return (
            <div className="max-w-5xl mx-auto p-12">
                <div className="bg-[#FFF5F0] border-2 border-[#FF4F00] p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-[#FF4F00] mx-auto mb-6" />
                    <h2 className="font-serif text-3xl font-bold text-black mb-4">Report Error</h2>
                    <p className="font-mono text-black mb-8">{error}</p>
                    <button
                        onClick={() => router.push(`/dashboard/context-verifier/${repo_scan_id}`)}
                        className="bg-black text-white hover:bg-[#FF4F00] p-4 font-mono uppercase tracking-widest px-8"
                    >
                        Return_To_Context
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8 md:p-12">
            {/* Header */}
            <div className="mb-12 border-b-2 border-black pb-8">
                <Link href={`/dashboard/context-verifier/${repo_scan_id}`} className="inline-flex items-center text-[#555] hover:text-black font-mono text-xs uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back_to_Context
                </Link>

                <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest uppercase">PHASE_04b // DOCUMENTATION</div>
                <h1 className="font-serif text-5xl font-bold text-black tracking-tight mb-4">
                    Compliance Report.
                </h1>
                <p className="font-mono text-sm text-[#555] max-w-xl leading-relaxed">
                    Generate and sign your official EU AI Act compliance documentation.
                </p>
            </div>

            {/* Assessment Info */}
            {assessment && (
                <div className="border-2 border-black bg-white mb-12">
                    <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-xl font-bold text-black">
                                {assessment.repo_owner} <span className="text-[#999]">/</span> {assessment.repo_name}
                            </h2>
                            <p className="font-mono text-xs text-[#555] mt-1 uppercase tracking-widest">
                                Classification: {assessment.final_risk_classification.replace('_', ' ')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-black" />
                            <span className="font-mono text-xs text-black uppercase tracking-widest">Generator_Ready</span>
                        </div>
                    </div>

                    {/* Not approved warning */}
                    {!assessment.approved_for_report && (
                        <div className="p-6 bg-[#FFF5F0] border-b border-[#FF4F00]/20 flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-[#FF4F00] flex-shrink-0" />
                            <div>
                                <h3 className="font-serif text-lg font-bold text-[#FF4F00]">Approvals Pending</h3>
                                <p className="font-mono text-xs text-black mt-1">
                                    {assessment.requires_manual_review
                                        ? 'Manual review required before generation.'
                                        : 'Complete context verification to unlock generator.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Existing Report */}
            {report && (
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 className="w-6 h-6 text-[#047857]" />
                        <h3 className="font-serif text-2xl font-bold text-black">Report Generated</h3>
                    </div>
                    <ReportDownloadCard
                        reportId={report.report_id}
                        fileName={report.file_name}
                        fileSize={report.file_size}
                        riskClassification={report.risk_classification}
                        riskScore={report.risk_score}
                        repoName={report.repo_name}
                        repoOwner={report.repo_owner}
                        generatedAt={report.generated_at}
                        hasSiganture={report.has_signature}
                        onDelete={handleReportDeleted}
                    />
                </div>
            )}

            {/* Generate Button */}
            {!report && assessment?.approved_for_report && (
                <div className="border-2 border-black bg-white p-12 text-center mb-12">
                    <div className="w-16 h-16 bg-black text-white mx-auto flex items-center justify-center mb-6">
                        <FileText className="w-8 h-8" />
                    </div>

                    <h3 className="font-serif text-3xl font-bold text-black mb-4">
                        Generate Official Documentation
                    </h3>
                    <p className="font-mono text-sm text-[#555] mb-8 max-w-md mx-auto leading-relaxed">
                        Compile all verification data into a signed 20-page PDF report suitable for regulatory auditing.
                    </p>

                    {isFreeTier ? (
                        <div className="flex flex-col items-center">
                            <div className="bg-[#F5F5F5] border border-black p-6 max-w-md w-full mb-6">
                                <div className="flex items-center justify-between mb-4 border-b border-[#E5E5E5] pb-2">
                                    <span className="font-mono text-xs uppercase tracking-widest text-black">Feature_Lock</span>
                                    <span className="font-mono text-xs uppercase tracking-widest text-[#FF4F00]">[PRO_ONLY]</span>
                                </div>
                                <p className="font-mono text-xs text-[#555] mb-4 text-left">
                                    Official PDF documentation generation is restricted to Pro Plan subscribers.
                                </p>
                                <button
                                    onClick={() => router.push('/pricing')}
                                    className="w-full bg-black text-white py-3 font-mono text-xs uppercase tracking-widest hover:bg-[#FF4F00] transition-colors"
                                >
                                    Upgrade_To_Unlock
                                </button>
                            </div>
                            <button
                                disabled
                                className="inline-flex items-center gap-3 px-8 py-4 bg-[#E5E5E5] text-[#999] font-mono text-sm uppercase tracking-widest cursor-not-allowed opacity-50"
                            >
                                <FileText className="w-5 h-5" />
                                Generate_PDF_Report
                            </button>
                        </div>
                    ) : isGenerating ? (
                        <div className="max-w-xs mx-auto">
                            <div className="flex items-center justify-center gap-3 mb-4 font-mono text-xs uppercase tracking-widest text-[#555]">
                                <Loader2 className="w-4 h-4 text-[#FF4F00] animate-spin" />
                                <span>Compiling_Data...</span>
                            </div>
                            <div className="h-4 border border-black p-0.5 bg-white">
                                <div
                                    className="h-full bg-black transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 font-mono text-[10px] text-[#999]">
                                <span>START</span>
                                <span>FINISH</span>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-black hover:bg-[#FF4F00] text-white font-mono text-sm uppercase tracking-widest transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        >
                            <FileText className="w-5 h-5" />
                            Generate_PDF_Report
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}

                    {error && (
                        <div className="mt-8 bg-[#FFF5F0] border border-[#FF4F00] p-4 inline-block text-left max-w-md">
                            <p className="font-mono text-xs text-[#FF4F00] font-bold uppercase mb-1">Error_Log:</p>
                            <p className="font-mono text-xs text-black">{error}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Storage Status */}
            <div className="mb-12">
                <StorageStatus />
            </div>

            {/* Report Info */}
            <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-8">
                <h4 className="font-serif text-lg font-bold text-black mb-6">Included in Documentation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    {[
                        'Executive Summary',
                        'System Overview',
                        'Risk Assessment Results',
                        'Evidence & Verification',
                        'Compliance Roadmap',
                        'Regulatory Analysis',
                        'Appendices',
                        'Compliance Certificate',
                    ].map((section, i) => (
                        <div key={i} className="flex items-center gap-3 font-mono text-sm text-[#555]">
                            <div className="w-1.5 h-1.5 bg-black" />
                            {section}
                        </div>
                    ))}
                </div>
                <div className="mt-8 pt-6 border-t border-[#E5E5E5] flex items-center gap-2 font-mono text-xs text-[#999] uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                    Reports Are Digitally Signed & Stored For 30 Days
                </div>
            </div>
            {/* Feedback Widget for End of Journey */}
            <FeedbackWidget />
        </div>
    );
}
