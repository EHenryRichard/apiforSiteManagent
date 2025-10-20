import express from 'express';
import * as userController from '../controllers/userController.js';
const router = express.Router();

router.get('/getUser', userController.getAllUser);
// router.get('/:id');
// router.post('/');
// router.put('/');
// router.delete('/:id');

export default router;
