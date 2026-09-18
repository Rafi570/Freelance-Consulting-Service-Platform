import app from './app';
import config from './app/config';

const port = config.port;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Freelance & Consulting Platform Server is running on port ${port}`);
  });
}

export default app;

