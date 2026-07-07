import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { DollarSign, Trophy, Target, Percent } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatsSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import {
  useDashboardStats, useDealsByStage, useRevenueTrend, useLeadsBySource,
} from '@/hooks/useAnalytics';
import { formatCompactCurrency, formatCurrency } from '@/lib/utils';

const SOURCE_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#64748b'];
const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '0.8rem' };

export default function AnalyticsPage() {
  const stats = useDashboardStats();
  const byStage = useDealsByStage();
  const trend = useRevenueTrend();
  const bySource = useLeadsBySource();

  return (
    <div>
      <PageHeader title="Analytics" description="Sales performance across your pipeline." />

      {stats.isLoading ? (
        <StatsSkeleton />
      ) : stats.data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open pipeline" value={formatCompactCurrency(stats.data.openPipelineValue)} icon={DollarSign} tone="primary" hint={`${stats.data.openDealsCount} deals`} />
          <StatCard label="Won revenue" value={formatCompactCurrency(stats.data.wonValue)} icon={Trophy} tone="success" hint={`${stats.data.wonDealsCount} won`} />
          <StatCard label="Win rate" value={`${stats.data.winRate}%`} icon={Percent} tone="info" />
          <StatCard label="Total leads" value={stats.data.totalLeads} icon={Target} tone="warning" />
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Deals by stage */}
        <Card>
          <CardHeader><CardTitle>Pipeline value by stage</CardTitle></CardHeader>
          <CardContent>
            {byStage.isLoading ? <CardSkeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byStage.data} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-12} textAnchor="end" height={50} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Value']} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {byStage.data?.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Leads by source */}
        <Card>
          <CardHeader><CardTitle>Leads by source</CardTitle></CardHeader>
          <CardContent>
            {bySource.isLoading ? <CardSkeleton className="h-64" /> : !bySource.data?.length ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No lead data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={bySource.data}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {bySource.data.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={(value) => <span className="text-xs capitalize text-muted-foreground">{String(value).replace('_', ' ').toLowerCase()}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue trend full width */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue trend (won deals)</CardTitle></CardHeader>
          <CardContent>
            {trend.isLoading ? <CardSkeleton className="h-64" /> : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend.data} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                  <Line type="monotone" dataKey="value" stroke="hsl(244 80% 66%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(244 80% 66%)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
