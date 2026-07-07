import type { Request, Response } from 'express';
import { dealsService } from './deals.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const actor = (req: Request) => ({ id: req.user!.sub, role: req.user!.role });

export const dealsController = {
  async board(req: Request, res: Response) {
    return sendSuccess(res, await dealsService.board(actor(req)));
  },
  async get(req: Request, res: Response) {
    return sendSuccess(res, await dealsService.getById(actor(req), req.params.id));
  },
  async create(req: Request, res: Response) {
    return sendSuccess(res, await dealsService.create(actor(req), req.body), 201);
  },
  async update(req: Request, res: Response) {
    return sendSuccess(res, await dealsService.update(actor(req), req.params.id, req.body));
  },
  async move(req: Request, res: Response) {
    const { stageId, position } = req.body;
    return sendSuccess(res, await dealsService.move(actor(req), req.params.id, stageId, position));
  },
  async remove(req: Request, res: Response) {
    return sendSuccess(res, await dealsService.remove(actor(req), req.params.id));
  },
};
