'use client';

import { useState } from 'react';
import GuardianActivity from '@/components/dashboard/GuardianActivity';

export default function ComplianceGuardianPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-12 border-b-2 border-black pb-6">
                <h1 className="text-4xl font-black mb-4 tracking-tighter">COMPLIANCE_GUARDIAN</h1>
                <p className="font-mono text-sm text-gray-600 max-w-2xl">
                    Automated PR checks against EU AI Act regulations.
                    The Guardian scans every pull request for prohibited practices and high-risk indicators
                    using the dynamic Rulebook.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-12">
                {/* SECTION 1: GUARDIAN ACTIVITY LOG */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h2 className="font-mono text-lg font-bold uppercase tracking-widest">LIVE_ACTIVITY_FEED</h2>
                    </div>
                    <GuardianActivity />
                </section>

                {/* SECTION 2: CONFIGURATION (Placeholder for now) */}
                <section className="opacity-50 pointer-events-none grayscale">
                    <div className="flex items-center gap-4 mb-6">
                        <h2 className="font-mono text-lg font-bold uppercase tracking-widest">CONFIGURATION [COMING_SOON]</h2>
                    </div>
                    <div className="border border-black p-6 bg-gray-50">
                        <p className="font-mono text-xs mb-4">
                            Configure risk thresholds, notification channels (Slack/Email), and blocking behavior.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                <span className="font-mono text-sm">BLOCK_ON_UNACCEPTABLE_RISK</span>
                                <span className="font-bold text-green-600 text-xs">[ENABLED]</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                <span className="font-mono text-sm">BLOCK_ON_HIGH_RISK</span>
                                <span className="font-bold text-gray-400 text-xs">[DISABLED]</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
