import { Link } from 'react-router-dom';
import {
  Users, DollarSign, Trophy, Target, CheckSquare, ArrowRight, TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/StatCard';
import { StatsSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDashboardStats, useRevenueTrend } from '@/hooks/useAnalytics';
import { useTasks } from '@/hooks/useTasks';
import { useCustomers } from '@/hooks/useCustomers';
import { formatCompactCurrency, formatCurrency } from '@/lib/utils';
import { customerStatusTone, priorityTone } from '@/components/ui/Badge';

export default function DashboardPage() {
  const stats = useDashboardStats();
  const trend = useRevenueTrend();
  const tasks = useTasks({ page: 1, status: 'TODO', scope: 'mine' });
  const recentCustomers = useCustomers({ page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your revenue, pipeline and priorities at a glance."
      />

      {stats.isLoading ? (
        <StatsSkeleton />
      ) : stats.data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open pipeline" value={formatCompactCurrency(stats.data.openPipelineValue)} icon={DollarSign} tone="primary" hint={`${stats.data.openDealsCount} open deals`} />
          <StatCard label="Won revenue" value={formatCompactCurrency(stats.data.wonValue)} icon={Trophy} tone="success" hint={`${stats.data.wonDealsCount} deals won`} />
          <StatCard label="Win rate" value={`${stats.data.winRate}%`} icon={TrendingUp} tone="info" hint="closed vs open" />
          <StatCard label="Active customers" value={stats.data.activeCustomers} icon={Users} tone="warning" hint={`${stats.data.totalCustomers} total`} />
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
            <Badge tone="success" dot>Last 6 months</Badge>
          </CardHeader>
          <CardContent>
            {trend.isLoading ? (
              <div className="h-64"><CardSkeleton className="h-full" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trend.data} margin={{ left: -18, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(244 80% 66%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(244 80% 66%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '0.8rem' }}
                    formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(244 80% 66%)" strokeWidth={2.5} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tasks due */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> My open tasks</CardTitle>
            <Link to="/app/tasks" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.isLoading ? (
              <CardSkeleton />
            ) : !tasks.data?.items.length ? (
              <EmptyState icon={CheckSquare} title="All clear" description="No open tasks. Nice work!" />
            ) : (
              tasks.data.items.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card/40 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                    {t.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        due {formatDistanceToNow(new Date(t.dueDate), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent customers */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4" /> Recently added customers</CardTitle>
          <Link to="/app/customers" className="flex items-center gap-1 text-xs text-primary hover:underline">
            All customers <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentCustomers.isLoading ? (
            <CardSkeleton />
          ) : !recentCustomers.data?.items.length ? (
            <EmptyState title="No customers yet" />
          ) : (
            <div className="divide-y divide-border">
              {recentCustomers.data.items.map((c) => (
                <Link key={c.id} to={`/app/customers/${c.id}`} className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/30">
                  <Avatar firstName={c.name.split(' ')[0]} lastName={c.name.split(' ')[1]} src={c.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.company ?? c.email}</p>
                  </div>
                  <Badge tone={customerStatusTone[c.status]}>{c.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
