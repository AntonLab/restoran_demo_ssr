import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;

const rating = { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger };

const reviewSchema = new Schema(
  {
    dishesRating: rating,
    serviceRating: rating,
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    contact: { type: String, maxlength: 200 },
    status: { type: String, enum: REVIEW_STATUSES, default: "pending" },
  },
  { timestamps: true },
);

type ReviewDoc = InferSchemaType<typeof reviewSchema>;

export const Review =
  (mongoose.models.Review as Model<ReviewDoc> | undefined) ??
  mongoose.model<ReviewDoc>("Review", reviewSchema);
