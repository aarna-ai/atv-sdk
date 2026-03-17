import { Router, IRouter } from 'express';
import { vaultsRouter } from './vaults.routes';
import { transactionsRouter } from './transactions.routes';
import { stakeRouter } from './stake.routes';
import { queueRouter } from './queue.routes';
import { analyticsRouter } from './analytics.routes';

export const v1Router: IRouter = Router();

v1Router.use('/vaults', vaultsRouter);
v1Router.use('/', transactionsRouter);
v1Router.use('/', stakeRouter);
v1Router.use('/', queueRouter);
v1Router.use('/', analyticsRouter);
