'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ClientDetailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const clientId = params.id as string;
    
    const [clientName, setClientName] = useState('LOADING...');

    useEffect(() => {
        async function fetchClient() {
            try {
                const res = await fetch(`/api/firm/clients/${clientId}`);
                if (res.ok) {
                    const data = await res.json();
                    setClientName(data.client_name.toUpperCase());
                }
            } catch (err) {
                console.error('Failed to fetch client info', err);
            }
        }
        if (clientId) fetchClient();
    }, [clientId]);

    const tabs = [
        { name: 'OVERVIEW', href: `/firm/clients/${clientId}` },
        { name: 'GUARDIAN', href: `/firm/clients/${clientId}/guardian` },
        { name: 'REGISTRY', href: `/firm/clients/${clientId}/registry` },
        { name: 'CONFORMITY', href: `/firm/clients/${clientId}/conformity` },
        { name: 'TIMELINE', href: `/firm/clients/${clientId}/timeline` },
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* CLIENT HEADER */}
            <header className="p-8 border-b-2 border-black flex items-center justify-between bg-white sticky top-0 z-40">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/firm/clients" className="text-xs font-mono text-gray-400 hover:text-black transition-colors">
                            ← BACK_TO_DIRECTORY
                        </Link>
                        <span className="text-[10px] font-mono text-gray-300">/</span>
                        <span className="text-xs font-mono font-bold text-[#FF4F00]">CLIENT_CONTEXT</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter">
                        {clientName}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-black text-white font-mono text-xs tracking-widest uppercase">
                        Active_Audit_Mode
                    </div>
                </div>
            </header>

            {/* SUB-NAVIGATION */}
            <nav className="px-8 border-b-2 border-black bg-[#F5F5F5] flex overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`
                                px-6 py-4 font-mono text-xs tracking-widest border-r-2 border-black transition-all whitespace-nowrap
                                ${isActive 
                                    ? 'bg-black text-white' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }
                            `}
                        >
                            {tab.name}
                        </Link>
                    );
                })}
            </nav>

            {/* PAGE CONTENT */}
            <main className="flex-1 overflow-auto bg-white">
                {children}
            </main>
        </div>
    );
}
