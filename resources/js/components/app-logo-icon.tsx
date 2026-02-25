import { cn } from '@/lib/utils';

type AppLogoIconProps = {
    className?: string;
};

export default function AppLogoIcon({ className }: AppLogoIconProps) {
    return (
        <div className={cn('flex items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 shadow-sm', className)}>
            <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <circle cx="12" cy="13" r="7" stroke="white" strokeWidth="2.5" fill="none" />
                <line x1="12" y1="4" x2="12" y2="10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        </div>
    );
}
