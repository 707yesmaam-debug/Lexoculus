import Link from 'next/link';
import { ArrowLeft, WifiOff } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
            <div className="max-w-md w-full border border-black bg-white p-12 text-center shadow-lg relative">
                {/* Decorative corner markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#FF4F00]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#FF4F00]" />

                <div className="flex justify-center mb-8">
                    <div className="border border-black p-4 rounded-full bg-[#F5F5F5]">
                        <WifiOff className="w-8 h-8 text-[#FF4F00]" />
                    </div>
                </div>

                <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest">[ERR::404::SIGNAL_LOST]</div>
                <h1 className="font-serif text-4xl font-bold mb-4">Page not found.</h1>
                <p className="font-mono text-sm text-[#555] mb-8 leading-relaxed">
                    The requested resource could not be located in the current sector.
                    Please verify the URL or return to safety.
                </p>

                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 font-mono text-xs hover:bg-[#FF4F00] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    RETURN_TO_BASE
                </Link>
            </div>
        </div>
    );
}
