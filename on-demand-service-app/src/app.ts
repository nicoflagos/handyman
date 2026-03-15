import express from 'express';
import { setRoutes } from './routes/index';
import { logger } from './utils/logger';
import config from './config/index';
import connectDB from './db';
import path from 'path';
import fs from 'fs';
import { getUploadsRootDir } from './utils/uploads';

const app = express();
const PORT = config.port || 3000;
const SKIP_DB = process.env.SKIP_DB === 'true';

function parseCorsOrigins() {
    const raw = String(process.env.CORS_ORIGINS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    // Safe defaults for local dev + GitHub Pages.
    if (raw.length > 0) return raw;

    return [
        'http://localhost:5173',
        'http://localhost:4173',
        'https://nicoflagos.github.io',
    ];
}

const corsOrigins = new Set(parseCorsOrigins());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic hardening headers (safe defaults)
app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    return next();
});

// CORS (needed for GitHub Pages -> Render API calls)
app.use((req, res, next) => {
    const origin = String(req.headers.origin || '');
    if (origin && corsOrigins.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') return res.status(204).end();
    return next();
});

// Serve uploaded files (e.g. profile pictures)
app.use('/uploads', express.static(getUploadsRootDir()));

// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Set up routes
setRoutes(app);

function startServer(): void {
    if (process.env.SERVE_STATIC === 'true') {
        const candidates = [
            // Docker/root runtime (WORKDIR=/usr/src/app)
            path.resolve(process.cwd(), 'client', 'dist'),
            // If running from compiled output and CWD isn't the repo root
            path.resolve(__dirname, '..', '..', 'client', 'dist'),
            path.resolve(__dirname, '..', 'client', 'dist'),
        ];

        const clientDist = candidates.find(d => fs.existsSync(path.join(d, 'index.html')));
        if (clientDist) {
            const indexHtml = path.join(clientDist, 'index.html');
            app.use(express.static(clientDist));
            app.get('*', (req, res) => {
                // Never let the SPA fallback mask real 404s for API/uploads.
                if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
                    return res.status(404).json({ message: 'Not found' });
                }

                const accept = String(req.headers.accept || '');
                if (!accept.includes('text/html')) {
                    return res.status(404).json({ message: 'Not found' });
                }

                return res.sendFile(indexHtml);
            });
            logger.info(`Serving static frontend from: ${clientDist}`);
        } else {
            logger.info(
                `SERVE_STATIC=true but no frontend build found. Looked in: ${candidates.join(', ')}`,
            );
            app.get('/', (_req, res) => {
                res
                    .status(404)
                    .send('Frontend not built/available. Try /health or deploy with Dockerfile.full.');
            });
        }
    }

    app.listen(PORT, () => {
        logger.info(`Server is running on http://localhost:${PORT}`);
    });
}

if (SKIP_DB) {
    logger.info('SKIP_DB=true: starting server without MongoDB connection');
    startServer();
} else {
    connectDB()
        .then(() => startServer())
        .catch(err => {
            logger.error('Failed to start server due to DB connection error', err as Error);
            process.exit(1);
        });
}
