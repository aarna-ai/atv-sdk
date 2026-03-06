import { Router, IRouter } from 'express';
import { vaultsRouter } from './vaults.routes';
import { transactionsRouter } from './transactions.routes';

export const v1Router: IRouter = Router();

v1Router.use('/vaults', vaultsRouter);
v1Router.use('/', transactionsRouter);
