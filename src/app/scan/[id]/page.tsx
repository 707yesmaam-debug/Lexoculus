'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import OpticalLogo from '@/components/OpticalLogo';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ScanMetadata {
    name: string;
    owner: string;
    language: string | null;
    total_files: number;
    license: string | null;
    stars: number;
}

interface AnalysisResult {
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
    confidence_score: number;
    llm_model_used: string;
    analysis_duration_ms: number;
}

interface RiskResult {
    assessment_id: string;
    risk_classification: string;
    risk_score: number;
    risk_narrative: string | null;
    matched_annex_iii_articles: Array<{ article: string; category: string }>;
    key_findings: Array<{ finding: string; severity: string }>;
    preliminary_assessment: {
        is_unacceptable: boolean;
        is_high_risk: boolean;
        is_limited_risk: boolean;
        is_minimal_risk: boolean;
    };
    gpai_classification?: {
        is_gpai: boolean;
        is_systemic_risk: boolean;
    };
}

type PipelineStep = 'scanning' | 'analyzing' | 'classifying' | 'complete' | 'error';

// ─── RISK BADGE COLORS ──────────────────────────────────────────────────────

function getRiskColor(classification: string) {
    switch (classification) {
        case 'UNACCEPTABLE': return { bg: '#1A0000', text: '#FF4F00', border: '#FF4F00' };
        case 'HIGH_RISK': return { bg: '#FFF5F0', text: '#FF4F00', border: '#FF4F00' };
        case 'LIMITED_RISK': return { bg: '#FFFBF0', text: '#B8860B', border: '#B8860B' };
        case 'MINIMAL_RISK': return { bg: '#F0FFF4', text: '#047857', border: '#10B981' };
        default: return { bg: '#F5F5F5', text: '#555', border: '#333' };
    }
}

// ─── PROGRESS INDICATOR ────────────────────────────────────────────────────

