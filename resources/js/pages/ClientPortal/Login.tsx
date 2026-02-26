import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Mail, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type Props = {
    errors?: {
        microsoft?: string;
    };
};

export default function ClientPortalLogin({ errors }: Props) {
    const { flash } = usePage().props;
    const { data, setData, post, processing } = useForm({
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/portal/magic-link');
    };

    return (
        <AuthLayout
            title="Client Portal"
            description="Secure access for client approvers"
        >
            <Head title="Client Portal Login" />

            <div className="flex flex-col gap-6">
                {flash?.message && (
                    <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertDescription>{flash.message}</AlertDescription>
                    </Alert>
                )}

                {errors?.microsoft && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.microsoft}</AlertDescription>
                    </Alert>
                )}

                {/* Microsoft SSO Option */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sign in with Microsoft</CardTitle>
                        <CardDescription>
                            Quick access using your Microsoft account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <a href="/portal/auth/microsoft">
                            <Button 
                                type="button" 
                                className="w-full bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white"
                                size="lg"
                            >
                                <svg 
                                    className="mr-2 h-5 w-5" 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 21 21"
                                >
                                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                                </svg>
                                Sign in with Microsoft
                            </Button>
                        </a>
                    </CardContent>
                </Card>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with email
                        </span>
                    </div>
                </div>

                {/* Magic Link Option */}
                <Card>
                    <CardHeader>
                        <CardTitle>Magic Link</CardTitle>
                        <CardDescription>
                            Receive a secure login link via email
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="you@company.com"
                                        className="pl-10"
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full"
                                disabled={processing}
                            >
                                {processing ? 'Sending...' : 'Send Login Link'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="bg-muted rounded-lg p-4 text-sm">
                        <h4 className="font-medium mb-2">How Magic Link works</h4>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>• Enter your email address above</li>
                            <li>• We'll send you a secure login link</li>
                            <li>• Click the link to access the portal</li>
                            <li>• Links expire in 1 hour and can only be used once</li>
                        </ul>
                    </div>

                    <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Staff Login
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
