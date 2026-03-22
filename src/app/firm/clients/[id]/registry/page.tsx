'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, Search, ExternalLink } from 'lucide-react';

export default function ClientRegistryPage() {
    const params = useParams();
    const clientId = params.id as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [systems, setSystems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSystems() {
            try {
                // Fetch AI systems filtered by client ID
                const res = await fetch(`/api/ai-systems?firm_client_id=${clientId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSystems(data);
                }
            } catch (err) {
                console.error('Failed to fetch systems', err);
            } finally {
                setLoading(false);
            }
        }
        fetchSystems();
    }, [clientId]);

    if (loading) return <div className="p-8 font-mono text-xs">SCANNING_INVENTORY...</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-2xl font-black">SYSTEM_REGISTRY</h2>
                    <p className="text-gray-500 font-mono text-xs uppercase mt-1 tracking-tight">
                        Inventory of detected AI assets and components
                    </p>
                </div>
                <div className="flex items-center gap-2 border-2 border-black px-3 py-2 bg-[#F5F5F5]">
                    <Search size={14} className="text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="FILTER_SYSTEMS..." 
                        className="bg-transparent border-none outline-none font-mono text-xs w-48"
                    />
                </div>
            </div>

            {systems.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {systems.map((system) => (
                        <div key={system.id} className="border-2 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <div className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-black flex items-center justify-center text-white">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight">{system.name}</h3>
                                        <div className="flex gap-4 mt-1">
                                            <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                                                <ExternalLink size={10} /> {system.source_repo_url?.replace('https://github.com/', '')}
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-[#FF4F00] uppercase">
                                                {system.risk_classification || 'NOT_CLASSIFIED'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="px-4 py-2 border border-black font-mono text-[10px] hover:bg-black hover:text-white transition-colors">
                                        VIEW_AUDIT_TRAIL
                                    </button>
                                    <button className="px-4 py-2 bg-black text-white font-mono text-[10px] hover:bg-[#FF4F00] transition-colors">
                                        MANAGE_SYSTEM
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="border-2 border-dashed border-black p-20 text-center">
                    <div className="text-gray-400 font-mono text-sm">NO_SYSTEMS_REGISTERED_FOR_THIS_CLIENT</div>
                    <button className="mt-4 bg-black text-white px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-[#FF4F00] transition-colors">
                        TRIGGER_DISCOVERY_SCAN
                    </button>
                </div>
            )}
        </div>
    );
}
