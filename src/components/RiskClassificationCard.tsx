'use client';

import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, ShieldX, AlertCircle } from 'lucide-react';
import RiskScoreGauge from './RiskScoreGauge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
            return <ShieldX className="w-8 h-8 text-red-500" />;
        case 'HIGH_RISK':
            return <ShieldAlert className="w-8 h-8 text-orange-500" />;
        case 'LIMITED_RISK':
            return <Shield className="w-8 h-8 text-amber-500" />;
        case 'MINIMAL_RISK':
            return <ShieldCheck className="w-8 h-8 text-emerald-500" />;
    }
}

function getRiskColors(classification: RiskClassification) {
    switch (classification) {
        case 'UNACCEPTABLE':
            return {
                bg: 'bg-red-950/10',
                border: 'border-red-900/50',
                text: 'text-red-500',
                badge: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-900/50',
            };
        case 'HIGH_RISK':
            return {
                bg: 'bg-orange-950/10',
                border: 'border-orange-900/50',
                text: 'text-orange-500',
                badge: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border-orange-900/50',
            };
        case 'LIMITED_RISK':
            return {
                bg: 'bg-amber-950/10',
                border: 'border-amber-900/50',
                text: 'text-amber-500',
                badge: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-900/50',
            };
        case 'MINIMAL_RISK':
            return {
                bg: 'bg-emerald-950/10',
                border: 'border-emerald-900/50',
                text: 'text-emerald-500',
                badge: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-900/50',
            };
    }
}

function getRiskLabel(classification: RiskClassification) {
    switch (classification) {
        case 'UNACCEPTABLE': return 'UNACCEPTABLE RISK';
        case 'HIGH_RISK': return 'HIGH RISK';
        case 'LIMITED_RISK': return 'LIMITED RISK';
        case 'MINIMAL_RISK': return 'MINIMAL RISK';
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
    const colors = getRiskColors(classification);

    return (
        <div className="space-y-6">
            {/* Main Risk Card */}
            <Card className={`${colors.border} ${colors.bg}`}>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Risk Icon & Label */}
                        <div className="flex flex-col items-center min-w-[160px]">
                            {getRiskIcon(classification)}
                            <h2 className={`text-xl font-bold mt-3 ${colors.text}`}>
                                {getRiskLabel(classification)}
                            </h2>
                        </div>

                        {/* Divider */}
                        <Separator orientation="vertical" className="hidden md:block h-24 bg-zinc-800" />

                        {/* Score Gauge */}
                        <div className="flex-shrink-0">
                            <RiskScoreGauge score={score} size="md" />
                        </div>

                        {/* Divider */}
                        <Separator orientation="vertical" className="hidden md:block h-24 bg-zinc-800" />

                        {/* Narrative */}
                        <div className="flex-1">
                            <p className="text-zinc-300 text-sm leading-relaxed">
                                {narrative}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Manual Review Warning */}
            {manualReviewNeeded && (
                <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-400 font-medium text-sm">Manual Review Recommended</p>
                        <p className="text-zinc-400 text-sm mt-1">
                            {manualReviewReason || 'This assessment may require human verification.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Matched Articles */}
            {matchedArticles.length > 0 && (
                <Card>
                    <CardHeader className="pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-zinc-400" />
                            <CardTitle className="text-base font-medium text-zinc-200">Matched Annex III Articles</CardTitle>
                            <Badge variant="secondary" className="ml-auto font-mono">
                                {matchedArticles.length} match{matchedArticles.length !== 1 ? 'es' : ''}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-zinc-800">
                            {matchedArticles.map((article, i) => {
                                const articleColors = getRiskColors(article.riskTier);
                                return (
                                    <div key={i} className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-zinc-200 font-medium">{article.article}</span>
                                                    <Badge variant="outline" className={`${articleColors.badge} border`}>
                                                        {article.riskTier.replace('_', ' ')}
                                                    </Badge>
                                                    {article.applicable === 'conditional' && (
                                                        <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                                                            Conditional
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-zinc-400 text-sm">{article.category}</p>
                                                <p className="text-zinc-500 text-xs mt-2">{article.reasoning}</p>
                                            </div>
                                        </div>
                                        {article.requirements && article.requirements.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-zinc-800">
                                                <p className="text-xs text-zinc-500 mb-1">Requirements:</p>
                                                <ul className="text-xs text-zinc-400 list-disc list-inside space-y-0.5">
                                                    {article.requirements.slice(0, 3).map((req, j) => (
                                                        <li key={j}>{req}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Key Findings */}
            <Card>
                <CardHeader className="pb-3 border-b border-zinc-800">
                    <CardTitle className="text-base font-medium text-zinc-200">Key Findings</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <ul className="space-y-2">
                        {keyFindings.map((finding, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-zinc-500 mt-1">•</span>
                                <span className={finding.includes('⚠️') ? 'text-amber-400' : 'text-zinc-300'}>
                                    {finding}
                                </span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
