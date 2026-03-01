import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
    children: ReactNode;
};

type State = {
    hasError: boolean;
    message?: string;
    stack?: string;
};

export class AppErrorBoundary extends Component<Props, State> {
    state: State = {
        hasError: false,
    };

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            message: error.message,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        if (import.meta.env.DEV) {
            console.error('Unhandled React render error', error, errorInfo);
        }

        this.setState({
            stack: errorInfo.componentStack,
        });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleBackToDashboard = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6">
                <div className="w-full max-w-2xl space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                    <div>
                        <h1 className="text-xl font-semibold">Something went wrong</h1>
                        <p className="text-sm text-muted-foreground">
                            A runtime error prevented this screen from rendering.
                        </p>
                    </div>

                    {this.state.message && (
                        <pre className="whitespace-pre-wrap break-words rounded-md border bg-muted p-3 text-xs">
                            {this.state.message}
                        </pre>
                    )}

                    {import.meta.env.DEV && this.state.stack && (
                        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border bg-muted p-3 text-[11px]">
                            {this.state.stack}
                        </pre>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={this.handleReload}>
                            Reload Page
                        </Button>
                        <Button type="button" variant="outline" onClick={this.handleBackToDashboard}>
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}
