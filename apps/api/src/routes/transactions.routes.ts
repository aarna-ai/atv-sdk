import { Router, IRouter } from 'express';
import { transactionsHandler } from '../handlers/transactions.handler';
import { apiKeyMiddleware } from '../middleware/apiKey.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

export const transactionsRouter: IRouter = Router();

transactionsRouter.use(apiKeyMiddleware);
transactionsRouter.use(rateLimitMiddleware);

transactionsRouter.get('/deposit-tx', transactionsHandler.buildDepositTx);
transactionsRouter.get('/withdraw-tx', transactionsHandler.buildWithdrawTx);
