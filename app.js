import express from 'express';
import userRoute from './routes/userRoute.js';

const app = express();
app.use(express.json());

if (userRoute) {
  app.use('/api/users', userRoute);
} else {
  console.log('userRoute is undefined!');
}

export default app;
