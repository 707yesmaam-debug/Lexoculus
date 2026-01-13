'use client';

import { useEffect, useState } from 'react';

interface ScanLine {
    text: string;
    status: 'ok' | 'match' | 'alert' | 'pending';
    delay: number;
}

const scanSequence: ScanLine[] = [
    { text: 'INIT: LexOculus v2.4.1', status: 'ok', delay: 200 },
    { text: 'CLONE: github.com/acme/ml-model', status: 'ok', delay: 400 },
    { text: 'SCAN: /src/model/classifier.py', status: 'ok', delay: 300 },
    { text: 'SCAN: /src/inference/predict.py', status: 'ok', delay: 250 },
    { text: 'DETECT: PyTorch, Transformers, ONNX', status: 'ok', delay: 350 },
    { text: 'ANALYZE: Model architecture...', status: 'pending', delay: 600 },
    { text: 'MATCH: Annex III, Article 6.1(a)', status: 'match', delay: 400 },
    { text: 'MATCH: Annex III, Article 6.2', status: 'match', delay: 300 },
    { text: 'RISK_TIER: HIGH_RISK', status: 'alert', delay: 500 },
    { text: 'SCORE: 72/100', status: 'alert', delay: 200 },
    { text: 'GENERATING: Compliance_Report.pdf', status: 'pending', delay: 700 },
    { text: 'ARTIFACT: SIGNED_AND_STORED', status: 'ok', delay: 400 },
    { text: 'CLEANUP: Source code wiped', status: 'ok', delay: 300 },
    { text: 'STATUS: Assessment complete', status: 'ok', delay: 200 },
];

export default function TerminalScanner() {
    const [lines, setLines] = useState<ScanLine[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (currentIndex >= scanSequence.length) {
            setIsComplete(true);
            // Restart after a pause
            const restartTimer = setTimeout(() => {
                setLines([]);
                setCurrentIndex(0);
                setIsComplete(false);
            }, 3000);
            return () => clearTimeout(restartTimer);
        }

        const timer = setTimeout(() => {
            setLines(prev => [...prev, scanSequence[currentIndex]]);
            setCurrentIndex(prev => prev + 1);
        }, scanSequence[currentIndex]?.delay || 300);

        return () => clearTimeout(timer);
    }, [currentIndex]);

    const getStatusColor = (status: ScanLine['status']) => {
        switch (status) {
            case 'ok': return 'text-[#888]';
            case 'match': return 'text-[#D4AF37]';
            case 'alert': return 'text-[#FF3B30]';
            case 'pending': return 'text-[#888] animate-pulse';
        }
    };

    const getStatusLabel = (status: ScanLine['status']) => {
        switch (status) {
            case 'ok': return '[OK]';
            case 'match': return '[MATCH]';
            case 'alert': return '[!]';
            case 'pending': return '[...]';
        }
    };

    return (
        <div className="bg-[#121212] text-[#F7F5F0] p-6 h-full min-h-[400px] overflow-hidden">
            {/* Terminal Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#333]">
                <span className="text-xs uppercase tracking-widest text-[#888]">
                    LEXOCULUS_SCANNER
                </span>
                <span className={`text-xs uppercase tracking-widest ${isComplete ? 'text-[#D4AF37]' : 'text-[#FF3B30] animate-pulse'}`}>
                    {isComplete ? '[ COMPLETE ]' : '[ SCANNING ]'}
                </span>
            </div>

            {/* Terminal Output */}
            <div className="space-y-1 text-sm font-mono">
                {lines.map((line, index) => (
                    <div key={index} className="flex justify-between items-center">
                        <span className="text-[#888]">
                            <span className="text-[#555] mr-2">$</span>
                            {line.text}
                        </span>
                        <span className={getStatusColor(line.status)}>
                            {getStatusLabel(line.status)}
                        </span>
                    </div>
                ))}

                {/* Cursor */}
                {!isComplete && (
                    <div className="flex items-center">
                        <span className="text-[#555] mr-2">$</span>
                        <span className="w-2 h-4 bg-[#D4AF37] animate-pulse"></span>
                    </div>
                )}
            </div>

            {/* Summary Bar */}
            {isComplete && (
                <div className="mt-6 pt-4 border-t border-[#333]">
                    <div className="grid grid-cols-3 gap-4 text-center text-xs uppercase tracking-widest">
                        <div>
                            <div className="text-[#888]">Files</div>
                            <div className="text-[#F7F5F0] text-lg">847</div>
                        </div>
                        <div>
                            <div className="text-[#888]">Risk</div>
                            <div className="text-[#FF3B30] text-lg">HIGH</div>
                        </div>
                        <div>
                            <div className="text-[#888]">Score</div>
                            <div className="text-[#D4AF37] text-lg">72</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
