import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { usersRouter } from '../modules/users/users.routes.js';
import { customersRouter } from '../modules/customers/customers.routes.js';
import { leadsRouter } from '../modules/leads/leads.routes.js';
import { dealsRouter } from '../modules/deals/deals.routes.js';
import { tasksRouter } from '../modules/tasks/tasks.routes.js';
import { activitiesRouter } from '../modules/activities/activities.routes.js';
import { notesRouter } from '../modules/notes/notes.routes.js';
import { emailsRouter } from '../modules/emails/emails.routes.js';
import { notificationsRouter } from '../modules/notifications/notifications.routes.js';
import { uploadsRouter } from '../modules/uploads/uploads.routes.js';
import { analyticsRouter } from '../modules/analytics/analytics.routes.js';
import { aiRouter } from '../modules/ai/ai.routes.js';
import { exportRouter } from '../modules/export/export.routes.js';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) =>
  res.json({
    success: true,
    data: { name: 'AI-CRM API', version: '1.0.0', docs: '/api/docs (see docs/API.md)' },
  }),
);

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/leads', leadsRouter);
apiRouter.use('/deals', dealsRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/activities', activitiesRouter);
apiRouter.use('/notes', notesRouter);
apiRouter.use('/emails', emailsRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/uploads', uploadsRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/export', exportRouter);
