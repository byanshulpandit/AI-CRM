import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';

/**
 * Restricts a route to the given roles. Must run after `authenticate`.
 * Usage: `router.post('/', authorize('ADMIN', 'SALES_MANAGER'), handler)`
 */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}
