import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/saveUser', userController.saveUser);
router.get('/magic_link/:id', userController.fetchvalidationToken);

// Login endpoints
router.post('/login', userController.loginUser);
router.get('/login-verify/:id', userController.fetchLoginValidationToken);
router.post('/refresh-token', userController.refreshAccessToken);

// Password reset endpoints
router.post('/forgot-password', userController.forgotPassword);
router.get('/reset-password/:id', userController.verifyPasswordResetLink);
router.post('/reset-password', userController.resetPassword);

// Protected routes (require authentication)
router.get('/', authenticate, userController.getUser);

export default router;
