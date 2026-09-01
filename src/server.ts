import app from './app';
import config from './app/config';

const port = config.port;

app.listen(port, () => {
  console.log(`🚀 Freelance & Consulting Platform Server is running on port ${port}`);
});
