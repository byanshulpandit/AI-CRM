import type { Request, Response } from 'express';
import { leadsService } from './leads.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import type { LeadListQuery } from './leads.validation.js';

const actor = (req: Request) => ({ id: req.user!.sub, role: req.user!.role });

export const leadsController = {
  async list(req: Request, res: Response) {
    const { items, meta } = await leadsService.list(actor(req), req.query as unknown as LeadListQuery);
    return sendSuccess(res, items, 200, meta);
  },
  async get(req: Request, res: Response) {
    return sendSuccess(res, await leadsService.getById(actor(req), req.params.id));
  },
  async create(req: Request, res: Response) {
    return sendSuccess(res, await leadsService.create(actor(req), req.body), 201);
  },
  async update(req: Request, res: Response) {
    return sendSuccess(res, await leadsService.update(actor(req), req.params.id, req.body));
  },
  async convert(req: Request, res: Response) {
    return sendSuccess(res, await leadsService.convert(actor(req), req.params.id));
  },
  async remove(req: Request, res: Response) {
    return sendSuccess(res, await leadsService.remove(actor(req), req.params.id));
  },
};
