import express from 'express';
import cors from 'cors';
import userRoute from './routes/userRoute.js';
import clientRoute from './routes/clientRoute.js';
import siteRoute from './routes/siteRoute.js';
import cookieParser from 'cookie-parser';
import backupRoute from './routes/backupRoute.js';

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://10.217.92.99:3001', // Your frontend
  'http://10.217.92.99:3000', // Your backend
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin or from file:// (origin === 'null')
      if (!origin || origin === 'null') return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Required for cookies/sessions
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  })
);

app.use(express.json());
app.use(cookieParser());
app.use('/api/users', userRoute);
app.use('/api/clients', clientRoute);
app.use('/api/sites', siteRoute);
app.use('/api/backup', backupRoute);

app.listen(3000, '0.0.0.0', () => {
  console.log('🚀 Server running on http://10.217.92.99:3000');
});

export default app;
