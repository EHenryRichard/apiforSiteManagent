import express from 'express';
import userRoute from './routes/userRoute.js';

const app = express();
app.use(express.json());

app.use('/api/users', userRoute);

export default app;
