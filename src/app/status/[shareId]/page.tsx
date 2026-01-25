'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Shield, ShieldCheck, ShieldAlert, Clock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface StatusData {
    system_name: string;
    description: string | null;
    risk_classification: string | null;
    risk_score: number | null;
    lifecycle_stage: string;
    last_scanned_at: string | null;
    compliance_status: 'assessed' | 'pending';
    verified_by: string;
}

interface ErrorData {
    error: string;
    message?: string;
}

export default function PublicStatusPage() {
    const params = useParams();
    const shareId = params.shareId as string;

    const [status, setStatus] = useState<StatusData | null>(null);
    const [error, setError] = useState<ErrorData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatus();
    }, [shareId]);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/status/${shareId}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data);
            } else {
                setStatus(data);
            }
        } catch (err) {
            setError({ error: 'network_error', message: 'Failed to load status' });
        } finally {
            setLoading(false);
        }
    };

    const getRiskDisplay = (classification: string | null) => {
        switch (classification) {
            case 'UNACCEPTABLE':
                return {
                    label: 'UNACCEPTABLE RISK',
                    color: 'bg-red-600 text-white',
                    icon: <ShieldAlert className="w-8 h-8" />,
                    borderColor: 'border-red-600'
                };
            case 'HIGH_RISK':
                return {
                    label: 'HIGH RISK',
                    color: 'bg-[#FF4F00] text-white',
                    icon: <ShieldAlert className="w-8 h-8" />,
                    borderColor: 'border-[#FF4F00]'
                };
            case 'LIMITED_RISK':
                return {
                    label: 'LIMITED RISK',
                    color: 'bg-yellow-500 text-black',
                    icon: <Shield className="w-8 h-8" />,
                    borderColor: 'border-yellow-500'
                };
            case 'MINIMAL_RISK':
                return {
                    label: 'MINIMAL RISK',
                    color: 'bg-green-600 text-white',
                    icon: <ShieldCheck className="w-8 h-8" />,
                    borderColor: 'border-green-600'
                };
            default:
                return {
                    label: 'PENDING ASSESSMENT',
                    color: 'bg-gray-400 text-white',
                    icon: <Clock className="w-8 h-8" />,
                    borderColor: 'border-gray-400'
                };
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-4" />
                    <div className="font-mono text-xs text-[#999] uppercase tracking-widest">
                        LOADING_STATUS...
                    </div>
                </div>
            </div>
        );
    }

    // Error states
    if (error) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
                <div className="max-w-md w-full border-2 border-black bg-white p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-[#FF4F00] mx-auto mb-4" />

                    {error.error === 'subscription_inactive' ? (
                        <>
                            <h1 className="font-serif text-2xl font-bold mb-4">Status Unavailable</h1>
                            <p className="font-mono text-sm text-[#555] mb-6">
                                This compliance status page is temporarily unavailable.
                                The system owner needs to maintain an active subscription.
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="font-serif text-2xl font-bold mb-4">Page Not Found</h1>
                            <p className="font-mono text-sm text-[#555] mb-6">
                                {error.message || 'This status page does not exist or has been disabled.'}
                            </p>
                        </>
                    )}

                    <a
                        href="https://lexoculus.com"
                        className="inline-flex items-center gap-2 font-mono text-xs text-[#FF4F00] hover:underline"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Learn about LexOculus
                    </a>
                </div>
            </div>
        );
    }

    // Success state
    const risk = getRiskDisplay(status?.risk_classification || null);

    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            {/* Header */}
            <header className="bg-white border-b-2 border-black">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="font-serif text-xl font-bold tracking-tight">
                        LexOculus
                    </div>
                    <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest">
                        EU AI ACT COMPLIANCE
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Status Card */}
                <div className={`border-2 ${risk.borderColor} bg-white mb-8`}>
                    <div className={`${risk.color} p-6 flex items-center gap-4`}>
                        {risk.icon}
                        <div>
                            <div className="font-mono text-xs uppercase tracking-widest opacity-75 mb-1">
                                EU AI ACT CLASSIFICATION
                            </div>
                            <div className="font-serif text-2xl font-bold">
                                {risk.label}
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <h1 className="font-serif text-3xl font-bold mb-3">{status?.system_name}</h1>
                        {status?.description && (
                            <p className="font-mono text-sm text-[#555] mb-6">{status.description}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div>
                                <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">
                                    RISK SCORE
                                </div>
                                <div className="font-serif text-2xl font-bold">
                                    {status?.risk_score ?? '—'}<span className="text-[#999] text-sm">/100</span>
                                </div>
                            </div>
                            <div>
                                <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">
                                    LIFECYCLE STAGE
                                </div>
                                <div className="font-mono text-sm font-medium uppercase">
                                    {status?.lifecycle_stage || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">
                                    LAST ASSESSED
                                </div>
                                <div className="font-mono text-sm">
                                    {status?.last_scanned_at
                                        ? new Date(status.last_scanned_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                        : 'Not yet assessed'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Verification Badge */}
                <div className="border-2 border-black bg-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                            <div className="font-mono text-xs uppercase tracking-widest text-[#999]">
                                VERIFIED BY
                            </div>
                            <div className="font-serif text-lg font-bold">LexOculus</div>
                        </div>
                    </div>
                    <a
                        href="https://lexoculus.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-[#FF4F00] hover:underline flex items-center gap-1"
                    >
                        Learn more <ExternalLink className="w-3 h-3" />
                    </a>
                </div>

                {/* Footer Note */}
                <div className="mt-8 text-center font-mono text-[10px] text-[#999] uppercase tracking-widest">
                    This compliance status is based on automated code analysis under the EU AI Act.
                </div>
            </main>
        </div>
    );
}
