import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield, Building2, Cog, ArrowRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Admin', href: '/admin' },
];

export default function AdminIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Panel" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
                    <p className="text-muted-foreground">
                        User management, roles, and system settings
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* User Management */}
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                Users
                            </CardTitle>
                            <CardDescription>
                                Manage staff users and assign roles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add, edit, or remove staff users. Assign roles to control access.
                            </p>
                            <Link href="/admin/users">
                                <Button className="w-full">
                                    Manage Users
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Roles & Permissions */}
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-green-500" />
                                Roles & Permissions
                            </CardTitle>
                            <CardDescription>
                                Configure RBAC roles and permissions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create roles and assign permissions. Control who can do what.
                            </p>
                            <Link href="/admin/roles">
                                <Button className="w-full">
                                    Manage Roles
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Clients */}
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-purple-500" />
                                Clients
                            </CardTitle>
                            <CardDescription>
                                Manage client organizations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add client companies, manage contacts, and configure portal access.
                            </p>
                            <Link href="/clients">
                                <Button className="w-full">
                                    Manage Clients
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Integrations */}
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cog className="h-5 w-5 text-gray-500" />
                                Integrations
                            </CardTitle>
                            <CardDescription>
                                External system connections
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Manage PSA, RMM, and other external system integrations.
                            </p>
                            <Link href="/integrations">
                                <Button className="w-full">
                                    Manage Integrations
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Current Configuration Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>RBAC Configuration</CardTitle>
                        <CardDescription>
                            Current roles and permissions setup
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Available Roles</h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 bg-primary/10 rounded text-sm">Super Admin</span>
                                    <span className="px-2 py-1 bg-primary/10 rounded text-sm">MSP Admin</span>
                                    <span className="px-2 py-1 bg-primary/10 rounded text-sm">Change Manager</span>
                                    <span className="px-2 py-1 bg-primary/10 rounded text-sm">Engineer</span>
                                    <span className="px-2 py-1 bg-primary/10 rounded text-sm">CAB Member</span>
                                    <span className="px-2 py-1 bg-primary/10 rounded text-sm">Client Approver</span>
                                    <span className="px-2 py-1 bg-primary/10 rounded text-sm">Read Only</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Key Permissions</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                                    <span>• dashboard.view</span>
                                    <span>• changes.view</span>
                                    <span>• changes.create</span>
                                    <span>• changes.edit</span>
                                    <span>• changes.delete</span>
                                    <span>• changes.approve</span>
                                    <span>• users.manage</span>
                                    <span>• forms.manage</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
