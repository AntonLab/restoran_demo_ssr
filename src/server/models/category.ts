import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    order: { type: Number, default: 0, validate: Number.isInteger },
  },
  { timestamps: true },
);

type CategoryDoc = InferSchemaType<typeof categorySchema>;

export const Category =
  (mongoose.models.Category as Model<CategoryDoc> | undefined) ??
  mongoose.model<CategoryDoc>("Category", categorySchema);
