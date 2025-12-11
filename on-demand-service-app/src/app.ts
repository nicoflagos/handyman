import express from 'express';
import { setRoutes } from './routes/index';
import { logger } from './utils/logger';
import { config } from './config/index';

const app = express();
const PORT = config.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up routes
setRoutes(app);

// Start the server
app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});