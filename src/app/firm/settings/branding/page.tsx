'use client';

import { useState, useEffect } from 'react';
import { Palette, Upload, Check, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function FirmBrandingPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [firm, setFirm] = useState<any>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBranding() {
            try {
                const res = await fetch('/api/firm/settings/branding');
                if (res.ok) {
                    const data = await res.json();
                    setFirm(data.firm);
                }
            } catch (error) {
                console.error('Failed to fetch branding:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchBranding();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/firm/settings/branding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(firm)
            });
            if (res.ok) {
                setMessage('Branding settings updated successfully.');
            } else {
                setMessage('Error updating branding settings.');
            }
        } catch (error) {
            setMessage('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF4F00]" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-3xl">
            <div className="border-b-2 border-black pb-6 mb-8">
                <h1 className="font-serif text-3xl font-bold text-black mb-2">Branding.</h1>
                <p className="font-mono text-sm text-[#555]">
                    Customize how your firm appears to clients and in reports.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="space-y-4">
                    <label className="font-mono text-xs uppercase tracking-widest text-black block">Firm Name</label>
                    <Input 
                        value={firm?.name || ''} 
                        onChange={(e) => setFirm({...firm, name: e.target.value})}
                        className="rounded-none border-2 border-black font-mono"
                        placeholder="Enter firm name..."
                    />
                </div>

                <div className="space-y-4">
                    <label className="font-mono text-xs uppercase tracking-widest text-black block">Logo URL</label>
                    <div className="flex gap-4">
                        <Input 
                            value={firm?.logo_url || ''} 
                            onChange={(e) => setFirm({...firm, logo_url: e.target.value})}
                            className="rounded-none border-2 border-black font-mono flex-1"
                            placeholder="https://..."
                        />
                        {firm?.logo_url && (
                            <div className="w-10 h-10 border-2 border-black flex items-center justify-center overflow-hidden bg-white">
                                <img src={firm.logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="font-mono text-xs uppercase tracking-widest text-black block">Report Introduction (Custom Text)</label>
                    <Textarea 
                        value={firm?.custom_intro || ''} 
                        onChange={(e) => setFirm({...firm, custom_intro: e.target.value})}
                        className="rounded-none border-2 border-black font-mono min-h-[150px]"
                        placeholder="Welcome your clients to their compliance report..."
                    />
                    <div className="flex gap-2 text-[#999] text-[10px] font-mono leading-tight">
                        <Info className="w-3 h-3 flex-shrink-0" />
                        <span>THIS TEXT WILL APPEAR ON THE SECOND PAGE OF EVERY GENERATED COMPLIANCE REPORT.</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="font-mono text-xs uppercase tracking-widest text-black block">Branding Color</label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="color" 
                            value={firm?.branding_color || '#000000'} 
                            onChange={(e) => setFirm({...firm, branding_color: e.target.value})}
                            className="w-12 h-12 border-2 border-black cursor-pointer bg-transparent"
                        />
                        <Input 
                            value={firm?.branding_color || ''} 
                            onChange={(e) => setFirm({...firm, branding_color: e.target.value})}
                            className="rounded-none border-2 border-black font-mono w-32 uppercase"
                        />
                    </div>
                </div>

                {message && (
                    <div className="p-4 border-2 border-black bg-blue-50 text-blue-800 font-mono text-xs uppercase tracking-widest">
                        {message}
                    </div>
                )}

                <div className="pt-8 border-t-2 border-black">
                    <Button 
                        disabled={saving}
                        className="bg-black text-white hover:bg-[#FF4F00] transition-colors rounded-none px-8 py-6 font-mono font-bold uppercase tracking-widest flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save Branding Configuration
                    </Button>
                </div>
            </form>
        </div>
    );
}
