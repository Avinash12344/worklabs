import { z } from 'zod';

export const createMilestoneSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
  amount: z.number().int().positive(),
  due_date: z.string().datetime().nullable().optional(),
});

export const updateMilestoneSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  amount: z.number().int().positive().optional(),
  due_date: z.string().datetime().nullable().optional(),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;