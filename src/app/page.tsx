'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Brain, Scale, ClipboardCheck, FileText, Shield, Lock } from 'lucide-react';
import StarBackground from '@/components/StarBackground';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] as const }
    })
};

const pipelineSteps = [
    {
        icon: Github,
        step: "01",
        title: "Repository Ingestion",
        description: "Connect your GitHub account with read-only access. We extract README, package.json, file structure, and dependency graphs from your AI repository.",
        terminal: [
            "SCANNING: github.com/org/ml-model",
            "EXTRACTED: readme.md, requirements.txt",
            "FILES: 847 | LANGUAGE: Python"
        ]
    },
    {
        icon: Brain,
        step: "02",
        title: "Capability Analysis",
        description: "Our LLM analyzes your codebase to detect AI/ML frameworks, model architectures, training pipelines, and inference patterns.",
        terminal: [
            "DETECTED: PyTorch, Transformers",
            "MODEL_TYPE: Neural Network",
            "CAPABILITIES: NLP, Classification"
        ]
    },
    {
        icon: Scale,
        step: "03",
        title: "Risk Classification",
        description: "Map detected capabilities against EU AI Act Annex III articles. Get preliminary risk classification from UNACCEPTABLE to MINIMAL_RISK.",
        terminal: [
            "ANNEX_III: Article 6.1(a) matched",
            "RISK_TIER: HIGH_RISK",
            "SCORE: 72/100"
        ]
    },
    {
        icon: ClipboardCheck,
        step: "04",
        title: "Context Verification",
        description: "Answer targeted questions about deployment context, human oversight, data safeguards, and transparency measures to finalize your assessment.",
        terminal: [
            "CONTEXT: EU Healthcare Deployment",
            "OVERSIGHT: Human-in-the-loop confirmed",
            "STATUS: VERIFIED"
        ]
    },
    {
        icon: FileText,
        step: "05",
        title: "Enterprise Trust Pack",
        description: "Generate a 'Vendor Risk Profile' PDF. Includes executive summary, Article 5 clearance, and privacy checks. Ready for your data room.",
        terminal: [
            "GENERATING: Vendor_Risk_Profile.pdf",
            "STATUS: ACCESS_GRANTED",
            "READY_FOR: SALES"
        ]
    }
];

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col selection:bg-white selection:text-black text-white relative">
            <StarBackground />

            {/* Header */}
            <header className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center backdrop-blur-sm bg-black/5 border-b border-white/5">
                <div className="font-heading font-bold tracking-tighter text-xl flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    ComplianceAI
                </div>
                <nav className="hidden md:flex gap-8 text-sm font-medium tracking-wide opacity-70">
                    <a href="#pipeline" className="hover:opacity-100 transition-opacity">Pipeline</a>
                    <a href="#security" className="hover:opacity-100 transition-opacity">Security</a>
                    <Link href="/pricing" className="hover:opacity-100 transition-opacity">Pricing</Link>
                </nav>
                <div className="flex gap-4 items-center">
                    <Link href="/auth/login" className="text-sm font-medium hover:text-white/80 transition-colors">Log In</Link>
                    <Link href="/auth/signup" className="text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-zinc-200 transition-all">
                        Start Free
                    </Link>
                </div>
            </header>

            {/* HERO */}
            <section className="h-screen flex items-center justify-center px-6 relative overflow-hidden">
                <div className="max-w-5xl mx-auto text-center z-10">
                    <motion.div
                        custom={0}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-zinc-400 mb-8"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        EU AI ACT COMPLIANT
                    </motion.div>

                    <motion.h1
                        custom={1}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 text-white"
                    >
                        Unblock <br />
                        <span className="text-zinc-500">Enterprise Sales.</span>
                    </motion.h1>

                    <motion.p
                        custom={2}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        Generate a professional <strong>Vendor Risk Profile</strong> in seconds.
                        Prove EU AI Act compliance, satisfy procurement teams, and close deals faster.
                    </motion.p>

                    <motion.div
                        custom={3}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="flex flex-col sm:flex-row justify-center gap-4"
                    >
                        <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-zinc-200 transition-all">
                            <Github className="w-5 h-5" />
                            Connect GitHub
                        </Link>
                        <Link href="/pricing" className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-white/5 transition-all">
                            View Pricing
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* 5-STAGE PIPELINE */}
            <section id="pipeline" className="py-32 px-6 max-w-7xl mx-auto">
                <div className="mb-16 text-center">
                    <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">From Code to Contract</h2>
                    <p className="text-zinc-500 max-w-2xl mx-auto">Automated "Guerrilla Compliance" checks generate the artifacts your customers need.</p>
                </div>

                <div className="space-y-6">
                    {pipelineSteps.map((step, index) => (
                        <motion.div
                            key={step.step}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className="grid md:grid-cols-2 gap-8 p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                        >
                            <div className="flex flex-col justify-center">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-lg border border-white/10">
                                        <step.icon className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <span className="font-mono text-zinc-600 text-sm">{step.step}</span>
                                </div>
                                <h3 className="font-heading text-2xl font-bold mb-3">{step.title}</h3>
                                <p className="text-zinc-400 leading-relaxed">{step.description}</p>
                            </div>
                            <div className="font-mono text-sm text-zinc-500 bg-black/50 p-6 rounded-xl border border-white/5 flex flex-col justify-center">
                                {step.terminal.map((line, i) => (
                                    <div key={i} className="py-1">
                                        <span className="text-zinc-600 mr-2">$</span>
                                        {line}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* SECURITY & TRUST */}
            <section id="security" className="py-32 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono mb-6">
                            <Lock className="w-3 h-3" /> ZERO DATA RETENTION
                        </div>
                        <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">We analyze code. <br />We don't store it.</h2>
                        <div className="space-y-6 text-lg text-zinc-400">
                            <p>
                                ComplianceAI operates on a <strong className="text-white">Zero-Retention</strong> architecture.
                                Your repository is cloned into volatile memory, analyzed, and immediately discarded.
                            </p>
                            <p>
                                We only persist the <strong className="text-white">compliance metadata</strong>: risk scores,
                                capability assessments, and your signed PDF reports. Your source code never touches our database.
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>
                        <div className="relative glass-panel rounded-2xl p-8 border border-white/10 bg-black/40">
                            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                                <div className="text-sm font-mono text-zinc-500">DATA_LIFECYCLE</div>
                                <div className="text-xs font-bold text-green-500">ENFORCED</div>
                            </div>
                            <div className="space-y-4 font-mono text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">git clone repo</span>
                                    <span className="text-white">VOLATILE_MEMORY</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">llm_analysis</span>
                                    <span className="text-white">EPHEMERAL_PROCESS</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">risk_assessment</span>
                                    <span className="text-white">METADATA_ONLY</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">pdf_report</span>
                                    <span className="text-emerald-400">SIGNED_STORED</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">source_code</span>
                                    <span className="text-red-500">WIPED_IMMEDIATE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section id="pricing" className="py-32 text-center">
                <h2 className="font-heading text-5xl md:text-7xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">
                    Ready to comply?
                </h2>
                <p className="text-zinc-500 text-lg mb-12 max-w-xl mx-auto">
                    Get your first compliance assessment free. No credit card required.
                </p>
                <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-white text-black px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform">
                    Start Free Assessment
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </section>

            <footer className="py-12 text-center text-zinc-600 text-sm border-t border-white/5">
                <div className="mb-4 flex justify-center gap-6">
                    <a href="#" className="hover:text-zinc-400">Terms</a>
                    <a href="#" className="hover:text-zinc-400">Privacy</a>
                    <a href="#" className="hover:text-zinc-400">Security</a>
                </div>
                ComplianceAI © 2026. Built for the European Union.
            </footer>
        </div>
    );
}
