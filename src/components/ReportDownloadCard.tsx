'use client';

import { useState } from 'react';
import { Download, FileText, Shield, Trash2, RefreshCw } from 'lucide-react';

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
    UNACCEPTABLE: { bg: 'bg-[#FFF5F0]', text: 'text-[#FF4F00]', border: 'border-[#FF4F00]' },
    HIGH_RISK: { bg: 'bg-[#FFF5F0]', text: 'text-[#FF4F00]', border: 'border-[#FF4F00]' },
    LIMITED_RISK: { bg: 'bg-white', text: 'text-black', border: 'border-black' },
    MINIMAL_RISK: { bg: 'bg-white', text: 'text-[#999]', border: 'border-[#E5E5E5]' },
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
        if (!confirm('PERMANENTLY DELETE REPORT RECORD?')) return;

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
        <div className={`border-2 ${colors.border} ${colors.bg} p-6`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-4 border-b border-black pb-4 mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-serif text-xl font-bold text-black">{repoOwner}/{repoName}</h3>
                        <p className="font-mono text-xs text-[#555] uppercase tracking-wider">{fileName}</p>
                    </div>
                </div>
                <div className={`px-4 py-1 font-mono text-xs font-bold uppercase tracking-widest border ${colors.border} ${colors.text}`}>
                    {riskClassification.replace('_', ' ')}
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div>
                    <p className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Risk Score</p>
                    <p className="font-mono text-lg font-bold text-black">{riskScore}/100</p>
                </div>
                <div>
                    <p className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">File Size</p>
                    <p className="font-mono text-lg text-black">{formatFileSize(fileSize)}</p>
                </div>
                <div>
                    <p className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Generated</p>
                    <p className="font-mono text-sm text-black pt-1">
                        {new Date(generatedAt).toLocaleDateString()}
                    </p>
                </div>
                <div>
                    <p className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Signature</p>
                    <div className="flex items-center gap-1 pt-1">
                        <Shield className={`w-4 h-4 ${hasSiganture ? 'text-[#047857]' : 'text-[#999]'}`} />
                        <span className={`font-mono text-xs uppercase ${hasSiganture ? 'text-[#047857]' : 'text-[#999]'}`}>
                            {hasSiganture ? 'Verified' : 'Unsigned'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-[#FF4F00] text-white transition-colors font-mono text-xs uppercase tracking-widest"
                    >
                        <Download className="w-4 h-4" />
                        Download_PDF
                    </button>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="p-3 border border-black text-black hover:bg-[#F5F5F5] transition-colors"
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
                        className="flex items-center gap-2 px-4 py-2 text-[#999] hover:text-[#FF4F00] transition-colors disabled:opacity-50 font-mono text-xs uppercase tracking-widest"
                    >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? 'Deleting...' : 'Delete_Record'}
                    </button>
                )}
            </div>
        </div>
    );
}
