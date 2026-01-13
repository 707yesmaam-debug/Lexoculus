'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Brain, ArrowRight, Clock, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import CapabilityCard from '@/components/CapabilityCard';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface RepoScanData {
    repo_scan_id: string;
    repo_name: string;
    repo_owner: string;
    repo_description: string | null;
    primary_language: string | null;
    total_files: number;
    scanned_at: string;
    has_analysis: boolean;
    analysis_id: string | null;
}

interface AnalysisData {
    analysis_id: string;
    is_ai_system: boolean;
    capabilities: string[];
    libraries: string[];
    ai_frameworks: string[];
    programming_languages: string[];
    detected_model_types: string[];
    has_ml_pipeline: boolean;
    has_training_code: boolean;
    has_inference_code: boolean;
    has_data_processing: boolean;
    has_model_serialization: boolean;
    estimated_risk_indicators: Record<string, boolean>;
    llm_model_used: string;
    analysis_duration_ms: number;
    confidence_score: number;
    analyzed_at: string;
    analysis_notes?: string;
}

export default function AnalyzerPage() {
    const params = useParams();
    const router = useRouter();
    const repo_scan_id = params.repo_scan_id as string;

    const [repoScan, setRepoScan] = useState<RepoScanData | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch repo scan data on mount
    useEffect(() => {
        async function fetchRepoScan() {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch(`/api/repo-scans/${repo_scan_id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch repo scan');
                }

                setRepoScan(data);

                // If analysis already exists, fetch it
                if (data.has_analysis) {
                    const analysisResponse = await fetch(`/api/capability-analysis/${repo_scan_id}`);
                    const analysisData = await analysisResponse.json();

                    if (analysisResponse.ok) {
                        setAnalysis(analysisData);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setIsLoading(false);
            }
        }

        if (repo_scan_id) {
            fetchRepoScan();
        }
    }, [repo_scan_id]);

    // Trigger analysis
    const handleAnalyze = async () => {
        try {
            setIsAnalyzing(true);
            setError(null);

            const response = await fetch('/api/analyze-capabilities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo_scan_id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setAnalysis(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-black border-t-[#FF4F00] animate-spin rounded-full" />
                    <p className="font-mono text-sm text-[#555] tracking-widest uppercase">Initializing_Scan_Sequence...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !repoScan) {
        return (
            <div className="max-w-5xl mx-auto p-12">
                <div className="bg-[#FFF5F0] border-2 border-[#FF4F00] p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-[#FF4F00] mx-auto mb-6" />
                    <h2 className="font-serif text-3xl font-bold text-black mb-4">Critical Error</h2>
                    <p className="font-mono text-black mb-8">{error}</p>
                    <Button
                        onClick={() => router.push('/dashboard/scanner')}
                        className="bg-black text-white hover:bg-[#FF4F00] rounded-none font-mono uppercase tracking-widest px-8"
                    >
                        Return_To_Base
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8 md:p-12">
            {/* Header */}
            <div className="mb-12 border-b-2 border-black pb-8">
                <Link href="/dashboard/scanner" className="inline-flex items-center text-[#555] hover:text-black font-mono text-xs uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back_To_Scanner
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest uppercase">PHASE_03 // ANALYSIS</div>
                        <h1 className="font-serif text-5xl font-bold text-black tracking-tight mb-4">
                            Capability Audit.
                        </h1>
                        <p className="font-mono text-sm text-[#555] max-w-xl leading-relaxed">
                            Deep learning architectural analysis and heuristic risk pattern matching.
                        </p>
                    </div>
                </div>
            </div>

            {/* Repo Info Card */}
            {repoScan && (
                <div className="border-2 border-black bg-white mb-12">
                    <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-2xl font-bold text-black items-center flex gap-2">
                                {repoScan.repo_owner} <span className="text-[#999]">/</span> {repoScan.repo_name}
                            </h2>
                        </div>
                        <div className="text-right">
                            <span className="bg-black text-white px-3 py-1 text-xs font-mono uppercase tracking-widest">
                                {repoScan.primary_language || 'UNKNOWN'}
                            </span>
                        </div>
                    </div>

                    {/* Analysis Actions */}
                    <div className="p-8">
                        {!analysis ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                                <div className="p-4 border border-black bg-[#F5F5F5]">
                                    <Brain className="w-12 h-12 text-black" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-xl font-bold mb-2">Ready for Inspection</h3>
                                    <p className="font-mono text-xs text-[#555] max-w-md mx-auto">
                                        Initiate the deep scan to map architecture, detect AI frameworks, and identify potential EU AI Act high-risk vectors.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="w-full bg-black hover:bg-[#FF4F00] text-white rounded-none h-12 font-mono text-sm uppercase tracking-widest transition-all"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            </>
                                        ) : (
                                            <>
                                                INITIATE_SCAN
                                            </>
                                        )}
                                    </Button>

                                    {isAnalyzing && (
                                        <div className="flex items-center gap-2 text-[#555] font-mono text-[10px] uppercase animate-pulse">
                                            <div className="w-2 h-2 bg-[#FF4F00] rounded-full" />
                                            Heuristic_Analysis_In_Progress...
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="text-center md:text-left">
                                        <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Confidence Score</div>
                                        <div className="font-serif text-3xl font-bold text-black">
                                            {(analysis.confidence_score * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                    <div className="h-8 w-px bg-[#E5E5E5]" />
                                    <div className="text-center md:text-left">
                                        <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Scan Duration</div>
                                        <div className="font-serif text-3xl font-bold text-black">
                                            {(analysis.analysis_duration_ms / 1000).toFixed(2)}s
                                        </div>
                                    </div>
                                </div>

                                {analysis.is_ai_system ? (
                                    <Button
                                        onClick={() => router.push(`/dashboard/risk-classifier/${repo_scan_id}`)}
                                        className="bg-[#FF4F00] hover:bg-black text-white rounded-none h-12 px-8 font-mono text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-0 hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                    >
                                        Proceed_To_Classification <ArrowRight className="w-4 h-4 ml-3" />
                                    </Button>
                                ) : (
                                    <div className="flex flex-col items-end">
                                        <div className="px-4 py-2 bg-[#F0FFF4] border border-[#10B981] text-[#047857] font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Audit_Complete_//_No_Risk
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="mb-12 bg-[#FFF5F0] border-l-4 border-[#FF4F00] p-6 flex items-start gap-4">
                    <ShieldAlert className="w-6 h-6 text-[#FF4F00] flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-serif text-lg font-bold text-[#FF4F00]">Analysis Interrupted</h3>
                        <p className="font-mono text-xs text-black mt-1 mb-4">{error}</p>
                        <Button
                            variant="outline"
                            onClick={handleAnalyze}
                            className="border-black text-black hover:bg-black hover:text-white rounded-none font-mono text-xs uppercase tracking-widest h-8"
                        >
                            Retry_Sequence
                        </Button>
                    </div>
                </div>
            )}

            {/* Analysis Results */}
            {analysis && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* AI System Status Banner */}
                    <div className={`border-2 p-8 relative overflow-hidden ${analysis.is_ai_system
                        ? 'border-[#FF4F00] bg-[#FFF5F0]'
                        : 'border-black bg-[#F5F5F5]'
                        }`}>

                        {analysis.is_ai_system && (
                            <div className="absolute top-0 right-0 p-2 bg-[#FF4F00] text-white">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                            <div className={`w-16 h-16 flex items-center justify-center border-2 ${analysis.is_ai_system ? 'border-[#FF4F00] bg-white text-[#FF4F00]' : 'border-black bg-white text-black'
                                }`}>
                                <Brain className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className={`font-serif text-2xl font-bold mb-2 ${analysis.is_ai_system ? 'text-[#FF4F00]' : 'text-black'}`}>
                                    {analysis.is_ai_system ? 'AI System Detected' : 'Non-AI System'}
                                </h3>
                                <p className="font-mono text-sm text-black max-w-2xl">
                                    {analysis.is_ai_system
                                        ? 'Positive identification of Machine Learning components. This repository falls under the scope of the EU AI Act classification framework.'
                                        : 'Negative for active Machine Learning components. This system does not demonstrate regulatory risk under current heuristics.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Capability Details */}
                    <CapabilityCard
                        capabilities={analysis.capabilities}
                        frameworks={analysis.ai_frameworks}
                        libraries={analysis.libraries}
                        languages={analysis.programming_languages}
                        modelTypes={analysis.detected_model_types}
                        riskIndicators={analysis.estimated_risk_indicators}
                        hasMLPipeline={analysis.has_ml_pipeline}
                        hasTrainingCode={analysis.has_training_code}
                        hasInferenceCode={analysis.has_inference_code}
                        hasDataProcessing={analysis.has_data_processing}
                        hasModelSerialization={analysis.has_model_serialization}
                    />

                    {/* Analysis Notes */}
                    {analysis.analysis_notes && (
                        <div className="border-2 border-black bg-white p-8">
                            <h4 className="font-mono text-xs text-[#999] uppercase tracking-widest mb-4">Reasoning_Engine_Output</h4>
                            <p className="font-mono text-sm text-black leading-relaxed whitespace-pre-wrap border-l-2 border-[#E5E5E5] pl-4">
                                {analysis.analysis_notes}
                            </p>
                        </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap gap-6 text-[10px] font-mono uppercase tracking-wider text-[#999] border-t border-[#E5E5E5] pt-8">
                        <span>MODEL_USED: {analysis.llm_model_used}</span>
                        <span>ANALYSIS_ID: {analysis.analysis_id}</span>
                        <span>TIMESTAMP: {new Date(analysis.analyzed_at).toISOString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
