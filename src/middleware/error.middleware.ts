import { Request, Response, NextFunction } from "express";
import { translateRequest } from "../utils/translations";

export class AppError extends Error {
  statusCode?: number;
  status?: string;
  translationKey?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    status: string = "error",
    translationKey?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = status;
    this.translationKey = translationKey;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  // If translation key exists, translate the message; otherwise use the error message
  const message = err.translationKey
    ? translateRequest(err.translationKey, req)
    : err.message || translateRequest("error.internalServer", req);

  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
