import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessType: z.string().min(2, 'Business type must be at least 2 characters'),
  businessCategory: z.string().min(2, 'Business category must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional().nullable(),
  date: z.string().or(z.date()).optional().nullable(),
  source: z.enum(['CSV', 'DEMO', 'POS', 'BANK_STATEMENT']),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'POS', 'WALLET']),
  direction: z.enum(['INFLOW', 'OUTFLOW']),
  status: z.enum(['COMPLETED', 'PENDING', 'FAILED']),
}).refine(
  (data) => {
    if (data.type === 'INCOME' && data.direction !== 'INFLOW') return false;
    if (data.type === 'EXPENSE' && data.direction !== 'OUTFLOW') return false;
    return true;
  },
  {
    message: 'INCOME must have direction INFLOW, and EXPENSE must have direction OUTFLOW',
    path: ['direction'],
  }
);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;

export const profileUpdateSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').optional(),
  businessType: z.string().min(2, 'Business type must be at least 2 characters').optional(),
  businessCategory: z.string().min(2, 'Business category must be at least 2 characters').optional(),
  location: z.string().min(2, 'Location must be at least 2 characters').optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;

export const preferencesUpdateSchema = z.object({
  currency: z.string().min(1, 'Currency is required').optional(),
  alertThreshold: z.number().positive('Alert threshold must be positive').optional(),
  smsNotifications: z.boolean().optional(),
});

export type PreferencesUpdateInput = z.infer<typeof preferencesUpdateSchema>;

export const loanApplicationSchema = z.object({
  lenderId: z.string().min(1, 'Lender ID is required'),
  requestedAmount: z.number().positive('Requested amount must be positive'),
});

export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;

