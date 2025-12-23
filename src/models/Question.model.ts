import mongoose, { Document, Schema } from "mongoose";

export interface IQuestion extends Document {
  title_en: string;
  title_ar: string;
  type: "personal" | "partner" | "common";
  options: Array<{
    title_en: string;
    title_ar: string;
  }>;
  isActive?: boolean;
}

const questionSchema = new Schema<IQuestion>(
  {
    title_en: {
      type: String,
      required: [true, "English title is required"],
      trim: true,
    },
    title_ar: {
      type: String,
      required: [true, "Arabic title is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["personal", "partner", "common"],
      required: [true, "Question type is required"],
    },
    options: [
      {
        title_en: {
          type: String,
          required: true,
          trim: true,
        },
        title_ar: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Question = mongoose.model<IQuestion>("Question", questionSchema);

