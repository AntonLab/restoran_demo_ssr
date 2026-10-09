import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const favoriteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    dishId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);
favoriteSchema.index({ userId: 1, dishId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });

type FavoriteDoc = InferSchemaType<typeof favoriteSchema>;

export const Favorite =
  (mongoose.models.Favorite as Model<FavoriteDoc> | undefined) ??
  mongoose.model<FavoriteDoc>("Favorite", favoriteSchema);
