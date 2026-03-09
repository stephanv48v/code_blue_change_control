import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Check, Copy, Edit2, KeyRound, Mail, Plus, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { SharedData } from '@/types/auth';

interface Role {
    id: number;
    name: string;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    roles: Role[];
    is_microsoft_user: boolean;
}

interface Props {
    users: UserData[];
    roles: Role[];
}

function EditRolesDialog({ user, roles }: { user: UserData; roles: Role[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        roles: user.roles.map((r) => r.name),
    });

    const toggle = (roleName: string) => {
        setData(
            'roles',
            data.roles.includes(roleName)
                ? data.roles.filter((r) => r !== roleName)
                : [...data.roles, roleName],
        );
    };

    const handleSubmit = () => {
        put(`/admin/users/${user.id}/roles`, {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit2 className="mr-1 h-3 w-3" />
                    Edit Roles
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit Roles — {user.name}</DialogTitle>
                    <DialogDescription>Select the roles to assign to this user.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-2 py-2 max-h-60 overflow-y-auto">
                    {roles.map((role) => (
                        <div key={role.id} className="flex items-center gap-2 rounded-md border p-2">
                            <Checkbox
                                id={`role-${user.id}-${role.id}`}
                                checked={data.roles.includes(role.name)}
                                onCheckedChange={() => toggle(role.name)}
                            />
                            <Label htmlFor={`role-${user.id}-${role.id}`} className="cursor-pointer">
                                {role.name}
                            </Label>
                        </div>
                    ))}
                </div>
                {errors.roles && <p className="text-sm text-red-500">{errors.roles}</p>}
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={processing}>
                        Save Roles
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PasswordModal({ password, onClose }: { password: string; onClose: () => void }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Generated Password</DialogTitle>
                    <DialogDescription>
                        Copy this password now. It will not be shown again.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                    <code className="flex-1 text-sm font-mono break-all">{password}</code>
                    <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ResetPasswordButton({ user }: { user: UserData }) {
    const [confirming, setConfirming] = useState(false);

    const handleReset = () => {
        router.post(`/admin/users/${user.id}/reset-password`, {}, {
            onSuccess: () => setConfirming(false),
        });
    };

    return (
        <Dialog open={confirming} onOpenChange={setConfirming}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <KeyRound className="mr-1 h-3 w-3" />
                    Reset Password
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Generate a new password for {user.name}? Their current password will stop working immediately.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleReset}>Reset Password</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminUsers({ users, roles }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [showPassword, setShowPassword] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        role: '',
    });

    useEffect(() => {
        if (flash.generatedPassword) {
            setShowPassword(flash.generatedPassword);
        }
    }, [flash.generatedPassword]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Admin', href: '/admin' },
        { title: 'Users', href: '/admin/users' },
    ];

    const handleSubmit = () => {
        post('/admin/users');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Users" />

            {showPassword && (
                <PasswordModal password={showPassword} onClose={() => setShowPassword(null)} />
            )}

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">User Management</h1>
                        <p className="text-muted-foreground">Manage staff users and assign roles</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Admin
                            </Button>
                        </Link>
                        <Link href="/admin/roles">
                            <Button variant="outline">
                                <Shield className="mr-2 h-4 w-4" />
                                Manage Roles
                            </Button>
                        </Link>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New User</DialogTitle>
                                    <DialogDescription>Add a new staff user to the system.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="John Doe"
                                        />
                                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="john@company.com"
                                        />
                                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role.id} value={role.name}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleSubmit} disabled={processing}>
                                        Add User
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {flash.message && !flash.generatedPassword && (
                    <Alert>
                        <AlertDescription>{flash.message}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-4">
                    {users.map((user) => (
                        <Card key={user.id}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{user.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                {user.email}
                                                {user.is_microsoft_user && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Microsoft SSO
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {user.roles.map((role) => (
                                            <Badge key={role.id} variant="secondary">
                                                {role.name}
                                            </Badge>
                                        ))}
                                        <EditRolesDialog user={user} roles={roles} />
                                        <ResetPasswordButton user={user} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {users.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <User className="h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No users found</h3>
                            <p className="text-sm text-muted-foreground">Add your first user to get started</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
