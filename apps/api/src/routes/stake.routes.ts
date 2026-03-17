import { Router, IRouter } from 'express';
import { stakeHandler } from '../handlers/stake.handler';
import { apiKeyMiddleware } from '../middleware/apiKey.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

export const stakeRouter: IRouter = Router();

stakeRouter.use(apiKeyMiddleware);
stakeRouter.use(rateLimitMiddleware);

stakeRouter.get('/stake-tx', stakeHandler.buildStakeTx);
stakeRouter.get('/unstake-tx', stakeHandler.buildUnstakeTx);
