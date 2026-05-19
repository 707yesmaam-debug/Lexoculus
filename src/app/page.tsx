'use client';

import OpticalLogo from '@/components/OpticalLogo';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// ─── SCAN LINE ANIMATION ─────────────────────────────────────────────────────
function ScanLine() {
    return (
        <div
            className="absolute top-0 bottom-0 w-[2px] bg-[#FF4F00] opacity-60 pointer-events-none z-10"
            style={{
                animation: 'scanSweep 3s linear infinite',
            }}
        />
    );
}

// ─── TYPING STATUS ────────────────────────────────────────────────────────────
function StatusBlinker({ label }: { label: string }) {
    const [on, setOn] = useState(true);
    useEffect(() => {
        const id = setInterval(() => setOn(v => !v), 700);
        return () => clearInterval(id);
    }, []);
    return (
        <span className="text-[#FF4F00]">
            {label}{on ? '█' : ' '}
        </span>
    );
}

// ─── HERO CTA ────────────────────────────────────────────────────────────────
function HeroCTA() {
    return (
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Link
                    href="/request-demo"
                    className="bg-[#FF4F00] text-white font-mono text-sm uppercase tracking-widest px-8 py-4 hover:bg-black transition-colors border-2 border-black text-center"
                >
                    Request_Demo →
                </Link>
            </div>

            <div className="flex items-center gap-4 mt-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#999]">
                    Enterprise-grade compliance
                </span>
                <span className="text-[#CCC]">·</span>
                <Link
                    href="/pricing"
                    className="font-mono text-[10px] uppercase tracking-widest text-[#999] hover:text-[#FF4F00] transition-colors"
                >
                    View_Plans →
                </Link>
            </div>
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function LandingPage() {
    return (
        <main className="min-h-screen bg-white text-black">

            {/* ═══════════════════════════════════════════════════════════════
                NAVBAR
            ═══════════════════════════════════════════════════════════════ */}
            <nav className="sticky top-0 z-50 bg-white border-b-2 border-black">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 py-4">
                    <OpticalLogo />

                    <div className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-widest">
                        <a href="#pipeline" className="hover:text-[#FF4F00]">How_It_Works</a>
                        <a href="#features" className="hover:text-[#FF4F00]">Features</a>
                        <a href="#compliance" className="hover:text-[#FF4F00]">EU_AI_Act</a>
                        <Link href="/pricing" className="hover:text-[#FF4F00]">Pricing</Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/auth/login"
                            className="hidden md:block font-mono text-xs uppercase tracking-widest hover:text-[#FF4F00]"
                        >
                            Login
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="bg-[#FF4F00] text-white font-mono text-xs uppercase tracking-widest px-5 py-3 hover:bg-black transition-colors border border-transparent"
                        >
                            Start_Audit
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════════════════════════
                HERO
            ═══════════════════════════════════════════════════════════════ */}
            <section className="border-b-2 border-black">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 min-h-[85vh]">

                    {/* Left — Copy */}
                    <div
                        className="flex flex-col justify-center border-b-2 md:border-b-0 md:border-r-2 border-black py-8 md:py-16 pr-8 md:pr-16"
                        style={{
                            paddingLeft: 'max(2rem, calc((100vw - 1400px) / 2 + 2rem))'
                        }}
                    >
                        <div className="flex flex-wrap items-center gap-2 mb-6">
                            <span className="bg-[#FF4F00] text-white font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 font-bold">
                                NOW OPEN SOURCE
                            </span>
                            <span className="text-gray-300">·</span>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-[#999]">
                                EU AI Act Compliance Engine
                            </span>
                        </div>

                        <h1 className="font-serif text-4xl md:text-6xl font-bold leading-[1.05] mb-6">
                            Your Code.<br />
                            <span className="text-[#FF4F00]">Legally</span> Compliant.
                        </h1>

                        <p className="font-mono text-sm text-[#555] leading-relaxed max-w-[400px] mb-10">
                            Lexoculus is now fully open-source. Connect your GitHub repository to scan your dependencies,
                            classify your AI system under the EU AI Act, and generate
                            a signed compliance report. In minutes, not months.
                        </p>

                        <HeroCTA />

                        <div className="flex gap-8 font-mono text-[10px] uppercase tracking-widest text-[#999]">
                            <span>Private_&_Public_Repos</span>
                            <span>SHA-256_Signed</span>
                            <span>Annex_III_Mapped</span>
                        </div>
                    </div>

                    {/* Right — Product Mockup */}
                    <div className="bg-[#FAFAFA] relative overflow-hidden">
                        <ScanLine />

                        {/* Inner content with padding */}
                        <div className="p-6 md:p-12 flex items-center justify-center">

                            {/* Simulated Risk Classification Output */}
                            <div className="w-full max-w-[420px] relative z-20">
                                {/* Terminal Header */}
                                <div className="bg-black text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2 flex justify-between">
                                    <span>LexOculus // Risk_Assessment</span>
                                    <StatusBlinker label="LIVE" />
                                </div>

                                {/* Assessment Body */}
                                <div className="border-2 border-black border-t-0 bg-white">
                                    {/* Repo Info */}
                                    <div className="p-4 border-b border-black">
                                        <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Repository</div>
                                        <div className="font-mono text-sm">acme-corp/recommendation-engine</div>
                                    </div>

                                    {/* Classification */}
                                    <div className="p-4 border-b border-black flex items-center justify-between">
                                        <div>
                                            <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Risk_Classification</div>
                                            <div className="font-serif text-2xl font-bold">HIGH_RISK</div>
                                        </div>
                                        <div className="w-16 h-16 border-2 border-[#FF4F00] flex items-center justify-center">
                                            <span className="font-mono text-2xl font-bold text-[#FF4F00]">78</span>
                                        </div>
                                    </div>

                                    {/* Matched Articles */}
                                    <div className="p-4 border-b border-black">
                                        <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-3">Matched_Annex_III_Articles</div>
                                        <div className="flex flex-wrap gap-2">
                                            {['ART_6 Biometrics', 'ART_22 Essential Services', 'ART_40 Recommender'].map(a => (
                                                <span key={a} className="font-mono text-[10px] border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors cursor-default">
                                                    {a}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* GPAI Detection */}
                                    <div className="p-4">
                                        <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-3">GPAI_Provider_Detected</div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <span className="font-mono text-[10px] bg-[#FF4F00] text-white px-2 py-1">OpenAI</span>
                                                <span className="font-mono text-[10px] border border-[#999] text-[#555] px-2 py-1">Deployer</span>
                                            </div>
                                            <span className="font-mono text-[10px] text-[#999]">SYSTEMIC_RISK: NO</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                STAT BAR
            ═══════════════════════════════════════════════════════════════ */}
            <section className="border-b-2 border-black bg-black text-white">
                <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4">
                    {/* Stat 1 */}
                    <div className="p-6 text-center border-r border-b md:border-b-0 border-[#333]">
                        <div className="font-serif text-3xl md:text-4xl font-bold text-[#FF4F00] mb-1">200+</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#999]">AI Libraries</div>
                    </div>
                    {/* Stat 2 */}
                    <div className="p-6 text-center border-b md:border-b-0 md:border-r border-[#333]">
                        <div className="font-serif text-3xl md:text-4xl font-bold text-[#FF4F00] mb-1">14</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#999]">Annex III Articles</div>
                    </div>
                    {/* Stat 3 */}
                    <div className="p-6 text-center border-r border-[#333]">
                        <div className="font-serif text-3xl md:text-4xl font-bold text-[#FF4F00] mb-1">10</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#999]">GPAI Providers</div>
                    </div>
                    {/* Stat 4 */}
                    <div className="p-6 text-center">
                        <div className="font-serif text-3xl md:text-4xl font-bold text-[#FF4F00] mb-1">4</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#999]">Risk Levels</div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                PIPELINE — HOW IT WORKS
            ═══════════════════════════════════════════════════════════════ */}
            <section id="pipeline" className="border-b-2 border-black">
                <div className="max-w-[1400px] mx-auto">
                    {/* Section Header */}
                    <div className="p-8 md:p-16 pb-0 md:pb-0">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-4">
                            System_Architecture
                        </div>
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
                            Five stages. Zero ambiguity.
                        </h2>
                        <p className="font-mono text-sm text-[#555] max-w-[500px]">
                            From repository scan to signed compliance report.
                            Each stage is deterministic, auditable, and documented.
                        </p>
                    </div>

                    {/* Pipeline Steps */}
                    <div className="mt-12">
                        {[
                            {
                                num: '01',
                                label: 'INSPECT',
                                title: 'Deep Dependency Scan',
                                desc: 'Connect your GitHub repo. We parse every dependency file — package.json, requirements.txt, pyproject.toml — and map them against our database of 200+ AI libraries.',
                                detail: ['Python, JS, Go, Rust', 'File tree analysis', 'No code leaves your environment'],
                                visual: [
                                    { file: 'requirements.txt', status: 'PARSED' },
                                    { file: 'src/model/transformer.py', status: 'DETECTED' },
                                    { file: 'config/hyperparams.yaml', status: 'READ' },
                                    { file: 'data/processors/pii_scrub.ts', status: 'FLAGGED' },
                                    { file: '... 842 files scanned', status: 'COMPLETE' },
                                ],
                            },
                            {
                                num: '02',
                                label: 'ANALYZE',
                                title: 'AI Capability Detection',
                                desc: 'LLM-powered analysis identifies what your system does — computer vision, NLP, biometric processing, emotion recognition — and which AI frameworks are in use.',
                                detail: ['Groq LLM analysis', 'Capability mapping', 'Confidence scoring'],
                                visual: [
                                    { file: 'Computer Vision', status: 'DETECTED' },
                                    { file: 'NLP / Text Processing', status: 'DETECTED' },
                                    { file: 'Biometric Processing', status: 'FLAGGED' },
                                    { file: 'Generative AI', status: 'DETECTED' },
                                    { file: 'Confidence: 94.2%', status: 'HIGH' },
                                ],
                            },
                            {
                                num: '03',
                                label: 'CLASSIFY',
                                title: 'Risk Classification',
                                desc: 'Capabilities are mapped to EU AI Act Annex III articles. The system determines if your AI is Unacceptable, High-Risk, Limited-Risk, or Minimal-Risk.',
                                detail: ['Annex III article matching', 'GPAI provider detection', 'Constraint validation'],
                                visual: [
                                    { file: 'ART_6 Biometrics', status: 'MATCH' },
                                    { file: 'ART_22 Essential Services', status: 'MATCH' },
                                    { file: 'ART_39 Generative AI', status: 'MATCH' },
                                    { file: 'Classification', status: 'HIGH_RISK' },
                                    { file: 'Risk Score', status: '78/100' },
                                ],
                            },
                            {
                                num: '04',
                                label: 'VERIFY',
                                title: 'Context Verification',
                                desc: 'A dynamic questionnaire refines the preliminary assessment. Your answers about deployment context, human oversight, and safeguards adjust the final classification.',
                                detail: ['Dynamic question generation', 'Risk score refinement ±15pt', 'Evidence collection'],
                                visual: [
                                    { file: 'Deployment region?', status: 'EU/EEA' },
                                    { file: 'Human oversight?', status: 'YES' },
                                    { file: 'Biometric opt-out?', status: 'AVAILABLE' },
                                    { file: 'Testing procedure?', status: 'PROVIDED' },
                                    { file: 'Final Classification', status: 'VERIFIED' },
                                ],
                            },
                            {
                                num: '05',
                                label: 'REPORT',
                                title: 'Signed Compliance Report',
                                desc: 'A SHA-256 signed PDF report is generated with your classification, matched articles, evidence summary, and compliance roadmap. Tamper-evident and audit-ready.',
                                detail: ['20+ page PDF', 'Digital signature', 'Supabase storage'],
                                visual: [
                                    { file: 'Executive Summary', status: 'GENERATED' },
                                    { file: 'Risk Assessment', status: 'GENERATED' },
                                    { file: 'Compliance Roadmap', status: 'GENERATED' },
                                    { file: 'SHA-256 Hash', status: 'SIGNED' },
                                    { file: 'Report Status', status: 'COMPLETE' },
                                ],
                            },
                        ].map((step, i) => (
                            <div
                                key={step.num}
                                className={`grid grid-cols-1 md:grid-cols-2 border-t-2 border-black ${i % 2 === 1 ? 'md:[direction:rtl]' : ''}`}
                            >
                                {/* Copy Side */}
                                <div className={`p-8 md:p-12 flex flex-col justify-center ${i % 2 === 0 ? 'md:border-r-2 border-black' : ''} md:[direction:ltr]`}>
                                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-4">
                                        Phase_{step.num} // {step.label}
                                    </div>
                                    <h3 className="font-serif text-3xl md:text-4xl font-bold mb-4">{step.title}</h3>
                                    <p className="font-mono text-sm text-[#555] leading-relaxed mb-6 max-w-[400px]">
                                        {step.desc}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {step.detail.map(d => (
                                            <span key={d} className="font-mono text-[10px] uppercase tracking-widest border border-black px-3 py-1">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Visual Side — Simulated Terminal */}
                                <div className={`p-6 md:p-8 bg-[#FAFAFA] flex items-center justify-center md:[direction:ltr] ${i % 2 === 1 ? 'md:border-r-2 border-black' : ''}`}>
                                    <div className="w-full max-w-[380px]">
                                        <div className="bg-black text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2 flex justify-between">
                                            <span>// {step.label}_OUTPUT</span>
                                            <span className="text-[#FF4F00]">STEP_{step.num}</span>
                                        </div>
                                        <div className="border-2 border-black border-t-0 bg-white">
                                            {step.visual.map((v, j) => (
                                                <div
                                                    key={j}
                                                    className={`flex justify-between items-center px-4 py-2 font-mono text-xs ${j < step.visual.length - 1 ? 'border-b border-[#E5E5E5]' : ''} ${j === step.visual.length - 1 ? 'text-[#FF4F00] font-bold' : 'text-[#555]'}`}
                                                >
                                                    <span>{v.file}</span>
                                                    <span className={j === step.visual.length - 1 ? '' : 'text-[#999]'}>[{v.status}]</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pipeline CTA */}
                    <div className="p-8 md:p-16 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-6">
                        <p className="font-mono text-sm text-[#555]">
                            Full pipeline takes under 5 minutes.
                        </p>
                        <Link
                            href="/auth/signup"
                            className="bg-[#FF4F00] text-white font-mono text-sm uppercase tracking-widest px-8 py-4 hover:bg-black transition-colors whitespace-nowrap"
                        >
                            Run_Your_First_Scan
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                NEW FEATURES
            ═══════════════════════════════════════════════════════════════ */}
            <section id="features" className="border-b-2 border-black">
                <div className="max-w-[1400px] mx-auto">
                    <div className="p-8 md:p-16 pb-0 md:pb-0">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-4">
                            New_Modules
                        </div>
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
                            Beyond classification.
                        </h2>
                        <p className="font-mono text-sm text-[#555] max-w-[500px]">
                            Full-spectrum compliance tooling. Not just a risk label —
                            a complete system for tracking, assessing, and proving conformity.
                        </p>
                    </div>

                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 mt-12 border-t-2 border-black">

                        {/* Feature 1 — GPAI */}
                        <div className="p-8 md:p-10 border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col">
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-6">
                                Module_01
                            </div>
                            <h3 className="font-serif text-2xl font-bold mb-4">
                                GPAI Classification Engine
                            </h3>
                            <p className="font-mono text-xs text-[#555] leading-relaxed mb-8 flex-1">
                                Detects General Purpose AI model usage — OpenAI, Anthropic, Google,
                                Meta, Mistral, and 5 more providers. Determines if you are a
                                provider or deployer and flags systemic risk obligations.
                            </p>

                            {/* Mini Visual */}
                            <div className="border-2 border-black">
                                <div className="bg-black text-white font-mono text-[10px] px-3 py-1.5 uppercase tracking-widest">
                                    GPAI_Scan
                                </div>
                                <div className="p-3 space-y-2 font-mono text-[10px]">
                                    <div className="flex justify-between"><span className="text-[#555]">Provider</span><span className="bg-[#FF4F00] text-white px-1.5">OpenAI</span></div>
                                    <div className="flex justify-between"><span className="text-[#555]">Role</span><span>DEPLOYER</span></div>
                                    <div className="flex justify-between"><span className="text-[#555]">Systemic</span><span>NOT_APPLICABLE</span></div>
                                    <div className="flex justify-between"><span className="text-[#555]">Obligations</span><span className="text-[#FF4F00]">6 CONSTRAINTS</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 — Conformity */}
                        <div className="p-8 md:p-10 border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col">
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-6">
                                Module_02
                            </div>
                            <h3 className="font-serif text-2xl font-bold mb-4">
                                Conformity Assessment Tracker
                            </h3>
                            <p className="font-mono text-xs text-[#555] leading-relaxed mb-8 flex-1">
                                Determines whether your system needs Module A
                                (self-assessment) or Module B+C (notified body audit).
                                Tracks your progress through each conformity pathway step.
                            </p>

                            {/* Mini Visual */}
                            <div className="border-2 border-black">
                                <div className="bg-black text-white font-mono text-[10px] px-3 py-1.5 uppercase tracking-widest">
                                    Conformity_Path
                                </div>
                                <div className="p-3 space-y-2 font-mono text-[10px]">
                                    <div className="flex justify-between"><span className="text-[#555]">Module</span><span className="font-bold">MODULE_A</span></div>
                                    <div className="flex justify-between"><span className="text-[#555]">QMS</span><span className="text-[#FF4F00]">IN_PROGRESS</span></div>
                                    <div className="flex justify-between"><span className="text-[#555]">Technical Doc</span><span>PENDING</span></div>
                                    <div className="flex justify-between"><span className="text-[#555]">Declaration</span><span>NOT_STARTED</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 — Timeline */}
                        <div className="p-8 md:p-10 flex flex-col">
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-6">
                                Module_03
                            </div>
                            <h3 className="font-serif text-2xl font-bold mb-4">
                                Compliance Timeline
                            </h3>
                            <p className="font-mono text-xs text-[#555] leading-relaxed mb-8 flex-1">
                                Article 113 defines staggered enforcement deadlines.
                                Our timeline dashboard shows exactly which deadlines apply
                                to your system and how much time you have left.
                            </p>

                            {/* Mini Visual */}
                            <div className="border-2 border-black">
                                <div className="bg-black text-white font-mono text-[10px] px-3 py-1.5 uppercase tracking-widest">
                                    Timeline_Status
                                </div>
                                <div className="p-3 space-y-2 font-mono text-[10px]">
                                    <div className="flex justify-between"><span className="text-[#555]">Banned AI</span><span className="text-[#FF4F00]">FEB 2025 ✕</span></div>
                                    <div className="flex justify-between"><span className="text-[#555]">GPAI Rules</span><span className="text-[#FF4F00]">AUG 2025 ✕</span></div>
                                    <div className="flex justify-between"><span className="text-[#555]">High-Risk</span><span>DEC 2027</span></div>
                                    <div className="flex justify-between"><span className="text-[#555]">Full Act</span><span>AUG 2028</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features CTA */}
                    <div className="p-8 md:p-16 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-6">
                        <p className="font-mono text-sm text-[#555]">
                            All modules included in Pro. Full-spectrum EU AI Act coverage.
                        </p>
                        <Link
                            href="/auth/signup"
                            className="bg-[#FF4F00] text-white font-mono text-sm uppercase tracking-widest px-8 py-4 hover:bg-black transition-colors whitespace-nowrap"
                        >
                            Start_Audit
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                COMPLIANCE GUARDIAN
            ═══════════════════════════════════════════════════════════════ */}
            <section className="border-b-2 border-black">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2">

                    {/* Left — Copy */}
                    <div className="p-8 md:p-16 flex flex-col justify-center border-b-2 md:border-b-0 md:border-r-2 border-black">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-6">
                            Guardian_Protocol // CI/CD
                        </div>
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">
                            Every pull request.<br /><span className="text-[#FF4F00]">Automatically</span> audited.
                        </h2>
                        <p className="font-mono text-sm text-[#555] leading-relaxed max-w-[400px] mb-8">
                            Install the LexOculus Guardian GitHub Action.
                            Every PR triggers a compliance scan. High-risk changes
                            are flagged before they reach main. Continuous compliance,
                            not one-time audits.
                        </p>
                        <div className="flex flex-wrap gap-3 mb-8">
                            {['GitHub Action', 'PR Blocking', 'Auto-Scan', 'Pro Feature'].map(d => (
                                <span key={d} className="font-mono text-[10px] uppercase tracking-widest border border-black px-3 py-1">
                                    {d}
                                </span>
                            ))}
                        </div>
                        <Link
                            href="/auth/signup"
                            className="self-start bg-black text-white font-mono text-sm uppercase tracking-widest px-8 py-4 hover:bg-[#FF4F00] transition-colors"
                        >
                            Enable_Guardian
                        </Link>
                    </div>

                    {/* Right — Simulated PR Check */}
                    <div className="p-6 md:p-12 bg-[#FAFAFA] flex items-center justify-center">
                        <div className="w-full max-w-[420px]">
                            {/* PR Header */}
                            <div className="bg-black text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2 flex justify-between">
                                <span>PR #247 // feature/new-model</span>
                                <StatusBlinker label="SCANNING" />
                            </div>

                            <div className="border-2 border-black border-t-0 bg-white">
                                {/* PR Info */}
                                <div className="p-4 border-b border-black">
                                    <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Commit</div>
                                    <div className="font-mono text-sm">feat: integrate GPT-4 for content generation</div>
                                </div>

                                {/* Guardian Checks */}
                                <div className="p-4 border-b border-black">
                                    <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-3">Guardian_Checks</div>
                                    <div className="space-y-2">
                                        {[
                                            { check: 'Dependency Scan', result: 'PASS', color: 'text-green-600' },
                                            { check: 'GPAI Detection', result: 'FLAGGED', color: 'text-[#FF4F00]' },
                                            { check: 'Risk Classification', result: 'HIGH_RISK', color: 'text-[#FF4F00]' },
                                            { check: 'Annex III Match', result: '3 ARTICLES', color: 'text-[#FF4F00]' },
                                        ].map((c, i) => (
                                            <div key={i} className="flex justify-between font-mono text-xs">
                                                <span className="text-[#555]">{c.check}</span>
                                                <span className={c.color}>[{c.result}]</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Verdict */}
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Verdict</div>
                                        <div className="font-serif text-xl font-bold text-[#FF4F00]">MERGE_BLOCKED</div>
                                    </div>
                                    <div className="border-2 border-[#FF4F00] px-3 py-2">
                                        <span className="font-mono text-[10px] text-[#FF4F00] uppercase tracking-widest">Review_Required</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                EU AI ACT — URGENCY
            ═══════════════════════════════════════════════════════════════ */}
            <section id="compliance" className="border-b-2 border-black">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2">

                    {/* Left — Urgency Copy */}
                    <div className="p-8 md:p-16 flex flex-col justify-center border-b-2 md:border-b-0 md:border-r-2 border-black">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-6">
                            Regulation // Active
                        </div>
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">
                            The EU AI Act<br />is <span className="text-[#FF4F00]">already</span> in force.
                        </h2>
                        <p className="font-mono text-sm text-[#555] leading-relaxed max-w-[400px] mb-8">
                            Banned AI practices are prohibited since February 2025.
                            GPAI obligations apply from August 2025.
                            High-risk system requirements take effect December 2027.
                            Non-compliance fines reach €35 million or 7% of global turnover.
                        </p>
                        <div className="font-mono text-xs text-black">
                            You are either compliant, or you are liable.
                        </div>
                    </div>

                    {/* Right — Deadline Grid */}
                    <div className="bg-black text-white p-8 md:p-12 flex flex-col justify-center">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#999] mb-8">
                            Article_113 // Enforcement_Timeline
                        </div>
                        <div className="space-y-0">
                            {[
                                { date: 'FEB 2025', event: 'Banned AI practices prohibited', status: 'ENFORCED' },
                                { date: 'AUG 2025', event: 'GPAI model obligations apply', status: 'ENFORCED' },
                                { date: 'DEC 2026', event: 'Article 50 transparency obligations', status: 'UPCOMING' },
                                { date: 'DEC 2027', event: 'High-risk AI system requirements', status: 'UPCOMING' },
                            ].map((d, i) => (
                                <div key={i} className="flex items-start gap-4 py-4 border-b border-[#333]">
                                    <div className="font-mono text-sm text-[#FF4F00] w-[100px] shrink-0">{d.date}</div>
                                    <div className="flex-1 font-mono text-sm">{d.event}</div>
                                    <div className={`font-mono text-[10px] uppercase tracking-widest shrink-0 ${d.status === 'ENFORCED' ? 'text-[#FF4F00]' : 'text-[#666]'}`}>
                                        [{d.status}]
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 font-mono text-[10px] uppercase tracking-widest text-[#666]">
                            Source: Regulation (EU) 2024/1689, Article 113
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                WHO THIS IS FOR
            ═══════════════════════════════════════════════════════════════ */}
            <section className="border-b-2 border-black">
                <div className="max-w-[1400px] mx-auto p-8 md:p-16">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-4">
                        Target_Operators
                    </div>
                    <h2 className="font-serif text-3xl md:text-5xl font-bold mb-12">
                        Built for teams that ship AI.
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                        {[
                            {
                                label: 'Engineering_Teams',
                                desc: 'You deploy AI models in production. You need to know if your system is classified as high-risk before your next release.',
                            },
                            {
                                label: 'Startup_Founders',
                                desc: 'You are raising funds or entering the EU market. Investors and partners will ask about your EU AI Act compliance status.',
                            },
                            {
                                label: 'Compliance_Officers',
                                desc: 'You need audit-ready documentation and a clear risk classification. Not a 200-page legal opinion — a technical assessment.',
                            },
                        ].map((persona, i) => (
                            <div key={i} className={`p-8 border-2 border-black ${i < 2 ? 'md:border-r-0' : ''}`}>
                                <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-4">
                                    {persona.label}
                                </div>
                                <p className="font-mono text-sm text-[#555] leading-relaxed">
                                    {persona.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                MANUAL AUDIT vs LEXOCULUS
            ═══════════════════════════════════════════════════════════════ */}
            <section className="border-b-2 border-black">
                <div className="max-w-[1400px] mx-auto">
                    <div className="p-8 md:p-16 pb-0 md:pb-0">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-4">
                            Comparison // Approach
                        </div>
                        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
                            The old way is expensive.
                        </h2>
                        <p className="font-mono text-sm text-[#555] max-w-[500px]">
                            Manual EU AI Act compliance audits take months and cost tens of thousands.
                            LexOculus does it from your codebase in minutes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 mt-12 border-t-2 border-black">
                        {/* OLD WAY */}
                        <div className="p-8 md:p-12 border-b-2 md:border-b-0 md:border-r-2 border-black bg-[#FAFAFA]">
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#999] mb-6">
                                Traditional_Compliance_Audit
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Timeline', value: '3–6 months' },
                                    { label: 'Cost', value: '€15,000 – €50,000+' },
                                    { label: 'Output', value: '200-page legal opinion' },
                                    { label: 'Method', value: 'Manual document review' },
                                    { label: 'Maintenance', value: 'Outdated on delivery' },
                                    { label: 'Evidence', value: 'Self-reported questionnaire' },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-[#E5E5E5] font-mono text-sm">
                                        <span className="text-[#999]">{item.label}</span>
                                        <span className="text-[#555]">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* LEXOCULUS WAY */}
                        <div className="p-8 md:p-12 bg-black text-white">
                            <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4F00] mb-6">
                                LexOculus_Automated_Audit
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Timeline', value: 'Under 5 minutes' },
                                    { label: 'Cost', value: 'Flexible plans' },
                                    { label: 'Output', value: 'SHA-256 signed PDF report' },
                                    { label: 'Method', value: 'Automated code analysis' },
                                    { label: 'Maintenance', value: 'Re-scan on every PR' },
                                    { label: 'Evidence', value: 'Dependency graph + LLM analysis' },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-[#333] font-mono text-sm">
                                        <span className="text-[#999]">{item.label}</span>
                                        <span className="text-[#FF4F00] font-bold">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                FINAL CTA
            ═══════════════════════════════════════════════════════════════ */}
            <section className="border-b-2 border-black bg-[#FAFAFA]">
                <div className="max-w-[1400px] mx-auto p-8 md:p-24 text-center">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#999] mb-6">
                        Initiate_Scan
                    </div>
                    <h2 className="font-serif text-4xl md:text-6xl font-bold mb-6">
                        Know your risk.<br />Before the regulator does.
                    </h2>
                    <p className="font-mono text-sm text-[#555] max-w-[500px] mx-auto mb-10">
                        Connect your GitHub. Get your classification. Generate your report.
                        One scan is all it takes to know where you stand.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                        <Link
                            href="/auth/signup"
                            className="bg-[#FF4F00] text-white font-mono text-sm uppercase tracking-widest px-10 py-5 hover:bg-black transition-colors"
                        >
                            Start_Audit
                        </Link>
                        <Link
                            href="/pricing"
                            className="border-2 border-black font-mono text-sm uppercase tracking-widest px-10 py-5 hover:bg-black hover:text-white transition-colors"
                        >
                            Compare_Plans
                        </Link>
                    </div>

                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#999]">
                        SHA-256 signed reports • Annex III mapped • Zero data retention
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════════════════ */}
            <footer className="border-t-2 border-black bg-white">
                <div className="max-w-[1400px] mx-auto p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <OpticalLogo />
                        <span className="font-mono text-[10px] text-[#999] uppercase tracking-widest hidden md:block">
                            EU_AI_Act_Compliance_Engine
                        </span>
                    </div>
                    <div className="flex gap-8 font-mono text-xs underline decoration-1 underline-offset-4">
                        <Link href="/legal/terms" className="hover:text-[#FF4F00]">TERMS</Link>
                        <Link href="/legal/privacy" className="hover:text-[#FF4F00]">PRIVACY</Link>
                        <Link href="/legal/security" className="hover:text-[#FF4F00]">SECURITY</Link>
                        <Link href="/legal/compliance" className="hover:text-[#FF4F00]">EU_DISCLAIMER</Link>
                    </div>
                </div>
            </footer>

        </main>
    );
}
