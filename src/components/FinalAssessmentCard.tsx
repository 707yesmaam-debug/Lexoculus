'use client';

import { CheckCircle2, AlertCircle, AlertTriangle, Clock, FileCheck, FileWarning, ChevronDown, ChevronUp, FileText, Globe, Shield } from 'lucide-react';
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
    purpose_mismatch?: boolean;
    purpose_mismatch_reason?: string;
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

function getComplianceStyle(readiness: string) {
    switch (readiness) {
        case 'FULL_COMPLIANCE':
            return 'text-[#047857] bg-[#D1FAE5] border-[#047857]';
        case 'PARTIAL_COMPLIANCE':
            return 'text-[#B45309] bg-[#FEF3C7] border-[#B45309]';
        case 'NON_COMPLIANCE':
            return 'text-[#B91C1C] bg-[#FEE2E2] border-[#B91C1C]';
        default:
            return 'text-black bg-white border-black';
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

    return (
        <div className="space-y-12">
            {/* Approval Status Banner */}
            {approvedForReport ? (
                <div className="bg-[#F0FFF4] border-2 border-[#047857] p-6 flex items-center gap-4">
                    <CheckCircle2 className="w-8 h-8 text-[#047857]" />
                    <div>
                        <h3 className="font-serif text-xl font-bold text-[#047857]">Ready for Compliance Report</h3>
                        <p className="font-mono text-sm text-[#064E3B] mt-1">
                            Context verified. System authorized for report generation.
                        </p>
                    </div>
                </div>
            ) : contextSummary.purpose_mismatch ? (
                <div className="bg-[#FFF5F0] border-2 border-[#FF4F00] p-6 flex items-start gap-4">
                    <AlertTriangle className="w-8 h-8 text-[#FF4F00] flex-shrink-0" />
                    <div>
                        <h3 className="font-serif text-xl font-bold text-[#FF4F00]">Report Blocked: Purpose Mismatch</h3>
                        <p className="font-mono text-sm text-black mt-1">
                            {contextSummary.purpose_mismatch_reason || 'Declared intended purpose conflicts with verified context.'}
                        </p>
                        <p className="font-mono text-xs text-[#555] mt-2 uppercase tracking-widest">
                            Required Action: Update intended purpose in Risk Classifier or correct context answers.
                        </p>
                    </div>
                </div>
            ) : requiresManualReview ? (
                <div className="bg-[#FFF5F0] border-2 border-[#FF4F00] p-6 flex items-start gap-4">
                    <AlertTriangle className="w-8 h-8 text-[#FF4F00] flex-shrink-0" />
                    <div>
                        <h3 className="font-serif text-xl font-bold text-[#FF4F00]">Manual Review Required</h3>
                        <p className="font-mono text-sm text-black mt-1">
                            {escalationReason || 'Assessment logic requires human verification.'}
                        </p>
                    </div>
                </div>
            ) : null}

            {/* Main Classification Card */}
            <div className="border-2 border-black bg-white p-8">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    {/* Score Gauge */}
                    <div className="transform scale-110">
                        <RiskScoreGauge score={finalScore} size="lg" />
                    </div>

                    <div className="hidden md:block w-px h-32 bg-[#E5E5E5]" />

                    {/* Classification Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="font-mono text-xs text-[#999] uppercase tracking-widest mb-2">Final Verified Classification</div>
                        <h2 className="text-4xl font-serif font-bold text-black mb-4">
                            {finalClassification.replace('_', ' ')}
                        </h2>

                        {/* Compliance Status Badge */}
                        <div className={`inline-flex items-center gap-2 px-4 py-2 border font-mono text-xs uppercase tracking-widest font-bold ${getComplianceStyle(complianceReadiness.overall_readiness)}`}>
                            {complianceReadiness.overall_readiness === 'FULL_COMPLIANCE' && <FileCheck className="w-4 h-4" />}
                            {complianceReadiness.overall_readiness === 'PARTIAL_COMPLIANCE' && <Clock className="w-4 h-4" />}
                            {complianceReadiness.overall_readiness.replace('_', ' ')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Three Column Summary Layout */}
            <div className="grid md:grid-cols-2 gap-8">

                {/* Context Context */}
                <div className="border-2 border-black bg-white">
                    <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center gap-3">
                        <Globe className="w-5 h-5 text-black" />
                        <h3 className="font-serif text-lg font-bold text-black">Operational Context</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <p className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Intended Use</p>
                            <p className="font-mono text-sm text-black border-l-2 border-[#FF4F00] pl-3">{contextSummary.intended_use}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Target Users</p>
                                <p className="font-mono text-sm text-black">{contextSummary.target_users}</p>
                            </div>
                            <div>
                                <p className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-1">Region</p>
                                <p className="font-mono text-sm text-black">{contextSummary.deployment_region}</p>
                            </div>
                        </div>
                        <div>
                            <p className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-2">Safeguards Engaged</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(contextSummary)
                                    .filter(([key, val]) => key.startsWith('has_') && val === true)
                                    .map(([key]) => (
                                        <span key={key} className="px-2 py-1 bg-black text-white text-[10px] font-mono uppercase tracking-widest">
                                            {key.replace('has_', '').replace('_', ' ')}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compliance Readiness */}
                <div className="border-2 border-black bg-white">
                    <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center gap-3">
                        <Shield className="w-5 h-5 text-black" />
                        <h3 className="font-serif text-lg font-bold text-black">Compliance Matrix</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Requirements Met */}
                        {complianceReadiness.requirements_met.length > 0 && (
                            <div>
                                <p className="font-mono text-xs font-bold text-[#047857] mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Requirements Met
                                </p>
                                <ul className="space-y-1">
                                    {complianceReadiness.requirements_met.map((req, i) => (
                                        <li key={i} className="font-mono text-xs text-black pl-6 relative">
                                            <span className="absolute left-1 top-1.5 w-1.5 h-1.5 bg-[#047857] rounded-full" />
                                            {req}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Requirements Pending */}
                        {complianceReadiness.requirements_pending.length > 0 && (
                            <div>
                                <p className="font-mono text-xs font-bold text-[#B45309] mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Pending
                                </p>
                                <ul className="space-y-1">
                                    {complianceReadiness.requirements_pending.map((req, i) => (
                                        <li key={i} className="font-mono text-xs text-black pl-6 relative">
                                            <span className="absolute left-1 top-1.5 w-1.5 h-1.5 bg-[#B45309] rounded-full" />
                                            {req}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Developer Action Items - High Visibility */}
            {complianceReadiness.developer_action_items.length > 0 && (
                <div className="border border-[#FF4F00] bg-[#FFF5F0] p-6">
                    <h3 className="font-serif text-lg font-bold text-[#FF4F00] mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> Required Actions
                    </h3>
                    <ul className="space-y-2">
                        {complianceReadiness.developer_action_items.map((item, i) => (
                            <li key={i} className="font-mono text-sm text-black flex items-start gap-3 bg-white border border-[#FF4F00]/20 p-3">
                                <span className="font-bold text-[#FF4F00]">{i + 1}.</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Evidence Items (Collapsible) */}
            <div className="border-2 border-black bg-white">
                <button
                    onClick={() => setShowEvidence(!showEvidence)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-black" />
                        <h3 className="font-serif text-lg font-bold text-black">Evidence Log</h3>
                        <span className="text-xs font-mono bg-black text-white px-2 py-0.5 ml-2">{evidenceItems.length}</span>
                    </div>
                    {showEvidence ? <ChevronUp className="w-4 h-4 text-black" /> : <ChevronDown className="w-4 h-4 text-black" />}
                </button>

                {showEvidence && (
                    <div className="border-t-2 border-black divide-y divide-[#E5E5E5]">
                        {evidenceItems.map((item, i) => {
                            const isIssue = item.category.includes('ISSUE') || item.category.includes('CRITICAL');
                            return (
                                <div key={i} className={`p-6 ${isIssue ? 'bg-[#FFF5F0]' : 'bg-white'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 font-mono text-[10px] font-bold uppercase border px-2 py-1 ${item.confidence === 'HIGH' ? 'bg-black text-white border-black' : 'bg-white text-black border-[#E5E5E5]'}`}>
                                            {item.confidence}_CONF
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-mono text-xs font-bold uppercase mb-1 ${isIssue ? 'text-[#FF4F00]' : 'text-black'}`}>
                                                {item.category}
                                            </p>
                                            <p className="font-serif text-black">{item.description}</p>

                                            {item.regulatory_reference && (
                                                <div className="mt-2 text-xs font-mono text-[#555] flex items-center gap-2">
                                                    <span>REF:</span>
                                                    <span className="bg-[#F5F5F5] px-1">{item.regulatory_reference}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
