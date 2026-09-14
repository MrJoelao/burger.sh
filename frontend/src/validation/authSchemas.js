/**
 * Auth Validation Schemas
 * Zod schemas for login, register, profile update
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Email non valida'),
  password: z.string().min(6, 'Password: almeno 6 caratteri')
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome: almeno 2 caratteri'),
    surname: z.string().trim().min(2, 'Cognome: almeno 2 caratteri'),
    email: z.string().trim().email('Email non valida'),
    password: z.string().min(6, 'Password: almeno 6 caratteri'),
    confirmPassword: z.string(),
    role: z.enum(['customer', 'manager'], {
      errorMap: () => ({ message: 'Ruolo non valido' })
    }),
    address: z
      .object({
        street: z.string().trim().min(1, 'Via richiesta'),
        city: z.string().trim().min(1, 'Città richiesta'),
        zip: z.string().trim().min(4, 'CAP non valido').max(10, 'CAP non valido')
      })
      .optional(),
    preferences: z.array(z.string()).optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword']
  })
  .refine(
    (data) => data.role !== 'customer' || (data.address && data.address.street && data.address.city && data.address.zip),
    {
      message: 'Indirizzo richiesto per i clienti',
      path: ['address']
    }
  );

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Nome: almeno 2 caratteri').optional(),
  surname: z.string().trim().min(2, 'Cognome: almeno 2 caratteri').optional(),
  address: z
    .object({
      street: z.string().trim().min(1, 'Via richiesta'),
      city: z.string().trim().min(1, 'Città richiesta'),
      zip: z.string().trim().min(4, 'CAP non valido').max(10, 'CAP non valido')
    })
    .optional(),
  preferences: z.array(z.string()).optional()
});

/**
 * Validate data against a schema
 * Returns { success, data, errors } - errors is a flat field->message map
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!errors[key]) errors[key] = issue.message;
  }

  return { success: false, data: null, errors };
}
