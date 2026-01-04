'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';
import StarBackground from '@/components/StarBackground';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/dashboard/scanner');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            <StarBackground />

            <div className="w-full max-w-md z-10">
                <div className="mb-8 text-center">
                    <div className="w-8 h-8 bg-zinc-100 mx-auto rotate-45 mb-6"></div>
                    <h1 className="text-2xl font-heading font-bold tracking-tight text-white">ComplianceAI</h1>
                    <p className="text-zinc-500 mt-2 text-sm">Sign in to your console</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-4 glass-panel p-8 shadow-2xl">
                        {error && (
                            <div className="bg-red-950/30 border border-red-900/50 p-3 flex gap-3 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-zinc-500" htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-950/80 border border-white/10 p-3 text-zinc-100 text-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-zinc-700"
                                placeholder="name@organization.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-medium uppercase tracking-wider text-zinc-500" htmlFor="password">Password</label>
                                <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300">Forgot?</a>
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-950/80 border border-white/10 p-3 text-zinc-100 text-sm focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-3 text-sm transition-colors disabled:opacity-50 mt-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Authenticate'}
                        </button>
                    </div>
                </form>

                <p className="text-center mt-8 text-sm text-zinc-600">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="text-zinc-400 hover:text-white transition-colors underline decoration-zinc-800 underline-offset-4">
                        Request Access
                    </Link>
                </p>
            </div>
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
