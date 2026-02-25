import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Download,
    FileBarChart2,
    ThumbsUp,
    TrendingUp,
} from 'lucide-react';
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Reports', href: '/reports' },
];

// ── Colour palettes ──────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    draft: '#94a3b8',
    submitted: '#60a5fa',
    pending_approval: '#f59e0b',
    approved: '#34d399',
    rejected: '#f87171',
    scheduled: '#818cf8',
    in_progress: '#38bdf8',
    completed: '#10b981',
    cancelled: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
};

const RISK_COLORS: Record<string, string> = {
    high: '#ef4444',
    medium: '#f97316',
    low: '#22c55e',
};

const TYPE_COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#14b8a6',
];

// ── Semi-circle donut (gauge) ────────────────────────────────────────────────

type GaugeProps = {
    value: number | null;
    label: string;
    sublabel?: string;
    color: string;
    icon: React.ReactNode;
};

function Gauge({ value, label, sublabel, color, icon }: GaugeProps) {
    const pct = value ?? 0;
    const remainder = 100 - pct;

    const data = [
        { name: 'value', value: pct },
        { name: 'empty', value: remainder },
    ];

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-full" style={{ height: 130 }}>
                <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="85%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius="60%"
                            outerRadius="80%"
                            paddingAngle={2}
                            dataKey="value"
                            strokeWidth={0}
                        >
                            <Cell fill={color} />
                            <Cell fill="hsl(var(--muted))" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                {/* Centre text */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">
                    <div className="text-muted-foreground mb-0.5">{icon}</div>
                    <span className="text-2xl font-bold leading-none">
                        {value !== null ? `${value}%` : '—'}
                    </span>
                </div>
            </div>
            <p className="mt-1 text-sm font-medium">{label}</p>
            {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
    );
}

// ── Pre-built report definitions ─────────────────────────────────────────────

const REPORT_CATALOGUE = [
    {
        id: 'change-volume',
        title: 'Change Volume Report',
        description: 'Total changes raised over a selected period, broken down by status and change type.',
        category: 'Operations',
        href: '/export/changes',
    },
    {
        id: 'risk-profile',
        title: 'Risk Profile Summary',
        description: 'Distribution of changes by risk level (Low / Medium / High) with trend analysis.',
        category: 'Risk',
        href: '/export/changes?filter=risk',
    },
    {
        id: 'approval-report',
        title: 'Approval & Rejection Report',
        description: 'Approval rates, average approval time, and reasons for rejection.',
        category: 'Governance',
        href: '/export/changes?filter=approvals',
    },
    {
        id: 'emergency-changes',
        title: 'Emergency Change Report',
        description: 'All emergency changes with details on justification, approvers, and outcomes.',
        category: 'Compliance',
        href: '/export/changes?filter=emergency',
    },
    {
        id: 'client-activity',
        title: 'Client Activity Report',
        description: 'Change volume per client, highlighting the most active clients and their risk profiles.',
        category: 'Clients',
        href: '/export/changes?filter=client',
    },
    {
        id: 'cab-summary',
        title: 'CAB Meeting Summary',
        description: 'CAB agenda items reviewed, votes cast, and outcome of each meeting.',
        category: 'Governance',
        href: '/export/cab-history',
    },
    {
        id: 'overdue-changes',
        title: 'Overdue & Stalled Changes',
        description: 'Changes that have not progressed past a status for more than 7 days.',
        category: 'Operations',
        href: '/export/changes?filter=stalled',
    },
    {
        id: 'security-patch',
        title: 'Security Patch Compliance',
        description: 'All security patch changes — planned, in-progress, and completed — with SLA status.',
        category: 'Compliance',
        href: '/export/changes?filter=security_patch',
    },
];

const CATEGORY_COLOURS: Record<string, string> = {
    Operations: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Risk: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    Governance: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    Compliance: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    Clients: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function toChartData<T extends Record<string, number>>(
    map: T,
    labelMap?: Record<string, string>,
) {
    return Object.entries(map)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
            name: labelMap?.[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            value,
        }));
}

// ── Props ────────────────────────────────────────────────────────────────────

