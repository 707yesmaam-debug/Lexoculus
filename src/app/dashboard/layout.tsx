'use client';

import { createClient } from '@/lib/supabase';
import { useRouter, usePathname, useParams } from 'next/navigation'; // Added useParams
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import OpticalLogo from '@/components/OpticalLogo';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams(); // Get params
    const [email, setEmail] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const repo_scan_id = params?.repo_scan_id as string | undefined;

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
        try {
            // Call server-side logout to clear HttpOnly cookies
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            const data = await response.json();

            // Clear ALL client-side storage to prevent any session leakage
            if (data.clearStorage || true) {
                // Clear all Supabase auth keys from localStorage
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));

                // Clear sessionStorage as well
                sessionStorage.clear();

                // Clear any app-specific state
                localStorage.removeItem('github_connected');
                localStorage.removeItem('last_repo');
            }

            // Force hard navigation to completely reset React state
            // Using window.location instead of router.push to ensure full page reload
            window.location.href = '/auth/login';
        } catch (error) {
            console.error('Logout failed:', error);
            // Even on error, try to redirect
            window.location.href = '/auth/login';
        }
    };

    // Dynamic Navigation items
    const navItems = [
        {
            name: '01_SCANNER',
            href: '/dashboard/scanner',
            status: '[ACTIVE]',
            isActive: pathname === '/dashboard/scanner'
        },
        {
            name: '02_ANALYSIS',
            // Link to the current analysis if ID exists, otherwise blocked
            href: repo_scan_id ? `/dashboard/analyzer/${repo_scan_id}` : '#',
            status: repo_scan_id ? '[IN_PROGRESS]' : '[LOCKED]',
            disabled: !repo_scan_id,
            // Active if we are in analyzer, risk, or context pages
            isActive: pathname.includes('/analyzer/') || pathname.includes('/risk-classifier/') || pathname.includes('/context-verifier/')
        },
        {
            name: '03_REPORTS',
            href: repo_scan_id ? `/dashboard/report/${repo_scan_id}` : '#',
            status: repo_scan_id ? '[AVAILABLE]' : '[LOCKED]',
            disabled: !repo_scan_id,
            isActive: pathname.includes('/report/')
        },
        {
            name: '04_INTEGRATIONS',
            href: '/dashboard/integrations',
            status: '[PRO]',
            isActive: pathname === '/dashboard/integrations'
        },
    ];

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white text-black">

            {/* LEFT SIDEBAR: Navigation */}
            {/* LEFT SIDEBAR: Navigation */}
            <aside className="w-full md:w-[350px] md:h-screen md:sticky md:top-0 border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col bg-[#F5F5F5] z-50">
                <div className="p-6 md:p-0 flex items-center justify-between md:block">
                    <div className="md:p-6 md:pb-0">
                        <Link href="/dashboard/scanner">
                            <OpticalLogo />
                        </Link>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 border border-black hover:bg-black hover:text-white transition-colors">
                        {isMobileMenuOpen ? 'CLOSE' : 'MENU'}
                    </button>
                </div>

                <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col justify-between flex-1 p-6 pt-0`}>
                    <div className="mt-6 md:mt-12">
                        <nav className="flex flex-col gap-2 font-mono text-sm">
                            {navItems.map((item) => {
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.disabled ? '#' : item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`
                                            group flex items-center justify-between px-2 py-2 text-sm font-medium font-mono
                                            ${item.isActive
                                                ? 'bg-black text-white'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                                            }
                                            ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        <span className="flex items-center gap-3">
                                            {item.name}
                                        </span>
                                        <span className={`text-[10px] tracking-wider ${item.isActive ? 'text-gray-400' : 'text-gray-400 group-hover:text-black'}`}>
                                            {['03_REPORTS', '05_SETTINGS', '04_INTEGRATIONS'].includes(item.name) ? (
                                                <span className="inline-flex items-center gap-1">
                                                    [PRO]
                                                </span>
                                            ) : (
                                                item.status
                                            )}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-8 md:mt-0">
                        {/* Upgrade Prompt Footer */}
                        <div className="p-4 border-t border-[#E5E5E5] -mx-6 md:mx-0">
                            <UpgradePrompt variant="sidebar" />
                        </div>
                        <div className="font-mono text-xs mb-4 pt-4 border-t border-[#E5E5E5] text-[#555]">
                            <div className="flex justify-between mb-2">
                                <span>OPERATOR:</span>
                                <span className="truncate max-w-[150px]">{email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>SESSION:</span>
                                <span className="text-[#FF4F00]">SECURE</span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full border border-black p-3 font-mono text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors text-center"
                        >
                            Terminate_Session
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 bg-white min-h-screen">
                {children}
            </main>
        </div>
    );
}
