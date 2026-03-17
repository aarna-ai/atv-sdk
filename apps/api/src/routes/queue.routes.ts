import { Router, IRouter } from 'express';
import { queueHandler } from '../handlers/queue.handler';
import { apiKeyMiddleware } from '../middleware/apiKey.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

export const queueRouter: IRouter = Router();

queueRouter.use(apiKeyMiddleware);
queueRouter.use(rateLimitMiddleware);

queueRouter.get('/queue-withdraw-tx', queueHandler.buildQueueWithdrawTx);
queueRouter.get('/unqueue-withdraw-tx', queueHandler.buildUnqueueWithdrawTx);
queueRouter.get('/redeem-withdraw-tx', queueHandler.buildRedeemWithdrawTx);
