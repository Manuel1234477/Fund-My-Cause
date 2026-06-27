import express from 'express';
import cors from 'cors';
import { initializePool, closePool } from './db/index.js';
import { runMigrations } from './db/migrations/run.js';
import restApi from './rest-api.js';
import { createLogger } from './logger.js';

const logger = createLogger('app');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_URL = process.env.DATABASE_URL || 'postgresql://localhost/fundmycause';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// OpenAPI schema
app.get('/openapi.json', (req, res) => {
  res.sendFile(new URL('../openapi.yaml', import.meta.url).pathname);
});

// API routes
app.use('/api/v1', restApi);

async function start() {
  try {
    logger.info('Starting indexer service...');
    
    initializePool(DB_URL);
    await runMigrations();
    
    app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await closePool();
  process.exit(0);
});

start();
