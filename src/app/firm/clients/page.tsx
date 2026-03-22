'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Client = {
    id: string;
    client_name: string;
    status: string;
    last_monitored_at: string | null;
    github_repo_url: string | null;
    monitoring_enabled: boolean;
};

export default function FirmClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchClients() {
            try {
                const res = await fetch('/api/firm/clients');
                if (res.ok) {
                    const data = await res.json();
                    setClients(data.clients || []);
                }
            } catch (error) {
                console.error("Failed to fetch clients", error);
            } finally {
                setLoading(false);
            }
        }
        fetchClients();
    }, []);

    const filteredClients = clients.filter(c => 
        c.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen bg-white text-black">
            <header className="mb-12 flex items-end justify-between border-b-2 border-black pb-6">
                <div>
                    <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest uppercase">
                        {'// Client_Registry'}
                    </div>
                    <h1 className="font-serif text-4xl font-bold">Client Directory</h1>
                    <p className="font-mono text-sm text-[#555] mt-2 max-w-xl">
                        Manage active compliance audits. Invite new clients to grant delegated access to their repositories.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href="/firm/clients/new"
                        className="bg-black text-white hover:bg-[#FF4F00] px-6 py-3 flex items-center gap-2 font-mono text-sm font-bold tracking-widest uppercase transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add_Client
                    </Link>
                </div>
            </header>

            {/* Search Bar */}
            <div className="mb-8 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-black font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4F00] focus:border-[#FF4F00] transition-none"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#555]">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <div className="font-mono text-xs tracking-widest uppercase">Loading_Registry...</div>
                </div>
            ) : clients.length === 0 ? (
                <div className="border border-dashed border-gray-300 p-12 text-center">
                    <div className="font-mono text-xs text-[#555] mb-4 uppercase tracking-widest">Registry_Empty</div>
                    <p className="text-gray-500 mb-6 font-mono text-sm">No clients have been added to your firm yet.</p>
                    <Link
                        href="/firm/clients/new"
                        className="inline-flex bg-black text-white hover:bg-[#FF4F00] px-6 py-3 items-center gap-2 font-mono text-sm font-bold tracking-widest uppercase transition-colors"
                    >
                        Initialize_First_Client
                    </Link>
                </div>
            ) : (
                <div className="border border-black overflow-hidden">
                    <table className="w-full text-left font-mono text-sm">
                        <thead className="bg-[#F5F5F5] border-b border-black text-xs uppercase tracking-widest">
                            <tr>
                                <th className="p-4 font-bold">Client Name</th>
                                <th className="p-4 font-bold">Repository</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold">Last Monitored</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold">{client.client_name}</div>
                                    </td>
                                    <td className="p-4 text-[#555] truncate max-w-[200px]">
                                        {client.github_repo_url || 'Pending Client Auth'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-widest font-bold border ${
                                            client.status === 'active' ? 'bg-green-50 border-green-200 text-green-700' :
                                            client.status === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                            'bg-gray-50 border-gray-200 text-gray-700'
                                        }`}>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-[#555]">
                                        {client.last_monitored_at
                                            ? formatDistanceToNow(new Date(client.last_monitored_at), { addSuffix: true })
                                            : 'Never'
                                        }
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link
                                            href={`/firm/clients/${client.id}`}
                                            className="text-[#FF4F00] hover:underline font-bold tracking-wider text-xs uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            View_Details -&gt;
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
