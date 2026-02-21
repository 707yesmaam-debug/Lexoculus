'use client';

import { createClient } from '@/lib/supabase';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import OpticalLogo from '@/components/OpticalLogo';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const urlEmail = searchParams.get('email');
    const [email, setEmail] = useState(urlEmail || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to send recovery email');
            } else {
                setSuccess(true);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white text-black">

            {/* LEFT CHASSIS: Context */}
            <aside className="w-full md:w-[400px] border-b-2 md:border-b-0 md:border-r-2 border-black p-8 md:p-12 flex flex-col justify-between bg-[#F5F5F5]">
                <div>
                    <div className="mb-12">
                        <Link href="/auth/login" className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#555] hover:text-black mb-8 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back_to_Login
                        </Link>
                        <OpticalLogo />
                    </div>
                    <div className="font-serif text-3xl font-bold mb-4">
                        Credential<br />Recovery<br />Protocol.
                    </div>
                    <p className="font-mono text-xs text-[#555] max-w-[200px] leading-relaxed">
                        Initiate identity verification sequence to restore access.
                    </p>
                </div>
                <div className="hidden md:block font-mono text-[10px] text-[#999]">
                    <div>SECURE_GATEWAY_V1</div>
                    <div>ENCRYPTION: AES-256</div>
                </div>
            </aside>

            {/* RIGHT CHASSIS: Form */}
            <main className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="font-mono text-xs text-[#FF4F00] mb-8 tracking-widest uppercase">
                        // Reset_Sequence
                    </div>

                    {!urlEmail ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-[#FF4F00]/10 border border-[#FF4F00] p-6 text-center">
                                <AlertCircle className="w-12 h-12 text-[#FF4F00] mx-auto mb-4" />
                                <h3 className="font-serif text-xl font-bold mb-2">Email Identity Required</h3>
                                <p className="font-mono text-xs text-black">
                                    Please initiate credential recovery from the login gateway by entering your email first.
                                </p>
                            </div>
                            <Link
                                href="/auth/login"
                                className="block w-full text-center bg-black hover:bg-[#FF4F00] text-white font-mono font-bold py-4 text-sm transition-colors tracking-widest uppercase"
                            >
                                RETURN_TO_LOGIN
                            </Link>
                        </div>
                    ) : success ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-[#F0FFF4] border border-[#22c55e] p-6 text-center">
                                <CheckCircle className="w-12 h-12 text-[#22c55e] mx-auto mb-4" />
                                <h3 className="font-serif text-xl font-bold mb-2">Check Your Inbox</h3>
                                <p className="font-mono text-xs text-[#555]">
                                    If an account exists for <span className="font-bold text-black">{email}</span>,
                                    we have sent a secure recovery link.
                                </p>
                            </div>
                            <Link
                                href="/auth/login"
                                className="block w-full text-center bg-black hover:bg-[#FF4F00] text-white font-mono font-bold py-4 text-sm transition-colors tracking-widest uppercase"
                            >
                                RETURN_TO_LOGIN
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            {error && (
                                <div className="bg-[#FF4F00]/10 border border-[#FF4F00] p-4 flex gap-3 text-[#FF4F00] text-sm font-mono">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-mono font-bold uppercase tracking-wider" htmlFor="email">Email_Identity</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    readOnly
                                    className="w-full bg-[#F5F5F5] border border-black p-4 text-[#555] font-mono text-sm focus:outline-none transition-none rounded-none cursor-not-allowed"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black hover:bg-[#FF4F00] text-white font-mono font-bold py-4 text-sm transition-colors disabled:opacity-50 tracking-widest uppercase rounded-none"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'SEND_RECOVERY_LINK ->'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    )
}
