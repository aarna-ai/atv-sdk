import { apiReference } from '@scalar/express-api-reference';
import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import { openApiSpec } from './config/openapi';
import { v1Router } from './routes';
import { mcpRouter } from './routes/mcp.routes';

export function createApp(): Application {
    const app = express();

    app.use(helmet());
    app.use(cors({
        allowedHeaders: ['Content-Type', 'Accept', 'x-api-key'],
    }));
    app.use(express.json());

    app.get('/', (_req, res) => {
        res.redirect('/docs');
    });

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
    });

    // A2A Agent Card — enables agent-to-agent discovery
    app.get('/.well-known/agent.json', (_req, res) => {
        res.json({
            name: 'ATV',
            description:
                'DeFi yield vault agent by Aarna. Provides vault discovery, performance metrics, and transaction building for EVM yield vaults on Ethereum and Base.',
            url: 'https://atv-api.aarna.ai',
            provider: { organization: 'Aarna', url: 'https://aarna.ai' },
            version: '1.0.0',
            capabilities: {
                mcp: {
                    url: 'https://atv-api.aarna.ai/mcp',
                    transport: 'streamable-http',
                },
            },
            authentication: {
                schemes: [{ scheme: 'apiKey', in: 'header', name: 'x-api-key' }],
            },
            skills: [
                {
                    name: 'usdc_fixed_yield',
                    description: 'Deposit USDC into fixed-income yield vaults earning 8-12% APY',
                },
                {
                    name: 'yield_query',
                    description:
                        'Query vault performance metrics: NAV, TVL, APY, historical data',
                },
                {
                    name: 'risk_assessment',
                    description:
                        'Check vault operational status (deposit/withdraw pauses) and token breakdowns',
                },
                {
                    name: 'withdrawal',
                    description:
                        'Build instant or queued withdrawal transactions from yield vaults',
                },
            ],
        });
    });

    // MCP Server Card — enables Smithery and other registries to discover this server
    app.get('/.well-known/mcp/server-card.json', (_req, res) => {
        res.json({
            name: 'ATV',
            description:
                "Access Aarna's DeFi yield vaults — query NAV/TVL/APY, build transactions, track portfolios.",
            url: 'https://atv-api.aarna.ai/mcp',
            transport: 'streamable-http',
            authentication: {
                type: 'apiKey',
                in: 'header',
                name: 'x-api-key',
            },
            version: '1.0.1',
        });
    });

    // Serve the OpenAPI spec as JSON (useful for tooling / SDK generation)
    app.get('/openapi.json', (_req, res) => {
        res.json(openApiSpec);
    });

    // Scalar API reference UI — no auth required, served at /docs
    // Remove CSP for /docs only: Scalar loads from multiple external CDNs and
    // its own proxy, so per-route allowlisting is impractical.
    app.use('/docs', (_req, res, next) => {
        res.removeHeader('Content-Security-Policy');
        next();
    });
    app.use(
        '/docs',
        apiReference({
            theme: 'purple',
            pageTitle: 'aarnâ API Reference',
            url: '/openapi.json',
            proxy: '',
        }),
    );

    app.use('/v1', v1Router);
    app.use('/mcp', mcpRouter);

    // Global error handler — must be last
    app.use(
        (
            err: Error & { statusCode?: number },
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction,
        ) => {
            console.error(err);
            const statusCode = err.statusCode ?? 500;
            res.status(statusCode).json({
                error: err.message ?? 'Internal server error',
                statusCode,
            });
        },
    );

    return app;
}
