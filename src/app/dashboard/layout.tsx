'use client';

import { createClient } from '@/lib/supabase';
import { useRouter, usePathname, useParams } from 'next/navigation'; // Added useParams
import { useEffect, useState } from 'react';
import Link from 'next/link';
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
            name: '02_INTEGRATIONS',
            href: '/dashboard/integrations',
            status: '[LINKED]',
            isActive: pathname === '/dashboard/integrations'
        },
        {
            name: '03_ANALYSIS',
            // Link to the current analysis if ID exists, otherwise blocked
            href: repo_scan_id ? `/dashboard/analyzer/${repo_scan_id}` : '#',
            status: repo_scan_id ? '[IN_PROGRESS]' : '[LOCKED]',
            disabled: !repo_scan_id,
            // Active if we are in analyzer, risk, or context pages
            isActive: pathname.includes('/analyzer/') || pathname.includes('/risk-classifier/') || pathname.includes('/context-verifier/')
        },
        {
            name: '04_REPORTS',
            href: repo_scan_id ? `/dashboard/report/${repo_scan_id}` : '#',
            status: repo_scan_id ? '[AVAILABLE]' : '[LOCKED]',
            disabled: !repo_scan_id,
            isActive: pathname.includes('/report/')
        },
    ];

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white text-black">

            {/* LEFT SIDEBAR: Navigation */}
            <aside className="w-full md:w-[350px] md:h-screen md:sticky md:top-0 border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col justify-between p-6 bg-[#F5F5F5] z-50">
                <div>
                    <div className="mb-12">
                        <Link href="/dashboard/scanner">
                            <OpticalLogo />
                        </Link>
                    </div>

                    <nav className="flex flex-col gap-2 font-mono text-sm">
                        {navItems.map((item) => {
                            return (
                                <Link
                                    key={item.name}
                                    href={item.disabled ? '#' : item.href} {/* Retained original disabled href logic */}
                                    className={`
                                        group flex items-center justify-between px-2 py-2 text-sm font-medium font-mono
                                        ${item.isActive
                                            ? 'bg-black text-white'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                                        }
                                        ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''} {/* Added disabled styling */}
                                    `}
                                >
                                    <span className="flex items-center gap-3">
                                        {item.name}
                                    </span>
                                    <span className={`text-[10px] tracking-wider ${item.isActive ? 'text-gray-400' : 'text-gray-400 group-hover:text-black'}`}>
                                        {['04_REPORTS', '05_SETTINGS'].includes(item.name) ? (
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

                <div>
                    {/* Upgrade Prompt Footer */}
                    <div className="p-4 border-t border-[#E5E5E5]">
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
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 bg-white min-h-screen">
                {children}
            </main>
        </div>
    );
}
