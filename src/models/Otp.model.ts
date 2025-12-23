import mongoose, { Document, Schema } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otp: string;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // 10 minutes
    },
  },
  {
    timestamps: false,
  }
);

// Create index for faster lookups
otpSchema.index({ email: 1, otp: 1 });

export const Otp = mongoose.model<IOtp>("Otp", otpSchema);
