import { Router, IRouter } from 'express';
import { vaultsHandler } from '../handlers/vaults.handler';
import { analyticsHandler } from '../handlers/analytics.handler';
import { apiKeyMiddleware } from '../middleware/apiKey.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

export const vaultsRouter: IRouter = Router();

vaultsRouter.use(apiKeyMiddleware);
vaultsRouter.use(rateLimitMiddleware);

vaultsRouter.get('/', vaultsHandler.listVaults);
// /tvl must be registered before /:address to avoid "tvl" being matched as an address
vaultsRouter.get('/tvl', analyticsHandler.getTotalTvl);
vaultsRouter.get('/:address', vaultsHandler.getVault);
vaultsRouter.get('/:address/nav', vaultsHandler.getNAV);
vaultsRouter.get('/:address/tvl', vaultsHandler.getTVL);
vaultsRouter.get('/:address/apy', vaultsHandler.getAPY);
vaultsRouter.get('/:address/deposit-status', vaultsHandler.getDepositStatus);
vaultsRouter.get('/:address/withdraw-status', vaultsHandler.getWithdrawStatus);
vaultsRouter.get('/:address/queue-withdraw-status', vaultsHandler.getQueueWithdrawStatus);
vaultsRouter.get('/:address/portfolio', vaultsHandler.getVaultPortfolio);
vaultsRouter.get('/:address/historical-nav', vaultsHandler.getHistoricalNav);
vaultsRouter.get('/:address/historical-tvl', vaultsHandler.getHistoricalTvl);
