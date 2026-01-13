'use client';

import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, ShieldX, AlertCircle, FileText } from 'lucide-react';
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

interface RiskClassificationCardProps {
    classification: RiskClassification;
    score: number;
    narrative: string;
    matchedArticles: MatchedArticle[];
    keyFindings: string[];
    manualReviewNeeded: boolean;
    manualReviewReason?: string;
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

export default function RiskClassificationCard({
    classification,
    score,
    narrative,
    matchedArticles,
    keyFindings,
    manualReviewNeeded,
    manualReviewReason,
}: RiskClassificationCardProps) {

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
                                        <p className="font-mono text-sm text-black mb-4">{article.reasoning}</p>

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
                    <ul className="space-y-3">
                        {keyFindings.map((finding, i) => (
                            <li key={i} className="flex items-start gap-3 font-mono text-sm text-black">
                                <span className="mt-1.5 w-1.5 h-1.5 bg-[#FF4F00] flex-shrink-0" />
                                {finding}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
