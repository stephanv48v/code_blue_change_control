import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Mail, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, ClientContact } from '@/types';

type ClientInfo = {
    id: number;
    name: string;
    code: string;
};

type Props = {
    client: ClientInfo;
    contact: ClientContact;
};

export default function ContactInvite({ client, contact }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Clients', href: '/clients' },
        { title: client.name, href: `/clients/${client.id}` },
        { title: `${contact.first_name} ${contact.last_name}`, href: `/clients/${client.id}/contacts/${contact.id}` },
        { title: 'Invite', href: `/clients/${client.id}/contacts/${contact.id}/invite` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Send Invite" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href={`/clients/${client.id}/contacts/${contact.id}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Send Portal Invite</h1>
                        <p className="text-muted-foreground">
                            Send magic link login to {contact.first_name} {contact.last_name}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Invite Details</CardTitle>
                        <CardDescription>
                            Magic link authentication (Phase 3)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium">Magic Link Email</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Send a secure, single-use login link to {contact.email}. 
                                    The link will expire after 24 hours and can only be used once.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-muted p-3 rounded-full">
                                <Clock className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-medium">Token Expiration</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Magic links expire after 24 hours. Contacts can request a new link at any time.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-muted p-3 rounded-full">
                                <CheckCircle className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-medium">Single Use</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Each magic link can only be used once. After login, the token is invalidated.
                                </p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-amber-100 text-amber-800">Phase 3</Badge>
                            </div>
                            <p className="text-sm text-amber-800 mt-2">
                                Magic link authentication will be implemented in Phase 3. 
                                This page is a placeholder showing the planned functionality.
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button disabled>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Magic Link
                            </Button>
                            <Link href={`/clients/${client.id}/contacts/${contact.id}`}>
                                <Button variant="outline">Cancel</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
