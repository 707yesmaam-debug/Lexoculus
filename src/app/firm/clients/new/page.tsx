'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Link as LinkIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AddClientPage() {
    const router = useRouter();
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [onboardingLink, setOnboardingLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/firm/clients/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_name: clientName,
                    client_email: clientEmail || undefined,
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create client');
            }

            setOnboardingLink(data.onboarding_url);
            
            // If email was provided, the backend handles sending it.
            // We just show the link here for manual copying.

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (onboardingLink) {
            navigator.clipboard.writeText(onboardingLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto min-h-screen bg-white text-black">
            <div className="mb-6">
                <Link href="/firm/clients" className="font-mono text-xs text-[#555] hover:text-black hover:underline uppercase tracking-widest">
                    &lt;- Back_To_Registry
                </Link>
            </div>

            <header className="mb-10 border-b-2 border-black pb-6">
                <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest uppercase">
                    // Initialize_Client_Audit
                </div>
                <h1 className="font-serif text-3xl font-bold">New Client Onboarding</h1>
                <p className="font-mono text-sm text-[#555] mt-2">
                    Generate a secure, delegated access link for a new client. This allows the client to authorize read-only access to their specific repositories without sharing credentials.
                </p>
            </header>

            {!onboardingLink ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-[#FF4F00]/10 border border-[#FF4F00] p-4 flex gap-3 text-[#FF4F00] text-sm font-mono">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-mono font-bold uppercase tracking-wider" htmlFor="clientName">
                            Client_Entity_Name *
                        </label>
                        <input
                            id="clientName"
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full bg-white border border-black p-4 text-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] transition-none rounded-none placeholder:text-gray-300"
                            placeholder="e.g., Acme Corporation"
                            required
                        />
                        <p className="text-[10px] font-mono text-gray-500 uppercase">Internal identifier for your records.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono font-bold uppercase tracking-wider" htmlFor="clientEmail">
                            Client_Contact_Email (Optional)
                        </label>
                        <input
                            id="clientEmail"
                            type="email"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                            className="w-full bg-white border border-black p-4 text-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] transition-none rounded-none placeholder:text-gray-300"
                            placeholder="cto@acme.com"
                        />
                        <p className="text-[10px] font-mono text-gray-500 uppercase">If provided, we will email the onboarding link directly.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !clientName}
                        className="w-full bg-black hover:bg-[#FF4F00] text-white font-mono font-bold py-4 text-sm transition-colors disabled:opacity-50 disabled:hover:bg-black tracking-widest uppercase rounded-none mt-8"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'GENERATE_AUTHORIZATION_LINK ->'}
                    </button>
                </form>
            ) : (
                <div className="border border-green-500 p-8 bg-green-50">
                    <div className="flex items-center gap-3 mb-4 text-green-700">
                        <CheckCircle2 className="w-6 h-6" />
                        <h2 className="font-mono font-bold text-lg uppercase tracking-wide">Client Initialized</h2>
                    </div>
                    
                    <p className="font-mono text-sm text-green-800 mb-6">
                        Client record created for "<strong>{clientName}</strong>". 
                        {clientEmail ? ` An invitation email has been scheduled for delivery to ${clientEmail}.` : ' Please share the following secure link with your client so they can authorize repository access.'}
                    </p>

                    <div className="space-y-2">
                        <label className="text-xs font-mono font-bold uppercase tracking-wider text-green-900">
                            Secure_Delegation_Link
                        </label>
                        <div className="flex">
                            <input 
                                type="text" 
                                readOnly 
                                value={onboardingLink}
                                className="flex-1 bg-white border-y border-l border-green-500 p-4 text-green-900 font-mono text-sm focus:outline-none"
                            />
                            <button 
                                onClick={copyToClipboard}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 font-mono font-bold text-sm uppercase tracking-wider transition-colors border-y border-r border-green-600"
                            >
                                {copied ? 'COPIED!' : 'COPY'}
                            </button>
                        </div>
                        <p className="text-[10px] font-mono text-green-700 uppercase mt-2">
                            Link is single-use and expires in 48 hours.
                        </p>
                    </div>

                    <div className="mt-10">
                        <Link 
                            href="/firm/clients"
                            className="text-green-800 hover:text-green-900 underline font-mono text-sm font-bold uppercase tracking-widest"
                        >
                            RETURN_TO_REGISTRY
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
