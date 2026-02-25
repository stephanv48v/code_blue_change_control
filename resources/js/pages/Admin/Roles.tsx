import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

interface Props {
    roles: Role[];
    permissions: Permission[];
}

export default function AdminRoles({ roles, permissions }: Props) {
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const createForm = useForm({
        name: '',
        permissions: [] as string[],
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Admin', href: '/admin' },
        { title: 'Roles', href: '/admin/roles' },
    ];

    const handleCreate = () => {
        createForm.post('/admin/roles', {
            onSuccess: () => {
                createForm.reset();
            },
        });
    };

    const handleDelete = (e: React.MouseEvent, roleId: number, roleName: string) => {
        e.stopPropagation();
        if (!confirm(`Delete the "${roleName}" role? This cannot be undone.`)) return;
        router.delete(`/admin/roles/${roleId}`, { preserveScroll: true });
    };

    const toggleCreatePermission = (permissionName: string) => {
        createForm.setData(
            'permissions',
            createForm.data.permissions.includes(permissionName)
                ? createForm.data.permissions.filter((p) => p !== permissionName)
                : [...createForm.data.permissions, permissionName],
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Roles" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
                        <p className="text-muted-foreground">
                            Manage system roles and their permissions
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Admin
                            </Button>
                        </Link>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Role
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Create New Role</DialogTitle>
                                    <DialogDescription>
                                        Add a new role to the system and assign permissions.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Role Name</Label>
                                        <Input
                                            id="name"
                                            value={createForm.data.name}
                                            onChange={(e) =>
                                                createForm.setData('name', e.target.value)
                                            }
                                            placeholder="e.g., Change Manager"
                                        />
                                        {createForm.errors.name && (
                                            <p className="text-sm text-red-500">
                                                {createForm.errors.name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Permissions</Label>
                                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                                            {permissions.map((permission) => (
                                                <div
                                                    key={permission.id}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Checkbox
                                                        checked={createForm.data.permissions.includes(
                                                            permission.name,
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleCreatePermission(permission.name)
                                                        }
                                                    />
                                                    <span className="text-sm">
                                                        {permission.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {createForm.errors.permissions && (
                                            <p className="text-sm text-red-500">
                                                {createForm.errors.permissions}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={handleCreate}
                                        disabled={createForm.processing}
                                    >
                                        Create Role
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role) => (
                        <Card
                            key={role.id}
                            className="cursor-pointer transition-colors hover:border-primary/40"
                            onClick={() => setEditingRole(role)}
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        {role.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingRole(role);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={(e) =>
                                                handleDelete(e, role.id, role.name)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription>
                                    {role.permissions.length} permissions assigned
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {role.permissions.map((permission) => (
                                        <Badge
                                            key={permission.id}
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {permission.name}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {roles.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Shield className="h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No roles configured</h3>
                            <p className="text-sm text-muted-foreground">
                                Create your first role to get started
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Edit Role Dialog */}
            {editingRole && (
                <EditRoleDialog
                    role={editingRole}
                    permissions={permissions}
                    open={editingRole !== null}
                    onOpenChange={(open) => {
                        if (!open) setEditingRole(null);
                    }}
                />
            )}
        </AppLayout>
    );
}

// --- Edit Role Dialog ---

function EditRoleDialog({
    role,
    permissions,
    open,
    onOpenChange,
}: {
    role: Role;
    permissions: Permission[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        permissions: role.permissions.map((p) => p.name),
    });

    const togglePermission = (permissionName: string) => {
        setData(
            'permissions',
            data.permissions.includes(permissionName)
                ? data.permissions.filter((p) => p !== permissionName)
                : [...data.permissions, permissionName],
        );
    };

    const handleSubmit = () => {
        put(`/admin/roles/${role.id}`, {
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Role</DialogTitle>
                    <DialogDescription>
                        Update the role name and its assigned permissions.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor={`edit-name-${role.id}`}>Role Name</Label>
                        <Input
                            id={`edit-name-${role.id}`}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>
                            Permissions{' '}
                            <span className="text-muted-foreground font-normal">
                                ({data.permissions.length} selected)
                            </span>
                        </Label>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                            {permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={data.permissions.includes(permission.name)}
                                        onCheckedChange={() => togglePermission(permission.name)}
                                    />
                                    <span className="text-sm">{permission.name}</span>
                                </div>
                            ))}
                        </div>
                        {errors.permissions && (
                            <p className="text-sm text-red-500">{errors.permissions}</p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={processing}>
                        {processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
