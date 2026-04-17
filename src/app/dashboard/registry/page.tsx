'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, RefreshCw, AlertTriangle, Shield, ShieldCheck, ShieldAlert, ArrowRight, Archive, ExternalLink, Share2, Copy, Check, Code, GitCompare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AiSystem {
    id: string;
    name: string;
    description: string | null;
    source_repo_url: string | null;
    risk_classification: string | null;
    risk_score: number | null;
    status: string;
    lifecycle_stage: string;
    last_scanned_at: string | null;
    created_at: string;
    updated_at: string;
    latest_scan: {
        id: string;
        repo_name: string;
        repo_owner: string;
    } | null;
    // Share fields
    public_share_id: string | null;
    share_enabled: boolean;
    // Drift tracking (Phase 3.1)
    drift_detected: boolean;
    files_changed_count: number | null;
    drift_checked_at: string | null;
}

interface Stats {
    total: number;
    high_risk: number;
    limited_risk: number;
    minimal_risk: number;
    unacceptable_risk: number;
    unclassified: number;
}

export default function RegistryPage() {
    const router = useRouter();
    const [systems, setSystems] = useState<AiSystem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSystemName, setNewSystemName] = useState('');
    const [newSystemDesc, setNewSystemDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [sharingSystemId, setSharingSystemId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [badgeModalSystem, setBadgeModalSystem] = useState<AiSystem | null>(null);
    const [badgeCopied, setBadgeCopied] = useState<string | null>(null);

    useEffect(() => {
        fetchSystems();
    }, []);

    const fetchSystems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai-systems');
            if (res.ok) {
                const data = await res.json();
                setSystems(data.ai_systems || []);
                setStats(data.stats || null);
            }
        } catch (error) {
            console.error('Failed to fetch AI systems:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSystem = async () => {
        if (!newSystemName.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/ai-systems', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newSystemName,
                    description: newSystemDesc || null,
                }),
            });

            if (res.ok) {
                setShowAddModal(false);
                setNewSystemName('');
                setNewSystemDesc('');
                fetchSystems();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create AI system');
            }
        } catch (error) {
            console.error('Failed to create AI system:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleShare = async (systemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSharingSystemId(systemId);

        try {
            const res = await fetch(`/api/ai-systems/${systemId}/share`, {
                method: 'POST',
            });

            if (res.ok) {
                const data = await res.json();
                // Copy URL to clipboard
                await navigator.clipboard.writeText(data.share_url);
                setCopiedId(systemId);
                setTimeout(() => setCopiedId(null), 2000);
                // Refresh to show updated share status
                fetchSystems();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to enable sharing');
            }
        } catch (error) {
            console.error('Share error:', error);
        } finally {
            setSharingSystemId(null);
        }
    };

    const handleCopyUrl = async (shareId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/status/${shareId}`;
        await navigator.clipboard.writeText(url);
        setCopiedId(shareId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getRiskBadge = (classification: string | null) => {
        switch (classification) {
            case 'UNACCEPTABLE':
                return <span className="px-2 py-1 text-[10px] font-mono uppercase bg-red-600 text-white">UNACCEPTABLE</span>;
            case 'HIGH_RISK':
                return <span className="px-2 py-1 text-[10px] font-mono uppercase bg-[#FF4F00] text-white">HIGH_RISK</span>;
            case 'LIMITED_RISK':
                return <span className="px-2 py-1 text-[10px] font-mono uppercase bg-yellow-500 text-black">LIMITED_RISK</span>;
            case 'MINIMAL_RISK':
                return <span className="px-2 py-1 text-[10px] font-mono uppercase bg-green-600 text-white">MINIMAL_RISK</span>;
            default:
                return <span className="px-2 py-1 text-[10px] font-mono uppercase bg-gray-400 text-white">UNCLASSIFIED</span>;
        }
    };

    const getRiskIcon = (classification: string | null) => {
        switch (classification) {
            case 'UNACCEPTABLE':
            case 'HIGH_RISK':
                return <ShieldAlert className="w-5 h-5 text-[#FF4F00]" />;
            case 'LIMITED_RISK':
                return <Shield className="w-5 h-5 text-yellow-500" />;
            case 'MINIMAL_RISK':
                return <ShieldCheck className="w-5 h-5 text-green-600" />;
            default:
                return <Shield className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-12">
            {/* Header */}
            <div className="mb-12 border-b-2 border-black pb-8">
                <div className="font-mono text-[10px] md:text-xs text-[#FF4F00] mb-4 tracking-widest uppercase">
                    REGISTRY // AI_SYSTEMS
                </div>
                <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 tracking-tight">AI System Registry.</h1>
                <p className="font-mono text-xs md:text-sm text-[#555] max-w-xl leading-relaxed">
                    All your scanned AI systems in one place.
                    Systems are automatically added when you scan a repository.
                </p>
            </div>

            {/* Stats Cards */}
            {stats && stats.total > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-12">
                    <div className="border-2 border-black p-4 bg-white">
                        <div className="font-mono text-[10px] text-[#555] uppercase tracking-widest mb-1">TOTAL</div>
                        <div className="font-serif text-3xl font-bold">{stats.total}</div>
                    </div>
                    <div className="border-2 border-red-600 p-4 bg-white">
                        <div className="font-mono text-[10px] text-red-600 uppercase tracking-widest mb-1">UNACCEPTABLE</div>
                        <div className="font-serif text-3xl font-bold text-red-600">{stats.unacceptable_risk}</div>
                    </div>
                    <div className="border-2 border-[#FF4F00] p-4 bg-white">
                        <div className="font-mono text-[10px] text-[#FF4F00] uppercase tracking-widest mb-1">HIGH_RISK</div>
                        <div className="font-serif text-3xl font-bold text-[#FF4F00]">{stats.high_risk}</div>
                    </div>
                    <div className="border-2 border-yellow-500 p-4 bg-white">
                        <div className="font-mono text-[10px] text-yellow-600 uppercase tracking-widest mb-1">LIMITED</div>
                        <div className="font-serif text-3xl font-bold text-yellow-600">{stats.limited_risk}</div>
                    </div>
                    <div className="border-2 border-green-600 p-4 bg-white">
                        <div className="font-mono text-[10px] text-green-600 uppercase tracking-widest mb-1">MINIMAL</div>
                        <div className="font-serif text-3xl font-bold text-green-600">{stats.minimal_risk}</div>
                    </div>
                    <div className="border-2 border-gray-300 p-4 bg-white">
                        <div className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-1">PENDING</div>
                        <div className="font-serif text-3xl font-bold text-gray-500">{stats.unclassified}</div>
                    </div>
                </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl font-bold">Registered Systems</h2>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchSystems}
                        className="text-black hover:bg-black hover:text-white rounded-none font-mono text-xs"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        REFRESH
                    </Button>
                </div>
            </div>

            {/* Systems List */}
            <div className="border-2 border-black bg-white">
                {loading ? (
                    <div className="p-12 text-center font-mono text-xs text-[#999] uppercase tracking-widest">
                        LOADING_REGISTRY...
                    </div>
                ) : systems.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="font-mono text-xs text-[#999] uppercase tracking-widest mb-4">
                            NO_SYSTEMS_YET
                        </div>
                        <p className="font-mono text-sm text-[#555] mb-6">
                            Scan your first repository to automatically add it here.
                        </p>
                        <Button
                            onClick={() => router.push('/dashboard/scanner')}
                            className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-xs uppercase tracking-widest"
                        >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            GO_TO_SCANNER
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-[#E5E5E5]">
                        {systems.map((system) => (
                            <div
                                key={system.id}
                                className="p-6 hover:bg-[#F9F9F9] transition-colors group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        {getRiskIcon(system.risk_classification)}
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-serif text-xl font-bold">{system.name}</h3>
                                                {getRiskBadge(system.risk_classification)}
                                                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[#F5F5F5] text-[#555] border border-[#E5E5E5]">
                                                    {system.lifecycle_stage}
                                                </span>
                                            </div>
                                            {system.description && (
                                                <p className="font-mono text-xs text-[#555] mb-2">{system.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 font-mono text-[10px] text-[#999]">
                                                {system.source_repo_url && (
                                                    <a
                                                        href={system.source_repo_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center gap-1 hover:text-black"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        {system.latest_scan?.repo_owner}/{system.latest_scan?.repo_name}
                                                    </a>
                                                )}
                                                {system.risk_score !== null && (
                                                    <span>SCORE: {system.risk_score}/100</span>
                                                )}
                                                {system.last_scanned_at && (
                                                    <span>SCANNED: {new Date(system.last_scanned_at).toLocaleDateString()}</span>
                                                )}
                                                {/* Drift Badge (Phase 3.1) */}
                                                {system.drift_detected && system.files_changed_count && system.files_changed_count > 0 && (
                                                    <>
                                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 font-mono text-[10px]">
                                                            <GitCompare className="w-3 h-3" />
                                                            {system.files_changed_count} FILES CHANGED
                                                        </span>
                                                        {/* Phase 3.2: Rescan Recommendation */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/dashboard/scanner?repo=${encodeURIComponent(system.source_repo_url || '')}`);
                                                            }}
                                                            className="flex items-center gap-1 px-2 py-0.5 bg-[#FF4F00] text-white font-mono text-[10px] hover:bg-black transition-colors"
                                                        >
                                                            <RefreshCw className="w-3 h-3" />
                                                            RESCAN
                                                        </button>
                                                    </>
                                                )}
                                                {/* Docs Link (Phase 2) */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/documents/${system.id}`); }}
                                                    className="flex items-center gap-1 hover:text-black"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    DOCS
                                                </button>
                                                {/* Conformity Tracker (Phase 5) */}
                                                {(system.risk_classification === 'HIGH_RISK' || system.risk_classification === 'LIMITED_RISK') && (
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/conformity/${system.id}`); }}
                                                            className="flex items-center gap-1 hover:text-black text-[#FF4F00]"
                                                        >
                                                            <ShieldCheck className="w-3 h-3" />
                                                            TRACK_CONFORMITY
                                                        </button>
                                                        
                                                        {system.risk_classification === 'HIGH_RISK' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/testing/${system.id}`); }}
                                                                className="flex items-center gap-1 hover:text-black text-blue-600"
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                TEST_EVIDENCE
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Share Button */}
                                        {system.share_enabled && system.public_share_id ? (
                                            <>
                                                <button
                                                    onClick={(e) => handleCopyUrl(system.public_share_id!, e)}
                                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 transition-colors"
                                                >
                                                    {copiedId === system.public_share_id ? (
                                                        <>
                                                            <Check className="w-3 h-3" />
                                                            COPIED!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3 h-3" />
                                                            LINK
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setBadgeModalSystem(system); }}
                                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 transition-colors"
                                                >
                                                    <Code className="w-3 h-3" />
                                                    BADGE
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={(e) => handleShare(system.id, e)}
                                                disabled={sharingSystemId === system.id}
                                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase bg-[#F5F5F5] text-[#555] border border-[#E5E5E5] hover:bg-black hover:text-white hover:border-black transition-colors disabled:opacity-50"
                                            >
                                                {sharingSystemId === system.id ? (
                                                    'SHARING...'
                                                ) : copiedId === system.id ? (
                                                    <>
                                                        <Check className="w-3 h-3" />
                                                        COPIED!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Share2 className="w-3 h-3" />
                                                        SHARE
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        <ArrowRight className="w-5 h-5 text-[#999] group-hover:text-black group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border-2 border-black w-full max-w-md">
                        <div className="p-4 border-b-2 border-black bg-[#F5F5F5]">
                            <h3 className="font-serif text-xl font-bold">Register AI System</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block font-mono text-xs uppercase tracking-widest mb-2">
                                    SYSTEM_NAME *
                                </label>
                                <input
                                    type="text"
                                    value={newSystemName}
                                    onChange={(e) => setNewSystemName(e.target.value)}
                                    placeholder="e.g., Customer Support Chatbot"
                                    className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:border-[#FF4F00]"
                                />
                            </div>
                            <div>
                                <label className="block font-mono text-xs uppercase tracking-widest mb-2">
                                    DESCRIPTION
                                </label>
                                <textarea
                                    value={newSystemDesc}
                                    onChange={(e) => setNewSystemDesc(e.target.value)}
                                    placeholder="Brief description of the AI system's purpose..."
                                    rows={3}
                                    className="w-full border-2 border-black p-3 font-mono text-sm focus:outline-none focus:border-[#FF4F00] resize-none"
                                />
                            </div>
                            <div className="font-mono text-[10px] text-[#999] bg-[#F5F5F5] p-3 border border-[#E5E5E5]">
                                <AlertTriangle className="w-3 h-3 inline mr-1" />
                                After creating, link a GitHub repository to enable automated compliance scanning.
                            </div>
                        </div>
                        <div className="p-4 border-t-2 border-black bg-[#F5F5F5] flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewSystemName('');
                                    setNewSystemDesc('');
                                }}
                                className="border-black text-black hover:bg-black hover:text-white rounded-none font-mono text-xs uppercase tracking-widest"
                            >
                                CANCEL
                            </Button>
                            <Button
                                onClick={handleCreateSystem}
                                disabled={!newSystemName.trim() || creating}
                                className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-xs uppercase tracking-widest disabled:opacity-50"
                            >
                                {creating ? 'CREATING...' : 'REGISTER'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Badge Embed Modal */}
            {badgeModalSystem && badgeModalSystem.public_share_id && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border-2 border-black w-full max-w-lg">
                        <div className="p-4 border-b-2 border-black bg-[#F5F5F5] flex items-center justify-between">
                            <h3 className="font-serif text-xl font-bold">Embed Compliance Badge</h3>
                            <button
                                onClick={() => setBadgeModalSystem(null)}
                                className="text-[#999] hover:text-black"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Preview */}
                            <div>
                                <div className="font-mono text-xs uppercase tracking-widest mb-2 text-[#999]">PREVIEW</div>
                                <div className="border border-[#E5E5E5] p-4 bg-[#F9F9F9] flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`/api/badge/${badgeModalSystem.public_share_id}`}
                                        alt="Compliance Badge"
                                    />
                                </div>
                            </div>

                            {/* Markdown */}
                            <div>
                                <div className="font-mono text-xs uppercase tracking-widest mb-2 text-[#999]">MARKDOWN (for README)</div>
                                <div className="relative">
                                    <code className="block bg-[#1a1a1a] text-green-400 p-3 text-xs font-mono break-all">
                                        {`[![EU AI Act](${typeof window !== 'undefined' ? window.location.origin : ''}/api/badge/${badgeModalSystem.public_share_id})](${typeof window !== 'undefined' ? window.location.origin : ''}/status/${badgeModalSystem.public_share_id})`}
                                    </code>
                                    <button
                                        onClick={async () => {
                                            const url = typeof window !== 'undefined' ? window.location.origin : '';
                                            await navigator.clipboard.writeText(`[![EU AI Act](${url}/api/badge/${badgeModalSystem.public_share_id})](${url}/status/${badgeModalSystem.public_share_id})`);
                                            setBadgeCopied('markdown');
                                            setTimeout(() => setBadgeCopied(null), 2000);
                                        }}
                                        className="absolute top-2 right-2 px-2 py-1 text-[10px] font-mono uppercase bg-white text-black border border-black hover:bg-black hover:text-white transition-colors"
                                    >
                                        {badgeCopied === 'markdown' ? 'COPIED!' : 'COPY'}
                                    </button>
                                </div>
                            </div>

                            {/* HTML */}
                            <div>
                                <div className="font-mono text-xs uppercase tracking-widest mb-2 text-[#999]">HTML (for websites)</div>
                                <div className="relative">
                                    <code className="block bg-[#1a1a1a] text-green-400 p-3 text-xs font-mono break-all">
                                        {`<a href="${typeof window !== 'undefined' ? window.location.origin : ''}/status/${badgeModalSystem.public_share_id}"><img src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/badge/${badgeModalSystem.public_share_id}" alt="EU AI Act Compliance"></a>`}
                                    </code>
                                    <button
                                        onClick={async () => {
                                            const url = typeof window !== 'undefined' ? window.location.origin : '';
                                            await navigator.clipboard.writeText(`<a href="${url}/status/${badgeModalSystem.public_share_id}"><img src="${url}/api/badge/${badgeModalSystem.public_share_id}" alt="EU AI Act Compliance"></a>`);
                                            setBadgeCopied('html');
                                            setTimeout(() => setBadgeCopied(null), 2000);
                                        }}
                                        className="absolute top-2 right-2 px-2 py-1 text-[10px] font-mono uppercase bg-white text-black border border-black hover:bg-black hover:text-white transition-colors"
                                    >
                                        {badgeCopied === 'html' ? 'COPIED!' : 'COPY'}
                                    </button>
                                </div>
                            </div>

                            <div className="font-mono text-[10px] text-[#999] bg-[#F5F5F5] p-3 border border-[#E5E5E5]">
                                <AlertTriangle className="w-3 h-3 inline mr-1" />
                                Badge updates automatically when risk classification changes.
                            </div>
                        </div>
                        <div className="p-4 border-t-2 border-black bg-[#F5F5F5] flex justify-end">
                            <Button
                                onClick={() => setBadgeModalSystem(null)}
                                className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-xs uppercase tracking-widest"
                            >
                                DONE
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
