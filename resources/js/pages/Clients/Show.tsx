import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Edit, Mail, MapPin, Phone, Plus, Trash2, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, Client, ClientContact } from '@/types';

type Props = {
    client: Client & {
        contacts: ClientContact[];
        account_manager?: { name: string } | null;
    };
};

export default function ClientShow({ client }: Props) {
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this client?')) {
            destroy(`/clients/${client.id}`);
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Clients', href: '/clients' },
        { title: client.name, href: `/clients/${client.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={client.name} />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <Link href="/clients">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{client.name}</h1>
                                <Badge variant={client.is_active ? "default" : "secondary"}>
                                    {client.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                                Code: {client.code}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/clients/${client.id}/edit`}>
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

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Client Details */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Client Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {client.industry && (
                                    <div className="flex items-start gap-3">
                                        <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">Industry</p>
                                            <p className="text-sm text-muted-foreground">{client.industry}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {(client.address || client.city) && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">Address</p>
                                            <p className="text-sm text-muted-foreground">
                                                {client.full_address || `${client.address}, ${client.city}`}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {client.phone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">Phone</p>
                                            <p className="text-sm text-muted-foreground">{client.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {client.website && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">Website</p>
                                            <a 
                                                href={client.website} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm text-primary hover:underline"
                                            >
                                                {client.website}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {client.notes && (
                                    <div className="pt-4 border-t">
                                        <p className="font-medium mb-2">Notes</p>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {client.notes}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Contacts Section */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Contacts</CardTitle>
                                <Link href={`/clients/${client.id}/contacts/create`}>
                                    <Button size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Contact
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {client.contacts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <UserPlus className="h-12 w-12 text-muted-foreground mx-auto" />
                                        <h3 className="mt-4 text-lg font-medium">No contacts yet</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Add contacts who can approve changes for this client
                                        </p>
                                        <Link href={`/clients/${client.id}/contacts/create`} className="mt-4 inline-block">
                                            <Button>Add Contact</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {client.contacts.map((contact) => (
                                            <div 
                                                key={contact.id} 
                                                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback>
                                                            {contact.first_name?.[0]}{contact.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium">
                                                                {contact.first_name} {contact.last_name}
                                                            </p>
                                                            {contact.is_primary_contact && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Primary
                                                                </Badge>
                                                            )}
                                                            {contact.is_approver && (
                                                                <Badge variant="default" className="text-xs">
                                                                    Approver
                                                                </Badge>
                                                            )}
                                                            {!contact.is_active && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    Inactive
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {contact.job_title || 'No title'} • {contact.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link href={`/clients/${client.id}/contacts/${contact.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            View
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Account Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Account Manager</p>
                                    <p className="font-medium">
                                        {client.account_manager?.name || 'Not assigned'}
                                    </p>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-muted-foreground">Contract Period</p>
                                    <p className="font-medium">
                                        {client.contract_start_date 
                                            ? new Date(client.contract_start_date).toLocaleDateString()
                                            : 'Not set'
                                        }
                                        {' - '}
                                        {client.contract_end_date
                                            ? new Date(client.contract_end_date).toLocaleDateString()
                                            : 'Not set'
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Total Contacts</p>
                                    <p className="font-medium">{client.contacts.length}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
