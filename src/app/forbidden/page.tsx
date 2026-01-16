import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';

export default function Forbidden() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
            <div className="max-w-md w-full border border-black bg-white p-12 text-center shadow-lg relative">
                <div className="flex justify-center mb-8">
                    <div className="border border-black p-4 rounded-full bg-black">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                </div>

                <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest">[ERR::403::ACCESS_DENIED]</div>
                <h1 className="font-serif text-3xl font-bold mb-4">Restricted Area.</h1>
                <p className="font-mono text-sm text-[#555] mb-8 leading-relaxed">
                    This sector requires higher clearance levels.
                    Upgrade your credentials to proceed.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/pricing"
                        className="block w-full bg-[#FF4F00] text-white px-8 py-3 font-mono text-xs hover:bg-black transition-colors flex items-center justify-center gap-2"
                    >
                        UPGRADE_CLEARANCE <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                        href="/dashboard"
                        className="block w-full border border-black text-black px-8 py-3 font-mono text-xs hover:bg-gray-50 transition-colors"
                    >
                        RETURN_TO_DASHBOARD
                    </Link>
                </div>
            </div>
        </div>
    );
}
