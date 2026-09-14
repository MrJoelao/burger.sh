/**
 * Dish Validation Schemas
 * Zod schemas for dish create/update
 */

import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID non valido');

export const createDishSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome: almeno 2 caratteri'),
    type: z.string().trim().min(2, 'Tipologia richiesta (es. burger, drink, side)'),
    price: z
      .number({ invalid_type_error: 'Prezzo numerico richiesto' })
      .min(0, 'Prezzo non negativo'),
    ingredientIds: z.array(objectIdSchema).optional(),
    isCustom: z.boolean().optional(),
    restaurantId: objectIdSchema.optional(),
    allergens: z.array(z.string()).optional()
  })
  .refine((data) => !data.isCustom || !!data.restaurantId, {
    message: 'restaurantId richiesto per i piatti custom',
    path: ['restaurantId']
  });

export const updateDishSchema = createDishSchema.partial().omit({ restaurantId: true });

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
