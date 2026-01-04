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

    const statusColor =
        quota.percentage < 70
            ? 'text-emerald-400'
            : quota.percentage < 90
                ? 'text-amber-400'
                : 'text-red-400';

    const bgColor =
        quota.percentage < 70
            ? 'bg-emerald-500'
            : quota.percentage < 90
                ? 'bg-amber-500'
                : 'bg-red-500';

    return (
        <div className="border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400 text-sm">Storage Usage</span>
                </div>
                <span className={`text-sm font-mono ${statusColor}`}>
                    {quota.percentage.toFixed(1)}%
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full ${bgColor} transition-all duration-300`}
                    style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                />
            </div>

            <p className="text-zinc-600 text-xs">
                {quota.used_mb} MB / {quota.limit_mb} MB (1 GB free tier)
            </p>

            {quota.percentage > 90 && (
                <div className="mt-3 flex items-center gap-2 text-amber-400 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Storage nearly full. Delete old reports.</span>
                </div>
            )}
        </div>
    );
}
