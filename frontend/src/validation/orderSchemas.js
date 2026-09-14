/**
 * Order Validation Schemas
 * Zod schemas for cart items and order confirmation
 */

import { z } from 'zod';

export const addCartItemSchema = z.object({
  restaurantId: z.string().min(1, 'Filiale richiesta'),
  dishId: z.string().min(1, 'Piatto richiesto'),
  quantity: z
    .number()
    .int('Quantità intera')
    .min(1, 'Quantità minima 1')
    .max(99, 'Quantità massima 99')
});

export const orderModeSchema = z.enum(['pickup', 'delivery'], {
  errorMap: () => ({ message: 'Modalità non valida' })
});

export const deliveryAddressSchema = z.object({
  address: z.string().trim().min(5, 'Indirizzo completo richiesto (via, città, CAP)')
});

export const createOrderSchema = z
  .object({
    restaurantId: z.string().min(1, 'Filiale richiesta'),
    mode: orderModeSchema,
    orderItems: z
      .array(
        z.object({
          dishId: z.string().min(1, 'Piatto richiesto'),
          quantity: z
            .number()
            .int('Quantità intera')
            .min(1, 'Quantità minima 1')
            .max(99, 'Quantità massima 99'),
          unitPrice: z.number().min(0, 'Prezzo non valido')
        })
      )
      .min(1, 'Almeno un articolo nell\'ordine'),
    delivery: z
      .object({
        address: z.string().trim().min(5, 'Indirizzo di consegna richiesto')
      })
      .optional()
  })
  .refine(
    (data) => data.mode !== 'delivery' || !!data.delivery?.address,
    {
      message: 'Indirizzo di consegna richiesto per la modalità delivery',
      path: ['delivery']
    }
  );

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
