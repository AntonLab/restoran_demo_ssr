import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { BOOKING_STATUSES } from "@/lib/booking-status";

const cents = { type: Number, required: true, min: 0, validate: Number.isInteger };

const itemSchema = new Schema(
  {
    dishId: { type: Schema.Types.ObjectId, required: true },
    nameSnapshot: { type: String, required: true },
    priceCentsSnapshot: cents,
    qty: { type: Number, required: true, min: 1, validate: Number.isInteger },
  },
  { _id: false },
);

const historySchema = new Schema(
  {
    status: { type: String, enum: BOOKING_STATUSES, required: true },
    at: { type: Date, required: true },
    by: { type: String, enum: ["user", "admin"] },
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    number: { type: Number, required: true, unique: true, validate: Number.isInteger },
    // Guests have no session, so this token is what lets them open their confirmation.
    viewToken: { type: String, required: true, select: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    contact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    startsAt: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1, max: 12, validate: Number.isInteger },
    items: { type: [itemSchema] },
    totalCents: cents,
    status: { type: String, enum: BOOKING_STATUSES, required: true },
    history: { type: [historySchema] },
  },
  { timestamps: true },
);
bookingSchema.index({ userId: 1, startsAt: -1 });
bookingSchema.index({ "contact.phone": 1 });
bookingSchema.index({ status: 1, startsAt: 1 });

type BookingDoc = InferSchemaType<typeof bookingSchema>;

export const Booking =
  (mongoose.models.Booking as Model<BookingDoc> | undefined) ??
  mongoose.model<BookingDoc>("Booking", bookingSchema);
