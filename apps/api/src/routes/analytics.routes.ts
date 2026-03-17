import { Router, IRouter } from 'express';
import { analyticsHandler } from '../handlers/analytics.handler';
import { apiKeyMiddleware } from '../middleware/apiKey.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

export const analyticsRouter: IRouter = Router();

analyticsRouter.use(apiKeyMiddleware);
analyticsRouter.use(rateLimitMiddleware);

analyticsRouter.get('/user-investments', analyticsHandler.getUserInvestments);
