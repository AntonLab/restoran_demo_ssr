import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const dishSchema = new Schema(
  {
    name: { type: String, required: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    weight: { type: String, required: true },
    ingredients: [String],
    priceCents: { type: Number, required: true, min: 0, validate: Number.isInteger },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    isChefChoice: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    order: { type: Number, default: 0, validate: Number.isInteger },
    favoritesCount: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    image: {
      small: String,
      medium: String,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

dishSchema.index({ status: 1, deletedAt: 1, categoryId: 1, order: 1 });

type DishDoc = InferSchemaType<typeof dishSchema>;

export const Dish =
  (mongoose.models.Dish as Model<DishDoc> | undefined) ??
  mongoose.model<DishDoc>("Dish", dishSchema);
