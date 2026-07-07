import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination.js';

export const customerListQuery = paginationQuery.extend({
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE', 'CHURNED']).optional(),
  ownerId: z.string().optional(),
  tag: z.string().optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(120),
  company: z.string().max(120).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(40).optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE', 'CHURNED']).default('LEAD'),
  tags: z.array(z.string()).max(10).default([]),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  notes: z.string().max(2000).optional(),
  ownerId: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const idParam = z.object({ id: z.string().min(1) });

export type CustomerListQuery = z.infer<typeof customerListQuery>;
