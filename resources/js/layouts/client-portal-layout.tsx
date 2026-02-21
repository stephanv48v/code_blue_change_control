import { Link, usePage } from '@inertiajs/react';
import { Building2, CheckCircle, LayoutGrid, LogOut, Menu, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem, ClientContact } from '@/types';

type Props = {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export default function ClientPortalLayout({ children, breadcrumbs = [] }: Props) {
    const { auth } = usePage().props;
    const contact = auth.contact as ClientContact | null;
    const getInitials = useInitials();

    const navItems = [
        {
            title: 'Dashboard',
            href: '/portal/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'My Approvals',
            href: '/portal/approvals',
            icon: CheckCircle,
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation */}
            <header className="border-b border-sidebar-border/80">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Mobile Menu */}
                    <div className="lg:hidden mr-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64">
                                <SheetHeader>
                                    <SheetTitle>Client Portal</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-4 mt-6">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className="flex items-center gap-2 text-sm font-medium"
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.title}
                                        </Link>
                                    ))}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Logo */}
                    <Link href="/portal/dashboard" className="flex items-center gap-2">
                        <Building2 className="h-6 w-6" />
                        <span className="font-semibold hidden sm:inline">Client Portal</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-6 ml-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        ))}
                    </nav>

                    {/* User Menu */}
                    <div className="ml-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>
                                            {contact ? getInitials(contact.name) : '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <div className="flex items-center justify-start gap-2 p-2">
                                    <div className="flex flex-col space-y-0.5">
                                        <p className="text-sm font-medium">{contact?.name}</p>
                                        <p className="text-xs text-muted-foreground">{contact?.email}</p>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/portal/dashboard">
                                        <LayoutGrid className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/portal/approvals">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        My Approvals
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <form action="/portal/logout" method="post">
                                    <DropdownMenuItem asChild>
                                        <button type="submit" className="w-full">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log out
                                        </button>
                                    </DropdownMenuItem>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl p-6">
                {children}
            </main>
        </div>
    );
}
