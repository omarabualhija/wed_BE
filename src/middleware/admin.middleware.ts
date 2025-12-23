import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { AppError } from "./error.middleware";
import { translateRequest } from "../utils/translations";

/**
 * Middleware to check if the authenticated user is an admin or superAdmin
 * Must be used after the authenticate middleware
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      throw new AppError(
        translateRequest("auth.tokenRequired", req),
        401,
        "error",
        "auth.tokenRequired"
      );
    }

    // Check if user has admin or superAdmin role
    const userRole = req.user.role || "user";
    if (userRole !== "admin" && userRole !== "superAdmin") {
      throw new AppError(
        translateRequest("auth.unauthorized", req),
        403,
        "error",
        "auth.unauthorized"
      );
    }

    // User is admin, proceed
    next();
  } catch (error: any) {
    next(error);
  }
};

