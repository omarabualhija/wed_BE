import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User.model";
import { AppError } from "./error.middleware";
import { translateRequest } from "../utils/translations";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError(
        translateRequest("auth.tokenRequired", req),
        401,
        "error",
        "auth.tokenRequired"
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      id: string;
    };

    // Get user from database
    const user = await User.findById(decoded.id).select("+password");

    if (!user) {
      throw new AppError(
        translateRequest("auth.userNotFound", req),
        404,
        "error",
        "auth.userNotFound"
      );
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      next(
        new AppError(
          translateRequest("auth.tokenInvalid", req),
          401,
          "error",
          "auth.tokenInvalid"
        )
      );
    } else if (error.name === "TokenExpiredError") {
      next(
        new AppError(
          translateRequest("auth.tokenExpired", req),
          401,
          "error",
          "auth.tokenExpired"
        )
      );
    } else {
      next(error);
    }
  }
};
