import express from 'express';
import { setRoutes } from './routes/index';
import { logger } from './utils/logger';
import config from './config/index';
import connectDB from './db';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = config.port || 3000;
const SKIP_DB = process.env.SKIP_DB === 'true';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (e.g. profile pictures)
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

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
            app.get('*', (_req, res) => {
                res.sendFile(indexHtml);
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
