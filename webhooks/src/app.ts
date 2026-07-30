import express from 'express';
import webhookRoutes from './routes/webhook.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();

app.use(requestLogger);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'webhooks' });
});

app.use(
  '/api/webhooks/github',
  express.raw({ type: 'application/json' }),
  webhookRoutes
);

app.use(errorHandler);

export default app;
