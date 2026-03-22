'use client';

import { useState, useEffect } from 'react';
import { Shield, ExternalLink, RefreshCw, Check, Zap, Lock, Activity, Eye, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Installation {
    id: string;
    repo_full_name: string;
    status: string;
    block_on_high_risk: boolean;
    block_on_unacceptable: boolean;
    notify_slack: boolean;
    installed_at: string;
    last_scan_at: string | null;
    total_scans: number;
    client_name: string;
}

interface Scan {
    id: string;
    repo_full_name: string;
    pr_number: number;
    pr_title: string;
    pr_url: string;
    risk_level: string;
    scanned_at: string;
    blocked: boolean;
    client_name: string;
}

export default function FirmMonitoringPage() {
    const [installations, setInstallations] = useState<Installation[]>([]);
    const [scans, setScans] = useState<Scan[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [instRes, scansRes] = await Promise.all([
                fetch('/api/firm/monitoring/installations'),
                fetch('/api/firm/monitoring/activity')
            ]);
            
            if (instRes.ok) {
                const data = await instRes.json();
                setInstallations(data.installations || []);
            }
            
            if (scansRes.ok) {
                const data = await scansRes.json();
                setScans(data.scans || []);
            }
        } catch (error) {
            console.error('Failed to fetch monitoring data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="p-8 md:p-12 max-w-6xl mx-auto font-mono">
            <header className="mb-12 border-b-2 border-black pb-8">
                <div className="text-[10px] text-[#FF4F00] mb-4 tracking-widest uppercase">
                    MONITORING // COMPLIANCE_GUARDIAN
                </div>
                <h1 className="font-serif text-3xl md:text-5xl font-extrabold mb-4 tracking-tighter">
                    Portfolio Protection.
                </h1>
                <p className="text-sm text-[#555] max-w-xl leading-relaxed">
                    Real-time monitoring of automated compliance checks across your entire client portfolio. 
                    Manage GitHub Action deployments and track pass/fail status for all PRs.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-12">
                {/* SECTION 1: INSTALLATIONS */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-2 bg-black rounded-full"></div>
                            <h2 className="text-lg font-bold uppercase tracking-widest">GUARDED_REPOSITORIES</h2>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={fetchData}
                            className="text-black hover:bg-black hover:text-white rounded-none border border-black h-8 text-xs font-mono"
                        >
                            <RefreshCw className="w-3 h-3 mr-2" />
                            RESYNC
                        </Button>
                    </div>

                    <div className="border-2 border-black bg-white">
                        {loading ? (
                            <div className="p-12 text-center text-xs text-[#999] uppercase tracking-widest">
                                FETCHING_REPOS...
                            </div>
                        ) : installations.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-xs text-[#999] mb-6 uppercase tracking-widest">NO_GUARDIAN_STATIONS_ACTIVE</p>
                                <Button 
                                    onClick={() => (window.location.href = '/firm/clients')}
                                    className="bg-black hover:bg-[#FF4F00] text-white rounded-none text-xs uppercase tracking-widest px-8"
                                >
                                    DEPLOY_TO_CLIENTS
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-[#F5F5F5] border-b-2 border-black uppercase text-[#555]">
                                        <tr>
                                            <th className="px-6 py-4">CLIENT</th>
                                            <th className="px-6 py-4">REPOSITORY</th>
                                            <th className="px-6 py-4">STATUS</th>
                                            <th className="px-6 py-4 text-right">SCANS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E5E5]">
                                        {installations.map((inst) => (
                                            <tr key={inst.id} className="hover:bg-[#F9F9F9] group">
                                                <td className="px-6 py-4 font-bold text-black border-r border-[#F0F0F0]">
                                                    {inst.client_name}
                                                </td>
                                                <td className="px-6 py-4 flex items-center gap-2">
                                                    <Shield className={`w-4 h-4 ${inst.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                                                    {inst.repo_full_name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-none border ${
                                                        inst.status === 'active' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'
                                                    }`}>
                                                        {inst.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold">
                                                    {inst.total_scans}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>

                {/* SECTION 2: ACTIVITY FEED */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h2 className="text-lg font-bold uppercase tracking-widest">LIVE_PORTFOLIO_FEED</h2>
                    </div>

                    <div className="border-2 border-black bg-white">
                        {loading ? (
                            <div className="p-12 text-center text-xs text-[#999] uppercase tracking-widest">
                                FETCHING_LOGS...
                            </div>
                        ) : scans.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-xs text-[#999] uppercase tracking-widest">NO_ACTIVITY_LOGGED</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-[#F5F5F5] border-b-2 border-black uppercase text-[#555]">
                                        <tr>
                                            <th className="px-6 py-4">TIMESTAMP</th>
                                            <th className="px-6 py-4">CLIENT</th>
                                            <th className="px-6 py-4">PR_EVENT</th>
                                            <th className="px-6 py-4">RISK</th>
                                            <th className="px-6 py-4">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E5E5]">
                                        {scans.map((scan) => (
                                            <tr key={scan.id} className="hover:bg-[#F9F9F9]">
                                                <td className="px-6 py-4 whitespace-nowrap text-[#999]">
                                                    {new Date(scan.scanned_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td className="px-6 py-4 font-bold border-r border-[#F0F0F0]">
                                                    {scan.client_name}
                                                </td>
                                                <td className="px-6 py-4 font-mono max-w-[200px] truncate">
                                                    <a href={scan.pr_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF4F00] flex items-center gap-2">
                                                        <ExternalLink className="w-3 h-3" />
                                                        #{scan.pr_number} {scan.pr_title}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 border ${
                                                        scan.risk_level === 'HIGH_RISK' || scan.risk_level === 'UNACCEPTABLE' 
                                                        ? 'bg-red-50 text-red-700 border-red-200' 
                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                    }`}>
                                                        {scan.risk_level}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {scan.blocked ? (
                                                        <span className="text-red-600 font-bold uppercase tracking-tighter">BLOCKED</span>
                                                    ) : (
                                                        <span className="text-green-600 uppercase tracking-tighter">PASSED</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
