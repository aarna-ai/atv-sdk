import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuth.middleware';
import * as admin from '../handlers/admin.handler';
import { adminLogin } from '../handlers/adminLogin.handler';

export const adminRouter: Router = Router();

// Login is unauthenticated — it issues the session token
adminRouter.post('/login', adminLogin);

// Everything else requires a valid session
adminRouter.use(adminAuthMiddleware);

adminRouter.get('/analytics/overview', admin.getOverview);
adminRouter.get('/analytics/requests-over-time', admin.getRequestsOverTime);
adminRouter.get('/analytics/top-endpoints', admin.getTopEndpoints);
adminRouter.get('/analytics/api-keys', admin.getApiKeys);
adminRouter.get('/analytics/errors', admin.getErrors);
adminRouter.get('/analytics/latency', admin.getLatency);
adminRouter.post('/analytics/cleanup', admin.runCleanup);

// API Key management
adminRouter.get('/api-keys', admin.listAllApiKeys);
adminRouter.post('/api-keys', admin.createApiKey);
adminRouter.patch('/api-keys/:id/toggle', admin.toggleApiKey);
adminRouter.delete('/api-keys/:id', admin.deleteApiKey);

// Additional analytics
adminRouter.get('/analytics/status-breakdown', admin.getStatusBreakdown);
adminRouter.get('/analytics/user-agents', admin.getUserAgentBreakdown);
adminRouter.get('/analytics/recent', admin.getRecentRequests);

// NPM download stats (proxied to avoid CORS)
adminRouter.get('/analytics/npm-downloads', admin.getNpmDownloads);

// DeFi-specific analytics
adminRouter.get('/analytics/top-vaults', admin.getTopVaults);
adminRouter.get('/analytics/tx-funnel', admin.getTxFunnel);
adminRouter.get('/analytics/channel-split', admin.getChannelSplit);
