import type { Request, Response } from 'express';
import { customersService } from './customers.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import type { CustomerListQuery } from './customers.validation.js';

function actor(req: Request) {
  return { id: req.user!.sub, role: req.user!.role };
}

export const customersController = {
  async list(req: Request, res: Response) {
    const { items, meta } = await customersService.list(
      actor(req),
      req.query as unknown as CustomerListQuery,
    );
    return sendSuccess(res, items, 200, meta);
  },

  async get(req: Request, res: Response) {
    const customer = await customersService.getById(actor(req), req.params.id);
    return sendSuccess(res, customer);
  },

  async create(req: Request, res: Response) {
    const customer = await customersService.create(actor(req), req.body);
    return sendSuccess(res, customer, 201);
  },

  async update(req: Request, res: Response) {
    const customer = await customersService.update(actor(req), req.params.id, req.body);
    return sendSuccess(res, customer);
  },

  async remove(req: Request, res: Response) {
    const result = await customersService.remove(actor(req), req.params.id);
    return sendSuccess(res, result);
  },
};
