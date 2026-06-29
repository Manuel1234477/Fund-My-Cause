import { query } from '../index.js';
import { createLogger } from '../../logger.js';

const logger = createLogger('migration:002-perf-indexes');

export async function up() {
  logger.info('Running migration 002-perf-indexes');

  // Paginated contribution list per campaign (most common query pattern)
  await query(`
    CREATE INDEX IF NOT EXISTS idx_contributions_campaign_time
      ON contributions(campaign_id, contributed_at DESC);
  `);

  // Unprocessed-event scan used on every ingestion cycle
  await query(`
    CREATE INDEX IF NOT EXISTS idx_raw_events_unprocessed
      ON raw_events(processed, ledger_sequence)
      WHERE processed = FALSE;
  `);

  // Campaign listing filtered by status, ordered by recency
  await query(`
    CREATE INDEX IF NOT EXISTS idx_campaigns_status_time
      ON campaigns(status, created_at DESC);
  `);

  // Contributor history — profile page query
  await query(`
    CREATE INDEX IF NOT EXISTS idx_contributions_contributor_time
      ON contributions(contributor_address, contributed_at DESC);
  `);

  logger.info('Migration 002-perf-indexes completed');
}

export async function down() {
  logger.info('Rolling back migration 002-perf-indexes');

  await query(`
    DROP INDEX IF EXISTS idx_contributions_campaign_time;
    DROP INDEX IF EXISTS idx_raw_events_unprocessed;
    DROP INDEX IF EXISTS idx_campaigns_status_time;
    DROP INDEX IF EXISTS idx_contributions_contributor_time;
  `);

  logger.info('Migration 002-perf-indexes rolled back');
}
