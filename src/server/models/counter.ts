import mongoose, { Schema } from "mongoose";

const counterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: 0, validate: Number.isInteger },
});

export const Counter = mongoose.models.Counter ?? mongoose.model("Counter", counterSchema);
