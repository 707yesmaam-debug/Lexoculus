'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Clock, Shield, FileText } from 'lucide-react';

export default function ClientTimelinePage() {
    const params = useParams();
    const clientId = params.id as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTimeline() {
            try {
                // Fetch events for this client (we'll use a mocked list for now or fetch by client_id)
                // In production, this would be a consolidated audit log / event stream
                const res = await fetch(`/api/audit-logs?firm_client_id=${clientId}`);
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data.logs || []);
                }
            } catch (err) {
                console.error('Failed to fetch timeline', err);
            } finally {
                setLoading(false);
            }
        }
        fetchTimeline();
    }, [clientId]);

    if (loading) return <div className="p-8 font-mono text-xs">RECONSTRUCTING_AUDIT_TRAIL...</div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl">
            <div>
                <h2 className="text-2xl font-black flex items-center gap-2">
                    <Clock className="text-[#FF4F00]" /> COMPLIANCE_TIMELINE
                </h2>
                <p className="text-gray-500 font-mono text-xs uppercase mt-1">
                    Immutable record of all compliance-relevant events
                </p>
            </div>

            <div className="relative">
                {/* VERTICAL LINE */}
                <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-black"></div>

                <div className="space-y-12">
                    {events.length > 0 ? (
                        events.map((event, index) => (
                            <div key={event.id} className="relative pl-16">
                                {/* NODE DOT */}
                                <div className="absolute left-[20px] top-2 w-3 h-3 bg-black border-2 border-white ring-2 ring-black rounded-full z-10"></div>
                                
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    <div className="min-w-[150px]">
                                        <div className="text-[10px] font-mono font-bold text-[#FF4F00]">{new Date(event.created_at).toLocaleDateString()}</div>
                                        <div className="text-[10px] font-mono text-gray-400 uppercase">{new Date(event.created_at).toLocaleTimeString()}</div>
                                    </div>
                                    
                                    <div className="flex-1 bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            {event.action.includes('SCAN') || event.action.includes('SYSTEM') ? <Shield size={14} /> : <FileText size={14} />}
                                            <div className="text-xs font-black uppercase tracking-tight">{event.action.replace(/_/g, ' ')}</div>
                                        </div>
                                        <p className="text-sm font-mono text-gray-600 mb-4">{event.description}</p>
                                        
                                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400">
                                            <span className="bg-gray-100 px-2 py-1">ENTITY: {event.entity_type}</span>
                                            <span className="bg-gray-100 px-2 py-1">OPERATOR: {event.user_email || 'SYSTEM'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="relative pl-16 py-20 text-center">
                            <div className="text-gray-400 font-mono text-sm uppercase">NO_COMPLIANCE_EVENTS_RECORDED_YET</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
