'use client';

import { createClient } from '@/lib/infra/supabase';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import OpticalLogo from '@/components/OpticalLogo';
import FirmSubscriptionGate from '@/components/FirmSubscriptionGate';

export default function FirmLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [firmData, setFirmData] = useState<{ 
        email: string | null, 
        firmName: string | null,
        firmLogo: string | null,
        brandingColor: string | null
    }>({ 
        email: null, 
        firmName: null,
        firmLogo: null,
        brandingColor: '#000000'
    });
    const router = useRouter();
    useFirmData(setFirmData);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const params = useParams();
    const clientId = params?.id as string | undefined;

    const navItems = [
        {
            name: '01_CLIENTS',
            href: '/firm/clients',
            isActive: pathname === '/firm/clients' || (pathname.startsWith('/firm/clients/') && !clientId)
        },
        // If a client is selected, show client-specific sub-nav in sidebar as well
        ...(clientId ? [
            {
                name: '↳ OVERVIEW',
                href: `/firm/clients/${clientId}`,
                isActive: pathname === `/firm/clients/${clientId}`
            },
            {
                name: '↳ GUARDIAN',
                href: `/firm/clients/${clientId}/guardian`,
                isActive: pathname === `/firm/clients/${clientId}/guardian`
            },
            {
                name: '↳ REGISTRY',
                href: `/firm/clients/${clientId}/registry`,
                isActive: pathname === `/firm/clients/${clientId}/registry`
            },
            {
                name: '↳ CONFORMITY',
                href: `/firm/clients/${clientId}/conformity`,
                isActive: pathname === `/firm/clients/${clientId}/conformity`
            },
            {
                name: '↳ TIMELINE',
                href: `/firm/clients/${clientId}/timeline`,
                isActive: pathname === `/firm/clients/${clientId}/timeline`
            }
        ] : []),
        {
            name: '02_SCANS',
            href: '/firm/scans',
            isActive: pathname === '/firm/scans' || pathname.startsWith('/firm/scans/'),
            disabled: !clientId && pathname.startsWith('/firm/scans')
        },
        {
            name: '03_REPORTS',
            href: '/firm/reports',
            isActive: pathname === '/firm/reports' || pathname.startsWith('/firm/reports/')
        },
        {
            name: '04_SETTINGS',
            href: '/firm/settings',
            isActive: pathname.startsWith('/firm/settings'),
            disabled: false
        },
    ];

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            sessionStorage.clear();
        } catch (error) {
            console.error('Logout failed:', error);
        }
        window.location.href = '/';
    };

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="font-mono text-xs">LOADING_FIRM_INTERFACE...</div></div>}>
            <FirmSubscriptionGate>
                <div className="min-h-screen flex flex-col md:flex-row bg-white text-black">
                    {/* LEFT SIDEBAR: Navigation */}
                    <aside className="w-full md:w-[350px] md:h-screen md:sticky md:top-0 border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col bg-[#F5F5F5] z-50">
                        <div className="p-6 md:p-0 flex items-center justify-between md:block">
                            <div className="md:p-6 md:pb-0">
                                <Link href="/firm/clients">
                                {firmData.firmLogo ? (
                                    <div className="h-12 w-auto mb-2 border-2 border-black bg-white flex items-center justify-center p-1">
                                        <img src={firmData.firmLogo} alt={firmData.firmName || 'Firm Logo'} className="max-h-full max-w-full object-contain" />
                                    </div>
                                ) : (
                                    <OpticalLogo />
                                )}
                                <div 
                                    className="mt-2 text-xs font-mono font-bold tracking-widest uppercase"
                                    style={{ color: firmData.brandingColor || '#FF4F00' }}
                                >
                                    LAW_FIRM_EDITION
                                </div>
                                </Link>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 border border-black hover:bg-black hover:text-white transition-colors">
                                {isMobileMenuOpen ? 'CLOSE' : 'MENU'}
                            </button>
                        </div>

                        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col justify-between flex-1 p-6 pt-0`}>
                            <div className="mt-6 md:mt-12 overflow-y-auto">
                                <nav className="flex flex-col gap-1 font-mono text-[11px]">
                                    {navItems.map((item: any) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={(e) => {
                                                if (item.disabled) {
                                                    e.preventDefault();
                                                    return;
                                                }
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={`
                                                group flex items-center justify-between px-3 py-2.5 font-bold uppercase tracking-widest
                                                ${item.isActive
                                                    ? 'bg-black text-white'
                                                    : item.disabled
                                                        ? 'text-gray-400 cursor-not-allowed opacity-50'
                                                        : 'text-gray-600 hover:bg-gray-200 hover:text-black'
                                                }
                                                ${item.name.startsWith('↳') ? 'ml-4 border-l border-gray-300 py-1.5' : 'mt-1'}
                                                transition-all
                                            `}
                                        >
                                            <span className="flex items-center gap-3">{item.name}</span>
                                        </Link>
                                    ))}
                                </nav>
                            </div>

                            <div className="mt-auto pt-6">
                                <div className="font-mono text-xs mb-4 pt-4 border-t border-[#E5E5E5] text-[#555]">
                                    <div className="flex justify-between mb-2">
                                        <span>FIRM:</span>
                                        <span className="truncate max-w-[150px] font-bold text-black">{firmData.firmName || 'Loading...'}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span>OPERATOR:</span>
                                        <span className="truncate max-w-[150px]">{firmData.email}</span>
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
            </FirmSubscriptionGate>
        </Suspense>
    );
}

// Hook to handle auth state and firm data loading
function useFirmData(setFirmData: React.Dispatch<React.SetStateAction<{ 
    email: string | null, 
    firmName: string | null,
    firmLogo: string | null,
    brandingColor: string | null
}>>) {
    useEffect(() => {
        let mounted = true;
        const syncUser = async () => {
            try {
                const res = await fetch('/api/user/sync', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    if (mounted && data.success) {
                        setFirmData({
                            email: data.email || null,
                            firmName: data.firmName || null,
                            firmLogo: data.firmLogo || null,
                            brandingColor: data.brandingColor || '#000000'
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to sync user data', err);
            }
        };
        syncUser();
        return () => { mounted = false; };
    }, [setFirmData]);
}
