import type { Prisma, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

interface Actor { id: string; role: Role; }

function customerScope(actor: Actor): Prisma.CustomerWhereInput {
  return actor.role === 'EMPLOYEE' ? { ownerId: actor.id } : {};
}
function dealScope(actor: Actor): Prisma.DealWhereInput {
  return actor.role === 'EMPLOYEE' ? { ownerId: actor.id } : {};
}

export const analyticsService = {
  async dashboard(actor: Actor) {
    const [customers, activeCustomers, openDeals, wonDeals, tasksDue, leads] = await Promise.all([
      prisma.customer.count({ where: customerScope(actor) }),
      prisma.customer.count({ where: { ...customerScope(actor), status: 'ACTIVE' } }),
      prisma.deal.findMany({ where: { ...dealScope(actor), status: 'OPEN' }, select: { value: true } }),
      prisma.deal.findMany({ where: { ...dealScope(actor), status: 'WON' }, select: { value: true } }),
      prisma.task.count({
        where: {
          assigneeId: actor.role === 'EMPLOYEE' ? actor.id : undefined,
          status: { not: 'DONE' },
          dueDate: { lte: new Date(Date.now() + 7 * 86_400_000) },
        },
      }),
      prisma.lead.count({ where: actor.role === 'EMPLOYEE' ? { assignedToId: actor.id } : {} }),
    ]);

    const openValue = openDeals.reduce((s, d) => s + Number(d.value), 0);
    const wonValue = wonDeals.reduce((s, d) => s + Number(d.value), 0);
    const winRate =
      wonDeals.length + openDeals.length > 0
        ? Math.round((wonDeals.length / (wonDeals.length + openDeals.length)) * 100)
        : 0;

    return {
      totalCustomers: customers,
      activeCustomers,
      openDealsCount: openDeals.length,
      openPipelineValue: openValue,
      wonDealsCount: wonDeals.length,
      wonValue,
      winRate,
      tasksDueSoon: tasksDue,
      totalLeads: leads,
    };
  },

  /** Deal count + value grouped by pipeline stage (for the funnel/bar chart). */
  async dealsByStage(actor: Actor) {
    const pipeline = await prisma.pipeline.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    if (!pipeline) return [];
    const deals = await prisma.deal.findMany({
      where: { stage: { pipelineId: pipeline.id }, ...dealScope(actor) },
      select: { stageId: true, value: true },
    });
    return pipeline.stages.map((s) => {
      const inStage = deals.filter((d) => d.stageId === s.id);
      return {
        stage: s.name,
        color: s.color,
        count: inStage.length,
        value: inStage.reduce((sum, d) => sum + Number(d.value), 0),
      };
    });
  },

  /** Won deal value per month for the last 6 months (revenue trend line). */
  async revenueTrend(actor: Actor) {
    const start = new Date();
    start.setMonth(start.getMonth() - 5);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const deals = await prisma.deal.findMany({
      where: { ...dealScope(actor), status: 'WON', closedAt: { gte: start } },
      select: { value: true, closedAt: true },
    });

    const months: { label: string; value: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(start);
      d.setMonth(start.getMonth() + i);
      months.push({ label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }), value: 0 });
    }
    for (const deal of deals) {
      if (!deal.closedAt) continue;
      const idx =
        (deal.closedAt.getFullYear() - start.getFullYear()) * 12 +
        (deal.closedAt.getMonth() - start.getMonth());
      if (idx >= 0 && idx < months.length) months[idx].value += Number(deal.value);
    }
    return months;
  },

  /** Lead counts grouped by source (for the donut chart). */
  async leadsBySource(actor: Actor) {
    const grouped = await prisma.lead.groupBy({
      by: ['source'],
      _count: { _all: true },
      where: actor.role === 'EMPLOYEE' ? { assignedToId: actor.id } : {},
    });
    return grouped.map((g) => ({ source: g.source, count: g._count._all }));
  },
};
