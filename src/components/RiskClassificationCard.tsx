'use client';

import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, ShieldX, AlertCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import RiskScoreGauge from './RiskScoreGauge';

type RiskClassification = 'UNACCEPTABLE' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK';

interface MatchedArticle {
    article: string;
    category: string;
    description: string;
    applicable: boolean | 'conditional';
    riskTier: RiskClassification;
    reasoning: string;
    requirements?: string[];
}

import { RiskEvidence } from '@/lib/compliance/eu-ai-act/risk-evidence';

interface RiskClassificationCardProps {
    classification: RiskClassification;
    score: number;
    narrative: string;
    matchedArticles: MatchedArticle[];
    keyFindings: string[];
    manualReviewNeeded: boolean;
    manualReviewReason?: string;
    evidence?: RiskEvidence[];
    prohibition_reasons?: {
        article: string;
        reason: string;
        description: string;
    }[];
    also_has_high_risk_elements?: boolean;
    constraint_validation?: {
        legal_citations?: {
            regulation_source: string;
            official_text: string;
        }[];
    };
}

function getRiskIcon(classification: RiskClassification) {
    switch (classification) {
        case 'UNACCEPTABLE':
            return <ShieldX className="w-12 h-12 text-[#FF4F00]" />;
        case 'HIGH_RISK':
            return <ShieldAlert className="w-12 h-12 text-[#FF4F00]" />;
        case 'LIMITED_RISK':
            return <Shield className="w-12 h-12 text-black" />;
        case 'MINIMAL_RISK':
            return <ShieldCheck className="w-12 h-12 text-[#999]" />;
    }
}

function getRiskColor(classification: RiskClassification) {
    switch (classification) {
        case 'UNACCEPTABLE':
        case 'HIGH_RISK':
            return 'text-[#FF4F00] border-[#FF4F00]';
        case 'LIMITED_RISK':
            return 'text-black border-black';
        default:
            return 'text-[#999] border-[#999]';
    }
}

function getSeverityColor(severity: string) {
    switch (severity) {
        case 'critical':
        case 'high':
            return 'bg-[#FFF5F0] border-[#FF4F00] text-[#FF4F00]';
        case 'medium':
            return 'bg-[#F5F5F5] border-black text-black';
        case 'info':
        default:
            return 'bg-[#F9F9F9] border-[#E5E5E5] text-[#555]';
    }
}

