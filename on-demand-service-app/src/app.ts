import express from 'express';
import { setRoutes } from './routes/index';
import { logger } from './utils/logger';
import config from './config/index';
import connectDB from './db';
import path from 'path';

const app = express();
const PORT = config.port || 3000;
const SKIP_DB = process.env.SKIP_DB === 'true';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Set up routes
setRoutes(app);

function startServer(): void {
    if (process.env.SERVE_STATIC === 'true') {
        const clientDist = path.join(__dirname, '..', 'client', 'dist');
        app.use(express.static(clientDist));
        app.get('*', (_req, res) => {
            res.sendFile(path.join(clientDist, 'index.html'));
        });
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
