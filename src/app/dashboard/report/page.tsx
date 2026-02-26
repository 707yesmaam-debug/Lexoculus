'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Search, Filter, ArrowRight, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AiSystem {
    id: string;
    name: string;
    description: string | null;
    risk_classification: string | null;
    risk_score: number | null;
    latest_scan_id: string | null;
    last_scanned_at: string | null;
    status: string;
}

export default function ReportsDashboard() {
    const router = useRouter();
    const [systems, setSystems] = useState<AiSystem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchSystems();
    }, []);

    const fetchSystems = async () => {
        try {
            const res = await fetch('/api/ai-systems');
            if (res.ok) {
                const data = await res.json();
                // Filter only systems that have been scanned (and thus might have reports)
                const scannedSystems = data.ai_systems.filter((s: AiSystem) => s.latest_scan_id);
                setSystems(scannedSystems);
            }
        } catch (error) {
            console.error('Failed to fetch systems:', error);
        } finally {
            setLoading(false);
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

    const filteredSystems = systems.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-12">
            {/* Header */}
            <div className="mb-12 border-b-2 border-black pb-8">
                <div className="font-mono text-[10px] md:text-xs text-[#FF4F00] mb-4 tracking-widest uppercase">
                    DASHBOARD // REPORTS
                </div>
                <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 tracking-tight">Compliance Reports.</h1>
                <p className="font-mono text-xs md:text-sm text-[#555] max-w-xl leading-relaxed">
                    Access detailed compliance reports, risk assessments, and audit logs for all your AI systems.
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search systems..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </div>
                <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white font-mono text-xs uppercase tracking-widest">
                    <Filter className="w-4 h-4 mr-2" />
                    FILTER_STATUS
                </Button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="p-12 text-center font-mono text-xs text-[#999] uppercase tracking-widest">
                    LOADING_DATA...
                </div>
            ) : filteredSystems.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 p-12 text-center">
                    <div className="font-mono text-xs text-[#999] uppercase tracking-widest mb-4">
                        NO_REPORTS_AVAILABLE
                    </div>
                    <p className="font-mono text-sm text-[#555] mb-6">
                        {searchQuery ? 'No matching systems found.' : 'Scan an AI system to generate your first compliance report.'}
                    </p>
                    {!searchQuery && (
                        <Button
                            onClick={() => router.push('/dashboard/scanner')}
                            className="bg-black hover:bg-[#FF4F00] text-white rounded-none font-mono text-xs uppercase tracking-widest"
                        >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            START_SCAN
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSystems.map((system) => (
                        <div
                            key={system.id}
                            onClick={() => {
                                router.push(`/dashboard/documents/${system.id}`);
                            }}
                            className="border-2 border-black bg-white p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    {getRiskIcon(system.risk_classification)}
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                                        {system.risk_classification?.replace('_', ' ') || 'UNCLASSIFIED'}
                                    </span>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
                            </div>

                            <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-[#FF4F00] transition-colors">
                                {system.name}
                            </h3>
                            <p className="font-mono text-xs text-gray-500 mb-6 line-clamp-2 h-8">
                                {system.description || 'No description provided.'}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="font-mono text-[10px] text-gray-400">
                                    LAST_SCAN: {system.last_scanned_at ? new Date(system.last_scanned_at).toLocaleDateString() : 'N/A'}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold font-mono">
                                    <FileText className="w-3 h-3" />
                                    VIEW_DOCUMENTS
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
