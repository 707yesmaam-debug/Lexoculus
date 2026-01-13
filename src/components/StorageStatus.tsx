'use client';

import { useEffect, useState } from 'react';
import { HardDrive, AlertTriangle } from 'lucide-react';

interface StorageQuota {
    used: number;
    limit: number;
    percentage: number;
    can_store: boolean;
    used_mb: number;
    limit_mb: number;
}

export default function StorageStatus() {
    const [quota, setQuota] = useState<StorageQuota | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkQuota = async () => {
            try {
                const res = await fetch('/api/storage-quota');
                if (res.ok) {
                    const data = await res.json();
                    setQuota(data);
                }
            } catch (error) {
                console.error('Failed to check storage quota:', error);
            } finally {
                setLoading(false);
            }
        };

        checkQuota();
        // Refresh every 5 minutes
        const interval = setInterval(checkQuota, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !quota) return null;

    const isNearLimit = quota.percentage > 90;
    const progressColor = isNearLimit ? 'bg-[#FF4F00]' : 'bg-black';

    return (
        <div className="border-2 border-black bg-white p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-black" />
                    <span className="font-serif text-lg font-bold text-black">System Storage</span>
                </div>
                <span className={`font-mono text-xs font-bold ${isNearLimit ? 'text-[#FF4F00]' : 'text-black'}`}>
                    {quota.percentage.toFixed(1)}% USED
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-4 border border-black p-0.5 bg-white mb-2">
                <div
                    className={`h-full ${progressColor} transition-all duration-300`}
                    style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                />
            </div>

            <div className="flex justify-between items-center text-xs font-mono">
                <p className="text-[#555] uppercase tracking-wide">
                    {quota.used_mb} MB / {quota.limit_mb} MB (1 GB ALLOCATION)
                </p>
                {isNearLimit && (
                    <div className="flex items-center gap-1 text-[#FF4F00] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>STORAGE_WARNING</span>
                    </div>
                )}
            </div>
        </div>
    );
}
