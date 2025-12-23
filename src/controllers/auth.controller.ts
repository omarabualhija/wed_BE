import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User.model";
import { Otp } from "../models/Otp.model";
import { generateOTP } from "../utils/otp.util";
import { sendOTPEmail } from "../services/email.service";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { translateRequest } from "../utils/translations";

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "secret", {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Register user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new AppError(
        translateRequest("auth.emailRequired", req),
        400,
        "error",
        "auth.emailRequired"
      );
    }

    if (password.length < 8) {
      throw new AppError(
        translateRequest("auth.passwordMinLength", req),
        400,
        "error",
        "auth.passwordMinLength"
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(
        translateRequest("auth.userExists", req),
        409,
        "error",
        "auth.userExists"
      );
    }

    // Create user
    const user = await User.create({
      email,
      password,
      isEmailConfirmed: false,
      isProfileComplete: false,
    });

    // Generate OTP
    const otp = generateOTP();

    // Save OTP to database
    await Otp.create({ email, otp });

    // Send OTP email
    await sendOTPEmail(email, otp);

    // Generate token
    const token = generateToken(user._id.toString());

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: "success",
      message: translateRequest("auth.registerSuccess", req),
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Resend OTP
export const resendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(
        translateRequest("auth.emailRequired", req),
        400,
        "error",
        "auth.emailRequired"
      );
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(
        translateRequest("auth.userNotFound", req),
        404,
        "error",
        "auth.userNotFound"
      );
    }

    // Generate new OTP
    const otp = generateOTP();

    // Delete old OTPs and save new one
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      status: "success",
      message: translateRequest("auth.otpResent", req),
    });
  } catch (error: any) {
    next(error);
  }
};

// Confirm OTP
export const confirmOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError(
        translateRequest("auth.emailRequired", req),
        400,
        "error",
        "auth.emailRequired"
      );
    }

    // Find OTP
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      throw new AppError(
        translateRequest("auth.invalidOTP", req),
        400,
        "error",
        "auth.invalidOTP"
      );
    }

    // Update user email confirmation status
    const user = await User.findOneAndUpdate(
      { email },
      { isEmailConfirmed: true },
      { new: true }
    );

    if (!user) {
      throw new AppError(
        translateRequest("auth.userNotFound", req),
        404,
        "error",
        "auth.userNotFound"
      );
    }

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // Generate token
    const token = generateToken(user._id.toString());

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      status: "success",
      message: translateRequest("auth.emailConfirmed", req),
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(
        translateRequest("auth.emailRequired", req),
        400,
        "error",
        "auth.emailRequired"
      );
    }

    // Find user with password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new AppError(
        translateRequest("auth.invalidCredentials", req),
        401,
        "error",
        "auth.invalidCredentials"
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(
        translateRequest("auth.invalidCredentials", req),
        401,
        "error",
        "auth.invalidCredentials"
      );
    }

    // Generate token
    const token = generateToken(user._id.toString());

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      status: "success",
      message: translateRequest("auth.loginSuccess", req),
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Update profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, relationshipType, dateOfBirth, numberOfChildren } = req.body;

    if (!name || !dateOfBirth) {
      throw new AppError(
        translateRequest("auth.emailRequired", req),
        400,
        "error",
        "auth.emailRequired"
      );
    }

    if (!req.user) {
      throw new AppError(
        translateRequest("auth.tokenRequired", req),
        401,
        "error",
        "auth.tokenRequired"
      );
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        relationshipType,
        dateOfBirth,
        numberOfChildren: numberOfChildren || 0,
        isProfileComplete: true,
      },
      { new: true }
    );

    if (!user) {
      throw new AppError(
        translateRequest("auth.userNotFound", req),
        404,
        "error",
        "auth.userNotFound"
      );
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      status: "success",
      message: translateRequest("auth.profileUpdated", req),
      data: {
        user: userResponse,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Get current user
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(
        translateRequest("auth.tokenRequired", req),
        401,
        "error",
        "auth.tokenRequired"
      );
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError(
        translateRequest("auth.userNotFound", req),
        404,
        "error",
        "auth.userNotFound"
      );
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      status: "success",
      data: {
        user: userResponse,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Admin Login
export const adminLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(
        translateRequest("auth.emailRequired", req),
        400,
        "error",
        "auth.emailRequired"
      );
    }

    // Find user with password and check if admin
    console.log("Admin login attempt for email:", email);
    const user = await User.findOne({ email }).select("+password");
    console.log("User found:", !!user, "Role:", user?.role);
    if (!user) {
      throw new AppError(
        translateRequest("auth.invalidCredentials", req),
        401,
        "error",
        "auth.invalidCredentials"
      );
    }

    // Check if user is admin or superAdmin
    console.log("User role check:", user.role);
    if (user.role !== "admin" && user.role !== "superAdmin") {
      throw new AppError(
        translateRequest("auth.unauthorized", req),
        403,
        "error",
        "auth.unauthorized"
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(
        translateRequest("auth.invalidCredentials", req),
        401,
        "error",
        "auth.invalidCredentials"
      );
    }

    // Generate token
    const token = generateToken(user._id.toString());

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: translateRequest("auth.loginSuccess", req),
      data: {
        token,
        admin: {
          id: userResponse._id,
          email: userResponse.email,
          name: userResponse.name,
          role: userResponse.role,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Logout
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(
        translateRequest("auth.tokenRequired", req),
        401,
        "error",
        "auth.tokenRequired"
      );
    }

    // In a real app, you might want to invalidate the token here
    // For now, we just return a success message
    res.status(200).json({
      status: "success",
      message: translateRequest("auth.logoutSuccess", req),
    });
  } catch (error: any) {
    next(error);
  }
};

// Delete account
export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(
        translateRequest("auth.tokenRequired", req),
        401,
        "error",
        "auth.tokenRequired"
      );
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError(
        translateRequest("auth.userNotFound", req),
        404,
        "error",
        "auth.userNotFound"
      );
    }

    // Delete user
    await User.findByIdAndDelete(req.user._id);

    // Delete all OTPs for this user
    await Otp.deleteMany({ email: user.email });

    res.status(200).json({
      status: "success",
      message: translateRequest("auth.accountDeleted", req),
    });
  } catch (error: any) {
    next(error);
  }
};
