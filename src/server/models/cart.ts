import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const lineSchema = new Schema(
  {
    dishId: { type: Schema.Types.ObjectId, required: true },
    qty: { type: Number, required: true, min: 1, max: 20, validate: Number.isInteger },
  },
  { _id: false },
);

const cartSchema = new Schema(
  {
    ownerKey: { type: String, required: true, unique: true },
    guest: { type: Boolean, required: true },
    items: { type: [lineSchema], validate: (v: unknown[]) => v.length <= 30 },
  },
  { timestamps: true },
);
// Partial on guest: a User Cart must never expire.
cartSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 2_592_000, partialFilterExpression: { guest: true } },
);

type CartDoc = InferSchemaType<typeof cartSchema>;

export const Cart =
  (mongoose.models.Cart as Model<CartDoc> | undefined) ??
  mongoose.model<CartDoc>("Cart", cartSchema);
