export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" className="size-5">
                    <circle cx="12" cy="13" r="7" stroke="white" strokeWidth="2.5" fill="none" />
                    <line x1="12" y1="4" x2="12" y2="10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">CodeBlue</span>
                <span className="truncate text-xs text-muted-foreground">Change Control</span>
            </div>
        </>
    );
}
