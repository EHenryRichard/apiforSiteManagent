/**
 *
 * @module routes/backupRoute
 */

import express from 'express';
import * as backupController from '../controllers/backupController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:siteId', backupController.getBackup);

export default router;
