import { Router } from 'express';
import { leadsController } from './leads.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { leadListQuery, createLeadSchema, updateLeadSchema, idParam } from './leads.validation.js';

export const leadsRouter = Router();
leadsRouter.use(authenticate);

leadsRouter.get('/', validate({ query: leadListQuery }), asyncHandler(leadsController.list));
leadsRouter.post('/', validate({ body: createLeadSchema }), asyncHandler(leadsController.create));
leadsRouter.get('/:id', validate({ params: idParam }), asyncHandler(leadsController.get));
leadsRouter.patch('/:id', validate({ params: idParam, body: updateLeadSchema }), asyncHandler(leadsController.update));
leadsRouter.post('/:id/convert', validate({ params: idParam }), asyncHandler(leadsController.convert));
leadsRouter.delete('/:id', validate({ params: idParam }), asyncHandler(leadsController.remove));
