'use client';

interface RiskScoreGaugeProps {
    score: number; // 0-100
    size?: 'sm' | 'md' | 'lg';
}

export default function RiskScoreGauge({ score, size = 'md' }: RiskScoreGaugeProps) {
    // Determine color based on score
    let colorClasses: string;
    let bgClasses: string;
    let label: string;

    if (score >= 81) {
        colorClasses = 'text-red-400';
        bgClasses = 'bg-red-500';
        label = 'Unacceptable';
    } else if (score >= 51) {
        colorClasses = 'text-orange-400';
        bgClasses = 'bg-orange-500';
        label = 'High Risk';
    } else if (score >= 21) {
        colorClasses = 'text-amber-400';
        bgClasses = 'bg-amber-500';
        label = 'Limited Risk';
    } else {
        colorClasses = 'text-emerald-400';
        bgClasses = 'bg-emerald-500';
        label = 'Minimal Risk';
    }

    // Size configurations
    const sizeConfig = {
        sm: { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-lg' },
        md: { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-2xl' },
        lg: { width: 160, height: 160, strokeWidth: 10, fontSize: 'text-3xl' },
    };

    const config = sizeConfig[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: config.width, height: config.height }}>
                {/* Background circle */}
                <svg
                    className="absolute inset-0 transform -rotate-90"
                    width={config.width}
                    height={config.height}
                >
                    <circle
                        cx={config.width / 2}
                        cy={config.height / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={config.strokeWidth}
                        className="text-zinc-800"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={config.width / 2}
                        cy={config.height / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={config.strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={colorClasses}
                        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    />
                </svg>

                {/* Score text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-mono font-bold ${config.fontSize} ${colorClasses}`}>
                        {score}
                    </span>
                </div>
            </div>

            {/* Label */}
            <div className={`text-sm font-medium ${colorClasses}`}>
                {label}
            </div>

            {/* Score bar alternative view */}
            <div className="w-full max-w-[160px] h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${bgClasses} transition-all duration-500`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}
