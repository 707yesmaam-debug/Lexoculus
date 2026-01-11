'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Brain, ArrowRight, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import CapabilityCard from '@/components/CapabilityCard';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { Button } from "@/components/ui/button";

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
            <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mb-4" />
                <p className="text-zinc-500">Loading repository data...</p>
            </div>
        );
    }

    // Error state
    if (error && !repoScan) {
        return (
            <div className="max-w-4xl mx-auto py-16">
                <div className="bg-red-950/20 border border-red-900/50 p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
                    <p className="text-zinc-400 mb-4">{error}</p>
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/dashboard/scanner')}
                        className="mt-4 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                    >
                        Back to Scanner
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard/scanner')}
                    className="text-zinc-500 hover:text-zinc-300 mb-4 pl-0 hover:bg-transparent"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Scanner
                </Button>

                <h1 className="text-3xl font-bold text-zinc-100 tracking-tight mb-2">
                    Capability Analysis
                </h1>
                <p className="text-zinc-500">
                    AI-powered analysis of repository structure and capabilities
                </p>
            </div>

            {/* Repo Info Card */}
            {repoScan && (
                <div className="border border-zinc-800 bg-zinc-950/50 mb-8">
                    <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-100">
                                {repoScan.repo_owner}/{repoScan.repo_name}
                            </h2>
                            {repoScan.repo_description && (
                                <p className="text-zinc-500 text-sm mt-1">{repoScan.repo_description}</p>
                            )}
                        </div>
                        <div className="text-right text-sm">
                            <div className="text-zinc-400">{repoScan.primary_language || 'Unknown'}</div>
                            <div className="text-zinc-600">{repoScan.total_files} files</div>
                        </div>
                    </div>

                    {/* Analysis Actions */}
                    <div className="px-6 py-4">
                        {!analysis ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing}
                                    className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold w-full sm:w-auto"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Brain className="w-5 h-5 mr-2" />
                                            Analyze Capabilities
                                        </>
                                    )}
                                </Button>

                                {isAnalyzing && (
                                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                        <Clock className="w-4 h-4" />
                                        This may take 10-30 seconds
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                                <div className="flex items-center gap-4">
                                    <ConfidenceBadge score={analysis.confidence_score} />
                                    <span className="text-zinc-600 text-sm">
                                        Analyzed in {(analysis.analysis_duration_ms / 1000).toFixed(1)}s
                                    </span>
                                </div>
                                {analysis.is_ai_system ? (
                                    <Button
                                        onClick={() => router.push(`/dashboard/risk-classifier/${repo_scan_id}`)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white"
                                    >
                                        Next: Risk Classification
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => router.push('/dashboard/scanner')}
                                        className="bg-emerald-600/90 hover:bg-emerald-600 text-white border-0"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Audit Complete
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="mb-8 bg-red-950/20 border border-red-900/50 p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-400 font-medium">Analysis Failed</p>
                        <p className="text-zinc-400 text-sm mt-1">{error}</p>
                        <Button
                            variant="ghost"
                            onClick={handleAnalyze}
                            className="mt-3 text-zinc-300 hover:text-white"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </div>
            )}

            {/* Analysis Results */}
            {analysis && (
                <div className="space-y-6">
                    {/* AI System Status */}
                    <div className={`border p-6 ${analysis.is_ai_system
                        ? 'bg-blue-950/20 border-blue-900/50'
                        : 'bg-zinc-900 border-zinc-800'
                        }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 flex items-center justify-center ${analysis.is_ai_system ? 'bg-blue-500/20' : 'bg-zinc-800'
                                }`}>
                                <Brain className={`w-6 h-6 ${analysis.is_ai_system ? 'text-blue-400' : 'text-zinc-500'
                                    }`} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-100">
                                    {analysis.is_ai_system ? 'AI System Detected' : 'Not an AI System'}
                                </h3>
                                <p className="text-zinc-500 text-sm mt-1">
                                    {analysis.is_ai_system
                                        ? 'This repository contains AI/ML components that may require regulatory assessment.'
                                        : 'No AI/ML components detected. This repository does not fall under the EU AI Act. No further action required.'}
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
                        <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                            <h4 className="text-zinc-400 text-sm font-medium mb-2">Analysis Reasoning</h4>
                            <p className="text-zinc-300 text-sm leading-relaxed">{analysis.analysis_notes}</p>
                        </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-600 border-t border-zinc-800 pt-4">
                        <span>Model: {analysis.llm_model_used}</span>
                        <span>Duration: {analysis.analysis_duration_ms}ms</span>
                        <span>Analyzed: {new Date(analysis.analyzed_at).toLocaleString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
