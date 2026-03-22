'use client';

import { useState, useEffect } from 'react';
import { Shield, Key, Plus, Trash2, Check, Loader2, Info, Github, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function FirmSecurityPage() {
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [data, setData] = useState<any>({ authorized_accounts: [], api_keys: [] });
    const [newKeyName, setNewKeyName] = useState('');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/firm/settings/security');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch security data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const generateKey = async () => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/firm/settings/security', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate', name: newKeyName })
            });
            if (res.ok) {
                const json = await res.json();
                setGeneratedKey(json.key);
                setNewKeyName('');
                fetchData();
            }
        } catch (error) {
            alert('Failed to generate key');
        } finally {
            setActionLoading(false);
        }
    };

    const revokeKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/firm/settings/security', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'revoke', key_id: id })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            alert('Failed to revoke key');
        } finally {
            setActionLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard');
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF4F00]" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl">
            <div className="border-b-2 border-black pb-6 mb-8">
                <h1 className="font-serif text-3xl font-bold text-black mb-2">Security & Access.</h1>
                <p className="font-mono text-sm text-[#555]">
                    Manage access credentials and authorized third-party connections.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* SECTION 1: API KEYS */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-black" />
                        <h2 className="font-serif text-xl font-bold uppercase tracking-tight">Universal Engine API Keys</h2>
                    </div>

                    {generatedKey && (
                        <div className="p-6 border-2 border-[#FF4F00] bg-orange-50 space-y-4">
                            <div className="flex items-center gap-2 text-[#FF4F00] font-bold font-mono text-xs uppercase underline">
                                <Info className="w-4 h-4" />
                                Save your key now
                            </div>
                            <p className="text-[10px] font-mono text-[#555] uppercase">
                                For security reasons, this key will only be shown once. Copy it now and store it safely.
                            </p>
                            <div className="flex gap-2">
                                <code className="flex-1 bg-white border border-[#FF4F00] p-3 font-mono text-xs break-all text-black font-bold">
                                    {generatedKey}
                                </code>
                                <Button onClick={() => copyToClipboard(generatedKey)} className="bg-black text-white rounded-none hover:bg-black">
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                            <Button onClick={() => setGeneratedKey(null)} variant="outline" className="w-full border-black rounded-none font-mono text-xs uppercase h-10">
                                I HAVE SAVED THE KEY
                            </Button>
                        </div>
                    )}

                    <div className="p-6 bg-[#F5F5F5] border-2 border-black">
                        <h3 className="font-mono text-xs font-bold uppercase tracking-widest mb-4">Generate New Engine Key</h3>
                        <div className="flex gap-4">
                            <Input 
                                value={newKeyName} 
                                onChange={(e) => setNewKeyName(e.target.value)}
                                className="rounded-none border-2 border-black font-mono flex-1 text-xs"
                                placeholder="Key Name (e.g. CI/CD Scanner)"
                            />
                            <Button 
                                onClick={generateKey}
                                disabled={actionLoading || !newKeyName}
                                className="bg-black text-white hover:bg-[#FF4F00] transition-colors rounded-none px-6 font-mono font-bold uppercase tracking-widest flex items-center gap-2 text-xs"
                            >
                                <Plus className="w-4 h-4" />
                                Generate
                            </Button>
                        </div>
                    </div>

                    <div className="border-2 border-black bg-white overflow-hidden">
                        <table className="w-full text-left font-mono text-xs border-collapse">
                            <thead className="bg-black text-white uppercase tracking-widest">
                                <tr>
                                    <th className="px-4 py-3">NAME</th>
                                    <th className="px-4 py-3">PREFIX</th>
                                    <th className="px-4 py-3 text-right">ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black">
                                {data.api_keys.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-[#999] uppercase tracking-widest font-bold">NO_KEYS_FOUND</td></tr>
                                ) : data.api_keys.map((key: any) => (
                                    <tr key={key.id} className="hover:bg-[#F9F9F9]">
                                        <td className="px-4 py-4 font-bold text-black border-r border-[#E5E5E5]">{key.name}</td>
                                        <td className="px-4 py-4 text-[#555]">{key.key_prefix}...</td>
                                        <td className="px-4 py-4 text-right">
                                            <button 
                                                onClick={() => revokeKey(key.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SECTION 2: AUTHORIZED ACCOUNTS */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <Github className="w-5 h-5 text-black" />
                        <h2 className="font-serif text-xl font-bold uppercase tracking-tight">Authorized Clients</h2>
                    </div>

                    <p className="font-mono text-xs text-[#555] leading-relaxed">
                        The following client organizations have granted your firm delegated access to their GitHub repositories for compliance auditing.
                    </p>

                    <div className="border-2 border-black bg-white overflow-hidden">
                        <table className="w-full text-left font-mono text-xs border-collapse">
                            <thead className="bg-[#F5F5F5] border-b-2 border-black uppercase text-black tracking-widest">
                                <tr>
                                    <th className="px-4 py-3">CLIENT</th>
                                    <th className="px-4 py-3">GITHUB_USER</th>
                                    <th className="px-4 py-3">GRANTED</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E5E5]">
                                {data.authorized_accounts.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-[#999] uppercase tracking-widest">NO_CONNECTIONS_ACTIVE</td></tr>
                                ) : data.authorized_accounts.map((acc: any) => (
                                    <tr key={acc.id} className="hover:bg-[#F9F9F9]">
                                        <td className="px-4 py-4 font-bold text-black">{acc.client_name}</td>
                                        <td className="px-4 py-4 flex items-center gap-2">
                                            <Shield className="w-3 h-3 text-green-600" />
                                            {acc.github_username}
                                        </td>
                                        <td className="px-4 py-4 text-[#999]">
                                            {new Date(acc.granted_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-4 border-2 border-black bg-white flex gap-4 items-start">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <p className="text-[10px] font-mono text-[#555] leading-relaxed uppercase">
                            TO REVOKE ACCESS FOR A SPECIFIC CLIENT, YOU MUST ARCHIVE THE CLIENT IN THE CLIENTS DASHBOARD OR CONTACT THE CLIENT TO REVOKE THE OAUTH PERMISSIONS FROM THEIR GITHUB SETTINGS.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
