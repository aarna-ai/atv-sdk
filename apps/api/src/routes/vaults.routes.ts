import { Router, IRouter } from 'express';
import { vaultsHandler } from '../handlers/vaults.handler';
import { apiKeyMiddleware } from '../middleware/apiKey.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

export const vaultsRouter: IRouter = Router();

vaultsRouter.use(apiKeyMiddleware);
vaultsRouter.use(rateLimitMiddleware);

vaultsRouter.get('/', vaultsHandler.listVaults);
vaultsRouter.get('/:address', vaultsHandler.getVault);
vaultsRouter.get('/:address/nav', vaultsHandler.getNAV);
vaultsRouter.get('/:address/tvl', vaultsHandler.getTVL);
vaultsRouter.get('/:address/apy', vaultsHandler.getAPY);
