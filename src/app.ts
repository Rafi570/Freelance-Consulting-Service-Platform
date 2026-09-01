import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import globalErrorHandler from './app/errors/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import router from './app/routes';

const app: Application = express();

app.use(express.json());
app.use(cors());

// Application Routes
app.use('/api/v1', router);

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Freelance & Consulting Service Platform API is running 🚀',
  });
});

// Global Error Handler
app.use(globalErrorHandler);

// Not Found Route Handler
app.use(notFound);

export default app;
