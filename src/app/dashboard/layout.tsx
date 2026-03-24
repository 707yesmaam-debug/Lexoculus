'use client';

import { createClient } from '@/lib/infra/supabase';
import { useRouter, usePathname, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import OpticalLogo from '@/components/OpticalLogo';
import SubscriptionGate from '@/components/SubscriptionGate';

export const dynamic = 'force-dynamic';

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
    const [persistentScanId, setPersistentScanId] = useState<string | null>(null);


    // PERSISTENCE: Track the last active scan ID so users can return to it
    useEffect(() => {
        if (repo_scan_id) {
            setPersistentScanId(repo_scan_id);
            localStorage.setItem('last_active_scan_id', repo_scan_id);
        } else {
            // Try to recover from storage
            const stored = localStorage.getItem('last_active_scan_id');
            setPersistentScanId(stored);
        }
    }, [repo_scan_id]);

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
                router.push('/');
            } else if (session) {
                setEmail(session.user.email || null);
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        try {
            // MUST await server-side logout to clear HttpOnly cookies
            // Otherwise middleware will still see the session as valid
            await fetch('/api/auth/logout', { method: 'POST' });

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
            localStorage.removeItem('last_active_scan_id');
            localStorage.removeItem('active_firm_client_id');
        } catch (error) {
            console.error('Logout failed:', error);
        }

        // Redirect to landing page
        window.location.href = '/';
    };

    // Dynamic Navigation items
    // Use the persistent ID if the current URL param is missing
    const activeScanId = repo_scan_id || persistentScanId;

    const navItems = [
        {
            name: '01_SCANNER',
            href: '/dashboard/scanner',
            // LOCKING: If a scan is active, prevent going back to scanner to start a new one
            // This forces the user to complete the lifecycle or terminate explicitly
            status: activeScanId ? '[LOCKED]' : '[START]',
            disabled: !!activeScanId,
            isActive: pathname === '/dashboard/scanner' || pathname === '/dashboard'
        },
        {
            name: '02_ANALYSIS',
            // Link to the current analysis if ID exists, otherwise blocked
            href: activeScanId ? `/dashboard/analyzer/${activeScanId}` : '#',
            status: activeScanId ? (repo_scan_id ? '[IN_PROGRESS]' : '[RESUME]') : '[LOCKED]',
            disabled: !activeScanId,
            // Active if we are in analyzer, risk, or context pages
            isActive: pathname.includes('/analyzer/') || pathname.includes('/risk-classifier/') || pathname.includes('/context-verifier/')
        },
        {
            name: '03_REPORTS',
            href: '/dashboard/report',
            status: '[VIEW]',
            disabled: false,
            isActive: pathname === '/dashboard/report' || pathname.startsWith('/dashboard/report/')
        },
        {
            name: '04_REGISTRY',
            href: '/dashboard/registry',
            // LOCKING: Force focus on active scan
            status: activeScanId ? '[LOCKED]' : '[VIEW]',
            disabled: !!activeScanId,
            isActive: pathname === '/dashboard/registry'
        },
        {
            name: '05_COMPLIANCE_GUARDIAN',
            href: '/dashboard/guardian',
            status: activeScanId ? '[LOCKED]' : '[VIEW]',
            disabled: !!activeScanId,
            isActive: pathname === '/dashboard/guardian'
        },
        {
            name: '06_TIMELINE',
            href: '/dashboard/timeline',
            status: activeScanId ? '[LOCKED]' : '[VIEW]',
            disabled: !!activeScanId,
            isActive: pathname === '/dashboard/timeline'
        },
        {
            name: '07_SETTINGS',
            href: '/dashboard/settings',
            status: activeScanId ? '[LOCKED]' : '[MANAGE]',
            disabled: !!activeScanId,
            isActive: pathname.startsWith('/dashboard/settings')
        },
        {
            name: '08_CONFIGURE_MCP',
            href: '/dashboard/configure-mcp',
            status: activeScanId ? '[LOCKED]' : '[CONNECT]',
            disabled: !!activeScanId,
            isActive: pathname.startsWith('/dashboard/configure-mcp')
        },
    ];


    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="font-mono text-xs">LOADING_INTERFACE...</div></div>}>
            <SubscriptionGate>
                <div className="min-h-screen flex flex-col md:flex-row bg-white text-black">

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
                                                    {item.status}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </nav>
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
                            {activeScanId && (
                                <div className="mb-4">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('WARNING: Aborting this scan will not refund your scan credit. Are you sure you want to proceed?')) {
                                                localStorage.removeItem('last_active_scan_id');
                                                window.location.href = '/dashboard/scanner';
                                            }
                                        }}
                                        className="w-full border border-black p-3 font-mono text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors text-center mb-1"
                                    >
                                        ABORT_SCAN
                                    </button>
                                    <div className="text-[10px] text-red-600 font-mono text-center leading-tight">
                                        [!] CREDIT_WILL_BE_LOST
                                    </div>
                                </div>
                            )}
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
            </SubscriptionGate>
        </Suspense>
    );
}
