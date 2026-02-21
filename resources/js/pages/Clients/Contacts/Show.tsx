import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit, Mail, Phone, Smartphone, Trash2, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function ContactShow({ client, contact }: Props) {
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this contact?')) {
            destroy(`/clients/${client.id}/contacts/${contact.id}`);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Clients', href: '/clients' },
        { title: client.name, href: `/clients/${client.id}` },
        { title: `${contact.first_name} ${contact.last_name}`, href: `/clients/${client.id}/contacts/${contact.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${contact.first_name} ${contact.last_name}`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <Link href={`/clients/${client.id}`}>
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-2xl">
                                    {contact.first_name?.[0]}{contact.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-bold tracking-tight">
                                        {contact.first_name} {contact.last_name}
                                    </h1>
                                    {contact.is_primary_contact && (
                                        <Badge variant="secondary">Primary</Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground">
                                    {contact.job_title || 'No title'} • {client.name}
                                </p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant={contact.is_approver ? "default" : "outline"}>
                                        {contact.is_approver ? 'Approver' : 'Not Approver'}
                                    </Badge>
                                    <Badge variant={contact.is_active ? "default" : "secondary"}>
                                        {contact.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/clients/${client.id}/contacts/${contact.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">Email</p>
                                    <a 
                                        href={`mailto:${contact.email}`}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        {contact.email}
                                    </a>
                                </div>
                            </div>

                            {contact.phone && (
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium">Phone</p>
                                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                                    </div>
                                </div>
                            )}

                            {contact.mobile && (
                                <div className="flex items-start gap-3">
                                    <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium">Mobile</p>
                                        <p className="text-sm text-muted-foreground">{contact.mobile}</p>
                                    </div>
                                </div>
                            )}

                            {(contact.job_title || contact.department) && (
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium">Position</p>
                                        <p className="text-sm text-muted-foreground">
                                            {contact.job_title}
                                            {contact.job_title && contact.department && ' • '}
                                            {contact.department}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Portal Access</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {contact.is_approver ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Magic Link Access</p>
                                            <p className="text-sm text-muted-foreground">
                                                Send login link via email
                                            </p>
                                        </div>
                                        <Link href={`/clients/${client.id}/contacts/${contact.id}/invite`}>
                                            <Button variant="outline" size="sm">
                                                Send Invite
                                            </Button>
                                        </Link>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Microsoft SSO</p>
                                            <p className="text-sm text-muted-foreground">
                                                Link Microsoft account for SSO
                                            </p>
                                        </div>
                                        <Badge variant="outline">Phase 4</Badge>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    This contact is not set as an approver and does not need portal access.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {contact.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{contact.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
