export default function FujifilmCodeBlueLogo({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Fujifilm Logo */}
            <svg viewBox="0 0 200 40" className="h-8 w-auto" fill="currentColor">
                {/* Stylized FJ letters representing Fujifilm */}
                <path d="M0 30V10h8v8h6v-8h8v20h-8v-6H8v6H0z" />
                <path d="M26 30V10h16v4h-8v4h6v4h-6v4h8v4H26z" />
            </svg>
            
            {/* Vertical Separator */}
            <div className="h-8 w-px bg-current opacity-30" />
            
            {/* CodeBlue Text */}
            <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight tracking-tight">
                    Code<span className="text-blue-500">Blue</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Change Control
                </span>
            </div>
        </div>
    );
}
