import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ChevronDown, Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
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

// ---------------------------------------------------------------------------
// Permission grouping & labels
// ---------------------------------------------------------------------------

const PERMISSION_GROUPS: { label: string; permissions: { name: string; label: string }[] }[] = [
    {
        label: 'Dashboard',
        permissions: [{ name: 'dashboard.view', label: 'View Dashboard' }],
    },
    {
        label: 'User Management',
        permissions: [
            { name: 'users.manage', label: 'Full User Management' },
            { name: 'users.view', label: 'View Users' },
            { name: 'users.create', label: 'Create Users' },
            { name: 'users.edit', label: 'Edit Users' },
            { name: 'users.delete', label: 'Delete Users' },
        ],
    },
    {
        label: 'Change Requests',
        permissions: [
            { name: 'changes.view', label: 'View Changes' },
            { name: 'changes.create', label: 'Create Changes' },
            { name: 'changes.edit', label: 'Edit Changes' },
            { name: 'changes.delete', label: 'Delete Changes' },
            { name: 'changes.approve', label: 'Approve / Reject Changes' },
        ],
    },
    {
        label: 'Forms & Templates',
        permissions: [{ name: 'forms.manage', label: 'Manage Form Schemas' }],
    },
    {
        label: 'Approvals',
        permissions: [{ name: 'approvals.manage', label: 'Manage Approvals' }],
    },
    {
        label: 'Integrations',
        permissions: [
            { name: 'integrations.view', label: 'View Integrations' },
            { name: 'integrations.manage', label: 'Manage Integrations' },
        ],
    },
    {
        label: 'Governance',
        permissions: [{ name: 'policies.manage', label: 'Manage Policies & Blackouts' }],
    },
    {
        label: 'Settings',
        permissions: [{ name: 'settings.manage', label: 'Manage Settings' }],
    },
    {
        label: 'Audit',
        permissions: [{ name: 'audit.view', label: 'View Audit Logs' }],
    },
];

/** Return a human-readable label for a permission name */
function permissionLabel(name: string): string {
    for (const group of PERMISSION_GROUPS) {
        for (const p of group.permissions) {
            if (p.name === name) return p.label;
        }
    }
    return name;
}

/** Return the group label for a permission name */
function permissionGroup(name: string): string {
    for (const group of PERMISSION_GROUPS) {
        for (const p of group.permissions) {
            if (p.name === name) return group.label;
        }
    }
    return 'Other';
}

// Badge color per group (kept subtle)
const GROUP_COLORS: Record<string, string> = {
    'Dashboard': 'bg-slate-100 text-slate-700',
    'User Management': 'bg-blue-50 text-blue-700',
    'Change Requests': 'bg-amber-50 text-amber-700',
    'Forms & Templates': 'bg-violet-50 text-violet-700',
    'Approvals': 'bg-green-50 text-green-700',
    'Integrations': 'bg-cyan-50 text-cyan-700',
    'Governance': 'bg-rose-50 text-rose-700',
    'Settings': 'bg-orange-50 text-orange-700',
    'Audit': 'bg-gray-100 text-gray-700',
};

// ---------------------------------------------------------------------------
// Grouped permission picker (reused in create + edit dialogs)
// ---------------------------------------------------------------------------

