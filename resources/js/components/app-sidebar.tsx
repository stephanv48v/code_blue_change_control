import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    FileText,
    CalendarClock,
    Vote,
    Building2,
    FormInput,
    BarChart2,
    ShieldCheck,
    Settings
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem, SharedData } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
        requiredPermission: 'dashboard.view',
    },
    {
        title: 'Change Requests',
        href: '/changes',
        icon: FileText,
        requiredPermission: 'changes.view',
    },
    {
        title: 'Scheduled Changes',
        href: '/changes/my-scheduled',
        icon: CalendarClock,
        requiredPermission: 'changes.view',
    },
    {
        title: 'CAB Agenda',
        href: '/cab-agenda',
        icon: Vote,
        requiredPermission: 'changes.view',
    },
    {
        title: 'Clients',
        href: '/clients',
        icon: Building2,
        requiredPermission: 'users.manage',
    },
    {
        title: 'Templates',
        href: '/form-builder',
        icon: FormInput,
        requiredPermission: 'forms.manage',
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: BarChart2,
        requiredPermission: 'changes.view',
    },
    {
        title: 'Governance',
        href: '/governance',
        icon: ShieldCheck,
        requiredPermission: 'policies.manage',
    },
    {
        title: 'Admin',
        href: '/admin',
        icon: Settings,
        requiredPermission: 'users.manage',
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.user?.permissions ?? [];

    const visibleItems = mainNavItems.filter((item) => {
        if (!item.requiredPermission) {
            return true;
        }

        return permissions.includes(item.requiredPermission);
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard().url} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={visibleItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
