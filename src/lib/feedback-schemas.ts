import { z } from "zod";

// Hidden field that humans leave empty; browsers do not autofill this name.
export const HONEYPOT_FIELD = "hp_site";

const TEXT_MAX = 1000;
const CONTACT_MAX = 200;

const tooLong = (n: number) => `Keep it under ${n} characters.`;

const rating = z.coerce
  .number({ error: "Choose a rating." })
  .int("Choose a rating.")
  .min(1, "Choose a rating.")
  .max(5, "Choose a rating.");
const text = (required: string) =>
  z.string().trim().min(1, required).max(TEXT_MAX, tooLong(TEXT_MAX));

export const reviewInputSchema = z.object({
  dishesRating: rating,
  serviceRating: rating,
  text: text("Please write your review."),
  contact: z
    .string()
    .trim()
    .max(CONTACT_MAX, tooLong(CONTACT_MAX))
    .optional()
    .transform((v) => v || undefined),
});

export const complaintInputSchema = z.object({
  text: text("Please describe the problem."),
  contact: z
    .string()
    .trim()
    .min(1, "Please leave a phone or email so we can reply.")
    .max(CONTACT_MAX, tooLong(CONTACT_MAX)),
});
