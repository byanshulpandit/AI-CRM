import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { logActivity } from '../../services/activity.service.js';
import { env } from '../../config/env.js';

const uploadDir = path.resolve(env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

const ALLOWED = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`));
  },
});

export const uploadsRouter = Router();
uploadsRouter.use(authenticate);

uploadsRouter.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('No file provided (field name must be "file")');
    const { customerId, dealId } = req.body as { customerId?: string; dealId?: string };

    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        customerId: customerId || null,
        dealId: dealId || null,
        uploadedById: req.user!.sub,
      },
    });

    if (customerId) {
      await logActivity({ type: 'FILE', summary: `Uploaded "${req.file.originalname}"`, userId: req.user!.sub, customerId });
    }
    return sendSuccess(res, attachment, 201);
  }),
);

uploadsRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const attachment = await prisma.attachment.findUnique({ where: { id: req.params.id } });
    if (!attachment) throw ApiError.notFound('Attachment not found');
    // Remove the physical file (ignore if already gone).
    const filePath = path.join(uploadDir, attachment.filename);
    fs.promises.unlink(filePath).catch(() => undefined);
    await prisma.attachment.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { id: req.params.id });
  }),
);
