import { Schema } from "mongoose";

export const cents = { type: Number, required: true, min: 0, validate: Number.isInteger };

export const itemSchema = new Schema(
  {
    dishId: { type: Schema.Types.ObjectId, required: true },
    nameSnapshot: { type: String, required: true },
    priceCentsSnapshot: cents,
    qty: { type: Number, required: true, min: 1, validate: Number.isInteger },
  },
  { _id: false },
);
