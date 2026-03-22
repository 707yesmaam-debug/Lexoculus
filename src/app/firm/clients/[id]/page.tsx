'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, Activity, CheckCircle, Globe, Github } from 'lucide-react';

export default function ClientOverviewPage() {
    const params = useParams();
    const clientId = params.id as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                // We'll create this consolidated endpoint next
                const res = await fetch(`/api/firm/clients/${clientId}/stats`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to fetch client stats', err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [clientId]);

    if (loading) return <div className="p-8 font-mono text-xs">COLLECTING_LATEST_DATA...</div>;

    const riskLevel = stats?.latestScan?.risk_classification || 'UNKNOWN';
    const riskColor = riskLevel === 'HIGH_RISK' ? 'text-red-500' : riskLevel === 'LIMITED_RISK' ? 'text-yellow-500' : 'text-green-500';

    return (
        <div className="p-8 space-y-8 max-w-7xl">
            {/* TOP CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 mb-2 text-gray-500 font-mono text-[10px]">
                        <Shield size={12} /> COMPLIANCE_STATUS
                    </div>
                    <div className={`text-2xl font-black ${riskColor}`}>
                        {riskLevel}
                    </div>
                </div>

                <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 mb-2 text-gray-500 font-mono text-[10px]">
                        <Activity size={12} /> AI_SYSTEMS_DETECTED
                    </div>
                    <div className="text-3xl font-black">{stats?.aiSystemsCount || 0}</div>
                </div>

                <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 mb-2 text-gray-500 font-mono text-[10px]">
                        <CheckCircle size={12} /> CONFORMITY_TASKS
                    </div>
                    <div className="text-3xl font-black">{stats?.completedTasks || 0} / {stats?.totalTasks || 0}</div>
                </div>

                <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 mb-2 text-gray-500 font-mono text-[10px]">
                        <Globe size={12} /> MONITORING
                    </div>
                    <div className="text-sm font-mono font-bold text-[#FF4F00]">
                        {stats?.monitoringEnabled ? 'ENABLED' : 'DISABLED'}
                    </div>
                </div>
            </div>

            {/* TWO COLUMN CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* REPO INFO */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                             <Github size={20} /> CONNECTED_INFRASTRUCTURE
                        </h2>
                        <div className="border-2 border-black p-6 bg-[#F5F5F5]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs font-mono text-gray-500 mb-1">REPOSITORY_ORIGIN</div>
                                    <div className="text-lg font-bold truncate max-w-md">{stats?.repoUrl || 'No Repository Connected'}</div>
                                </div>
                                <button className="border border-black px-4 py-2 text-xs font-mono hover:bg-black hover:text-white transition-colors">
                                    MANAGE_CONNECTION
                                </button>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-black mb-4">LATEST_SCAN_RESULTS</h2>
                        {stats?.latestScan ? (
                            <div className="border-2 border-black overflow-hidden">
                                <div className="p-4 bg-black text-white font-mono text-[10px] flex justify-between">
                                    <span>SCAN_ID: {stats.latestScan.id}</span>
                                    <span>COMPLETED: {new Date(stats.latestScan.scanned_at).toLocaleString()}</span>
                                </div>
                                <div className="p-6 bg-white">
                                    <div className="flex items-center gap-8">
                                        <div>
                                            <div className="text-xs font-mono text-gray-400 mb-1">SYSTEM_NAME</div>
                                            <div className="text-xl font-black">{stats.latestScan.repo_name}</div>
                                        </div>
                                        <div className="h-10 w-[2px] bg-gray-200"></div>
                                        <div>
                                            <div className="text-xs font-mono text-gray-400 mb-1">PRIMARY_LANGUAGE</div>
                                            <div className="text-xl font-black font-mono">{stats.latestScan.primary_language}</div>
                                        </div>
                                        <div className="h-10 w-[2px] bg-gray-200"></div>
                                        <div>
                                            <div className="text-xs font-mono text-gray-400 mb-1">RISK_SCORE</div>
                                            <div className="text-2xl font-black">74/100</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-black p-12 text-center text-gray-400 font-mono text-sm">
                                NO_SCAN_DATA_AVAILABLE
                                <div className="mt-4">
                                    <button className="bg-black text-white px-6 py-3 font-mono text-xs hover:bg-[#FF4F00] transition-colors">
                                        TRIGGER_INITIAL_AUDIT
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* SIDEBAR */}
                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-black mb-4">QUICK_ACTIONS</h2>
                        <div className="flex flex-col gap-2">
                            <button className="w-full border-2 border-black p-4 font-mono text-xs text-left hover:bg-black hover:text-white transition-all group flex justify-between items-center">
                                GENERATE_COMPLIANCE_REPORT
                                <span className="opacity-0 group-hover:opacity-100">→</span>
                            </button>
                            <button className="w-full border-2 border-black p-4 font-mono text-xs text-left hover:bg-black hover:text-white transition-all group flex justify-between items-center">
                                EXPORT_AUDIT_LOGS
                                <span className="opacity-0 group-hover:opacity-100">→</span>
                            </button>
                            <button className="w-full border-2 border-black p-4 font-mono text-xs text-left hover:bg-black hover:text-white transition-all group flex justify-between items-center">
                                SCHEDULE_RECURRING_SCAN
                                <span className="opacity-0 group-hover:opacity-100">→</span>
                            </button>
                        </div>
                    </section>

                    <section className="border-2 border-black p-6 bg-[#000000] text-white">
                        <div className="text-[10px] font-mono text-gray-400 mb-4 tracking-[0.2em] uppercase">Security_Insight</div>
                        <p className="text-sm font-mono leading-relaxed">
                            Continuous monitoring is active. Any changes to the detected libraries or AI frameworks will trigger an immediate alert in the Guardian tab.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
