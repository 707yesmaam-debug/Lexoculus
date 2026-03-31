'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Clock, AlertCircle, CheckCircle2,
    AlertTriangle, Calendar, Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface Deadline {
    id: string;
    date: string;
    title: string;
    description: string;
    article: string;
    applies_to: string[];
    status: 'passed' | 'critical' | 'upcoming' | 'future' | 'proposed';
    days_remaining: number;
    penalties?: string;
    is_proposed?: boolean;
}

interface TimelineData {
    total_deadlines: number;
    passed_deadlines: number;
    critical_deadlines: number;
    upcoming_deadlines: number;
    future_deadlines: number;
    proposed_deadlines: number;
    next_deadline: Deadline | null;
    most_urgent_action: string;
    deadlines: Deadline[];
}

interface AiSystemInfo {
    id: string;
    name: string;
    risk_classification: string;
    is_gpai_deployer: boolean;
    is_gpai_provider: boolean;
}

export default function TimelinePage() {
    const router = useRouter();
    const [aiSystems, setAiSystems] = useState<AiSystemInfo[]>([]);
    const [selectedSystem, setSelectedSystem] = useState<string>('all');
    const [timeline, setTimeline] = useState<TimelineData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedDeadline, setExpandedDeadline] = useState<string | null>(null);

    // Fetch AI systems list
    useEffect(() => {
        async function fetchSystems() {
            try {
                const res = await fetch('/api/ai-systems');
                if (res.ok) {
                    const data = await res.json();
                    setAiSystems(data.ai_systems || []);
                }
            } catch (e) {
                console.error('Failed to fetch AI systems', e);
            }
        }
        fetchSystems();
    }, []);

    // Fetch timeline for selected system
    useEffect(() => {
        async function fetchTimeline() {
            try {
                setIsLoading(true);
                setError(null);
                const res = await fetch(`/api/compliance-timeline/${selectedSystem}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Failed to load timeline');

                setTimeline(data.timeline);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load');
            } finally {
                setIsLoading(false);
            }
        }
        fetchTimeline();
    }, [selectedSystem]);

    const statusConfig = {
        passed: {
            color: 'bg-red-500',
            textColor: 'text-red-600',
            borderColor: 'border-red-200',
            bgColor: 'bg-red-50',
            icon: CheckCircle2,
            label: 'PASSED'
        },
        critical: {
            color: 'bg-[#FF4F00]',
            textColor: 'text-[#FF4F00]',
            borderColor: 'border-[#FF4F00]/30',
            bgColor: 'bg-[#FFF5F0]',
            icon: AlertTriangle,
            label: 'CRITICAL'
        },
        upcoming: {
            color: 'bg-yellow-500',
            textColor: 'text-yellow-700',
            borderColor: 'border-yellow-200',
            bgColor: 'bg-yellow-50',
            icon: Clock,
            label: 'UPCOMING'
        },
        future: {
            color: 'bg-emerald-500',
            textColor: 'text-emerald-600',
            borderColor: 'border-emerald-200',
            bgColor: 'bg-emerald-50',
            icon: Calendar,
            label: 'FUTURE'
        },
        proposed: {
            color: 'bg-slate-400',
            textColor: 'text-slate-600',
            borderColor: 'border-slate-200',
            bgColor: 'bg-slate-50',
            icon: Calendar,
            label: 'PROPOSED'
        },
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-black border-t-[#FF4F00] animate-spin rounded-full" />
                    <p className="font-mono text-sm text-[#555] tracking-widest uppercase">Calculating_Deadlines...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-8 md:p-12">
            {/* Header */}
            <div className="mb-12 border-b-2 border-black pb-8">
                <Link href="/dashboard/registry" className="inline-flex items-center text-[#555] hover:text-black font-mono text-xs uppercase tracking-widest mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back_to_Registry
                </Link>

                <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                    <div>
                        <div className="font-mono text-xs text-[#FF4F00] mb-2 tracking-widest uppercase">PHASE_06 // IMPLEMENTATION_TIMELINE</div>
                        <h1 className="font-serif text-4xl md:text-5xl font-bold text-black tracking-tight mb-2">
                            Compliance Timeline.
                        </h1>
                        <p className="font-mono text-sm text-[#555] max-w-xl leading-relaxed">
                            EU AI Act staggered deadlines per Article 113. Filtered by your system&apos;s classification.
                        </p>
                    </div>
                </div>
            </div>

            {/* System Selector */}
            {aiSystems.length > 0 && (
                <div className="mb-8">
                    <label className="font-mono text-xs text-[#555] uppercase tracking-widest block mb-2">Select_AI_System</label>
                    <select
                        value={selectedSystem}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSystem(e.target.value)}
                        className="border-2 border-black bg-white px-4 py-2 font-mono text-sm text-black w-full max-w-md appearance-none cursor-pointer hover:border-[#FF4F00] transition-colors"
                    >
                        <option value="all">All Deadlines (Master Timeline)</option>
                        {aiSystems.map((sys: AiSystemInfo) => (
                            <option key={sys.id} value={sys.id}>
                                {sys.name} — {sys.risk_classification || 'Unclassified'}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-8 bg-[#FFF5F0] border-l-4 border-[#FF4F00] p-6 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-[#FF4F00] flex-shrink-0" />
                    <p className="font-mono text-xs text-black">{error}</p>
                </div>
            )}

            {/* Summary Cards */}
            {timeline && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {([
                        { label: 'Passed', value: timeline.passed_deadlines, status: 'passed' as const },
                        { label: 'Critical (<90d)', value: timeline.critical_deadlines, status: 'critical' as const },
                        { label: 'Upcoming', value: timeline.upcoming_deadlines, status: 'upcoming' as const },
                        { label: 'Future', value: timeline.future_deadlines, status: 'future' as const },
                    ] as const).map((card) => (
                        <div key={card.label} className={`border-2 border-black p-4 ${card.value > 0 ? statusConfig[card.status].bgColor : 'bg-white'}`}>
                            <span className={`font-mono text-3xl font-bold ${card.value > 0 ? statusConfig[card.status].textColor : 'text-[#CCC]'}`}>
                                {card.value}
                            </span>
                            <p className="font-mono text-[10px] text-[#555] uppercase tracking-widest mt-1">{card.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Urgent Action */}
            {timeline?.most_urgent_action && (
                <div className="mb-8 border-2 border-black bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-[#FF4F00]" />
                        <span className="font-mono text-[10px] text-[#FF4F00] uppercase tracking-widest font-bold">Most Urgent Action</span>
                    </div>
                    <p className="font-mono text-sm text-white leading-relaxed">{timeline.most_urgent_action}</p>
                </div>
            )}

            {/* Timeline */}
            {timeline && timeline.deadlines.length > 0 && (
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-black/10" />

                    <div className="space-y-4">
                        {timeline.deadlines.map((deadline: Deadline) => {
                            const config = statusConfig[deadline.status];
                            const StatusIcon = config.icon;
                            const isExpanded = expandedDeadline === deadline.id;

                            return (
                                <div key={deadline.id} className="relative pl-12">
                                    {/* Timeline dot */}
                                    <div className={`absolute left-2.5 top-5 w-4 h-4 rounded-full ${config.color} border-2 border-white shadow-sm z-10`} />

                                    <div className={`border-2 ${config.borderColor} ${isExpanded ? config.bgColor : 'bg-white'} transition-colors`}>
                                        <button
                                            onClick={() => setExpandedDeadline(isExpanded ? null : deadline.id)}
                                            className="w-full px-6 py-4 flex items-center justify-between text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <StatusIcon className={`w-5 h-5 ${config.textColor}`} />
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono text-[10px] text-[#999] uppercase">
                                                            {new Date(deadline.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className={`font-mono text-[9px] ${config.textColor} ${config.bgColor} border ${config.borderColor} px-1.5 py-0.5 uppercase tracking-widest`}>
                                                            {config.label}
                                                        </span>
                                                        {deadline.status !== 'passed' && (
                                                            <span className="font-mono text-[10px] text-[#999]">
                                                                {deadline.days_remaining} days
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-serif text-lg font-bold text-black mt-1">{deadline.title}</h3>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[10px] text-[#FF4F00] hidden md:block">{deadline.article}</span>
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-[#999]" /> : <ChevronDown className="w-4 h-4 text-[#999]" />}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-6 pb-4 border-t border-black/10 pt-4 space-y-3">
                                                <p className="font-mono text-xs text-[#555] leading-relaxed">{deadline.description}</p>

                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] text-[#FF4F00]">{deadline.article}</span>
                                                    <span className="font-mono text-[10px] text-[#999]">|</span>
                                                    <span className="font-mono text-[10px] text-[#999]">Applies to: {deadline.applies_to.join(', ')}</span>
                                                </div>

                                                {deadline.penalties && (
                                                    <div className="bg-red-50 border border-red-200 px-3 py-2">
                                                        <span className="font-mono text-[10px] text-red-600 uppercase tracking-widest font-bold">Penalty: </span>
                                                        <span className="font-mono text-[10px] text-red-600">{deadline.penalties}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
