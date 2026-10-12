import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const passwordResetTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true },
);
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

type PasswordResetTokenDoc = InferSchemaType<typeof passwordResetTokenSchema>;

export const PasswordResetToken =
  (mongoose.models.PasswordResetToken as Model<PasswordResetTokenDoc> | undefined) ??
  mongoose.model<PasswordResetTokenDoc>("PasswordResetToken", passwordResetTokenSchema);
