import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { isProd } from '../../config/env.js';

const REFRESH_COOKIE = 'refreshToken';
const cookieOpts = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOpts);
    return sendSuccess(res, result, 201);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOpts);
    return sendSuccess(res, result);
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
    const result = await authService.refresh(token);
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOpts);
    return sendSuccess(res, result);
  },

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
    await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE, { ...cookieOpts, maxAge: undefined });
    return sendSuccess(res, { message: 'Logged out' });
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.sub);
    return sendSuccess(res, user);
  },
};
