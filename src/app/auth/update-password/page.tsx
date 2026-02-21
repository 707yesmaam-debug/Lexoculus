'use client';

import { createClient } from '@/lib/supabase';
import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import OpticalLogo from '@/components/OpticalLogo';

function UpdatePasswordForm() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();

        useEffect(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                console.log("Current Session:", session);
            });
            supabase.auth.onAuthStateChange((event, session) => {
                console.log("Auth Event:", event, "Session:", session);
            });
        }, [supabase]);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            setTimeout(() => {
                router.push('/dashboard/scanner');
            }, 3000);
        }
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
                        Secure<br />Credential<br />Update.
                    </div>
                    <p className="font-mono text-xs text-[#555] max-w-[200px] leading-relaxed">
                        Enter new secure passkey to restore system access.
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
                        // Update_Sequence
                    </div>

                    {success ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-[#F0FFF4] border border-[#22c55e] p-6 text-center">
                                <CheckCircle className="w-12 h-12 text-[#22c55e] mx-auto mb-4" />
                                <h3 className="font-serif text-xl font-bold mb-2">Password Updated</h3>
                                <p className="font-mono text-xs text-[#555]">
                                    Your credentials have been securely updated. Redirecting to dashboard...
                                </p>
                            </div>
                            <Link
                                href="/dashboard/scanner"
                                className="block w-full text-center bg-black hover:bg-[#FF4F00] text-white font-mono font-bold py-4 text-sm transition-colors tracking-widest uppercase"
                            >
                                CONTINUE_TO_DASHBOARD
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdate} className="space-y-6">
                            {error && (
                                <div className="bg-[#FF4F00]/10 border border-[#FF4F00] p-4 flex gap-3 text-[#FF4F00] text-sm font-mono">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-mono font-bold uppercase tracking-wider" htmlFor="password">New_Passkey</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white border border-black p-4 text-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] transition-none rounded-none"
                                    placeholder="Enter new password"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black hover:bg-[#FF4F00] text-white font-mono font-bold py-4 text-sm transition-colors disabled:opacity-50 tracking-widest uppercase rounded-none"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'UPDATE_CREDENTIALS ->'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function UpdatePasswordPage() {
    return (
        <Suspense>
            <UpdatePasswordForm />
        </Suspense>
    )
}
