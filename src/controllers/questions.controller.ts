import { Response, NextFunction } from "express";
import { Question } from "../models/Question.model";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { translateRequest, getLanguage } from "../utils/translations";

// Get all questions for mobile app (authenticated users only)
export const getQuestionsForMobile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get language from request header
    const language = getLanguage(req);
    const isArabic = language === "ar";

    // Only get active questions
    const questions = await Question.find({ isActive: true })
      .select("_id title_en title_ar type options")
      .sort({ createdAt: -1 });

    // Group questions by type
    const groupedQuestions = {
      personal: questions.filter((q) => q.type === "personal"),
      partner: questions.filter((q) => q.type === "partner"),
      common: questions.filter((q) => q.type === "common"),
    };

    // Format for mobile app with language support
    const steps = [
      {
        id: "personal",
        title: isArabic ? "الأسئلة الشخصية" : "Personal Questions",
        type: "personal",
        questions: groupedQuestions.personal.map((q) => ({
          id: q._id.toString(),
          title: isArabic ? q.title_ar : q.title_en,
          type: q.type,
          options: q.options.map((opt, idx) => ({
            id: `${q._id}_${idx}`,
            title: isArabic ? opt.title_ar : opt.title_en,
          })),
        })),
      },
      {
        id: "partner",
        title: isArabic ? "أسئلة الشريك" : "Partner Questions",
        type: "partner",
        questions: groupedQuestions.partner.map((q) => ({
          id: q._id.toString(),
          title: isArabic ? q.title_ar : q.title_en,
          type: q.type,
          options: q.options.map((opt, idx) => ({
            id: `${q._id}_${idx}`,
            title: isArabic ? opt.title_ar : opt.title_en,
          })),
        })),
      },
      {
        id: "common",
        title: isArabic ? "الأسئلة المشتركة" : "Common Questions",
        type: "common",
        questions: groupedQuestions.common.map((q) => ({
          id: q._id.toString(),
          title: isArabic ? q.title_ar : q.title_en,
          type: q.type,
          options: q.options.map((opt, idx) => ({
            id: `${q._id}_${idx}`,
            title: isArabic ? opt.title_ar : opt.title_en,
          })),
        })),
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        steps,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Get all questions (admin only)
export const getAllQuestions = async (
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

    // Search by title (English or Arabic)
    if (search) {
      query.$or = [
        { title_en: { $regex: search, $options: "i" } },
        { title_ar: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === "true";
    }

    // Get questions
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Question.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        data: questions,
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

// Get single question by ID (admin only)
export const getQuestionById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question) {
      throw new AppError(
        translateRequest("questions.notFound", req),
        404,
        "error",
        "questions.notFound"
      );
    }

    res.status(200).json({
      success: true,
      data: {
        question,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Create question (admin only)
export const createQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title_en, title_ar, type, options, isActive } = req.body;

    // Validate required fields
    if (!title_en || !title_ar || !type) {
      throw new AppError(
        translateRequest("questions.missingFields", req),
        400,
        "error",
        "questions.missingFields"
      );
    }

    // Validate type
    if (!["personal", "partner", "common"].includes(type)) {
      throw new AppError(
        translateRequest("questions.invalidType", req),
        400,
        "error",
        "questions.invalidType"
      );
    }

    // Validate options
    if (!options || !Array.isArray(options) || options.length === 0) {
      throw new AppError(
        translateRequest("questions.optionsRequired", req),
        400,
        "error",
        "questions.optionsRequired"
      );
    }

    // Validate each option
    for (const option of options) {
      if (!option.title_en || !option.title_ar) {
        throw new AppError(
          translateRequest("questions.optionMissingFields", req),
          400,
          "error",
          "questions.optionMissingFields"
        );
      }
    }

    // Create question
    const question = await Question.create({
      title_en,
      title_ar,
      type,
      options,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: translateRequest("questions.created", req),
      data: {
        question,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Update question (admin only)
export const updateQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title_en, title_ar, type, options, isActive } = req.body;

    const question = await Question.findById(id);

    if (!question) {
      throw new AppError(
        translateRequest("questions.notFound", req),
        404,
        "error",
        "questions.notFound"
      );
    }

    // Validate type if provided
    if (type && !["personal", "partner", "common"].includes(type)) {
      throw new AppError(
        translateRequest("questions.invalidType", req),
        400,
        "error",
        "questions.invalidType"
      );
    }

    // Validate options if provided
    if (options) {
      if (!Array.isArray(options) || options.length === 0) {
        throw new AppError(
          translateRequest("questions.optionsRequired", req),
          400,
          "error",
          "questions.optionsRequired"
        );
      }

      // Validate each option
      for (const option of options) {
        if (!option.title_en || !option.title_ar) {
          throw new AppError(
            translateRequest("questions.optionMissingFields", req),
            400,
            "error",
            "questions.optionMissingFields"
          );
        }
      }
    }

    // Update fields
    if (title_en !== undefined) question.title_en = title_en;
    if (title_ar !== undefined) question.title_ar = title_ar;
    if (type !== undefined) question.type = type;
    if (options !== undefined) question.options = options;
    if (isActive !== undefined) question.isActive = isActive;

    await question.save();

    res.status(200).json({
      success: true,
      message: translateRequest("questions.updated", req),
      data: {
        question,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// Delete question (admin only)
export const deleteQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      throw new AppError(
        translateRequest("questions.notFound", req),
        404,
        "error",
        "questions.notFound"
      );
    }

    res.status(200).json({
      success: true,
      message: translateRequest("questions.deleted", req),
    });
  } catch (error: any) {
    next(error);
  }
};
