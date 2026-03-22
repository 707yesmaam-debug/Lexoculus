'use client';

import { createClient } from '@/lib/infra/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';
import OpticalLogo from '@/components/OpticalLogo';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [accountType, setAccountType] = useState<'individual' | 'firm'>('individual');
    const [firmName, setFirmName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    account_type: accountType,
                    ...(accountType === 'firm' && { firm_name: firmName }),
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else if (data.user && !data.session) {
            // Email confirmation required
            setSuccess(true);
            setLoading(false);
        } else {
            // Auto-confirmed (e.g. testing)
            router.push(accountType === 'firm' ? '/firm/clients' : '/dashboard/scanner');
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
                        Initialize<br />Environment.
                    </div>
                    <p className="font-mono text-xs text-[#555] max-w-[200px] leading-relaxed">
                        Create a new LexOculus tenant.
                        Define admin credentials.
                    </p>
                </div>
                <div className="hidden md:block font-mono text-[10px] text-[#999]">
                    <div>NEW_TENANT_PROTOCOL</div>
                    <div>STATUS: PENDING_MIGRATION</div>
                </div>
            </aside>

            {/* RIGHT CHASSIS: Form */}
            <main className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="font-mono text-xs text-[#FF4F00] mb-8 tracking-widest uppercase">
                        // Register_User
                    </div>

                    <form onSubmit={handleSignup} className="space-y-6">
                        {error && (
                            <div className="bg-[#FF4F00]/10 border border-[#FF4F00] p-4 flex gap-3 text-[#FF4F00] text-sm font-mono">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                type="button"
                                onClick={() => setAccountType('individual')}
                                className={`p-4 border font-mono text-xs text-left transition-all ${accountType === 'individual' ? 'border-[#FF4F00] bg-[#FF4F00]/5 text-[#FF4F00]' : 'border-gray-200 text-gray-500 hover:border-black'}`}
                            >
                                <div className="font-bold mb-1 tracking-wider uppercase">Individual</div>
                                <div className="leading-relaxed opacity-80">I am scanning my own projects.</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAccountType('firm')}
                                className={`p-4 border font-mono text-xs text-left transition-all ${accountType === 'firm' ? 'border-[#FF4F00] bg-[#FF4F00]/5 text-[#FF4F00]' : 'border-gray-200 text-gray-500 hover:border-black'}`}
                            >
                                <div className="font-bold mb-1 tracking-wider uppercase">Law Firm</div>
                                <div className="leading-relaxed opacity-80">I am auditing clients.</div>
                            </button>
                        </div>

                        {accountType === 'firm' && (
                            <div className="space-y-4 pt-2 pb-4 border-b border-gray-100">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono font-bold uppercase tracking-wider" htmlFor="firmName">Firm_Name</label>
                                    <input
                                        id="firmName"
                                        type="text"
                                        value={firmName}
                                        onChange={(e) => setFirmName(e.target.value)}
                                        className="w-full bg-white border border-black p-4 text-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] transition-none rounded-none placeholder:text-gray-300"
                                        placeholder="Acme Legal"
                                        required={accountType === 'firm'}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-mono font-bold uppercase tracking-wider" htmlFor="name">Officer_Name</label>
                            <input
                                id="name"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-white border border-black p-4 text-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] transition-none rounded-none placeholder:text-gray-300"
                                placeholder="John Doe"
                                required
                            />
                        </div>

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
                            <label className="text-xs font-mono font-bold uppercase tracking-wider" htmlFor="password">Passkey_Set</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white border border-black p-4 text-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] transition-none rounded-none"
                                required
                            />
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
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'INITIALIZE_ACCOUNT ->'}
                        </button>
                    </form>

                    {success && (
                        <div className="mt-6 bg-green-50 border border-green-200 p-4 text-green-800 font-mono text-sm">
                            <p className="font-bold mb-1">CONFIRMATION_REQUIRED</p>
                            <p>Verification link sent to {email}.<br />Check your inbox to activate access.</p>
                        </div>
                    )}

                    <div className="mt-12 pt-8 border-t border-[#E5E5E5] text-center">
                        <Link href="/auth/login" className="font-mono text-xs text-[#555] hover:text-black border-b border-transparent hover:border-black pb-1 transition-all">
                            EXISTING_USER_DETECTED [SIGN_IN]
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
