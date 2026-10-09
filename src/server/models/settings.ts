import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { WEEKDAYS } from "@/lib/weekdays";

const scheduleDaySchema = new Schema(
  {
    day: { type: String, enum: WEEKDAYS, required: true },
    open: { type: String, required: true },
    close: { type: String, required: true },
    closed: { type: Boolean, default: false },
  },
  { _id: false },
);

const settingsSchema = new Schema(
  {
    name: { type: String, required: true, default: "Verde Kitchen" },
    description: { type: String, default: "" },
    contacts: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    address: { type: String, default: "" },
    schedule: {
      type: [scheduleDaySchema],
      validate: { validator: (v: unknown[]) => v.length === 7, message: "schedule needs 7 days" },
    },
    socials: [
      new Schema(
        { label: { type: String, required: true }, url: { type: String, required: true } },
        { _id: false },
      ),
    ],
    timezone: { type: String, required: true },
    maxConcurrentBookings: { type: Number, required: true, min: 1, validate: Number.isInteger },
  },
  { timestamps: true },
);

type SettingsDoc = InferSchemaType<typeof settingsSchema>;

export const Settings =
  (mongoose.models.Settings as Model<SettingsDoc> | undefined) ??
  mongoose.model<SettingsDoc>("Settings", settingsSchema);
