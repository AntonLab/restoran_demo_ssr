import { z } from "zod";

// Hidden field that humans leave empty; browsers do not autofill this name.
export const HONEYPOT_FIELD = "hp_site";

const rating = z.coerce.number().int().min(1).max(5);
const text = z.string().trim().min(1).max(1000);

export const reviewInputSchema = z.object({
  dishesRating: rating,
  serviceRating: rating,
  text,
  contact: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || undefined),
});

export const complaintInputSchema = z.object({
  text,
  contact: z.string().trim().min(1).max(200),
});
