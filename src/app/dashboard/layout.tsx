'use client';

import { createClient } from '@/lib/supabase';
import { useRouter, usePathname, useParams } from 'next/navigation'; // Added useParams
import { useEffect, useState } from 'react';
import Link from 'next/link';
import OpticalLogo from '@/components/OpticalLogo';

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
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/auth/login');
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
                                    href={item.disabled ? '#' : item.href}
                                    className={`
                                        group flex items-center justify-between p-3 border 
                                        transition-none cursor-pointer select-none
                                        ${item.isActive ? 'bg-black text-white border-black' : 'border-transparent hover:border-black hover:bg-white text-black'}
                                        ${item.disabled ? 'opacity-50 cursor-not-allowed hover:border-transparent hover:bg-transparent' : ''}
                                    `}
                                >
                                    <span>{item.name}</span>
                                    <span className={`text-[10px] ${item.isActive ? 'text-[#FF4F00]' : 'text-[#999] group-hover:text-[#FF4F00]'}`}>
                                        {item.status}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div>
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
