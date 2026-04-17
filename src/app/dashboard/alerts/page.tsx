'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Activity, ShieldAlert, CheckCircle2, ChevronRight,
    Loader2, AlertCircle, Clock, Search, RefreshCw, FileWarning
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface Alert {
    id: string;
    ai_system_id: string | null;
    category: string;
    severity: string;
    title: string;
    message: string;
    status: string;
    created_at: string;
    metadata: any;
    ai_system?: {
        id: string;
        name: string;
        risk_classification: string;
    };
}

export default function AlertsDashboard() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTriggering, setIsTriggering] = useState(false);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    const fetchAlerts = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await fetch('/api/alerts?status=unread');
            const data = await res.json();
            
            if (res.ok) {
                setAlerts(data.alerts || []);
            } else {
                throw new Error(data.error || 'Failed to load alerts');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading alerts');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

    const handleResolve = async (id: string) => {
        try {
            const res = await fetch(`/api/alerts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'resolved' })
            });

            if (res.ok) {
                setAlerts(prev => prev.filter(alert => alert.id !== id));
            }
        } catch (err) {
            console.error('Failed to resolve alert', err);
        }
    };

    const handleManualDriftCheck = async () => {
        setInfoMessage('Automated drift checks are scheduled nightly via GitHub Actions. To re-scan a specific system, go to the Registry and click RESCAN on any system with detected drift.');
        setTimeout(() => setInfoMessage(null), 8000);
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical': return <span className="bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase">Critical</span>;
            case 'warning': return <span className="bg-[#FF4F00]/10 text-[#FF4F00] px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase">Warning</span>;
            default: return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase">Info</span>;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'drift_detected': return <Activity className="w-5 h-5 text-[#FF4F00]" />;
            case 'risk_change': return <ShieldAlert className="w-5 h-5 text-red-500" />;
            default: return <FileWarning className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8 md:p-12">
            {/* Header */}
            <div className="mb-12 border-b-2 border-black pb-8 flex flex-col md:flex-row items-end justify-between gap-6">
                <div>
                    <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest uppercase">MONITORING // POST-MARKET</div>
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-black tracking-tight mb-2">
                        Active Alerts.
                    </h1>
                    <p className="font-mono text-sm text-[#555]">Post-market monitoring and code drift warnings.</p>
                </div>

                <div className="flex gap-4">
                    <Button 
                        onClick={handleManualDriftCheck}
                        disabled={isTriggering}
                        className="bg-white text-black border-2 border-black hover:bg-black hover:text-white rounded-none font-mono text-xs uppercase tracking-widest h-12 px-6 transition-all"
                    >
                        {isTriggering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Trigger Manual Check
                    </Button>
                </div>
            </div>

            {/* Info Message Banner */}
            {infoMessage && (
                <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 flex items-start gap-3">
                    <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="font-mono text-xs text-blue-700">{infoMessage}</p>
                </div>
            )}

            {isLoading ? (
                <div className="py-24 text-center">
                    <Loader2 className="w-8 h-8 text-[#FF4F00] animate-spin mx-auto mb-4" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#555]">Loading system alerts...</p>
                </div>
            ) : error ? (
                <div className="bg-[#FFF5F0] border border-[#FF4F00]/30 p-6 flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 text-[#FF4F00] mb-4" />
                    <h3 className="font-serif text-xl font-bold text-black mb-2">Error loading alerts</h3>
                    <p className="font-mono text-xs text-[#555]">{error}</p>
                </div>
            ) : alerts.length === 0 ? (
                <div className="bg-[#FAFAFA] border-2 border-black/5 p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-6" />
                    <h2 className="font-serif text-2xl font-bold text-black mb-2">System Optimal</h2>
                    <p className="font-mono text-[#555]">No active compliance or code drift alerts detected.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {alerts.map(alert => (
                        <div key={alert.id} className="bg-white border-2 border-black/10 hover:border-black/30 transition-colors p-6 flex gap-6 items-start group">
                            <div className="w-12 h-12 bg-[#FAFAFA] rounded-full flex items-center justify-center flex-shrink-0">
                                {getCategoryIcon(alert.category)}
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    {getSeverityBadge(alert.severity)}
                                    <span className="font-mono text-[10px] text-[#999] uppercase tracking-widest">
                                        {new Date(alert.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <h3 className="font-serif text-xl font-bold text-black mb-2">{alert.title}</h3>
                                <p className="font-mono text-sm text-[#555] leading-relaxed mb-4 max-w-3xl">
                                    {alert.message}
                                </p>
                                
                                {alert.ai_system && (
                                    <div className="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-200 px-3 py-2 inline-flex">
                                        <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Target System:</span>
                                        <Link href={`/dashboard/registry`} className="font-mono text-xs font-bold text-[#FF4F00] hover:underline">
                                            {alert.ai_system.name}
                                        </Link>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-4 pt-4 border-t border-black/5">
                                    <Button 
                                        onClick={() => handleResolve(alert.id)}
                                        className="bg-black text-white hover:bg-[#FF4F00] rounded-none font-mono text-[10px] uppercase tracking-widest h-8 px-6"
                                    >
                                        Mark as Resolved
                                    </Button>
                                    
                                    {alert.ai_system_id && alert.category === 'drift_detected' && (
                                        <Link href={`/dashboard/scanner?target=${alert.ai_system_id}`}>
                                            <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white rounded-none font-mono text-[10px] uppercase tracking-widest h-8 px-4">
                                                Re-scan System
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
