'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';

export default function ClientConformityPage() {
    const params = useParams();
    const clientId = params.id as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [systems, setSystems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchConformityData() {
            try {
                // Fetch systems and their assessments
                const res = await fetch(`/api/ai-systems?firm_client_id=${clientId}`);
                if (res.ok) {
                    const data = await res.json();
                    // In a real app, we'd join with assessments. 
                    // For now, we'll simulate the assessment data if missing
                    setSystems(data.ai_systems || []);
                }
            } catch (err) {
                console.error('Failed to fetch conformity data', err);
            } finally {
                setLoading(false);
            }
        }
        fetchConformityData();
    }, [clientId]);

    if (loading) return <div className="p-8 font-mono text-xs">CALCULATING_COMPLIANCE_ROADMAPS...</div>;

    return (
        <div className="p-8 space-y-8 max-w-7xl">
            <div>
                <h2 className="text-2xl font-black flex items-center gap-2">
                    <ClipboardList className="text-[#FF4F00]" /> CONFORMITY_ROADMAP
                </h2>
                <p className="text-gray-500 font-mono text-xs uppercase mt-1">
                    EU AI Act alignment and assessment progress
                </p>
            </div>

            <div className="space-y-6">
                {systems.length > 0 ? (
                    systems.map((system) => {
                        const progress = system.conformity_progress || 0;
                        return (
                            <div key={system.id} className="border-2 border-black overflow-hidden bg-white hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                                <div className="p-6 bg-[#F5F5F5] border-b-2 border-black flex justify-between items-center">
                                    <div>
                                        <div className="text-xs font-mono text-gray-400 mb-1 tracking-widest uppercase">Target_System</div>
                                        <h3 className="text-xl font-bold">{system.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-[10px] font-mono text-gray-400 mb-1">TOTAL_PROGRESS</div>
                                            <div className="text-lg font-black">{progress}%</div>
                                        </div>
                                        <div className="w-32 h-3 bg-white border border-black overflow-hidden">
                                            <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-4">
                                        <div className="text-[10px] font-mono font-bold text-gray-400 uppercase flex items-center gap-2">
                                            <Circle size={10} className="fill-black" /> ANNEX_III_CLASSIFICATION
                                        </div>
                                        <div className="p-4 border border-black bg-white">
                                            <div className="text-xs font-bold mb-1">{system.risk_classification || 'NOT_DETERMINED'}</div>
                                            <p className="text-[10px] text-gray-500 font-mono italic">
                                                Based on detected HR/LMS libraries and intended purpose analysis.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="text-[10px] font-mono font-bold text-gray-400 uppercase flex items-center gap-2">
                                            <Clock size={10} className="fill-black" /> KEY_MILESTONES
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] font-mono">
                                                <CheckCircle2 size={12} className="text-green-500" /> SYSTEM_REGISTRATION
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-mono">
                                                <CheckCircle2 size={12} className="text-green-500" /> RISK_MANAGEMENT_INIT
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-mono opacity-40">
                                                <Circle size={12} /> CONFORMITY_CERTIFICATE
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-end">
                                        <button className="w-full bg-black text-white px-4 py-4 font-mono text-xs uppercase tracking-widest flex justify-between items-center group hover:bg-[#FF4F00] transition-colors">
                                            GO_TO_ASSESSMENT
                                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="border-2 border-dashed border-black p-20 text-center">
                         <div className="text-gray-400 font-mono text-sm uppercase">NO_SYSTEMS_PENDING_CONFORMITY</div>
                    </div>
                )}
            </div>
        </div>
    );
}
