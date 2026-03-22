'use client';

import Link from 'next/link';
import { CreditCard, Palette, Shield, ArrowRight } from 'lucide-react';

export default function FirmSettingsPage() {
    return (
        <div className="p-8">
            <div className="border-b-2 border-black pb-6 mb-8">
                <h1 className="font-serif text-3xl font-bold text-black mb-2">Firm Settings.</h1>
                <p className="font-mono text-sm text-[#555]">
                    Manage your firm&apos;s subscription, branding, and preferences.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Billing & Capacity */}
                <Link href="/firm/settings/billing" className="group bg-white border-2 border-black p-8 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-black text-white flex items-center justify-center">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#999] group-hover:text-[#FF4F00] transition-colors" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-black mb-2">Billing & Capacity</h3>
                    <p className="font-mono text-sm text-[#555]">
                        Manage client seats, view usage, and purchase additional capacity.
                    </p>
                </Link>

                {/* Branding */}
                <Link href="/firm/settings/branding" className="group bg-white border-2 border-black p-8 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-black text-white flex items-center justify-center">
                            <Palette className="w-6 h-6" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#999] group-hover:text-[#FF4F00] transition-colors" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-black mb-2">Branding</h3>
                    <p className="font-mono text-sm text-[#555]">
                        Upload your firm logo, set custom report introductions, and configure white-label settings.
                    </p>
                </Link>

                {/* Security */}
                <Link href="/firm/settings/security" className="group bg-white border-2 border-black p-8 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-black text-white flex items-center justify-center">
                            <Shield className="w-6 h-6" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#999] group-hover:text-[#FF4F00] transition-colors" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-black mb-2">Security & Access</h3>
                    <p className="font-mono text-sm text-[#555]">
                        Manage API keys, team invitations, and audit logs.
                    </p>
                </Link>
            </div>
        </div>
    );
}
