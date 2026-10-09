import mongoose, {
  Schema,
  type InferSchemaType,
  type Model,
  type SchemaDefinitionProperty,
} from "mongoose";
import { WEEKDAYS } from "@/lib/weekdays";

const time = {
  type: String,
  required: true,
  match: [/^([01]\d|2[0-3]):[0-5]\d$/, "time must be HH:mm"],
} satisfies SchemaDefinitionProperty<string>;

const isTimeZone = (zone: string) => {
  try {
    return Boolean(Intl.DateTimeFormat(undefined, { timeZone: zone }));
  } catch {
    return false;
  }
};

const scheduleDaySchema = new Schema(
  {
    day: { type: String, enum: WEEKDAYS, required: true },
    open: time,
    close: time,
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
    timezone: {
      type: String,
      required: true,
      validate: { validator: isTimeZone, message: "timezone must be an IANA zone" },
    },
    maxConcurrentBookings: { type: Number, required: true, min: 1, validate: Number.isInteger },
  },
  { timestamps: true },
);

type SettingsDoc = InferSchemaType<typeof settingsSchema>;

export const Settings =
  (mongoose.models.Settings as Model<SettingsDoc> | undefined) ??
  mongoose.model<SettingsDoc>("Settings", settingsSchema);