export default function RiskClassificationCard({
    classification,
    score,
    narrative,
    matchedArticles,
    keyFindings,
    manualReviewNeeded,
    manualReviewReason,
    evidence = [],
    prohibition_reasons = [],
    also_has_high_risk_elements = false,
    constraint_validation,
}: RiskClassificationCardProps) {
    const [expandedCitations, setExpandedCitations] = useState<{ [key: number]: boolean }>({});

    return (
        <div className="space-y-12">
            {/* Main Risk Card */}
            <div className={`border-2 p-8 ${classification.includes('HIGH') || classification.includes('UNACCEPTABLE') ? 'border-[#FF4F00] bg-[#FFF5F0]' : 'border-black bg-white'}`}>
                <div className="flex flex-col md:flex-row items-center gap-12">

                    {/* Gauge */}
                    <div className="flex-shrink-0">
                        <RiskScoreGauge score={score} size="lg" />
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-32 bg-[#E5E5E5]" />

                    {/* Classification & Narrative */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                            {getRiskIcon(classification)}
                            <div>
                                <h2 className={`text-4xl font-serif font-bold tracking-tight ${classification.includes('HIGH') || classification.includes('UNACCEPTABLE') ? 'text-[#FF4F00]' : 'text-black'}`}>
                                    {classification.replace('_', ' ')}
                                </h2>
                                <p className="font-mono text-xs text-[#555] uppercase tracking-widest mt-1">
                                    EU AI ACT // ANNEX III
                                </p>
                            </div>
                        </div>

                        <p className="font-mono text-sm leading-relaxed text-black max-w-2xl">
                            {narrative}
                        </p>
                    </div>
                </div>
            </div>

            {/* Manual Review Warning */}
            {manualReviewNeeded && (
                <div className="border border-[#FF4F00] bg-[#FFF5F0] p-6 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-[#FF4F00] flex-shrink-0" />
                    <div>
                        <h4 className="font-serif text-lg font-bold text-[#FF4F00]">Manual Review Recommended</h4>
                        <p className="font-mono text-xs text-black mt-2">
                            {manualReviewReason || 'This assessment may require human verification.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Prohibition Rationale Section */}
            {classification === 'UNACCEPTABLE' && prohibition_reasons.length > 0 && (
                <div className="border-2 border-[#FF4F00] bg-white overflow-hidden">
                    <div className="px-6 py-4 bg-[#FF4F00] flex items-center gap-3">
                        <ShieldX className="w-6 h-6 text-white" />
                        <h3 className="font-serif text-xl font-bold text-white uppercase tracking-tight">Prohibited Application Rationale</h3>
                    </div>
                    <div className="divide-y divide-[#FF4F00]/20">
                        {prohibition_reasons.map((reason, i) => (
                            <div key={i} className="p-6 bg-[#FFF5F0]/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-mono text-xs font-bold bg-[#FF4F00] text-white px-2 py-1 uppercase tracking-widest">{reason.article}</span>
                                    <span className="font-serif font-bold text-black text-lg">{reason.reason}</span>
                                </div>
                                <p className="font-mono text-sm text-black leading-relaxed">
                                    {reason.description}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 py-4 bg-[#FFF5F0] border-t border-[#FF4F00]">
                        <p className="font-mono text-[10px] text-[#FF4F00] uppercase font-bold tracking-widest">Legal Status: Article 5 Prohibition // Non-Marketable</p>
                    </div>
                </div>
            )}

            {/* Hybrid Risk Warning (Unacceptable + High Risk) */}
            {classification === 'UNACCEPTABLE' && also_has_high_risk_elements && (
                <div className="border-2 border-black bg-white p-6 flex items-start gap-6 relative overflow-hidden">
                    <AlertTriangle className="w-10 h-10 text-black flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h4 className="font-serif text-2xl font-bold text-black mb-2">Annex III High-Risk Obligations</h4>
                        <p className="font-mono text-sm text-black leading-relaxed max-w-3xl">
                            In addition to being **PROHIBITED**, this AI system contains elements that would trigger **Annex III High-Risk** compliance requirements. 
                            Should the prohibition be resolved (e.g., through modification of the intended purpose or specific use cases), the system would remain subject to strict self-assessment, human oversight, and data governance standards.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="font-mono text-[10px] bg-black text-white px-3 py-1 uppercase tracking-widest">Article 9 - Risk Management</span>
                            <span className="font-mono text-[10px] bg-black text-white px-3 py-1 uppercase tracking-widest">Article 10 - Data Governance</span>
                            <span className="font-mono text-[10px] bg-black text-white px-3 py-1 uppercase tracking-widest">Article 14 - Human Oversight</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Matched Articles */}
            {matchedArticles.length > 0 && (
                <div className="border-2 border-black bg-white">
                    <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-black" />
                            <h3 className="font-serif text-xl font-bold text-black">Matched Articles</h3>
                        </div>
                        <span className="font-mono text-xs text-white bg-black px-2 py-1 uppercase tracking-widest">
                            {matchedArticles.length} Match{matchedArticles.length !== 1 ? 'es' : ''}
                        </span>
                    </div>

                    <div className="divide-y divide-black">
                        {matchedArticles.map((article, i) => (
                            <div key={i} className="p-6 hover:bg-[#FAFAFA] transition-colors">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-serif font-bold text-lg text-black">{article.article}</span>
                                            <span className={`font-mono text-[10px] uppercase border px-2 py-0.5 ${getRiskColor(article.riskTier)}`}>
                                                {article.riskTier.replace('_', ' ')}
                                            </span>
                                            {article.applicable === 'conditional' && (
                                                <span className="font-mono text-[10px] uppercase border border-[#999] text-[#999] px-2 py-0.5">
                                                    Conditional
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-mono text-xs text-[#555] uppercase tracking-wide mb-3">{article.category}</p>
                                        
                                        <div className="mb-4">
                                            <p className="font-serif font-bold text-sm text-black mb-1">Why you are flagged</p>
                                            <p className="font-mono text-sm text-black leading-relaxed">{article.description}</p>
                                        </div>

                                        <div className="mb-4">
                                            <p className="font-serif font-bold text-sm text-[#555] mb-1">Detection Evidence</p>
                                            <p className="font-mono text-xs text-[#555]">{article.reasoning}</p>
                                        </div>

                                        {article.requirements && article.requirements.length > 0 && (
                                            <div className="bg-[#F5F5F5] p-4 border border-[#E5E5E5]">
                                                <p className="font-mono text-[10px] text-[#999] uppercase tracking-widest mb-2">Requirements</p>
                                                <ul className="space-y-1">
                                                    {article.requirements.map((req, j) => (
                                                        <li key={j} className="font-mono text-xs text-black flex items-start gap-2">
                                                            <span className="mt-1 w-1 h-1 bg-black flex-shrink-0" />
                                                            {req}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Key Findings */}
            <div className="border-2 border-black bg-white">
                <div className="px-6 py-4 border-b border-black bg-[#F5F5F5]">
                    <h3 className="font-serif text-xl font-bold text-black">Key Findings</h3>
                </div>
                <div className="p-6">
                    <ul className="space-y-4">
                        {keyFindings.map((finding, i) => {
                            let itemStyle = "flex items-start gap-4 font-mono text-sm text-black p-3 border-l-4";
                            let iconColor = "bg-[#555]";
                            
                            if (finding.startsWith('PROHIBITED')) {
                                itemStyle += " border-[#FF4F00] bg-[#FFF5F0]";
                                iconColor = "bg-[#FF4F00]";
                            } else if (finding.startsWith('HIGH RISK') || finding.startsWith('CONDITIONAL')) {
                                itemStyle += " border-[#F59E0B] bg-[#FFFBEB]";
                                iconColor = "bg-[#F59E0B]";
                            } else if (finding.startsWith('LIMITED RISK')) {
                                itemStyle += " border-[#999] bg-[#F5F5F5]";
                            } else {
                                itemStyle += " border-transparent";
                            }

                            return (
                                <li key={i} className={itemStyle}>
                                    {finding.startsWith('PROHIBITED') ? (
                                        <ShieldX className="w-5 h-5 text-[#FF4F00] flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <span className={`mt-2 w-1.5 h-1.5 ${iconColor} flex-shrink-0`} />
                                    )}
                                    <span className="leading-relaxed">
                                        {finding}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            {/* Official Regulatory Text */}
            {constraint_validation?.legal_citations && constraint_validation.legal_citations.length > 0 && (
                <div className="border-2 border-black bg-white">
                    <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-black" />
                            <h3 className="font-serif text-xl font-bold text-black">Official Regulatory Text</h3>
                        </div>
                    </div>
                    <div className="divide-y divide-black">
                        {constraint_validation.legal_citations.map((citation, i) => {
                            const isExpanded = expandedCitations[i];
                            return (
                                <div key={i} className="p-6">
                                    <button 
                                        className="w-full flex items-center justify-between text-left"
                                        onClick={() => setExpandedCitations((prev: any) => ({ ...prev, [i]: !isExpanded }))}
                                    >
                                        <span className="font-serif font-bold text-lg text-black">{citation.regulation_source}</span>
                                        <span className="font-mono text-xs text-[#555] uppercase tracking-widest px-2 py-1 border border-[#E5E5E5]">
                                            {isExpanded ? 'Hide' : 'Show'} Text
                                        </span>
                                    </button>
                                    {isExpanded && (
                                        <div className="mt-4 p-4 bg-[#F9F9F9] border-l-4 border-[#FF4F00]">
                                            <p className="font-mono text-xs text-[#555] leading-relaxed whitespace-pre-wrap">
                                                {citation.official_text}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Evidence Trail */}
            {evidence.length > 0 && (
                <div className="border-2 border-black bg-white mt-8">
                    <div className="px-6 py-4 border-b border-black bg-[#F5F5F5] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="w-5 h-5 text-black" />
                            <h3 className="font-serif text-xl font-bold text-black">Evidence Trail</h3>
                        </div>
                        <span className="font-mono text-xs text-white bg-black px-2 py-1 uppercase tracking-widest">
                            {evidence.length} Item{evidence.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {evidence.map((item, i) => (
                                <div key={i} className={`p-4 border ${getSeverityColor(item.severity)} flex flex-col gap-2`}>
                                    <div className="flex justify-between items-start">
                                        <span className="font-mono text-sm font-bold truncate max-w-[80%]">{item.name}</span>
                                        {item.version && (
                                            <span className="font-mono text-[10px] px-1.5 py-0.5 border border-current opacity-70">
                                                v{item.version}
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-mono text-xs opacity-80 grid gap-1">
                                        <div>
                                            <span className="font-bold opacity-70 mr-1">Source:</span>
                                            {item.source_file}
                                        </div>
                                        <div>
                                            <span className="font-bold opacity-70 mr-1">Type:</span>
                                            {item.type}
                                        </div>
                                    </div>

                                    {(item.triggered_articles.length > 0 || item.risk_indicators.length > 0) && (
                                        <div className="mt-2 pt-2 border-t border-current border-opacity-20 flex flex-wrap gap-1">
                                            {item.triggered_articles.map((art, j) => (
                                                <span key={`art-${j}`} className="font-mono text-[9px] px-1 py-0.5 bg-black text-white">
                                                    {art}
                                                </span>
                                            ))}
                                            {item.risk_indicators.map((ind, j) => (
                                                <span key={`ind-${j}`} className="font-mono text-[9px] px-1 py-0.5 border border-current opacity-70">
                                                    {ind.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
