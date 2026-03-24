'use client';

import { createClient } from '@/lib/infra/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Eye, EyeOff, Check, X as CloseIcon } from 'lucide-react';
import OpticalLogo from '@/components/OpticalLogo';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [accountType] = useState<'individual' | 'firm'>('individual');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            setError('Password does not meet security requirements.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const supabase = createClient();
        const trimmedEmail = email.trim();
        const { data, error } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
                data: {
                    full_name: fullName,
                    account_type: 'individual',
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
                        Create a secure personal audit profile.
                        Access your compliance dashboard.
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
                            
                            {/* Password hints */}
                            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                                {[
                                    { label: '8+ Characters', met: password.length >= 8 },
                                    { label: 'Uppercase', met: /[A-Z]/.test(password) },
                                    { label: 'Lowercase', met: /[a-z]/.test(password) },
                                    { label: 'Number', met: /\d/.test(password) },
                                    { label: 'Special (@$!%*?&)', met: /[@$!%*?&]/.test(password) },
                                ].map((req, i) => (
                                    <div key={i} className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-tighter ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
                                        {req.met ? <Check size={10} /> : <div className="w-2.5 h-2.5 rounded-full border border-gray-300" />}
                                        {req.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 mt-4">
                            <label className="text-xs font-mono font-bold uppercase tracking-wider" htmlFor="confirmPassword">Confirm_Passkey</label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white border border-black p-4 text-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] transition-none rounded-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
