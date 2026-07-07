import { Router } from 'express';
import type { Request, Response } from 'express';
import { analyticsService } from './analytics.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const actor = (req: Request) => ({ id: req.user!.sub, role: req.user!.role });

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);

analyticsRouter.get('/dashboard', asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(res, await analyticsService.dashboard(actor(req))),
));
analyticsRouter.get('/deals-by-stage', asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(res, await analyticsService.dealsByStage(actor(req))),
));
analyticsRouter.get('/revenue-trend', asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(res, await analyticsService.revenueTrend(actor(req))),
));
analyticsRouter.get('/leads-by-source', asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(res, await analyticsService.leadsBySource(actor(req))),
));
