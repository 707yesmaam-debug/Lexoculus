'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert, ArrowRight, Calendar } from 'lucide-react';

export default function FirmSubscriptionGate({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/subscription/status');
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data);
                }
            } catch (error) {
                console.error('Failed to fetch subscription status');
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF4F00]" />
                    <div className="font-mono text-xs uppercase tracking-widest text-[#555]">
                        Verifying_Firm_Credentials...
                    </div>
                </div>
            </div>
        );
    }

    // Determine if the firm has access.
    // We expect them to have an active 'pro' or 'enterprise' subscription.
    // If not, they are shown the onboarding/waiting room wall.
    const isApproved = status && status.status === 'active' && (status.tier === 'pro' || status.tier === 'enterprise');

    if (!isApproved) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] p-6 text-black selection:bg-[#FF4F00] selection:text-white">
                <div className="bg-white border-2 border-black max-w-2xl w-full p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-6">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                            Account Pending Verification.
                        </h1>
                        <p className="font-mono text-sm leading-relaxed text-[#555]">
                            Welcome to LexOculus for Law Firms. To ensure the security and exclusivity of our dedicated firm infrastructure, your account is currently in a pending state. 
                        </p>
                    </div>

                    <div className="bg-[#FFF5F0] border border-[#FF4F00] p-6 mb-8 text-[#FF4F00]">
                        <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Next Steps
                        </h3>
                        <p className="font-mono text-sm leading-relaxed text-black">
                            Please schedule a brief onboarding session with our systems team. During this session, we will verify your firm's details, demonstrate the white-label capabilities, and activate your first Client Seats so you can begin monitoring repositories.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <a 
                            href="https://calendly.com/your-team/lexoculus-firm-onboarding" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 bg-black text-white px-6 py-4 font-mono text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FF4F00] transition-colors"
                        >
                            Schedule Onboarding <ArrowRight className="w-4 h-4" />
                        </a>
                        <button 
                            onClick={async () => {
                                await fetch('/api/auth/logout', { method: 'POST' });
                                window.location.href = '/';
                            }}
                            className="sm:w-auto w-full border border-black px-6 py-4 font-mono text-sm font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Access granted
    return <>{children}</>;
}
