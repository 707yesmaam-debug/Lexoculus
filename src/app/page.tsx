'use client';

import OpticalTypeScanner from '@/components/OpticalTypeScanner';
import OpticalLogo from '@/components/OpticalLogo';
import Link from 'next/link';

export default function LandingPage() {
    return (
        <main className="flex flex-col md:flex-row min-h-screen bg-white text-black">

            {/* LEFT CHASSIS: Fixed Context / Control Panel */}
            <aside className="w-full md:w-[350px] md:h-screen md:sticky md:top-0 border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col justify-between p-6 bg-white z-20">
                <div>
                    <div className="mb-8">
                        <OpticalLogo />
                    </div>

                    <div className="mb-12">
                        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4 leading-none tracking-tight">
                            The Compliance<br />Engine for AI.
                        </h1>
                        <p className="font-mono text-xs text-[#555] leading-relaxed max-w-[280px]">
                            Turn your code into legal defense.
                            Automated EU AI Act audits for engineering teams.
                        </p>
                    </div>

                    <nav className="flex flex-col gap-2 font-mono text-sm">
                        <a href="#scan" className="group flex items-center justify-between p-2 border border-transparent hover:border-black hover:bg-[#F5F5F5] transition-none cursor-pointer">
                            <span>01_INSPECT</span>
                            <span className="opacity-0 group-hover:opacity-100 text-[#FF4F00]">[RUN]</span>
                        </a>
                        <a href="#audit" className="group flex items-center justify-between p-2 border border-transparent hover:border-black hover:bg-[#F5F5F5] transition-none cursor-pointer">
                            <span>02_ANALYZE</span>
                            <span className="opacity-0 group-hover:opacity-100 text-[#FF4F00]">[VIEW]</span>
                        </a>
                        <a href="#certify" className="group flex items-center justify-between p-2 border border-transparent hover:border-black hover:bg-[#F5F5F5] transition-none cursor-pointer">
                            <span>03_CERTIFY</span>
                            <span className="opacity-0 group-hover:opacity-100 text-[#FF4F00]">[PRINT]</span>
                        </a>
                        <Link href="/pricing" className="group flex items-center justify-between p-2 border border-transparent hover:border-black hover:bg-[#F5F5F5] transition-none cursor-pointer">
                            <span>04_PRICING</span>
                            <span className="opacity-0 group-hover:opacity-100 text-[#FF4F00]">[VIEW]</span>
                        </Link>
                    </nav>
                </div>

                <div className="mt-8 md:mt-0">
                    <Link
                        href="/auth/signup"
                        className="block w-full text-center bg-[#FF4F00] text-white font-mono text-sm py-4 hover:bg-black transition-colors uppercase tracking-widest border border-transparent"
                    >
                        Start_Assessment
                    </Link>

                    <Link
                        href="/pricing"
                        className="block w-full text-center border border-black text-black font-mono text-sm py-4 mt-2 hover:bg-black hover:text-white transition-colors uppercase tracking-widest"
                    >
                        View_Plans
                    </Link>

                    <div className="mt-4 flex justify-between font-mono text-[10px] text-[#999]">
                        <span>ART_5 [BANNED]</span>
                        <span>ART_6 [HIGH_RISK]</span>
                    </div>
                </div>
            </aside>

            {/* RIGHT CHASSIS: Scrolling Audit Stream */}
            <div className="flex-1 flex flex-col">

                {/* HERO BLOCK */}
                <section id="scan" className="h-[60vh] md:h-screen border-b-2 border-black relative">
                    <OpticalTypeScanner />
                </section>

                {/* AUDIT STREAM */}
                <section id="audit" className="min-h-screen border-b-2 border-black flex flex-col">
                    {/* Section 1: INSPECT (formerly File Scan) */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 border-b border-black">
                        <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-black flex flex-col justify-center bg-[#F5F5F5]">
                            <div className="font-mono text-xs mb-8 text-[#FF4F00] tracking-widest">PHASE_01 // INSPECT</div>
                            <h3 className="font-serif text-4xl font-bold mb-6">Deep Dependency Scan.</h3>
                            <p className="font-mono text-sm text-[#555] max-w-sm leading-relaxed">
                                We parse your entire repository (Python, JS, Go, Rust).
                                Identifying neural architectures, training pipelines, and data ingress points.
                                No code leaves your environment.
                            </p>
                        </div>
                        <div className="p-8 md:p-12 font-mono text-xs overflow-hidden relative group cursor-crosshair">
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
                            {/* Simulated File Manifest Visual */}
                            <div className="space-y-2 opacity-60">
                                <div className="flex justify-between border-b border-[#E5E5E5] pb-1"><span>src/model/transformer.py</span><span>[DETECTED]</span></div>
                                <div className="flex justify-between border-b border-[#E5E5E5] pb-1"><span>requirements.txt</span><span>[PARSED]</span></div>
                                <div className="flex justify-between border-b border-[#E5E5E5] pb-1"><span>data/processors/pii_scrub.ts</span><span>[FLAGGED]</span></div>
                                <div className="flex justify-between border-b border-[#E5E5E5] pb-1"><span>config/hyperparams.yaml</span><span>[READ]</span></div>
                                <div className="flex justify-between border-b border-[#E5E5E5] pb-1"><span>deploy/docker/Dockerfile</span><span>[CHECKED]</span></div>
                                <div className="flex justify-between border-b border-[#E5E5E5] pb-1 text-[#FF4F00]"><span>... 842 files scanned</span><span>[COMPLETE]</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: ANALYZE (formerly Risk Class) */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                        <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-black font-mono text-xs relative group cursor-crosshair">
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
                            {/* Simulated Risk Matrix Visual */}
                            <div className="grid grid-cols-2 gap-4 h-full content-center">
                                <div className="border border-black p-4 flex flex-col justify-between aspect-square hover:bg-black hover:text-white transition-colors">
                                    <span>ANNEX_III</span>
                                    <span className="text-[#FF4F00] text-xl">MATCH</span>
                                </div>
                                <div className="border border-[#E5E5E5] p-4 flex flex-col justify-between aspect-square text-[#999]">
                                    <span>ART_5</span>
                                    <span>PASS</span>
                                </div>
                                <div className="border border-[#E5E5E5] p-4 flex flex-col justify-between aspect-square text-[#999]">
                                    <span>ART_52</span>
                                    <span>PASS</span>
                                </div>
                                <div className="border border-black p-4 flex flex-col justify-between aspect-square hover:bg-black hover:text-white transition-colors">
                                    <span>GPAI_RISK</span>
                                    <span className="text-[#FF4F00] text-xl">HIGH</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 md:p-12 flex flex-col justify-center bg-[#F5F5F5]">
                            <div className="font-mono text-xs mb-8 text-[#FF4F00] tracking-widest">PHASE_02 // ANALYZE</div>
                            <h3 className="font-serif text-4xl font-bold mb-6">Automated Classification.</h3>
                            <p className="font-mono text-sm text-[#555] max-w-sm leading-relaxed">
                                Our engine maps your system against EU AI Act categories.
                                It identifies Biometric Identification, Critical Infrastructure, and Employment AI triggers instantly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CERTIFICATION BLOCK */}
                <section id="certify" className="min-h-screen p-8 md:p-16 flex flex-col md:flex-row justify-between items-end gap-12 bg-[#F5F5F5]">
                    <div className="max-w-lg">
                        <div className="inline-block px-2 py-1 bg-black text-white font-mono text-xs mb-6">
                            FINAL_OUTPUT
                        </div>
                        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
                            Signed. Sealed.<br />Delivered.
                        </h2>
                        <p className="font-mono text-sm text-[#555] leading-relaxed">
                            A SHA-256 hashed PDF report. Immutable proof of your compliance status.
                            Ready for the boardroom, the courtroom, and the data room.
                        </p>
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-4">
                        <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest text-right">
                            Secure_Hash_Algorithm
                        </div>
                        <div className="font-mono text-xs border border-black p-4 bg-white truncate max-w-[300px] md:max-w-xs">
                            e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                        </div>
                        <Link
                            href="/auth/signup"
                            className="text-center font-bold font-serif text-xl border-2 border-black py-4 hover:bg-black hover:text-white transition-none"
                        >
                            Generate Artifact {'->'}
                        </Link>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="border-t-2 border-black p-6 md:p-8 flex flex-col md:flex-row justify-between items-center bg-white">
                    <div className="text-[10px] font-mono text-[#555] tracking-widest mb-8">
                        LAW_V1.0 // EU_COMPLIANCE
                    </div>
                    <div className="flex gap-8 font-mono text-xs underline decoration-1 underline-offset-4">
                        <Link href="/legal/terms" className="hover:text-[#FF4F00]">TERMS</Link>
                        <Link href="/legal/privacy" className="hover:text-[#FF4F00]">PRIVACY</Link>
                        <Link href="/legal/security" className="hover:text-[#FF4F00]">SECURITY</Link>
                        <Link href="/legal/compliance" className="hover:text-[#FF4F00]">EU_DISCLAIMER</Link>
                    </div>
                </footer>

            </div>
        </main>
    );
}
