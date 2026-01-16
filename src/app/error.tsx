'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#111] text-white flex items-center justify-center p-6 font-mono">
            <div className="max-w-lg w-full border border-white/20 bg-black p-12 text-center relative overflow-hidden">
                {/* Glitch effect background hint */}
                <div className="absolute inset-0 bg-[#FF4F00]/5 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex justify-center mb-8">
                        <AlertTriangle className="w-12 h-12 text-[#FF4F00]" />
                    </div>

                    <div className="text-xs text-[#FF4F00] mb-2 tracking-widest">[ERR::500::SYSTEM_FAILURE]</div>
                    <h1 className="font-serif text-4xl font-bold mb-4">Critical Error.</h1>
                    <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                        An unexpected anomaly has occurred. System integrity logic has intercepted the fault.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => reset()}
                            className="inline-flex items-center justify-center gap-2 border border-white px-6 py-3 text-xs hover:bg-white hover:text-black transition-colors"
                        >
                            <RefreshCcw className="w-3 h-3" />
                            RETRY_SEQUENCE
                        </button>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center gap-2 bg-[#FF4F00] text-white px-6 py-3 text-xs hover:bg-white hover:text-black transition-colors border border-transparent"
                        >
                            ABORT_TO_DASHBOARD
                        </Link>
                    </div>

                    {error.digest && (
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <p className="text-[10px] text-gray-600">ERROR_DIGEST: {error.digest}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