type Props = {
    stats: {
        totalChanges: number;
        completedCount: number;
        approvedCount: number;
        rejectedCount: number;
        inProgressCount: number;
        approvalRate: number | null;
        completionRate: number | null;
        highCriticalRate: number | null;
        highCritical: number;
    };
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    byRisk: Record<string, number>;
    topClients: { client: string; total: number }[];
    monthlyTrend: { month: string; total: number; completed: number }[];
    thisMonth: { new: number; completed: number; pending: number; emergency: number };
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsIndex({
    stats,
    byStatus,
    byPriority,
    byType,
    byRisk,
    topClients,
    monthlyTrend,
    thisMonth,
}: Props) {
    const statusChartData = toChartData(byStatus).map((d) => ({
        ...d,
        fill: STATUS_COLORS[d.name.toLowerCase().replace(/ /g, '_')] ?? '#94a3b8',
    }));

    const priorityChartData = toChartData(byPriority).map((d) => ({
        ...d,
        fill: PRIORITY_COLORS[d.name.toLowerCase()] ?? '#94a3b8',
    }));

    const riskChartData = toChartData(byRisk).map((d) => ({
        ...d,
        fill: RISK_COLORS[d.name.toLowerCase()] ?? '#94a3b8',
    }));

    const typeChartData = toChartData(byType);

    const maxClient = topClients.reduce((m, c) => Math.max(m, c.total), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Reports</h1>
                        <p className="text-muted-foreground">
                            Live metrics and pre-built exportable reports for your change control data.
                        </p>
                    </div>
                    <a href="/export/changes">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export all changes
                        </Button>
                    </a>
                </div>

                {/* This-month snapshot */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'New this month', value: thisMonth.new, color: 'text-blue-600' },
                        { label: 'Completed this month', value: thisMonth.completed, color: 'text-green-600' },
                        { label: 'Pending approval', value: thisMonth.pending, color: 'text-amber-600' },
                        { label: 'Emergency changes', value: thisMonth.emergency, color: 'text-red-600' },
                    ].map((item) => (
                        <Card key={item.label}>
                            <CardContent className="pt-6">
                                <p className="text-sm text-muted-foreground">{item.label}</p>
                                <p className={`text-4xl font-bold ${item.color}`}>{item.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Gauge row */}
                <div className="grid gap-6 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="text-base">Approval Rate</CardTitle>
                            <CardDescription>Approved vs decided (approved + rejected)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Gauge
                                value={stats.approvalRate}
                                label="Approved"
                                sublabel={`${stats.approvedCount} approved / ${stats.approvedCount + stats.rejectedCount} decided`}
                                color="#10b981"
                                icon={<ThumbsUp className="h-4 w-4" />}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="text-base">Completion Rate</CardTitle>
                            <CardDescription>Completed vs all changes ever raised</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Gauge
                                value={stats.completionRate}
                                label="Completed"
                                sublabel={`${stats.completedCount} of ${stats.totalChanges} total`}
                                color="#6366f1"
                                icon={<CheckCircle2 className="h-4 w-4" />}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-0">
                            <CardTitle className="text-base">High / Critical Rate</CardTitle>
                            <CardDescription>High + critical priority changes as % of total</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Gauge
                                value={stats.highCriticalRate}
                                label="High or Critical"
                                sublabel={`${stats.highCritical} of ${stats.totalChanges} changes`}
                                color="#f97316"
                                icon={<AlertTriangle className="h-4 w-4" />}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Donut charts row */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Status breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">By Status</CardTitle>
                            <CardDescription>All-time distribution across workflow states</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {statusChartData.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={statusChartData}
                                            cx="50%"
                                            cy="50%"
                                            startAngle={180}
                                            endAngle={0}
                                            innerRadius="55%"
                                            outerRadius="75%"
                                            paddingAngle={2}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {statusChartData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => [v, 'Changes']} />
                                        <Legend iconType="circle" iconSize={8} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Priority breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">By Priority</CardTitle>
                            <CardDescription>Critical / High / Medium / Low distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {priorityChartData.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={priorityChartData}
                                            cx="50%"
                                            cy="50%"
                                            startAngle={180}
                                            endAngle={0}
                                            innerRadius="55%"
                                            outerRadius="75%"
                                            paddingAngle={2}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {priorityChartData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => [v, 'Changes']} />
                                        <Legend iconType="circle" iconSize={8} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Risk breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">By Risk Level</CardTitle>
                            <CardDescription>Low / Medium / High risk breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {riskChartData.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={riskChartData}
                                            cx="50%"
                                            cy="50%"
                                            startAngle={180}
                                            endAngle={0}
                                            innerRadius="55%"
                                            outerRadius="75%"
                                            paddingAngle={2}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {riskChartData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => [v, 'Changes']} />
                                        <Legend iconType="circle" iconSize={8} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Change type + top clients */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Change type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">By Change Type</CardTitle>
                            <CardDescription>Semi-circle breakdown of change categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {typeChartData.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            data={typeChartData}
                                            cx="50%"
                                            cy="70%"
                                            startAngle={180}
                                            endAngle={0}
                                            innerRadius="50%"
                                            outerRadius="70%"
                                            paddingAngle={2}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {typeChartData.map((_, i) => (
                                                <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => [v, 'Changes']} />
                                        <Legend iconType="circle" iconSize={8} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top clients */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top Clients by Volume</CardTitle>
                            <CardDescription>Clients with the most change requests</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topClients.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {topClients.map((c) => (
                                        <div key={c.client} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium truncate">{c.client}</span>
                                                <span className="ml-2 shrink-0 text-muted-foreground">
                                                    {c.total}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full bg-primary"
                                                    style={{
                                                        width: `${maxClient > 0 ? Math.round((c.total / maxClient) * 100) : 0}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4" />
                            Monthly Trend — last 6 months
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-6 gap-3">
                            {monthlyTrend.map((m) => {
                                const completeRate = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                                return (
                                    <div key={m.month} className="flex flex-col items-center gap-1 text-center">
                                        <span className="text-xs text-muted-foreground">{m.month}</span>
                                        <div className="relative flex h-24 w-full flex-col justify-end rounded-md bg-muted">
                                            <div
                                                className="rounded-md bg-primary/70 transition-all"
                                                style={{ height: `${completeRate}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold">{m.total}</span>
                                        <span className="text-xs text-muted-foreground">{m.completed} done</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Pre-built report catalogue */}
                <div>
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FileBarChart2 className="h-5 w-5" />
                            Report Catalogue
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Pre-built reports ready to generate and export.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {REPORT_CATALOGUE.map((report) => (
                            <Card key={report.id} className="flex flex-col hover:border-primary/50 transition-colors">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-sm leading-snug">{report.title}</CardTitle>
                                        <span
                                            className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${CATEGORY_COLOURS[report.category] ?? 'bg-muted text-muted-foreground'}`}
                                        >
                                            {report.category}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col justify-between gap-3">
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {report.description}
                                    </p>
                                    <a href={report.href}>
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Download className="mr-2 h-3 w-3" />
                                            Generate
                                            <ArrowRight className="ml-auto h-3 w-3" />
                                        </Button>
                                    </a>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
