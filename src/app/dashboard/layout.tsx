'use client';

import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
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

    const navItems = [
        { name: '01_SCANNER', href: '/dashboard/scanner', status: '[ACTIVE]' },
        { name: '02_INTEGRATIONS', href: '/dashboard/integrations', status: '[LINKED]' },
        { name: '03_ANALYSIS', href: '#', status: '[LOCKED]', disabled: true },
        { name: '04_REPORTS', href: '#', status: '[LOCKED]', disabled: true },
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
                            const isActive = pathname.startsWith(item.href) && item.href !== '#';
                            return (
                                <Link
                                    key={item.name}
                                    href={item.disabled ? '#' : item.href}
                                    className={`
                                        group flex items-center justify-between p-3 border 
                                        transition-none cursor-pointer select-none
                                        ${isActive ? 'bg-black text-white border-black' : 'border-transparent hover:border-black hover:bg-white text-black'}
                                        ${item.disabled ? 'opacity-50 cursor-not-allowed hover:border-transparent hover:bg-transparent' : ''}
                                    `}
                                >
                                    <span>{item.name}</span>
                                    <span className={`text-[10px] ${isActive ? 'text-[#FF4F00]' : 'text-[#999] group-hover:text-[#FF4F00]'}`}>
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
