'use client';

interface ConfidenceBadgeProps {
    score: number; // 0-1
}

export default function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
    const percentage = Math.round(score * 100);

    let colorClasses: string;
    let label: string;

    if (percentage >= 90) {
        colorClasses = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
        label = 'Very Confident';
    } else if (percentage >= 70) {
        colorClasses = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
        label = 'Confident';
    } else {
        colorClasses = 'bg-orange-500/10 border-orange-500/30 text-orange-400';
        label = 'Review Recommended';
    }

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-medium ${colorClasses}`}>
            <span className="font-mono">{percentage}%</span>
            <span className="text-zinc-500">|</span>
            <span>{label}</span>
        </div>
    );
}
