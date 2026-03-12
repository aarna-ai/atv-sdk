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
