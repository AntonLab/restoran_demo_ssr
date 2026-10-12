import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const orderTemplateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
orderTemplateSchema.index({ userId: 1, lastUsedAt: -1 });

type OrderTemplateDoc = InferSchemaType<typeof orderTemplateSchema>;

export const OrderTemplate =
  (mongoose.models.OrderTemplate as Model<OrderTemplateDoc> | undefined) ??
  mongoose.model<OrderTemplateDoc>("OrderTemplate", orderTemplateSchema);
