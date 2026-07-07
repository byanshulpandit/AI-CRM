import { Router } from 'express';
import { dealsController } from './deals.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createDealSchema, updateDealSchema, moveDealSchema, idParam } from './deals.validation.js';

export const dealsRouter = Router();
dealsRouter.use(authenticate);

dealsRouter.get('/board', asyncHandler(dealsController.board));
dealsRouter.post('/', validate({ body: createDealSchema }), asyncHandler(dealsController.create));
dealsRouter.get('/:id', validate({ params: idParam }), asyncHandler(dealsController.get));
dealsRouter.patch('/:id', validate({ params: idParam, body: updateDealSchema }), asyncHandler(dealsController.update));
dealsRouter.patch('/:id/move', validate({ params: idParam, body: moveDealSchema }), asyncHandler(dealsController.move));
dealsRouter.delete('/:id', validate({ params: idParam }), asyncHandler(dealsController.remove));
