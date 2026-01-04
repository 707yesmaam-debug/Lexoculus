'use client';

import { CheckCircle2, AlertCircle, Loader2, FileCode2, Scale, Brain } from 'lucide-react';
import Link from 'next/link';

interface ScanStatusProps {
    status: 'idle' | 'scanning' | 'complete' | 'error';
    error?: string;
    data?: {
        name: string;
        language: string | null;
        total_files: number;
        license: string | null;
        stars: number;
        repo_scan_id?: string; // Added for Feature 2
    };
}

export default function ScanStatus({ status, error, data }: ScanStatusProps) {
    if (status === 'idle') return null;

    if (status === 'scanning') {
        return (
            <div className="w-full mt-6 bg-zinc-900 border border-zinc-800 p-6 flex flex-col items-center justify-center text-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin relative z-10" />
                </div>
                <h3 className="mt-4 text-zinc-100 font-medium font-mono text-sm tracking-wider uppercase">Ingesting Repository</h3>
                <p className="mt-1 text-zinc-500 text-sm">Cloning file tree, extracting metadata, and verifying structure...</p>

                <div className="w-full max-w-xs h-1 bg-zinc-800 mt-6 overflow-hidden rounded-full">
                    <div className="h-full bg-blue-600 w-1/3 animate-pulse rounded-full" />
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="w-full mt-6 bg-red-950/10 border border-red-900/20 p-4 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-red-400 font-medium text-sm">Scan Failed</h3>
                    <p className="text-red-500/80 text-sm mt-1">{error || 'An unknown error occurred during the repository scan.'}</p>
                </div>
            </div>
        );
    }

    if (status === 'complete' && data) {
        return (
            <div className="w-full mt-6 fade-in animate-in slide-in-from-bottom-2 duration-500">
                <div className="bg-zinc-900 border border-zinc-800 p-0 overflow-hidden">
                    {/* Header - Success Banner */}
                    <div className="bg-emerald-950/10 border-b border-emerald-900/20 p-4 flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-1.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-emerald-500 font-medium text-sm tracking-wide">INGESTION COMPLETE</h3>
                        </div>
                    </div>

                    {/* Content - Data Grid */}
                    <div className="p-6">
                        <div className="flex items-baseline justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">{data.name}</h2>
                            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                                ID: {data.repo_scan_id?.slice(-8) || 'N/A'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-950 border border-zinc-800/50">
                                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                    <FileCode2 className="w-4 h-4" />
                                    <span className="text-xs uppercase tracking-wider font-semibold">Files</span>
                                </div>
                                <span className="text-2xl font-mono text-zinc-200">{data.total_files}</span>
                            </div>

                            <div className="p-4 bg-zinc-950 border border-zinc-800/50">
                                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs uppercase tracking-wider font-semibold">Primary Lang</span>
                                </div>
                                <span className="text-lg font-mono text-zinc-200 truncate">{data.language || 'Unknown'}</span>
                            </div>

                            <div className="p-4 bg-zinc-950 border border-zinc-800/50">
                                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                    <Scale className="w-4 h-4" />
                                    <span className="text-xs uppercase tracking-wider font-semibold">License</span>
                                </div>
                                <span className="text-sm font-mono text-zinc-300 truncate">{data.license || 'None detected'}</span>
                            </div>

                            <div className="p-4 bg-zinc-950 border border-zinc-800/50 flex items-center justify-center">
                                <span className="text-xs text-zinc-600 text-center leading-relaxed">
                                    Metadata extracted & stored. Ready for compliance analysis.
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end">
                            {data.repo_scan_id ? (
                                <Link
                                    href={`/dashboard/analyzer/${data.repo_scan_id}`}
                                    className="group flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                                >
                                    <Brain className="w-4 h-4" />
                                    <span>Analyze Capabilities</span>
                                    <span className="text-blue-200 group-hover:translate-x-0.5 transition-transform">→</span>
                                </Link>
                            ) : (
                                <button disabled className="group flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium opacity-50 cursor-not-allowed">
                                    <Brain className="w-4 h-4" />
                                    <span>Analyze Capabilities</span>
                                    <span className="text-blue-200">→</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

