'use client';

import { CheckCircle2, AlertCircle, AlertTriangle, Clock, FileCheck, FileWarning, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import RiskScoreGauge from './RiskScoreGauge';

type RiskClassification = 'UNACCEPTABLE' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK';
type ComplianceReadiness = 'FULL_COMPLIANCE' | 'PARTIAL_COMPLIANCE' | 'NON_COMPLIANCE' | 'NEEDS_REVIEW';

interface EvidenceItem {
    category: string;
    description: string;
    supports_classification: string;
    regulatory_reference?: string;
    confidence: string;
    action_item?: string;
}

interface ContextSummary {
    intended_use: string;
    target_users: string;
    deployment_region: string;
    has_human_oversight: boolean;
    has_testing_procedure: boolean;
    has_transparency_statement: boolean;
    has_appeal_mechanism: boolean;
    has_data_safeguards: boolean;
}

interface ComplianceReadinessData {
    overall_readiness: string;
    requirements_met: string[];
    requirements_pending: string[];
    developer_action_items: string[];
}

interface FinalAssessmentCardProps {
    finalClassification: RiskClassification;
    finalScore: number;
    finalNarrative: string;
    contextSummary: ContextSummary;
    evidenceItems: EvidenceItem[];
    complianceReadiness: ComplianceReadinessData;
    approvedForReport: boolean;
    requiresManualReview: boolean;
    escalationReason?: string;
}

function getRiskColors(classification: RiskClassification) {
    switch (classification) {
        case 'UNACCEPTABLE':
            return {
                bg: 'bg-red-950/20',
                border: 'border-red-900/50',
                text: 'text-red-400',
                badge: 'bg-red-500/10 border-red-500/30 text-red-400',
            };
        case 'HIGH_RISK':
            return {
                bg: 'bg-orange-950/20',
                border: 'border-orange-900/50',
                text: 'text-orange-400',
                badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
            };
        case 'LIMITED_RISK':
            return {
                bg: 'bg-amber-950/20',
                border: 'border-amber-900/50',
                text: 'text-amber-400',
                badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
            };
        case 'MINIMAL_RISK':
            return {
                bg: 'bg-emerald-950/20',
                border: 'border-emerald-900/50',
                text: 'text-emerald-400',
                badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
            };
    }
}

function getComplianceColors(readiness: string) {
    switch (readiness) {
        case 'FULL_COMPLIANCE':
            return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        case 'PARTIAL_COMPLIANCE':
            return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        case 'NON_COMPLIANCE':
            return 'text-red-400 bg-red-500/10 border-red-500/30';
        case 'NEEDS_REVIEW':
            return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        default:
            return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
    }
}

function getComplianceIcon(readiness: string) {
    switch (readiness) {
        case 'FULL_COMPLIANCE':
            return <FileCheck className="w-5 h-5 text-emerald-400" />;
        case 'PARTIAL_COMPLIANCE':
            return <Clock className="w-5 h-5 text-amber-400" />;
        case 'NON_COMPLIANCE':
            return <FileWarning className="w-5 h-5 text-red-400" />;
        case 'NEEDS_REVIEW':
            return <AlertCircle className="w-5 h-5 text-blue-400" />;
        default:
            return <AlertCircle className="w-5 h-5 text-zinc-400" />;
    }
}

export default function FinalAssessmentCard({
    finalClassification,
    finalScore,
    finalNarrative,
    contextSummary,
    evidenceItems,
    complianceReadiness,
    approvedForReport,
    requiresManualReview,
    escalationReason,
}: FinalAssessmentCardProps) {
    const [showEvidence, setShowEvidence] = useState(false);
    const colors = getRiskColors(finalClassification);

    return (
        <div className="space-y-6">
            {/* Approval Status Banner */}
            {approvedForReport ? (
                <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <div>
                        <p className="text-emerald-400 font-medium">Ready for Compliance Report</p>
                        <p className="text-zinc-400 text-sm">Context verified. You can now generate your compliance report.</p>
                    </div>
                </div>
            ) : requiresManualReview ? (
                <div className="bg-amber-950/20 border border-amber-900/50 p-4 flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    <div>
                        <p className="text-amber-400 font-medium">Manual Review Required</p>
                        <p className="text-zinc-400 text-sm mt-1">
                            {escalationReason || 'This assessment requires human review before generating a compliance report.'}
                        </p>
                    </div>
                </div>
            ) : null}

            {/* Main Classification Card */}
            <div className={`border ${colors.border} ${colors.bg} p-6`}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Score Gauge */}
                    <RiskScoreGauge score={finalScore} size="lg" />

                    {/* Classification Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h2 className={`text-2xl font-bold ${colors.text}`}>
                            {finalClassification.replace('_', ' ')}
                        </h2>
                        <p className="text-zinc-400 text-sm mt-2">Final verified classification</p>

                        {/* Compliance Status */}
                        <div className="mt-4 flex items-center gap-2 justify-center md:justify-start">
                            {getComplianceIcon(complianceReadiness.overall_readiness)}
                            <span className={`px-2 py-1 text-sm border ${getComplianceColors(complianceReadiness.overall_readiness)}`}>
                                {complianceReadiness.overall_readiness.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Context Summary */}
            <div className="border border-zinc-800 bg-zinc-950/50">
                <div className="px-4 py-3 border-b border-zinc-800">
                    <h3 className="text-zinc-200 font-medium">Context Summary</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-zinc-500 text-xs mb-1">Intended Use</p>
                        <p className="text-zinc-200 text-sm">{contextSummary.intended_use}</p>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-xs mb-1">Target Users</p>
                        <p className="text-zinc-200 text-sm">{contextSummary.target_users}</p>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-xs mb-1">Deployment Region</p>
                        <p className="text-zinc-200 text-sm">{contextSummary.deployment_region}</p>
                    </div>
                    <div>
                        <p className="text-zinc-500 text-xs mb-1">Safety Measures</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {contextSummary.has_human_oversight && (
                                <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                    Human Oversight
                                </span>
                            )}
                            {contextSummary.has_testing_procedure && (
                                <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                    Testing
                                </span>
                            )}
                            {contextSummary.has_transparency_statement && (
                                <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                    Transparency
                                </span>
                            )}
                            {contextSummary.has_appeal_mechanism && (
                                <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                    Appeal Process
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Compliance Readiness */}
            <div className="border border-zinc-800 bg-zinc-950/50">
                <div className="px-4 py-3 border-b border-zinc-800">
                    <h3 className="text-zinc-200 font-medium">Compliance Readiness</h3>
                </div>
                <div className="p-4 space-y-4">
                    {/* Requirements Met */}
                    {complianceReadiness.requirements_met.length > 0 && (
                        <div>
                            <p className="text-emerald-400 text-sm font-medium mb-2">✅ Requirements Met</p>
                            <ul className="space-y-1">
                                {complianceReadiness.requirements_met.map((req, i) => (
                                    <li key={i} className="text-zinc-400 text-sm flex items-center gap-2">
                                        <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Requirements Pending */}
                    {complianceReadiness.requirements_pending.length > 0 && (
                        <div>
                            <p className="text-amber-400 text-sm font-medium mb-2">⏳ Requirements Pending</p>
                            <ul className="space-y-1">
                                {complianceReadiness.requirements_pending.map((req, i) => (
                                    <li key={i} className="text-zinc-400 text-sm flex items-center gap-2">
                                        <span className="w-1 h-1 bg-amber-400 rounded-full" />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Developer Action Items */}
                    {complianceReadiness.developer_action_items.length > 0 && (
                        <div className="pt-4 border-t border-zinc-800">
                            <p className="text-zinc-200 text-sm font-medium mb-2">🔧 Action Items</p>
                            <ul className="space-y-2">
                                {complianceReadiness.developer_action_items.map((item, i) => (
                                    <li key={i} className="text-zinc-300 text-sm bg-zinc-900 p-2 border-l-2 border-blue-500">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Evidence Items (Collapsible) */}
            <div className="border border-zinc-800 bg-zinc-950/50">
                <button
                    onClick={() => setShowEvidence(!showEvidence)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <h3 className="text-zinc-200 font-medium">Evidence Items</h3>
                        <span className="text-xs text-zinc-600">{evidenceItems.length} items</span>
                    </div>
                    {showEvidence ? (
                        <ChevronUp className="w-4 h-4 text-zinc-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                    )}
                </button>

                {showEvidence && (
                    <div className="border-t border-zinc-800 divide-y divide-zinc-800">
                        {evidenceItems.map((item, i) => {
                            const isIssue = item.category.includes('ISSUE') || item.category.includes('CRITICAL');
                            return (
                                <div key={i} className={`p-4 ${isIssue ? 'bg-red-950/10' : ''}`}>
                                    <div className="flex items-start gap-3">
                                        {isIssue ? (
                                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${isIssue ? 'text-red-400' : 'text-zinc-200'}`}>
                                                {item.category}
                                            </p>
                                            <p className="text-zinc-400 text-sm mt-1">{item.description}</p>
                                            {item.regulatory_reference && (
                                                <p className="text-zinc-500 text-xs mt-2">
                                                    📜 {item.regulatory_reference}
                                                </p>
                                            )}
                                            {item.action_item && (
                                                <p className="text-amber-400 text-xs mt-2 bg-amber-500/10 p-2">
                                                    ⚠️ {item.action_item}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 ${item.confidence === 'HIGH'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : item.confidence === 'MEDIUM'
                                                ? 'bg-amber-500/10 text-amber-400'
                                                : 'bg-zinc-800 text-zinc-500'
                                            }`}>
                                            {item.confidence}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Final Narrative */}
            <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                <h4 className="text-zinc-400 text-sm font-medium mb-2">Final Narrative</h4>
                <div className="text-zinc-300 text-sm prose prose-sm prose-invert max-w-none whitespace-pre-wrap">
                    {finalNarrative}
                </div>
            </div>
        </div>
    );
}
