'use client';

import { createClient } from '@/lib/infra/supabase';
import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import OpticalLogo from '@/components/OpticalLogo';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setCheckingSession(false);
        });
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setSession(null);
        router.refresh();
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const trimmedEmail = email.trim();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
        });

        if (error) {
            console.error('[AUTH LOGIN] Error object:', error);
            setError(error.message);
            setLoading(false);
        } else {
            // Force redirect to individual dashboard, bypassing the firm flow entry point
            router.push('/dashboard/scanner');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white text-black">

            {/* LEFT CHASSIS: Context */}
            <aside className="w-full md:w-[400px] border-b-2 md:border-b-0 md:border-r-2 border-black p-8 md:p-12 flex flex-col justify-between bg-[#F5F5F5]">
                <div>
                    <div className="mb-12">
                        <OpticalLogo />
                    </div>
                    <div className="font-serif text-3xl font-bold mb-4">
                        Authorized<br />Personnel<br />Only.
                    </div>
                    <p className="font-mono text-xs text-[#555] max-w-[200px] leading-relaxed">
                        Access the LexOculus System.
                        Secure individual audit entry point.
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
                        // {session ? 'Active_Session_Detected' : 'Initiate_Session'}
                    </div>

                    {checkingSession ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-black" />
                        </div>
                    ) : session ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-black text-white p-6 border border-white/10 shadow-xl">
                                <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-2">Authenticated_As</div>
                                <div className="font-mono text-sm font-bold truncate mb-1">{session.user.email}</div>
                                <div className="font-mono text-[10px] text-[#FF4F00] uppercase tracking-widest">Status: SESSION_ACTIVE</div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        const accountType = session.user.user_metadata?.account_type || 'individual';
                                        router.push(accountType === 'firm' ? '/firm/clients' : '/dashboard/scanner');
                                    }}
                                    className="w-full bg-[#FF4F00] hover:bg-black text-white font-mono font-bold py-4 text-sm transition-colors tracking-widest uppercase rounded-none flex items-center justify-center gap-2"
                                >
                                    PROCEED_TO_DASHBOARD →
                                </button>
                                
                                <button
                                    onClick={handleLogout}
                                    className="w-full border-2 border-black hover:bg-black hover:text-white text-black font-mono font-bold py-4 text-sm transition-colors tracking-widest uppercase rounded-none"
                                >
                                    LOG_OUT / SWITCH_ACCOUNT
                                </button>
                            </div>

                            <p className="text-center font-mono text-[10px] text-[#999] leading-relaxed px-4">
                                Use "SWITCH_ACCOUNT" if you have another identity registered with LexOculus.
                                You will be redirected to the gateway after termination.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6">
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
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white border border-black p-4 text-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] transition-none rounded-none placeholder:text-gray-300"
                                    placeholder="name@organization.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-mono font-bold uppercase tracking-wider" htmlFor="password">Passkey</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!email) {
                                                setError("Please enter your Email_Identity first to reset credentials.");
                                                return;
                                            }
                                            router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
                                        }}
                                        className="text-xs font-mono text-[#999] hover:text-[#FF4F00] uppercase tracking-widest"
                                    >
                                        RESET_CREDENTIALS
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white border border-black p-4 text-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] transition-none rounded-none"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 pt-2">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1 border-black rounded-none focus:ring-[#FF4F00] text-[#FF4F00]"
                                />
                                <label htmlFor="terms" className="text-xs font-mono text-[#555] leading-snug">
                                    I agree to the <Link href="/legal/terms" className="underline hover:text-black">Terms of Service</Link>, <Link href="/legal/privacy" className="underline hover:text-black">Privacy Policy</Link>, and <Link href="/legal/compliance" className="underline hover:text-black">Compliance Disclaimer</Link>.
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !termsAccepted}
                                className="w-full bg-black hover:bg-[#FF4F00] text-white font-mono font-bold py-4 text-sm transition-colors disabled:opacity-50 disabled:hover:bg-black tracking-widest uppercase rounded-none"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'AUTHENTICATE ->'}
                            </button>
                        </form>
                    )}

                    <div className="mt-12 pt-8 border-t border-[#E5E5E5] text-center">
                        <Link href="/auth/signup" className="font-mono text-xs text-[#555] hover:text-black border-b border-transparent hover:border-black pb-1 transition-all">
                            REQUEST_ACCESS_TOKEN [SIGN_UP]
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    )
}
