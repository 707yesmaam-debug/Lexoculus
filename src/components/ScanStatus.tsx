'use client';

import { CheckCircle2, AlertCircle, Loader2, FileCode2, Scale, Brain } from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

interface ScanStatusProps {
    status: 'idle' | 'scanning' | 'complete' | 'error';
    error?: string;
    data?: {
        name: string;
        language: string | null;
        total_files: number;
        license: string | null;
        stars: number;
        repo_scan_id?: string;
    };
}

export default function ScanStatus({ status, error, data }: ScanStatusProps) {
    if (status === 'idle') return null;

    if (status === 'scanning') {
        return (
            <div className="w-full mt-8 border border-black p-8 bg-white">
                <div className="flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-8 h-8 text-[#FF4F00] animate-spin mb-6" />
                    <h3 className="font-mono text-sm uppercase tracking-widest text-[#FF4F00] mb-2">System_Ingestion_Active</h3>
                    <p className="font-mono text-xs text-[#555]">Cloning file tree... Verifying signatures... Extracting metadata...</p>

                    <div className="w-full max-w-md h-2 bg-[#E5E5E5] mt-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bottom-0 bg-[#FF4F00] w-1/3 animate-[shimmer_2s_infinite_linear]" />
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="w-full mt-8 border border-[#FF4F00] bg-[#FF4F00]/5 p-6 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-[#FF4F00] flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-mono font-bold text-[#FF4F00] uppercase text-sm mb-1">Fatal_Error</h3>
                    <p className="font-mono text-xs text-[#FF4F00]">{error || 'INGESTION_FAILED: UNKNOWN_EXCEPTION'}</p>
                </div>
            </div>
        );
    }

    if (status === 'complete' && data) {
        return (
            <div className="w-full mt-8 border-t border-black animate-in fade-in duration-500 pt-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-[#FF4F00]"></span>
                            <span className="font-mono text-xs text-[#FF4F00] uppercase tracking-widest">Ingestion Complete</span>
                        </div>
                        <h2 className="font-serif text-4xl font-bold">{data.name}</h2>
                    </div>
                    <div className="font-mono text-xs text-[#555] border border-black px-2 py-1">
                        ID: {data.repo_scan_id?.slice(-8) || 'NULL'}
                    </div>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-black">
                    <div className="p-6 border-r border-[#E5E5E5] last:border-0 border-b md:border-b-0">
                        <div className="font-mono text-[10px] text-[#999] uppercase tracking-wider mb-2">Total_Files</div>
                        <div className="font-mono text-xl">{data.total_files}</div>
                    </div>
                    <div className="p-6 border-r md:border-r border-[#E5E5E5] border-b md:border-b-0 border-r-0">
                        <div className="font-mono text-[10px] text-[#999] uppercase tracking-wider mb-2">Language</div>
                        <div className="font-mono text-xl">{data.language || 'UNKNOWN'}</div>
                    </div>
                    <div className="p-6 border-r border-[#E5E5E5]">
                        <div className="font-mono text-[10px] text-[#999] uppercase tracking-wider mb-2">License</div>
                        <div className="font-mono text-xl">{data.license || 'NONE'}</div>
                    </div>
                    <div className="p-6">
                        <div className="font-mono text-[10px] text-[#999] uppercase tracking-wider mb-2">Stars</div>
                        <div className="font-mono text-xl">{data.stars}</div>
                    </div>
                </div>

                {/* Action Area */}
                <div className="mt-8 flex justify-end">
                    {data.repo_scan_id ? (
                        <Link
                            href={`/dashboard/analyzer/${data.repo_scan_id}`}
                            className="bg-black text-white hover:bg-[#FF4F00] px-8 py-4 font-mono font-bold uppercase tracking-widest text-sm transition-colors flex items-center gap-2"
                        >
                            <Brain className="w-4 h-4" />
                            Proceed to Analysis -&gt;
                        </Link>
                    ) : (
                        <Button disabled className="bg-[#E5E5E5] text-[#999] px-8 py-4 font-mono font-bold uppercase tracking-widest text-sm rounded-none">
                            Analysis Unavailable
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
