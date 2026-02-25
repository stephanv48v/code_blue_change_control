import { Head, Link } from '@inertiajs/react';
import { Plus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, ClientContact } from '@/types';

type Props = {
    client: {
        id: number;
        name: string;
        code: string;
    };
    contacts: ClientContact[];
};

export default function ClientContactsIndex({ client, contacts }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Clients', href: '/clients' },
        { title: client.name, href: `/clients/${client.id}` },
        { title: 'Contacts', href: `/clients/${client.id}/contacts` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${client.name} Contacts`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Contacts</h1>
                        <p className="text-muted-foreground">
                            {client.name} ({client.code})
                        </p>
                    </div>
                    <Link href={`/clients/${client.id}/contacts/create`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Contact
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Client Contacts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {contacts.length === 0 && (
                            <div className="rounded border border-dashed p-8 text-center">
                                <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    No contacts for this client.
                                </p>
                            </div>
                        )}

                        {contacts.map((contact) => (
                            <div
                                key={contact.id}
                                className="flex items-start justify-between rounded border p-3"
                            >
                                <div>
                                    <p className="font-medium">
                                        {contact.first_name} {contact.last_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                                    <div className="mt-2 flex gap-2">
                                        {contact.is_primary_contact && (
                                            <Badge variant="secondary">Primary</Badge>
                                        )}
                                        {contact.is_approver && <Badge>Approver</Badge>}
                                        {!contact.is_active && (
                                            <Badge variant="outline">Inactive</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/clients/${client.id}/contacts/${contact.id}`}>
                                        <Button variant="outline" size="sm">
                                            View
                                        </Button>
                                    </Link>
                                    <Link href={`/clients/${client.id}/contacts/${contact.id}/edit`}>
                                        <Button variant="outline" size="sm">
                                            Edit
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
