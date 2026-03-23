'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, Activity, CheckCircle, Globe, Github, ArrowRight } from 'lucide-react';

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

    const handleManageConnection = () => {
        // Redirect to the onboarding page for this client with reconnect forced
        if (stats?.onboardingToken) {
            window.location.href = `/onboard/${stats.onboardingToken}?reconnect=true`;
        } else {
            alert('Onboarding token not found. Please contact support.');
        }
    };

    const handleTriggerAudit = async (repoUrl?: string) => {
        const targetRepo = repoUrl || stats?.repoUrl;
        if (!targetRepo || targetRepo.includes('Authorized Account')) {
            alert('Please select a specific repository to scan first.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/firm/clients/${clientId}/rescan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoUrl: targetRepo })
            });
            if (res.ok) {
                // Refresh data
                window.location.reload();
            } else {
                alert('Failed to trigger scan.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) return (
        <div className="flex flex-col items-center justify-center h-[60vh] font-mono animate-pulse">
            <div className="text-4xl mb-4 font-black">SCANNING_INFRASTRUCTURE...</div>
            <div className="text-xs text-gray-400">CONNECTING_TO_SECURE_NODE_9</div>
        </div>
    );

    const riskLevel = stats?.latestScan?.risk_classification || 'UNKNOWN';
    const riskColor = riskLevel === 'HIGH_RISK' ? 'text-red-500' : riskLevel === 'LIMITED_RISK' ? 'text-yellow-500' : 'text-green-500';

    return (
        <div className="p-8 space-y-8 max-w-7xl animate-in fade-in duration-500">
            {/* TOP CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
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
                            <div className="flex flex-col gap-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-xs font-mono text-gray-500 mb-1">CURRENT_TARGET</div>
                                        <div className="text-lg font-bold truncate max-w-md">{stats?.repoUrl || 'No Repository Connected'}</div>
                                    </div>
                                    <button 
                                        onClick={handleManageConnection}
                                        className="bg-white border-2 border-black px-4 py-2 text-xs font-mono font-bold hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                    >
                                        MANAGE_CONNECTION
                                    </button>
                                </div>

                                {stats?.repositories && stats.repositories.length > 0 && (
                                    <div className="border-t border-black pt-6">
                                        <label className="text-xs font-mono text-gray-500 mb-2 block uppercase">Select Repository To Audit</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {stats.repositories.map((repo: any) => (
                                                <div 
                                                    key={repo.full_name}
                                                    className="flex items-center justify-between p-3 bg-white border border-gray-200 hover:border-black transition-colors"
                                                >
                                                    <span className="text-sm font-medium">{repo.full_name}</span>
                                                    <button 
                                                        onClick={() => handleTriggerAudit(repo.url)}
                                                        className="text-[10px] font-mono bg-black text-white px-3 py-1 hover:bg-[#FF4F00] transition-colors"
                                                    >
                                                        AUDIT_NOW
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-black mb-4">LATEST_SCAN_RESULTS</h2>
                        {stats?.latestScan ? (
                            <div className="border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <div className="p-4 bg-black text-white font-mono text-[10px] flex justify-between">
                                    <span>SCAN_ID: {stats.latestScan.id}</span>
                                    <span>COMPLETED: {new Date(stats.latestScan.scanned_at).toLocaleString()}</span>
                                </div>
                                <div className="p-6 bg-white">
                                    <div className="flex flex-col gap-6">
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
                                                <div className="text-2xl font-black">
                                                    {stats.latestScan?.risk_assessment?.risk_score ?? 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pipeline Progress Indicator */}
                                        <div className="mt-4 border-t border-gray-200 pt-6">
                                            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF4F00] mb-4">
                                                Pipeline Status
                                            </div>
                                            <div className="flex items-center justify-between text-xs font-mono mb-2">
                                                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                                                    {[
                                                        { label: 'Ingestion', active: true },
                                                        { label: 'Analysis', active: !!stats.latestScan?.llm_analysis },
                                                        { label: 'Classification', active: !!stats.latestScan?.risk_assessment },
                                                        { label: 'Verification', active: !!stats.latestScan?.final_risk_assessment?.context_verified },
                                                        { label: 'Report', active: !!stats.hasReport }
                                                    ].map((stage, i) => (
                                                        <div key={i} className="flex items-center gap-1 min-w-max">
                                                            <div className={`px-2 py-1 border ${stage.active ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                                                {i + 1}. {stage.label}
                                                            </div>
                                                            {i < 4 && <div className="w-4 h-px bg-gray-300 mx-1"></div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="mt-6 flex justify-end">
                                                <button 
                                                    onClick={() => window.location.href = `/dashboard/analyzer/${stats.latestScan.id}?firmClientId=${clientId}`}
                                                    className="bg-white border-2 border-black px-6 py-3 font-mono text-xs font-bold uppercase hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2"
                                                >
                                                    Continue Analysis Pipeline <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-black p-12 text-center text-gray-400 font-mono text-sm">
                                NO_SCAN_DATA_AVAILABLE
                                <div className="mt-4">
                                    <button 
                                        onClick={() => handleTriggerAudit()}
                                        className="bg-black text-white px-8 py-4 font-mono text-xs font-bold hover:bg-[#FF4F00] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_0px_rgba(255,79,0,1)]"
                                    >
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
                        <h2 className="text-xl font-black mb-4 uppercase">Actions</h2>
                        <div className="flex flex-col gap-3">
                            <button className="w-full border-2 border-black p-4 font-mono text-xs text-left bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all group flex justify-between items-center">
                                GENERATE_COMPLIANCE_REPORT
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </button>
                            <button className="w-full border-2 border-black p-4 font-mono text-xs text-left bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all group flex justify-between items-center">
                                EXPORT_AUDIT_LOGS
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </button>
                            <button className="w-full border-2 border-black p-4 font-mono text-xs text-left bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all group flex justify-between items-center">
                                SCHEDULE_RECURRING_SCAN
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </button>
                        </div>
                    </section>

                    <div className="p-1 bg-black">
                        <section className="border-2 border-white p-6 bg-[#000000] text-white">
                            <div className="text-[10px] font-mono text-gray-500 mb-4 tracking-[0.2em] uppercase">Security_Insight</div>
                            <p className="text-sm font-mono leading-relaxed text-gray-300">
                                Continuous monitoring is active. Any changes to the detected libraries or AI frameworks will trigger an immediate alert in the Guardian tab.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
