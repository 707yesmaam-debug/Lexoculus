'use client';

export default function OpticalLogo() {
    return (
        <div className="flex items-center gap-3 select-none group">
            {/* The Mark: A Lens/Comb */}
            <div className="relative w-10 h-10 flex items-center justify-center border-2 border-black bg-white group-hover:bg-black group-hover:border-transparent transition-colors duration-0">

                {/* Outer Brackets (Lens Housing) */}
                <svg width="100%" height="100%" viewBox="0 0 40 40" className="absolute inset-0 p-1 pointer-events-none">
                    {/* Top Left Corner */}
                    <path d="M 4 12 L 4 4 L 12 4" fill="none" stroke="currentColor" strokeWidth="2" className="text-black group-hover:text-white" />
                    {/* Bottom Right Corner */}
                    <path d="M 36 28 L 36 36 L 28 36" fill="none" stroke="currentColor" strokeWidth="2" className="text-black group-hover:text-white" />
                </svg>

                {/* The "Eye" / Aperture */}
                <div className="relative w-4 h-4">
                    <div className="absolute inset-0 border border-black group-hover:border-white rounded-full opacity-0 group-hover:opacity-100 transition-none animate-ping" />
                    <div className="w-full h-full bg-[#FF4F00] group-hover:bg-[#FF4F00]" />
                </div>

                {/* Crosshairs */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-[1px] h-full bg-[#E5E5E5]/20" />
                    <div className="h-[1px] w-full bg-[#E5E5E5]/20 absolute" />
                </div>
            </div>

            {/* The Type */}
            <div className="flex flex-col leading-none">
                <div className="font-serif font-black text-xl tracking-tight">
                    LEX<span className="text-[#FF4F00]">|</span>OCULUS
                </div>
            </div>
        </div>
    );
}
