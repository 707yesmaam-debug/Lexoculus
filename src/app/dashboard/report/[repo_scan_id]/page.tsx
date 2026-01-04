'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, FileText, CheckCircle2, Download, Clock } from 'lucide-react';
import ReportDownloadCard from '@/components/ReportDownloadCard';
import StorageStatus from '@/components/StorageStatus';

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

    // Fetch assessment and existing report
    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);

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

        try {
            setIsGenerating(true);
            setError(null);
            setProgress(10);

            // Simulate progress
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
            <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mb-4" />
                <p className="text-zinc-500">Loading report data...</p>
            </div>
        );
    }

    // Error state (no assessment)
    if (error && !assessment) {
        return (
            <div className="max-w-4xl mx-auto py-16">
                <div className="bg-red-950/20 border border-red-900/50 p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
                    <p className="text-zinc-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.push(`/dashboard/context-verifier/${repo_scan_id}`)}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                        Complete Context Verification
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
                    onClick={() => router.push(`/dashboard/context-verifier/${repo_scan_id}`)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Context Verification
                </button>

                <h1 className="text-3xl font-bold text-zinc-100 tracking-tight mb-2">
                    Compliance Report
                </h1>
                <p className="text-zinc-500">
                    Generate and download your EU AI Act compliance report
                </p>
            </div>

            {/* Assessment Info */}
            {assessment && (
                <div className="border border-zinc-800 bg-zinc-950/50 mb-8">
                    <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-100">
                                {assessment.repo_owner}/{assessment.repo_name}
                            </h2>
                            <p className="text-zinc-500 text-sm mt-1">
                                Classification: {assessment.final_risk_classification.replace('_', ' ')}
                                (Score: {assessment.final_risk_score})
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-zinc-400" />
                            <span className="text-zinc-400 text-sm">Report Generator</span>
                        </div>
                    </div>

                    {/* Not approved warning */}
                    {!assessment.approved_for_report && (
                        <div className="px-6 py-4 bg-amber-950/20 border-b border-amber-900/50 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-amber-400 font-medium">Not Approved for Report</p>
                                <p className="text-zinc-400 text-sm mt-1">
                                    {assessment.requires_manual_review
                                        ? 'This assessment requires manual review before generating a report.'
                                        : 'Please complete context verification to approve for report generation.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Existing Report */}
            {report && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-lg font-medium text-zinc-200">Report Ready</h3>
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
                <div className="border border-zinc-800 bg-zinc-950/50 p-8 text-center mb-8">
                    <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-zinc-200 mb-2">
                        Generate Compliance Report
                    </h3>
                    <p className="text-zinc-500 text-sm mb-6 max-w-md mx-auto">
                        Create a professional 20-page PDF report documenting your AI system's
                        EU AI Act compliance assessment.
                    </p>

                    {isGenerating ? (
                        <div className="max-w-xs mx-auto">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                                <span className="text-zinc-400">Generating report...</span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-zinc-600 text-xs mt-2">
                                This may take a few seconds
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold transition-colors mx-auto"
                        >
                            <FileText className="w-5 h-5" />
                            Generate PDF Report
                        </button>
                    )}

                    {error && (
                        <div className="mt-4 bg-red-950/20 border border-red-900/50 p-3 text-left max-w-md mx-auto">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Storage Status */}
            <StorageStatus />

            {/* Report Info */}
            <div className="mt-8 border border-zinc-800 bg-zinc-950/50 p-6">
                <h4 className="text-zinc-200 font-medium mb-4">What's Included in the Report</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        <div key={i} className="flex items-center gap-2 text-zinc-400 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-zinc-600" />
                            {section}
                        </div>
                    ))}
                </div>
                <p className="text-zinc-600 text-xs mt-4">
                    Reports are digitally signed and stored securely for 30 days.
                </p>
            </div>
        </div>
    );
}
