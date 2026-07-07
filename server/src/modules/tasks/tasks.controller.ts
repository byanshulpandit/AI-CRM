import type { Request, Response } from 'express';
import { tasksService } from './tasks.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import type { TaskListQuery } from './tasks.validation.js';

const actor = (req: Request) => ({ id: req.user!.sub, role: req.user!.role });

export const tasksController = {
  async list(req: Request, res: Response) {
    const { items, meta } = await tasksService.list(actor(req), req.query as unknown as TaskListQuery);
    return sendSuccess(res, items, 200, meta);
  },
  async get(req: Request, res: Response) {
    return sendSuccess(res, await tasksService.getById(actor(req), req.params.id));
  },
  async create(req: Request, res: Response) {
    return sendSuccess(res, await tasksService.create(actor(req), req.body), 201);
  },
  async update(req: Request, res: Response) {
    return sendSuccess(res, await tasksService.update(actor(req), req.params.id, req.body));
  },
  async remove(req: Request, res: Response) {
    return sendSuccess(res, await tasksService.remove(actor(req), req.params.id));
  },
};
