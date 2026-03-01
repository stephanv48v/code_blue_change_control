import { CheckCircle2, XCircle, Ban } from 'lucide-react';

const STEPS = [
    { key: 'draft', label: 'Draft' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'pending_approval', label: 'Approval' },
    { key: 'approved', label: 'Approved' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
];

const STEP_ORDER: Record<string, number> = {};
STEPS.forEach((step, i) => {
    STEP_ORDER[step.key] = i;
});

interface WorkflowStepperProps {
    currentStatus: string;
}

export function WorkflowStepper({ currentStatus }: WorkflowStepperProps) {
    const isRejected = currentStatus === 'rejected';
    const isCancelled = currentStatus === 'cancelled';
    const currentIndex = STEP_ORDER[currentStatus] ?? -1;

    if (isRejected || isCancelled) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-3">
                {isRejected ? (
                    <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                ) : (
                    <Ban className="h-5 w-5 shrink-0 text-slate-500" />
                )}
                <span className="text-sm font-medium">
                    {isRejected ? 'Change Rejected — needs revision' : 'Change Cancelled'}
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border bg-card px-4 py-3">
            {STEPS.map((step, index) => {
                const isComplete = index < currentIndex;
                const isCurrent = index === currentIndex;

                return (
                    <div key={step.key} className="flex items-center">
                        {index > 0 && (
                            <div
                                className={`mx-1 h-px w-4 sm:w-8 ${
                                    isComplete ? 'bg-green-500' : 'bg-muted'
                                }`}
                            />
                        )}
                        <div className="flex items-center gap-1.5">
                            {isComplete ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                            ) : (
                                <div
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 text-[9px] font-bold ${
                                        isCurrent
                                            ? 'border-blue-500 bg-blue-500 text-white'
                                            : 'border-muted-foreground/30 text-muted-foreground/50'
                                    }`}
                                >
                                    {index + 1}
                                </div>
                            )}
                            <span
                                className={`whitespace-nowrap text-xs font-medium ${
                                    isCurrent
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : isComplete
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-muted-foreground/50'
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