function PipelineProgress({ step }: { step: PipelineStep }) {
    const steps = [
        { key: 'scanning', label: 'Repo_Scan', num: '01' },
        { key: 'analyzing', label: 'AI_Analysis', num: '02' },
        { key: 'classifying', label: 'Risk_Classification', num: '03' },
        { key: 'complete', label: 'Results_Ready', num: '04' },
    ];

    const currentIndex = steps.findIndex(s => s.key === step);

    return (
        <div className="flex items-center gap-0 w-full max-w-2xl mx-auto">
            {steps.map((s, i) => {
                const isActive = i === currentIndex;
                const isDone = i < currentIndex || step === 'complete';
                return (
                    <div key={s.key} className="flex-1 flex flex-col items-center relative">
                        <div className={`
                            w-10 h-10 flex items-center justify-center font-mono text-xs font-bold border-2 transition-all duration-500
                            ${isDone ? 'bg-black text-white border-black' : ''}
                            ${isActive ? 'bg-[#FF4F00] text-white border-[#FF4F00] animate-pulse' : ''}
                            ${!isDone && !isActive ? 'bg-white text-[#CCC] border-[#E5E5E5]' : ''}
                        `}>
                            {isDone ? '✓' : s.num}
                        </div>
                        <div className={`mt-2 font-mono text-[9px] uppercase tracking-widest text-center
                            ${isDone || isActive ? 'text-black' : 'text-[#CCC]'}
                        `}>
                            {s.label}
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 transition-all duration-500
                                ${isDone ? 'bg-black' : 'bg-[#E5E5E5]'}
                            `} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function PublicScanResultsPage() {
    const params = useParams();
    const router = useRouter();
    const scanId = params.id as string;

    const [step, setStep] = useState<PipelineStep>('scanning');
    const [error, setError] = useState('');
    const [scanMeta, setScanMeta] = useState<ScanMetadata | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [risk, setRisk] = useState<RiskResult | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);

    const getScanToken = useCallback(() => {
        return localStorage.getItem('anon_scan_token') || '';
    }, []);

    // Calculate days until expiry
    const daysLeft = expiresAt
        ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    // ─── AUTO-RUN PIPELINE ──────────────────────────────────────────────
    useEffect(() => {
        if (!scanId) return;

        const scanToken = getScanToken();
        const storedScanId = localStorage.getItem('anon_scan_id');
        const storedExpires = localStorage.getItem('anon_scan_expires');

        if (storedExpires) setExpiresAt(storedExpires);

        // If no valid token for this scan, show error
        if (!scanToken || storedScanId !== scanId) {
            setError('Invalid or expired scan session. Please start a new scan from the homepage.');
            setStep('error');
            return;
        }

        runPipeline(scanId, scanToken);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scanId]);

    async function runPipeline(repoScanId: string, scanToken: string) {
        try {
            // Step 1: Scan is already done (we have the ID). Mark complete.
            setStep('analyzing');

            // Step 2: Analyze capabilities
            const analyzeRes = await fetch('/api/analyze-capabilities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo_scan_id: repoScanId, scan_token: scanToken }),
            });
            const analyzeData = await analyzeRes.json();
            if (!analyzeRes.ok) {
                throw new Error(analyzeData.error || 'Analysis failed');
            }
            setAnalysis(analyzeData);

            // Step 3: Classify risk (only if AI system detected)
            if (analyzeData.is_ai_system) {
                setStep('classifying');
                const classifyRes = await fetch('/api/classify-risk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ repo_scan_id: repoScanId, scan_token: scanToken }),
                });
                const classifyData = await classifyRes.json();
                if (!classifyRes.ok) {
                    throw new Error(classifyData.error || 'Classification failed');
                }
                setRisk(classifyData);
            }

            setStep('complete');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Pipeline failed');
            setStep('error');
        }
    }

    // ─── LOADING STATE ─────────────────────────────────────────────────
    if (step !== 'complete' && step !== 'error') {
        return (
            <div className="min-h-screen bg-white">
                {/* Minimal Nav */}
                <nav className="border-b-2 border-black">
                    <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 py-4">
                        <Link href="/"><OpticalLogo /></Link>
                        <Link href="/auth/signup" className="font-mono text-xs uppercase tracking-widest hover:text-[#FF4F00]">
                            Create_Account
                        </Link>
                    </div>
                </nav>

                <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
                    <div className="w-16 h-16 border-2 border-black border-t-[#FF4F00] animate-spin rounded-full mb-8" />

                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4">
                        Analyzing Your Repository
                    </h1>
                    <p className="font-mono text-sm text-[#555] text-center max-w-lg mb-12">
                        {step === 'analyzing' && 'Running AI capability detection and heuristic analysis...'}
                        {step === 'classifying' && 'Mapping findings against EU AI Act Annex III framework...'}
                        {step === 'scanning' && 'Initializing scan pipeline...'}
                    </p>

                    <PipelineProgress step={step} />
                </div>
            </div>
        );
    }

    // ─── ERROR STATE ───────────────────────────────────────────────────
    if (step === 'error') {
        return (
            <div className="min-h-screen bg-white">
                <nav className="border-b-2 border-black">
                    <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 py-4">
                        <Link href="/"><OpticalLogo /></Link>
                    </div>
                </nav>

                <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
                    <div className="bg-[#FFF5F0] border-2 border-[#FF4F00] p-8 max-w-lg text-center">
                        <div className="text-4xl mb-4">⚠</div>
                        <h2 className="font-serif text-2xl font-bold mb-3">Analysis Error</h2>
                        <p className="font-mono text-sm text-[#555] mb-6">{error}</p>
                        <Link
                            href="/"
                            className="bg-black text-white font-mono text-sm uppercase tracking-widest px-8 py-3 hover:bg-[#FF4F00] transition-colors inline-block"
                        >
                            Try_Again
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ─── RESULTS ───────────────────────────────────────────────────────
    const riskColors = risk ? getRiskColor(risk.risk_classification) : null;

    return (
        <div className="min-h-screen bg-white">
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-white border-b-2 border-black">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 py-4">
                    <Link href="/"><OpticalLogo /></Link>
                    <div className="flex items-center gap-4">
                        <Link href="/auth/login" className="hidden md:block font-mono text-xs uppercase tracking-widest hover:text-[#FF4F00]">
                            Login
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="bg-[#FF4F00] text-white font-mono text-xs uppercase tracking-widest px-5 py-3 hover:bg-black transition-colors"
                        >
                            Save_Results
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-12">

                {/* Expiry Warning */}
                {daysLeft !== null && (
                    <div className="bg-[#FFFBF0] border border-[#B8860B] px-4 py-3 mb-8 flex items-center justify-between flex-wrap gap-3">
                        <div className="font-mono text-xs text-[#B8860B]">
                            ⏳ This scan will be deleted in <strong>{daysLeft} days</strong>. Create an account to save it permanently.
                        </div>
                        <Link
                            href="/auth/signup"
                            className="font-mono text-[10px] uppercase tracking-widest text-[#B8860B] hover:text-black border border-[#B8860B] px-3 py-1 hover:bg-[#B8860B] hover:text-white transition-colors whitespace-nowrap"
                        >
                            Save_Now
                        </Link>
                    </div>
                )}

                {/* Pipeline Complete */}
                <div className="mb-12">
                    <PipelineProgress step="complete" />
                </div>

                {/* Header */}
                <div className="mb-12 border-b-2 border-black pb-8">
                    <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest uppercase">
                        Free_Scan // Public_Repository
                    </div>
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-black tracking-tight mb-2">
                        Scan Results
                    </h1>
                </div>

                {/* AI System Detection */}
                {analysis && (
                    <div className={`border-2 p-8 mb-8 ${analysis.is_ai_system
                            ? 'border-[#FF4F00] bg-[#FFF5F0]'
                            : 'border-black bg-[#F5F5F5]'
                        }`}>
                        <div className="flex items-start gap-6">
                            <div className={`w-14 h-14 flex items-center justify-center border-2 text-2xl ${analysis.is_ai_system ? 'border-[#FF4F00] bg-white' : 'border-black bg-white'
                                }`}>
                                🧠
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-serif text-2xl font-bold mb-2 ${analysis.is_ai_system ? 'text-[#FF4F00]' : 'text-black'
                                    }`}>
                                    {analysis.is_ai_system ? 'AI System Detected' : 'Non-AI System'}
                                </h3>
                                <p className="font-mono text-sm text-[#555] max-w-2xl">
                                    {analysis.is_ai_system
                                        ? 'This repository contains Machine Learning components subject to EU AI Act classification.'
                                        : 'No active Machine Learning components detected. This system does not fall under EU AI Act scope.'}
                                </p>

                                {/* Quick Stats */}
                                <div className="flex flex-wrap gap-6 mt-4 font-mono text-xs">
                                    <div>
                                        <span className="text-[#999] uppercase tracking-widest">Confidence</span>
                                        <div className="font-bold text-lg text-black">{(analysis.confidence_score * 100).toFixed(0)}%</div>
                                    </div>
                                    <div>
                                        <span className="text-[#999] uppercase tracking-widest">Duration</span>
                                        <div className="font-bold text-lg text-black">{(analysis.analysis_duration_ms / 1000).toFixed(1)}s</div>
                                    </div>
                                    <div>
                                        <span className="text-[#999] uppercase tracking-widest">Frameworks</span>
                                        <div className="font-bold text-lg text-black">{analysis.ai_frameworks.length}</div>
                                    </div>
                                    <div>
                                        <span className="text-[#999] uppercase tracking-widest">Capabilities</span>
                                        <div className="font-bold text-lg text-black">{analysis.capabilities.length}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detected Technologies */}
                {analysis && analysis.is_ai_system && (
                    <div className="border-2 border-black mb-8">
                        <div className="bg-black text-white font-mono text-[10px] uppercase tracking-widest px-6 py-3">
                            Detected_Technologies
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Frameworks */}
                            <div>
                                <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-3">AI Frameworks</div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.ai_frameworks.map(f => (
                                        <span key={f} className="bg-[#FFF5F0] border border-[#FF4F00] text-[#FF4F00] font-mono text-xs px-2 py-1">{f}</span>
                                    ))}
                                    {analysis.ai_frameworks.length === 0 && <span className="text-[#CCC] font-mono text-xs">None detected</span>}
                                </div>
                            </div>
                            {/* Libraries */}
                            <div>
                                <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-3">Libraries</div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.libraries.slice(0, 8).map(l => (
                                        <span key={l} className="bg-[#F5F5F5] border border-[#E5E5E5] font-mono text-xs px-2 py-1">{l}</span>
                                    ))}
                                    {analysis.libraries.length > 8 && <span className="font-mono text-xs text-[#999]">+{analysis.libraries.length - 8} more</span>}
                                </div>
                            </div>
                            {/* Capabilities */}
                            <div>
                                <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-3">Capabilities</div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.capabilities.map(c => (
                                        <span key={c} className="bg-black text-white font-mono text-xs px-2 py-1">{c}</span>
                                    ))}
                                    {analysis.capabilities.length === 0 && <span className="text-[#CCC] font-mono text-xs">None detected</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Risk Classification */}
                {risk && riskColors && (
                    <div className="border-2 mb-8" style={{ borderColor: riskColors.border, backgroundColor: riskColors.bg }}>
                        <div className="p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                <div>
                                    <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-2">EU AI Act Classification</div>
                                    <h2 className="font-serif text-3xl font-bold" style={{ color: riskColors.text }}>
                                        {risk.risk_classification.replace('_', ' ')}
                                    </h2>
                                </div>
                                <div className="text-center">
                                    <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Risk Score</div>
                                    <div className="font-serif text-4xl font-bold" style={{ color: riskColors.text }}>
                                        {risk.risk_score}/100
                                    </div>
                                </div>
                            </div>

                            {risk.risk_narrative && (
                                <p className="font-mono text-sm text-[#555] leading-relaxed border-l-2 pl-4 mb-6" style={{ borderColor: riskColors.border }}>
                                    {risk.risk_narrative}
                                </p>
                            )}

                            {/* Key Findings */}
                            {risk.key_findings && risk.key_findings.length > 0 && (
                                <div>
                                    <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-3">Key Findings</div>
                                    <div className="space-y-2">
                                        {risk.key_findings.slice(0, 5).map((f, i) => (
                                            <div key={i} className="flex items-start gap-2 font-mono text-xs">
                                                <span className="text-[#FF4F00] mt-0.5">▸</span>
                                                <span>{typeof f === 'string' ? f : f.finding || JSON.stringify(f)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* GPAI */}
                            {risk.gpai_classification?.is_gpai && (
                                <div className="mt-6 bg-white border border-[#333] p-4">
                                    <div className="font-mono text-xs font-bold mb-1">
                                        ⚡ General-Purpose AI Model Detected
                                    </div>
                                    <div className="font-mono text-[10px] text-[#555]">
                                        Subject to Chapter V obligations (Articles 51-55).
                                        {risk.gpai_classification.is_systemic_risk && (
                                            <span className="ml-2 text-[#FF4F00] font-bold">SYSTEMIC RISK</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    AUTH GATE — Context Verification
                ═══════════════════════════════════════════════════════════ */}
                <div className="border-2 border-black bg-white">
                    <div className="bg-black text-white font-mono text-[10px] uppercase tracking-widest px-6 py-3 flex items-center justify-between">
                        <span>Next Step: Context_Verification</span>
                        <span className="text-[#FF4F00]">🔒 Account_Required</span>
                    </div>
                    <div className="p-8 md:p-12 text-center">
                        <div className="text-5xl mb-6">🔐</div>
                        <h3 className="font-serif text-2xl md:text-3xl font-bold mb-4">
                            Refine Your Assessment
                        </h3>
                        <p className="font-mono text-sm text-[#555] max-w-lg mx-auto mb-8 leading-relaxed">
                            Answer context-specific questions to refine your risk classification.
                            Our AI generates tailored questions based on your repository&apos;s specific
                            capabilities and detected risk factors.
                        </p>

                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href="/auth/signup"
                                className="bg-[#FF4F00] text-white font-mono text-sm uppercase tracking-widest px-10 py-4 hover:bg-black transition-colors inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                            >
                                Create_Account →
                            </Link>
                            <span className="font-mono text-[10px] text-[#999] uppercase tracking-widest">
                                Free · No credit card · Your scan data will be linked to your account
                            </span>
                        </div>

                        <div className="mt-8 border-t border-[#E5E5E5] pt-6">
                            <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-3">What you&apos;ll unlock</div>
                            <div className="flex flex-wrap justify-center gap-4">
                                {['Context Verification', 'Detailed Risk Breakdown', 'Scan History', 'AI System Registry'].map(f => (
                                    <span key={f} className="border border-[#E5E5E5] font-mono text-[10px] px-3 py-1.5 text-[#555]">
                                        ✓ {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer metadata */}
                <div className="mt-8 flex flex-wrap gap-6 text-[10px] font-mono uppercase tracking-wider text-[#CCC]">
                    <span>SCAN_ID: {scanId}</span>
                    {analysis && <span>MODEL: {analysis.llm_model_used}</span>}
                    {risk && <span>CLASSIFICATION: {risk.risk_classification}</span>}
                </div>

            </div>
        </div>
    );
}
