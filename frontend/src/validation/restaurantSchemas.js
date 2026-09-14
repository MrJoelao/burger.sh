/**
 * Restaurant Validation Schemas
 * Zod schemas for restaurant create/update
 */

import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID non valido');

export const createRestaurantSchema = z.object({
  name: z.string().trim().min(2, 'Nome: almeno 2 caratteri'),
  address: z.string().trim().min(3, 'Indirizzo richiesto'),
  city: z.string().trim().min(2, 'Città richiesta'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{6,20}$/, 'Numero di telefono non valido'),
  vatNumber: z
    .string()
    .trim()
    .min(8, 'Partita IVA non valida')
    .max(20, 'Partita IVA non valida'),
  managerId: objectIdSchema
});

export const updateRestaurantSchema = createRestaurantSchema
  .partial()
  .omit({ managerId: true });

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
