// Translation messages
const translations: Record<string, Record<string, string>> = {
  en: {
    // Authentication errors
    "auth.emailRequired": "Email and password are required",
    "auth.passwordMinLength": "Password must be at least 8 characters",
    "auth.userExists": "User already exists",
    "auth.userNotFound": "User not found",
    "auth.invalidCredentials": "Invalid email or password",
    "auth.invalidOTP": "Invalid or expired OTP",
    "auth.emailNotConfirmed": "Email not confirmed",
    "auth.profileIncomplete": "Profile not complete",
    "auth.tokenRequired": "Authentication required. Please login.",
    "auth.tokenInvalid": "Invalid token",
    "auth.tokenExpired": "Token expired",
    "auth.unauthorized": "You are not authorized to access this resource",

    // Success messages
    "auth.registerSuccess": "User registered successfully. OTP sent to email.",
    "auth.otpResent": "OTP resent successfully",
    "auth.emailConfirmed": "Email confirmed successfully",
    "auth.loginSuccess": "Login successful",
    "auth.logoutSuccess": "Logout successful",
    "auth.profileUpdated": "Profile updated successfully",
    "auth.accountDeleted": "Account deleted successfully",
    "auth.userUpdated": "User updated successfully",
    "auth.userDeleted": "User deleted successfully",
    "auth.cannotDeleteSelf": "You cannot delete your own account",

    // Questions messages
    "questions.notFound": "Question not found",
    "questions.missingFields":
      "Title (English and Arabic) and type are required",
    "questions.invalidType":
      "Invalid question type. Must be personal, partner, or common",
    "questions.optionsRequired": "At least one option is required",
    "questions.optionMissingFields":
      "Each option must have both English and Arabic titles",
    "questions.created": "Question created successfully",
    "questions.updated": "Question updated successfully",
    "questions.deleted": "Question deleted successfully",

    // General errors
    "error.internalServer": "Internal Server Error",
    "error.routeNotFound": "Route not found",
    "error.validationFailed": "Validation error",
  },
  ar: {
    // Authentication errors
    "auth.emailRequired": "البريد الإلكتروني وكلمة المرور مطلوبان",
    "auth.passwordMinLength": "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
    "auth.userExists": "المستخدم موجود بالفعل",
    "auth.userNotFound": "المستخدم غير موجود",
    "auth.invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    "auth.invalidOTP": "رمز التحقق غير صحيح أو منتهي الصلاحية",
    "auth.emailNotConfirmed": "البريد الإلكتروني غير مؤكد",
    "auth.profileIncomplete": "الملف الشخصي غير مكتمل",
    "auth.tokenRequired": "المصادقة مطلوبة. يرجى تسجيل الدخول.",
    "auth.tokenInvalid": "رمز غير صحيح",
    "auth.tokenExpired": "انتهت صلاحية الرمز",
    "auth.unauthorized": "غير مصرح لك بالوصول إلى هذا المورد",

    // Success messages
    "auth.registerSuccess":
      "تم تسجيل المستخدم بنجاح. تم إرسال رمز التحقق إلى البريد الإلكتروني.",
    "auth.otpResent": "تم إعادة إرسال رمز التحقق بنجاح",
    "auth.emailConfirmed": "تم تأكيد البريد الإلكتروني بنجاح",
    "auth.loginSuccess": "تم تسجيل الدخول بنجاح",
    "auth.logoutSuccess": "تم تسجيل الخروج بنجاح",
    "auth.profileUpdated": "تم تحديث الملف الشخصي بنجاح",
    "auth.accountDeleted": "تم حذف الحساب بنجاح",
    "auth.userUpdated": "تم تحديث المستخدم بنجاح",
    "auth.userDeleted": "تم حذف المستخدم بنجاح",
    "auth.cannotDeleteSelf": "لا يمكنك حذف حسابك الخاص",

    // Questions messages
    "questions.notFound": "السؤال غير موجود",
    "questions.missingFields": "العنوان (الإنجليزية والعربية) والنوع مطلوبان",
    "questions.invalidType":
      "نوع السؤال غير صحيح. يجب أن يكون personal أو partner أو common",
    "questions.optionsRequired": "يجب أن يكون هناك خيار واحد على الأقل",
    "questions.optionMissingFields":
      "يجب أن يحتوي كل خيار على عنوانين باللغة الإنجليزية والعربية",
    "questions.created": "تم إنشاء السؤال بنجاح",
    "questions.updated": "تم تحديث السؤال بنجاح",
    "questions.deleted": "تم حذف السؤال بنجاح",

    // General errors
    "error.internalServer": "خطأ في الخادم الداخلي",
    "error.routeNotFound": "الطريق غير موجود",
    "error.validationFailed": "خطأ في التحقق",
  },
};

/**
 * Get language from request headers
 */
export const getLanguage = (req: any): string => {
  // Try multiple header formats (case-insensitive)
  const acceptLanguage =
    req.headers["accept-language"] ||
    req.headers["Accept-Language"] ||
    req.headers["ACCEPT-LANGUAGE"] ||
    req.get?.("accept-language") ||
    req.get?.("Accept-Language");

  if (acceptLanguage) {
    // Handle comma-separated values (e.g., "ar,en;q=0.9")
    const lang = acceptLanguage
      .toLowerCase()
      .split(",")[0]
      .trim()
      .split(";")[0]
      .trim();
    if (lang.startsWith("ar")) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Translation] Detected language: ar from header: ${acceptLanguage}`
        );
      }
      return "ar";
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Translation] Using default language: en. Header received: ${
        acceptLanguage || "none"
      }`
    );
  }
  return "en"; // Default to English
};

/**
 * Translate a message key to the appropriate language
 */
export const translate = (key: string, lang: string = "en"): string => {
  const langTranslations = translations[lang] || translations.en;
  return langTranslations[key] || translations.en[key] || key;
};

/**
 * Translate message based on request language
 */
export const translateRequest = (key: string, req: any): string => {
  const lang = getLanguage(req);
  const translated = translate(key, lang);

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Translation] Key: ${key}, Language: ${lang}, Translated: ${translated}`
    );
  }

  return translated;
};
