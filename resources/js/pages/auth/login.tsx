import { Form, Head } from '@inertiajs/react';
import CodeBlueLogo from '@/components/codeblue-logo';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

interface Props {
    errors?: Record<string, string>;
    enableLocalLogin: boolean;
}

export default function Login({ enableLocalLogin }: Props) {
    return (
        <>
            <Head title="Log in" />
            <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        {/* Centered Logo */}
                        <div className="flex justify-center">
                            <CodeBlueLogo />
                        </div>

                        {/* Email / Password Form */}
                        {enableLocalLogin && (
                            <Form
                                action="/login/local"
                                method="post"
                                resetOnSuccess={['password']}
                                className="flex flex-col gap-5"
                            >
                                {({ processing, errors }) => (
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="admin@example.com"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Password"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={3}
                                            />
                                            <Label htmlFor="remember">Remember me</Label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            tabIndex={4}
                                            disabled={processing}
                                        >
                                            {processing && <Spinner />}
                                            Log in
                                        </Button>
                                    </div>
                                )}
                            </Form>
                        )}

                        {/* Divider */}
                        <div className="relative flex items-center gap-3">
                            <div className="flex-1 border-t" />
                            <span className="text-xs text-muted-foreground">
                                {enableLocalLogin ? 'Or continue with' : 'Sign in to your account'}
                            </span>
                            <div className="flex-1 border-t" />
                        </div>

                        {/* Microsoft SSO */}
                        <a href="/auth/microsoft">
                            <Button variant="outline" className="w-full">
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 21 21" aria-hidden="true">
                                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                                </svg>
                                Sign in with Microsoft
                            </Button>
                        </a>

                        {/* Footer */}
                        <p className="text-center text-xs text-muted-foreground">
                            Staff access only. Contact IT for assistance.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
