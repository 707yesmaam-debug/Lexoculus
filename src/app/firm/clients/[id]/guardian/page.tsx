'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldCheck, Bell, History, PlayCircle, AlertCircle } from 'lucide-react';

export default function ClientGuardianPage() {
    const params = useParams();
    const clientId = params.id as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [alerts, setAlerts] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [scans, setScans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch alerts and scans for this client
                const [alertsRes, scansRes] = await Promise.all([
                    fetch(`/api/alerts?firm_client_id=${clientId}`),
                    fetch(`/api/repo-scans?firm_client_id=${clientId}`)
                ]);
                
                if (alertsRes.ok) setAlerts(await alertsRes.json());
                if (scansRes.ok) {
                    const data = await scansRes.json();
                    setScans(data.scans || []);
                }
            } catch (err) {
                console.error('Failed to fetch guardian data', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [clientId]);

    const handleRescan = async () => {
        setScanning(true);
        try {
            const res = await fetch(`/api/firm/clients/${clientId}/rescan`, { method: 'POST' });
            if (res.ok) {
                // Refresh data
                const scansRes = await fetch(`/api/repo-scans?firm_client_id=${clientId}`);
                if (scansRes.ok) {
                    const data = await scansRes.json();
                    setScans(data.scans || []);
                }
            }
        } catch (err) {
            console.error('Rescan failed', err);
        } finally {
            setScanning(false);
        }
    };

    if (loading) return <div className="p-8 font-mono text-xs">INITIALIZING_GUARDIAN_PROTOCOLS...</div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2">
                        <ShieldCheck className="text-[#FF4F00]" /> COMPLIANCE_GUARDIAN
                    </h2>
                    <p className="text-gray-500 font-mono text-xs uppercase mt-1">
                        Continuous monitoring and automated risk detection
                    </p>
                </div>
                <button 
                    onClick={handleRescan}
                    disabled={scanning}
                    className={`
                        flex items-center gap-2 px-6 py-3 border-2 border-black font-mono text-xs tracking-widest transition-all
                        ${scanning ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-[#FF4F00] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                    `}
                >
                    <PlayCircle size={16} /> {scanning ? 'AUDIT_IN_PROGRESS...' : 'TRIGGER_MANUAL_AUDIT'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ACTIVE ALERTS */}
                <section className="space-y-4">
                    <h3 className="text-sm font-black font-mono flex items-center gap-2 text-gray-400">
                        <Bell size={14} /> ACTIVE_SECURITY_ALERTS
                    </h3>
                    <div className="space-y-3">
                        {alerts.length > 0 ? (
                            alerts.map((alert) => (
                                <div key={alert.id} className="border-2 border-black p-4 bg-white flex gap-4 items-start">
                                    <div className="p-2 bg-red-100 text-red-600">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-tight">{alert.title}</div>
                                        <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                                        <div className="text-[10px] font-mono text-gray-400 mt-2">DETECTED: {new Date(alert.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="border-2 border-black p-12 bg-[#F5F5F5] text-center">
                                <span className="text-xs font-mono text-gray-400 italic">SYSTEM_STABLE: NO_ACTIVE_ALERTS_DETECTED</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* AUDIT HISTORY */}
                <section className="space-y-4">
                    <h3 className="text-sm font-black font-mono flex items-center gap-2 text-gray-400">
                        <History size={14} /> AUDIT_HISTORY
                    </h3>
                    <div className="border-2 border-black divide-y-2 divide-black overflow-hidden">
                        {scans.length > 0 ? (
                            scans.map((scan) => (
                                <div key={scan.id} className="p-4 bg-white hover:bg-gray-50 flex justify-between items-center group">
                                    <div>
                                        <div className="text-xs font-bold font-mono uppercase">{scan.repo_name} SCAN</div>
                                        <div className="text-[10px] font-mono text-gray-400 mt-1">TIMESTAMP: {new Date(scan.scanned_at).toLocaleString()}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-mono font-black text-green-500 uppercase tracking-widest hidden group-hover:inline">
                                            VERIFIED_ON_CHAIN
                                        </span>
                                        <button className="text-xs font-mono underline hover:text-[#FF4F00]">
                                            REPORT
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-gray-400 font-mono text-xs italic">
                                NO_AUDIT_HISTORY_FOUND
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