function GroupedPermissionPicker({
    dbPermissions,
    selected,
    onToggle,
    onSet,
}: {
    dbPermissions: Permission[];
    selected: string[];
    onToggle: (name: string) => void;
    onSet: (next: string[]) => void;
}) {
    const dbNames = new Set(dbPermissions.map((p) => p.name));

    // Track which groups are expanded — default all collapsed
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpanded = (label: string) =>
        setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

    const toggleGroup = (groupPerms: { name: string }[]) => {
        const names = groupPerms.filter((p) => dbNames.has(p.name)).map((p) => p.name);
        const allSelected = names.every((n) => selected.includes(n));
        if (allSelected) {
            // remove all group perms
            onSet(selected.filter((s) => !names.includes(s)));
        } else {
            // add missing group perms
            const combined = new Set([...selected, ...names]);
            onSet([...combined]);
        }
    };

    return (
        <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border p-2">
            {PERMISSION_GROUPS.map((group) => {
                const availablePerms = group.permissions.filter((p) => dbNames.has(p.name));
                if (availablePerms.length === 0) return null;

                const allSelected = availablePerms.every((p) => selected.includes(p.name));
                const someSelected = availablePerms.some((p) => selected.includes(p.name));
                const isOpen = expanded[group.label] ?? false;
                const selectedCount = availablePerms.filter((p) => selected.includes(p.name)).length;

                return (
                    <div key={group.label} className="rounded-md border">
                        <div className="flex items-center gap-2 px-3 py-2">
                            <Checkbox
                                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                onCheckedChange={() => toggleGroup(availablePerms)}
                            />
                            <button
                                type="button"
                                className="flex flex-1 cursor-pointer items-center justify-between"
                                onClick={() => toggleExpanded(group.label)}
                            >
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {group.label}
                                    <span className="ml-1.5 font-normal normal-case tracking-normal">
                                        ({selectedCount}/{availablePerms.length})
                                    </span>
                                </span>
                                <ChevronDown
                                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>
                        {isOpen && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t bg-muted/30 px-3 py-2 pl-9">
                                {availablePerms.map((perm) => (
                                    <label
                                        key={perm.name}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Checkbox
                                            checked={selected.includes(perm.name)}
                                            onCheckedChange={() => onToggle(perm.name)}
                                        />
                                        <span className="text-sm">{perm.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Show any DB permissions that aren't in our group map (future-proofing) */}
            {(() => {
                const mapped = new Set(PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.name)));
                const unmapped = dbPermissions.filter((p) => !mapped.has(p.name));
                if (unmapped.length === 0) return null;
                const isOpen = expanded['Other'] ?? false;
                return (
                    <div className="rounded-md border">
                        <button
                            type="button"
                            className="flex w-full cursor-pointer items-center justify-between px-3 py-2"
                            onClick={() => toggleExpanded('Other')}
                        >
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Other
                            </span>
                            <ChevronDown
                                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {isOpen && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t bg-muted/30 px-3 py-2 pl-9">
                                {unmapped.map((perm) => (
                                    <label
                                        key={perm.name}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Checkbox
                                            checked={selected.includes(perm.name)}
                                            onCheckedChange={() => onToggle(perm.name)}
                                        />
                                        <span className="text-sm">{perm.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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
                                        <Label>
                                            Permissions{' '}
                                            <span className="font-normal text-muted-foreground">
                                                ({createForm.data.permissions.length} selected)
                                            </span>
                                        </Label>
                                        <GroupedPermissionPicker
                                            dbPermissions={permissions}
                                            selected={createForm.data.permissions}
                                            onToggle={toggleCreatePermission}
                                            onSet={(next) => createForm.setData('permissions', next)}
                                        />
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
                                <div className="flex flex-wrap gap-1.5">
                                    {role.permissions.map((permission) => (
                                        <Badge
                                            key={permission.id}
                                            className={`text-xs border-0 ${GROUP_COLORS[permissionGroup(permission.name)] ?? 'bg-gray-100 text-gray-700'}`}
                                        >
                                            {permissionLabel(permission.name)}
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

// ---------------------------------------------------------------------------
// Edit Role Dialog
// ---------------------------------------------------------------------------

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
                            <span className="font-normal text-muted-foreground">
                                ({data.permissions.length} selected)
                            </span>
                        </Label>
                        <GroupedPermissionPicker
                            dbPermissions={permissions}
                            selected={data.permissions}
                            onToggle={togglePermission}
                            onSet={(next) => setData('permissions', next)}
                        />
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
