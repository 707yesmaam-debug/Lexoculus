'use client';

interface RiskScoreGaugeProps {
    score: number; // 0-100
    classification?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function RiskScoreGauge({ score, classification, size = 'md' }: RiskScoreGaugeProps) {
    // Determine color and label based on classification (priority) or score
    let colorClasses: string;
    let label: string;

    const normalizedClass = (classification || '').replace(/\s+/g, '_').toUpperCase();

    if (normalizedClass === 'UNACCEPTABLE' || (!classification && score >= 81)) {
        colorClasses = 'text-[#FF4F00]';
        label = 'UNACCEPTABLE';
    } else if (normalizedClass === 'HIGH_RISK' || (!classification && score >= 51)) {
        colorClasses = 'text-[#FF4F00]';
        label = 'HIGH RISK';
    } else if (normalizedClass === 'LIMITED_RISK' || (!classification && score >= 21)) {
        colorClasses = 'text-black';
        label = 'LIMITED RISK';
    } else {
        colorClasses = 'text-[#999]';
        label = classification ? classification.replace('_', ' ') : 'MINIMAL RISK';
    }


    // Size configurations
    const sizeConfig = {
        sm: { width: 80, height: 80, strokeWidth: 4, fontSize: 'text-sm' },
        md: { width: 120, height: 120, strokeWidth: 6, fontSize: 'text-xl' },
        lg: { width: 160, height: 160, strokeWidth: 8, fontSize: 'text-2xl' },
    };

    const config = sizeConfig[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-4">
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
                        stroke="#E5E5E5"
                        strokeWidth={config.strokeWidth}
                        className="opacity-50"
                    />
                    {/* Progress circle */}
                    <circle
                        cx={config.width / 2}
                        cy={config.height / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={config.strokeWidth}
                        strokeLinecap="butt" // Sharp edges
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={colorClasses}
                        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    />
                </svg>

                {/* Score text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-mono font-bold ${config.fontSize} ${colorClasses} tracking-tighter`}>
                        {score}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-[#999] tracking-widest">Score</span>
                </div>
            </div>

            {/* Label */}
            <div className={`text-xs font-mono uppercase tracking-widest font-bold border px-2 py-1 ${colorClasses} border-current`}>
                {label}
            </div>
        </div>
    );
}
