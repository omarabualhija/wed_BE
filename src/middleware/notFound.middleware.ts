import { Request, Response, NextFunction } from "express";
import { translateRequest } from "../utils/translations";

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    status: "error",
    message: translateRequest("error.routeNotFound", req),
  });
};
