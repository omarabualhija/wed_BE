import { Router } from "express";
import {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsForMobile,
} from "../controllers/questions.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

/**
 * @swagger
 * /api/v1/questions/mobile:
 *   get:
 *     summary: Get questions for mobile app (authenticated users)
 *     tags: [Questions]
 *     description: |
 *       This endpoint requires authentication.
 *       Returns active questions grouped by type (personal, partner, common).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     steps:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Authentication required or invalid token
 */
router.get("/mobile", authenticate, getQuestionsForMobile);

// Admin routes - require authentication AND admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @swagger
 * /api/v1/questions:
 *   get:
 *     summary: Get all questions (admin only)
 *     tags: [Questions]
 *     description: |
 *       This endpoint requires admin or superAdmin role.
 *       Regular users will receive a 403 Forbidden error.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title (English or Arabic)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [personal, partner, common]
 *         description: Filter by question type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: Forbidden - admin or superAdmin role required
 */
router.get("/", getAllQuestions);

/**
 * @swagger
 * /api/v1/questions/{id}:
 *   get:
 *     summary: Get question by ID (admin only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Question retrieved successfully
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: Forbidden - admin or superAdmin role required
 *       404:
 *         description: Question not found
 */
router.get("/:id", getQuestionById);

/**
 * @swagger
 * /api/v1/questions:
 *   post:
 *     summary: Create a new question (admin only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title_en
 *               - title_ar
 *               - type
 *               - options
 *             properties:
 *               title_en:
 *                 type: string
 *                 example: "What are your main communication preferences?"
 *               title_ar:
 *                 type: string
 *                 example: "ما هي تفضيلاتك الرئيسية في التواصل؟"
 *               type:
 *                 type: string
 *                 enum: [personal, partner, common]
 *                 example: "personal"
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title_en
 *                     - title_ar
 *                   properties:
 *                     title_en:
 *                       type: string
 *                       example: "Direct and straightforward"
 *                     title_ar:
 *                       type: string
 *                       example: "مباشر وصريح"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Question created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: Forbidden - admin or superAdmin role required
 */
router.post("/", createQuestion);

/**
 * @swagger
 * /api/v1/questions/{id}:
 *   put:
 *     summary: Update question (admin only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title_en:
 *                 type: string
 *               title_ar:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [personal, partner, common]
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title_en:
 *                       type: string
 *                     title_ar:
 *                       type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Question updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: Forbidden - admin or superAdmin role required
 *       404:
 *         description: Question not found
 */
router.put("/:id", updateQuestion);

/**
 * @swagger
 * /api/v1/questions/{id}:
 *   delete:
 *     summary: Delete question (admin only)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *       401:
 *         description: Authentication required or invalid token
 *       403:
 *         description: Forbidden - admin or superAdmin role required
 *       404:
 *         description: Question not found
 */
router.delete("/:id", deleteQuestion);

export default router;
