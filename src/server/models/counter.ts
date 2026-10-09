import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const counterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: 0, validate: Number.isInteger },
});

type CounterDoc = InferSchemaType<typeof counterSchema>;

export const Counter =
  (mongoose.models.Counter as Model<CounterDoc> | undefined) ??
  mongoose.model<CounterDoc>("Counter", counterSchema);
