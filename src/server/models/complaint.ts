import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const COMPLAINT_STATUSES = ["new", "in_progress", "resolved"] as const;

const complaintSchema = new Schema(
  {
    number: { type: Number, required: true, unique: true, validate: Number.isInteger },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    contact: { type: String, required: true, maxlength: 200 },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: COMPLAINT_STATUSES, default: "new" },
  },
  { timestamps: true },
);

type ComplaintDoc = InferSchemaType<typeof complaintSchema>;

export const Complaint =
  (mongoose.models.Complaint as Model<ComplaintDoc> | undefined) ??
  mongoose.model<ComplaintDoc>("Complaint", complaintSchema);
