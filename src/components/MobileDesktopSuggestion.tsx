'use client';

import { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';

export default function MobileDesktopSuggestion() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Basic check for mobile width
        if (window.innerWidth < 768) {
            // Check if already dismissed in this session
            const dismissed = sessionStorage.getItem('mobile_suggestion_dismissed');
            if (!dismissed) {
                setIsVisible(true);
            }
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('mobile_suggestion_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t-2 border-black p-6 shadow-2xl md:hidden animate-in slide-in-from-bottom duration-500">
            <div className="flex items-start gap-4">
                <div className="bg-neutral-100 p-2 border border-black">
                    <Monitor className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-2">
                    <h3 className="font-serif font-bold text-lg leading-none">Desktop Recommended</h3>
                    <p className="font-mono text-xs text-neutral-600 leading-relaxed">
                        LexOculus is optimized for high-density analysis on larger screens.
                        For the best experience, please switch to a desktop or laptop terminal.
                    </p>
                    <button
                        onClick={handleDismiss}
                        className="mt-2 text-[10px] font-mono uppercase tracking-widest border-b border-black hover:text-[#FF4F00] hover:border-[#FF4F00] transition-colors"
                    >
                        [Dismiss_Warning]
                    </button>
                </div>
            </div>
        </div>
    );
}
