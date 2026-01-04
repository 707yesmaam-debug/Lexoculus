'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StarBackground from '@/components/StarBackground';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();

        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push('/auth/login');
            } else {
                setEmail(session.user.email || null);
            }
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/auth/login');
            } else if (session) {
                setEmail(session.user.email || null);
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    return (
        <div className="min-h-screen text-foreground selection:bg-blue-500/30 star-overlay">
            <StarBackground />

            {/* Top Navigation Bar - Glass style */}
            <header className="fixed top-0 left-0 right-0 h-14 glass-panel-light z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard/scanner" className="flex items-center gap-2 group">
                        <div className="w-5 h-5 bg-zinc-100 rounded-none transform rotate-45 group-hover:rotate-0 transition-transform duration-300"></div>
                        <span className="font-heading font-bold text-zinc-100 tracking-tight">ComplianceAI</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 ml-4">
                        <Link href="/dashboard/scanner" className="px-3 py-1.5 text-xs font-medium text-zinc-100 bg-white/10 border border-white/10 rounded-sm">Scanner</Link>
                        <span className="text-zinc-700 text-xs px-2">/</span>
                        <button disabled className="px-3 py-1.5 text-xs font-medium text-zinc-500 cursor-not-allowed">Analysis</button>
                        <span className="text-zinc-700 text-xs px-2">/</span>
                        <button disabled className="px-3 py-1.5 text-xs font-medium text-zinc-500 cursor-not-allowed">Reports</button>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {email && <span className="text-xs text-zinc-500 font-mono hidden sm:block">{email}</span>}
                    <button
                        onClick={handleLogout}
                        className="text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors uppercase tracking-wider"
                    >
                        Log Out
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto relative z-10">
                {children}
            </main>
        </div>
    );
}
