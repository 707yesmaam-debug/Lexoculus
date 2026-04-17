'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Loader2, AlertCircle, CheckCircle2,
    ShieldAlert, UploadCloud, FileText, ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { getTestingRequirements, TestingRequirement, calculateTestingProgress } from '@/lib/compliance/eu-ai-act/testing-requirements';

interface EvidenceData {
    id: string;
    requirement_id: string;
    file_name: string;
    file_url: string;
    hash: string;
    status: string;
    created_at: string;
}

export default function TestingRequirementsPage() {
    const params = useParams();
    const router = useRouter();
    const ai_system_id = params.ai_system_id as string;

    const [aiSystemName, setAiSystemName] = useState('');
    const [riskClassification, setRiskClassification] = useState<string | null>(null);
    const [requirements, setRequirements] = useState<TestingRequirement[]>([]);
    const [evidence, setEvidence] = useState<EvidenceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedReq, setExpandedReq] = useState<string | null>(null);
    const [uploadingReq, setUploadingReq] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // 1. Fetch AI System details (risk class)
            const res = await fetch(`/api/ai-systems/${ai_system_id}`);
            const data = await res.json();
            
            if (res.ok && data.ai_system) {
                setAiSystemName(data.ai_system.name);
                setRiskClassification(data.ai_system.risk_classification);
                setRequirements(getTestingRequirements(data.ai_system.risk_classification));
            }

            // 2. Fetch Evidence
            const evRes = await fetch(`/api/testing-evidence?ai_system_id=${ai_system_id}`);
            if (evRes.ok) {
                const evData = await evRes.json();
                setEvidence(evData.evidence || []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setIsLoading(false);
        }
    }, [ai_system_id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUploadEvidence = async (req: TestingRequirement, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingReq(req.id);
            setError(null);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('ai_system_id', ai_system_id);
            formData.append('requirement_id', req.id);
            formData.append('category', req.category);

            const res = await fetch('/api/testing-evidence', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            if (data) {
                setEvidence(prev => [data, ...prev]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploadingReq(null);
            e.target.value = ''; // Reset input
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-black border-t-[#FF4F00] animate-spin rounded-full" />
                    <p className="font-mono text-sm text-[#555] tracking-widest uppercase">Loading_Testing_Requirements...</p>
                </div>
            </div>
        );
    }

    if (requirements.length === 0 && !isLoading) {
        return (
            <div className="max-w-5xl mx-auto p-12">
                <div className="bg-[#FAFAFA] border-2 border-black/10 p-8 text-center">
                    <ShieldAlert className="w-12 h-12 text-[#999] mx-auto mb-6" />
                    <h2 className="font-serif text-3xl font-bold text-black mb-4">No Testing Required</h2>
                    <p className="font-mono text-[#555] mb-8">
                        The AI system ({riskClassification || 'Unknown'}) does not mandate strict Article 15 technical testing under the EU AI Act.
                    </p>
                    <Button
                        onClick={() => router.push('/dashboard/registry')}
                        className="bg-black text-white hover:bg-[#FF4F00] rounded-none font-mono uppercase tracking-widest px-8"
                    >
                        Return_To_Registry
                    </Button>
                </div>
            </div>
        );
    }

    // Map requirements with evidence status
    const reqsWithStatus = requirements.map(req => {
        const hasEvidence = evidence.some(e => e.requirement_id === req.id);
        const newStatus: "verified" | "not_started" | "evidence_uploaded" = hasEvidence ? 'evidence_uploaded' : 'not_started';
        return { ...req, status: newStatus };
    });

    const progress = calculateTestingProgress(reqsWithStatus as any);

    return (
        <div className="max-w-6xl mx-auto p-8 md:p-12">
            {/* Header */}
            <div className="mb-12 border-b-2 border-black pb-8">
                <Link href="/dashboard/registry" className="inline-flex items-center text-[#555] hover:text-black font-mono text-xs uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back_to_Registry
                </Link>

                <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                    <div>
                        <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest uppercase">PHASE_06 // TECHNICAL_TESTING</div>
                        <h1 className="font-serif text-4xl md:text-5xl font-bold text-black tracking-tight mb-2">
                            Testing Evidence.
                        </h1>
                        {aiSystemName && (
                            <p className="font-mono text-sm text-[#555]">{aiSystemName} • {riskClassification}</p>
                        )}
                    </div>

                    <div className="text-right">
                        <div className="font-mono text-[10px] text-[#555] uppercase tracking-widest mb-1">Requirement Progress</div>
                        <div className="font-serif text-3xl font-bold text-black">{progress.percent}%</div>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="mb-8 bg-[#FFF5F0] border-l-4 border-[#FF4F00] p-6 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-[#FF4F00] flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-serif text-lg font-bold text-[#FF4F00]">Error</h3>
                        <p className="font-mono text-xs text-black mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Requirements List */}
            <div className="space-y-4">
                {reqsWithStatus.map((req) => {
                    const isExpanded = expandedReq === req.id;
                    const reqEvidence = evidence.filter(e => e.requirement_id === req.id);
                    const isComplete = req.status !== 'not_started';

                    return (
                        <div key={req.id} className={`border-2 ${isComplete ? 'border-emerald-200 bg-emerald-50/20' : 'border-black/10 bg-white'}`}>
                            {/* Card Header */}
                            <button
                                onClick={() => setExpandedReq(isExpanded ? null : req.id)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isComplete ? 'bg-emerald-100 border-emerald-500 text-emerald-600' : 'bg-gray-50 border-gray-300 text-gray-400'}`}>
                                        {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[10px] text-[#FF4F00] uppercase tracking-widest">{req.article_reference}</span>
                                        </div>
                                        <h3 className="font-serif text-xl font-bold text-black">{req.title}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {isComplete ? 'EVIDENCE_PROVIDED' : 'PENDING_EVIDENCE'}
                                    </span>
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[#999]" /> : <ChevronDown className="w-5 h-5 text-[#999]" />}
                                </div>
                            </button>

                            {/* Card Details */}
                            {isExpanded && (
                                <div className="px-6 pb-6 pt-2 border-t border-black/5">
                                    <p className="font-mono text-sm text-[#555] leading-relaxed mb-6 max-w-3xl">
                                        {req.description}
                                    </p>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        {/* Acceptable Evidence Types */}
                                        <div>
                                            <h4 className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-3">Acceptable Evidence</h4>
                                            <ul className="space-y-2">
                                                {req.evidence_types.map((type, i) => (
                                                    <li key={i} className="font-mono text-[11px] text-[#555] flex items-center gap-2">
                                                        <FileText className="w-3 h-3 text-[#FF4F00]" />
                                                        {type.replace(/_/g, ' ').toUpperCase()}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Upload / List */}
                                        <div className="bg-gray-50 border border-gray-200 p-4">
                                            <h4 className="font-mono text-[10px] text-[#555] uppercase tracking-widest mb-4">Attached Documents</h4>

                                            {reqEvidence.length > 0 ? (
                                                <div className="space-y-2 mb-4">
                                                    {reqEvidence.map(ev => (
                                                        <div key={ev.id} className="bg-white border border-gray-200 p-3 flex justify-between items-center">
                                                            <div className="flex items-center gap-3">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                                <div>
                                                                    <a href={ev.file_url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#FF4F00] hover:underline">
                                                                        {ev.file_name}
                                                                    </a>
                                                                    <p className="font-mono text-[9px] text-gray-400 mt-0.5">SHA-256: {ev.hash}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 border-2 border-dashed border-gray-300 mb-4 bg-white">
                                                    <p className="font-mono text-xs text-gray-400">No evidence uploaded yet</p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3">
                                                <Button 
                                                    variant="outline" 
                                                    disabled={uploadingReq === req.id}
                                                    onClick={() => document.getElementById(`upload-${req.id}`)?.click()}
                                                    className="w-full font-mono text-xs uppercase tracking-widest bg-white hover:bg-black hover:text-white transition-colors"
                                                >
                                                    {uploadingReq === req.id ? (
                                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                                                    ) : (
                                                        <><UploadCloud className="w-4 h-4 mr-2" /> Select File</>
                                                    )}
                                                </Button>
                                                <input 
                                                    id={`upload-${req.id}`}
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={(e) => handleUploadEvidence(req, e)} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
