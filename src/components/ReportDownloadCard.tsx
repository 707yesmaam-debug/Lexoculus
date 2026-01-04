'use client';

import { useState } from 'react';
import { Download, FileText, Calendar, Hash, Shield, Trash2, RefreshCw } from 'lucide-react';

interface ReportDownloadCardProps {
    reportId: string;
    fileName: string;
    fileSize: number;
    riskClassification: string;
    riskScore: number;
    repoName: string;
    repoOwner: string;
    generatedAt: string;
    hasSiganture: boolean;
    onDelete?: () => void;
    onRefresh?: () => void;
}

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    UNACCEPTABLE: { bg: 'bg-red-950/20', text: 'text-red-400', border: 'border-red-900/50' },
    HIGH_RISK: { bg: 'bg-orange-950/20', text: 'text-orange-400', border: 'border-orange-900/50' },
    LIMITED_RISK: { bg: 'bg-amber-950/20', text: 'text-amber-400', border: 'border-amber-900/50' },
    MINIMAL_RISK: { bg: 'bg-emerald-950/20', text: 'text-emerald-400', border: 'border-emerald-900/50' },
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ReportDownloadCard({
    reportId,
    fileName,
    fileSize,
    riskClassification,
    riskScore,
    repoName,
    repoOwner,
    generatedAt,
    hasSiganture,
    onDelete,
    onRefresh,
}: ReportDownloadCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const colors = RISK_COLORS[riskClassification] || RISK_COLORS.LIMITED_RISK;

    const handleDownload = () => {
        window.open(`/api/reports/${reportId}/download`, '_blank');
    };

    const handleDelete = async () => {
        if (!confirm('Delete this report permanently?')) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/reports/${reportId}`, {
                method: 'DELETE',
            });

            if (response.ok && onDelete) {
                onDelete();
            }
        } catch (error) {
            console.error('Failed to delete report:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={`border ${colors.border} ${colors.bg}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center">
                        <FileText className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                        <h3 className="text-zinc-100 font-medium">{repoOwner}/{repoName}</h3>
                        <p className="text-zinc-500 text-sm">{fileName}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 text-sm font-medium border ${colors.border} ${colors.text}`}>
                    {riskClassification.replace('_', ' ')}
                </span>
            </div>

            {/* Details */}
            <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <p className="text-zinc-500 text-xs mb-1">Risk Score</p>
                    <p className="text-zinc-200 font-mono">{riskScore}/100</p>
                </div>
                <div>
                    <p className="text-zinc-500 text-xs mb-1">File Size</p>
                    <p className="text-zinc-200 font-mono">{formatFileSize(fileSize)}</p>
                </div>
                <div>
                    <p className="text-zinc-500 text-xs mb-1">Generated</p>
                    <p className="text-zinc-200 text-sm">
                        {new Date(generatedAt).toLocaleDateString()}
                    </p>
                </div>
                <div>
                    <p className="text-zinc-500 text-xs mb-1">Signature</p>
                    <div className="flex items-center gap-1">
                        <Shield className={`w-4 h-4 ${hasSiganture ? 'text-emerald-400' : 'text-zinc-600'}`} />
                        <span className={`text-sm ${hasSiganture ? 'text-emerald-400' : 'text-zinc-600'}`}>
                            {hasSiganture ? 'Verified' : 'None'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Regenerate Report"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {onDelete && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-1 px-3 py-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                )}
            </div>
        </div>
    );
}
