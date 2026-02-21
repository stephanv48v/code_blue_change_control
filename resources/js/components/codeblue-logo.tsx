import { cn } from '@/lib/utils';

type CodeBlueLogoProps = {
    className?: string;
    imageClassName?: string;
};

export default function CodeBlueLogo({
    className,
    imageClassName,
}: CodeBlueLogoProps) {
    return (
        <div className={cn('flex items-center justify-center', className)}>
            <img
                src="/images/codeblue-change-control-restored.png"
                alt="CodeBlue Change Control"
                className={cn('h-auto w-full max-w-[420px]', imageClassName)}
            />
        </div>
    );
}
