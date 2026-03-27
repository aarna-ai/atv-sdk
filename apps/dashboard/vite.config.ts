import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Redirect bare `/` and `/dashboard` to `/dashboard/` in dev mode */
function redirectPlugin(): Plugin {
    return {
        name: 'redirect-to-dashboard',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (req.url === '/' || req.url === '/dashboard') {
                    res.writeHead(302, { Location: '/dashboard/' });
                    res.end();
                    return;
                }
                next();
            });
        },
    };
}

export default defineConfig({
    plugins: [react(), redirectPlugin()],
    base: '/dashboard/',
    server: {
        proxy: {
            '/admin': 'http://localhost:3000',
        },
    },
});
