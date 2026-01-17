'use client';

import { useEffect, useState } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

export default function OpticalTypeScanner() {
    const [scannedTextHorizontal, setScannedTextHorizontal] = useState("COMPLIANCE");
    const [scannedTextVertical, setScannedTextVertical] = useState("VERIFIED");
    const [scanPosition, setScanPosition] = useState(0);
    const [isScanning, setIsScanning] = useState(true);

    // Simulated "OCR" effect where text randomizes before settling
    useEffect(() => {
        if (!isScanning) return;

        const interval = setInterval(() => {
            setScanPosition(prev => (prev + 1) % 100);

            // Randomize text occasionally to simulate processing
            if (Math.random() > 0.8) {
                const randomChar = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                setScannedTextHorizontal(prev =>
                    prev.split('').map((char, i) => Math.random() > 0.9 ? randomChar : char).join('')
                );
            } else {
                setScannedTextHorizontal("COMPLIANCE"); // Reset to target
            }
        }, 50);

        return () => clearInterval(interval);
    }, [isScanning]);

    return (
        <div className="w-full h-full relative overflow-hidden bg-white flex flex-col items-center justify-center select-none cursor-crosshair border-b-2 border-black">
            {/* Background Grid / Reticle */}
            <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-20 pointer-events-none">
                {Array.from({ length: 400 }).map((_, i) => (
                    <div key={i} className="border-[0.5px] border-[#E5E5E5]" />
                ))}
            </div>

            {/* Corner Markers */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-black" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-black" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-black" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-black" />

            {/* Central Typography */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                    <h1 className="text-5xl md:text-9xl font-black tracking-tighter text-black mix-blend-multiply" style={{ fontFamily: 'var(--font-serif)' }}>
                        LEX<span className="text-[#FF4F00]">|</span>OCULUS
                    </h1>

                    {/* Laser Scan Line */}
                    <div
                        className="absolute top-0 bottom-0 w-[2px] bg-[#FF4F00] opacity-80 z-20"
                        style={{ left: `${scanPosition}%`, transition: 'left 0.05s linear' }}
                    >
                        <div className="absolute bottom-[-20px] left-[-4px] text-[10px] font-mono whitespace-nowrap bg-black text-[#FF4F00] px-1">
                            X: {scanPosition.toString().padStart(3, '0')}
                        </div>
                    </div>
                </div>

                <div className="flex gap-12 mt-8 text-sm font-mono tracking-widest text-[#555]">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-[#999] mb-1">TARGET_ID</span>
                        <span>{scannedTextHorizontal}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-[#999] mb-1">STATUS</span>
                        <span className="text-[#FF4F00] animate-pulse">SCANNING...</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-[#999] mb-1">CONFIDENCE</span>
                        <span>99.9%</span>
                    </div>
                </div>
            </div>

            {/* Floating Metadata Blocks */}
            <div className="absolute top-12 left-12 font-mono text-[10px] text-[#999] hidden md:block">
                <div>LAW: EU_AI_ACT</div>
                <div>AREA: ANNEX_III</div>
                <div>RISK: HIGH_IMPACT</div>
            </div>

            <div className="absolute bottom-12 right-12 font-mono text-[10px] text-[#999] text-right hidden md:block">
                <div>MODE: STRICT_COMPLIANCE</div>
                <div>TYPE: PROHIBITED_PRACTICES</div>
                <div>STATUS: ENFORCING</div>
            </div>

        </div>
    );
}
