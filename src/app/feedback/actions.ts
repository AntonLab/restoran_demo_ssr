"use server";

import { headers } from "next/headers";
import { clientIp } from "@/lib/client-ip";
import {
  type FieldErrors,
  listApprovedReviews,
  type PublicReview,
  submitComplaint,
  submitReview,
} from "@/server/feedback";

type Failed = { status: "error"; error: string; fieldErrors?: FieldErrors };
export type ReviewFormState = { status: "idle" } | { status: "success" } | Failed;
export type ComplaintFormState =
  | { status: "idle" }
  | { status: "success"; number: number }
  | Failed;

export async function reviewAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const result = await submitReview(Object.fromEntries(formData), clientIp(await headers()));
  if (result.ok) return { status: "success" };
  return { status: "error", error: result.error, fieldErrors: result.fieldErrors };
}

export async function complaintAction(
  _prev: ComplaintFormState,
  formData: FormData,
): Promise<ComplaintFormState> {
  const result = await submitComplaint(Object.fromEntries(formData), clientIp(await headers()));
  if (result.ok) return { status: "success", number: result.number };
  return { status: "error", error: result.error, fieldErrors: result.fieldErrors };
}

export async function loadMoreReviews(
  offset: number,
): Promise<{ reviews: PublicReview[]; total: number }> {
  return listApprovedReviews({ offset: Number.isFinite(offset) ? offset : 0, limit: 10 });
}
