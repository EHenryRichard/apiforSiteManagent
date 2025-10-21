import express from 'express';
import * as userController from '../controllers/userController.js';
const router = express.Router();

router.post('/saveUser', userController.saveUser);
// router.get('/:id');
// router.post('/');
// router.put('/');
// router.delete('/:id');

export default router;
