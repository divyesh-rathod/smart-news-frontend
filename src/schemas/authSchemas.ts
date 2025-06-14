import { z } from 'zod';
// This file contains the schemas for login and signup forms using Zod
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

export const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone_number: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  profile_picture: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;