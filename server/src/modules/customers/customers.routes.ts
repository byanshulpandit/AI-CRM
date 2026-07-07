import { Router } from 'express';
import { customersController } from './customers.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  customerListQuery,
  createCustomerSchema,
  updateCustomerSchema,
  idParam,
} from './customers.validation.js';

export const customersRouter = Router();
customersRouter.use(authenticate);

customersRouter.get('/', validate({ query: customerListQuery }), asyncHandler(customersController.list));
customersRouter.post('/', validate({ body: createCustomerSchema }), asyncHandler(customersController.create));
customersRouter.get('/:id', validate({ params: idParam }), asyncHandler(customersController.get));
customersRouter.patch('/:id', validate({ params: idParam, body: updateCustomerSchema }), asyncHandler(customersController.update));
customersRouter.delete('/:id', validate({ params: idParam }), asyncHandler(customersController.remove));
