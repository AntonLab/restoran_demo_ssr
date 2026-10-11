import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ORDER_STATUSES } from "@/lib/order-status";
import { cents, itemSchema } from "@/server/models/shared";

const historySchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, required: true },
    by: { type: String, enum: ["user", "admin"] },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    number: { type: Number, required: true, unique: true, validate: Number.isInteger },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    address: { type: String, required: true },
    deliveryAt: { type: Date, required: true },
    items: { type: [itemSchema], validate: (v: unknown[]) => v.length >= 1 },
    totalCents: cents,
    status: { type: String, enum: ORDER_STATUSES, required: true },
    history: { type: [historySchema] },
  },
  { timestamps: true },
);
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ "customer.phone": 1 });

type OrderDoc = InferSchemaType<typeof orderSchema>;

export const Order =
  (mongoose.models.Order as Model<OrderDoc> | undefined) ??
  mongoose.model<OrderDoc>("Order", orderSchema);
