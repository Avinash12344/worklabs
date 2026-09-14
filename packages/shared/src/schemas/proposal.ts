import { z } from 'zod';

export const createProposalSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  cover_letter: z
    .string()
    .trim()
    .min(20, 'Cover letter must be at least 20 characters')
    .max(5000, 'Cover letter is too long'),
  bid_amount: z
    .number()
    .int('Bid must be an integer')
    .positive('Bid must be positive'),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;