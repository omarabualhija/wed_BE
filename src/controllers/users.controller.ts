import { Response, NextFunction } from "express";
import { User } from "../models/User.model";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { translateRequest } from "../utils/translations";

// Get all users (admin only)
// Note: requireAdmin middleware ensures only admin/superAdmin can access
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Search by email or name
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by email confirmation status
    if (req.query.isEmailConfirmed !== undefined) {
      query.isEmailConfirmed = req.query.isEmailConfirmed === "true";
    }

    // Filter by profile completion status
    if (req.query.isProfileComplete !== undefined) {
      query.isProfileComplete = req.query.isProfileComplete === "true";
    }

    // Filter by role (always exclude superAdmin)
    if (req.query.role && req.query.role !== "superAdmin") {
      // Filter by specific role (user or admin)
      query.role = req.query.role;
    } else {
      // No role filter or trying to filter by superAdmin - exclude superAdmin
      query.role = { $ne: "superAdmin" };
    }

    // Get users
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Get single user by ID (admin only)
// Note: requireAdmin middleware ensures only admin/superAdmin can access
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      throw new AppError(
        translateRequest("auth.userNotFound", req),
        404,
        "error",
        "auth.userNotFound"
      );
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Update user (admin only)
// Note: requireAdmin middleware ensures only admin/superAdmin can access
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, relationshipType, dateOfBirth, numberOfChildren, role, isEmailConfirmed, isProfileComplete } = req.body;

    const user = await User.findById(id);

    if (!user) {
      throw new AppError(
        translateRequest("auth.userNotFound", req),
        404,
        "error",
        "auth.userNotFound"
      );
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (relationshipType !== undefined) user.relationshipType = relationshipType;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (numberOfChildren !== undefined) user.numberOfChildren = numberOfChildren;
    if (role !== undefined) user.role = role;
    if (isEmailConfirmed !== undefined) user.isEmailConfirmed = isEmailConfirmed;
    if (isProfileComplete !== undefined) user.isProfileComplete = isProfileComplete;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: translateRequest("auth.userUpdated", req),
      data: {
        user: userResponse,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Delete user (admin only)
// Note: requireAdmin middleware ensures only admin/superAdmin can access
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.user._id.toString() === id) {
      throw new AppError(
        translateRequest("auth.cannotDeleteSelf", req),
        400,
        "error",
        "auth.cannotDeleteSelf"
      );
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new AppError(
        translateRequest("auth.userNotFound", req),
        404,
        "error",
        "auth.userNotFound"
      );
    }

    res.status(200).json({
      success: true,
      message: translateRequest("auth.userDeleted", req),
    });
  } catch (error: any) {
    next(error);
  }
};

