'use client';

import { useEffect, useState } from 'react';
import { getRecentPRScans, PRScanResult } from '@/app/actions/guardian';
import Link from 'next/link';

export default function GuardianActivity() {
    const [scans, setScans] = useState<PRScanResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScans = async () => {
            const { scans } = await getRecentPRScans();
            setScans(scans);
            setLoading(false);
        };
        fetchScans();
    }, []);

    if (loading) {
        return <div className="p-4 font-mono text-xs text-gray-500">LOADING_GUARDIAN_LOGS...</div>;
    }

    if (scans.length === 0) {
        return (
            <div className="p-8 border border-gray-200 border-dashed text-center">
                <p className="font-mono text-sm text-gray-500 mb-2">NO_ACTIVITY_DETECTED</p>
                <p className="text-xs text-gray-400">
                    Connect the Compliance Guardian to your repositories to see PR scans here.
                </p>
            </div>
        );
    }

    return (
        <div className="border border-black">
            <div className="bg-black text-white p-3 flex justify-between items-center">
                <h3 className="font-mono text-sm uppercase tracking-wider">GUARDIAN_ACTIVITY_LOG</h3>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded">LATEST_20</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100 font-mono">
                        <tr>
                            <th className="px-4 py-3">DATE</th>
                            <th className="px-4 py-3">REPOSITORY</th>
                            <th className="px-4 py-3">PR</th>
                            <th className="px-4 py-3">RISK_LEVEL</th>
                            <th className="px-4 py-3">STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scans.map((scan) => (
                            <tr key={scan.id} className="border-b border-gray-100 hover:bg-gray-50 font-mono">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {scan.scanned_at ? new Date(scan.scanned_at).toLocaleDateString() : 'N/A'}
                                    <span className="text-gray-400 text-xs ml-1">
                                        {scan.scanned_at ? new Date(scan.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {scan.repo_full_name}
                                </td>
                                <td className="px-4 py-3 max-w-[200px] truncate">
                                    <a href={scan.pr_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                                        #{scan.pr_number} {scan.pr_title}
                                    </a>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs rounded-full border ${scan.risk_level === 'UNACCEPTABLE' ? 'bg-red-50 text-red-700 border-red-200' :
                                            scan.risk_level === 'HIGH_RISK' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                'bg-green-50 text-green-700 border-green-200'
                                        }`}>
                                        {scan.risk_level}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {scan.blocked ? (
                                        <span className="text-red-600 font-bold">BLOCKED</span>
                                    ) : (
                                        <span className="text-green-600">PASSED</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
