import { z } from 'zod';

export const createJobSchema = z
  .object({
    // client_id removed — comes from req.user
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10).max(10000),
    budget_min: z.number().int().nonnegative(),
    budget_max: z.number().int().positive(),
    deadline: z.string().datetime().nullable().optional(),
  })
  .refine((data) => data.budget_max >= data.budget_min, {
    message: 'budget_max must be greater than or equal to budget_min',
    path: ['budget_max'],
  });

export const updateJobSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().min(10).max(10000).optional(),
    budget_min: z.number().int().nonnegative().optional(),
    budget_max: z.number().int().positive().optional(),
    status: z
      .enum(['draft', 'open', 'in_progress', 'completed', 'cancelled'])
      .optional(),
    deadline: z.string().datetime().nullable().optional(),
  })
  .refine(
    (data) =>
      data.budget_min === undefined ||
      data.budget_max === undefined ||
      data.budget_max >= data.budget_min,
    {
      message: 'budget_max must be greater than or equal to budget_min',
      path: ['budget_max'],
    }
  );

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;