import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

type SessionDoc = InferSchemaType<typeof sessionSchema>;

export const Session =
  (mongoose.models.Session as Model<SessionDoc> | undefined) ??
  mongoose.model<SessionDoc>("Session", sessionSchema);
