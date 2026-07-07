import { Router } from 'express';
import { tasksController } from './tasks.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { taskListQuery, createTaskSchema, updateTaskSchema, idParam } from './tasks.validation.js';

export const tasksRouter = Router();
tasksRouter.use(authenticate);

tasksRouter.get('/', validate({ query: taskListQuery }), asyncHandler(tasksController.list));
tasksRouter.post('/', validate({ body: createTaskSchema }), asyncHandler(tasksController.create));
tasksRouter.get('/:id', validate({ params: idParam }), asyncHandler(tasksController.get));
tasksRouter.patch('/:id', validate({ params: idParam, body: updateTaskSchema }), asyncHandler(tasksController.update));
tasksRouter.delete('/:id', validate({ params: idParam }), asyncHandler(tasksController.remove));
