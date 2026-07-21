import type { PoolClient } from 'pg';
import { getPool } from './db/index.js';
import { createLogger } from './logger.js';
import { randomUUID } from 'crypto';

const logger = createLogger('event-ingestor');

interface RawEvent {
  type: 'initialize' | 'contribute' | 'withdraw' | 'refund';
  contractId: string;
  ledgerSequence: number;
  txHash: string;
  data: Record<string, unknown>;
}

interface CampaignInitData {
  creator: string;
  tokenId: string;
  goal: bigint;
  deadline: number;
  minContribution: bigint;
  title: string;
  description: string;
}

export async function ingestEvents(events: RawEvent[]): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const event of events) {
      const eventId = randomUUID();

      // Check if event already processed (idempotent upsert)
      const existing = await client.query(
        'SELECT id FROM raw_events WHERE tx_hash = $1 AND event_type = $2',
        [event.txHash, event.type]
      );

      if (existing.rows.length === 0) {
        // Insert raw event
        let campaignId: string | null = null;

        if (event.type === 'initialize') {
          const initData = event.data as unknown as CampaignInitData;
          campaignId = randomUUID();

          // Upsert campaign
          await client.query(
            `INSERT INTO campaigns (id, creator_address, contract_address, token_address, goal, deadline, min_contribution, title, description, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (contract_address) DO UPDATE SET updated_at = NOW()`,
            [
              campaignId,
              initData.creator,
              event.contractId,
              initData.tokenId,
              initData.goal,
              initData.deadline,
              initData.minContribution,
              initData.title,
              initData.description,
              'active'
            ]
          );
        } else {
          // Get campaign by contract address
          const result = await client.query(
            'SELECT id FROM campaigns WHERE contract_address = $1',
            [event.contractId]
          );
          if (result.rows.length > 0) {
            campaignId = result.rows[0].id;
          }
        }

        // Insert raw event
        await client.query(
          `INSERT INTO raw_events (id, campaign_id, event_type, ledger_sequence, tx_hash, event_data, processed)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [eventId, campaignId, event.type, event.ledgerSequence, event.txHash, JSON.stringify(event.data), false]
        );

        // Process event
        await processEvent(client, event, campaignId);

        // Mark as processed
        await client.query(
          'UPDATE raw_events SET processed = TRUE, processed_at = NOW() WHERE id = $1',
          [eventId]
        );

        logger.info(`Processed ${event.type} event for contract ${event.contractId}`);
      }
    }

    // Update last processed ledger
    const maxLedger = Math.max(...events.map(e => e.ledgerSequence));
    await client.query('UPDATE sync_state SET last_processed_ledger = $1 WHERE id = 1', [maxLedger]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function processEvent(
  client: PoolClient,
  event: RawEvent,
  campaignId: string | null
): Promise<void> {
  if (!campaignId) return;

  const data = event.data as Record<string, unknown>;

  switch (event.type) {
    case 'contribute': {
      const contributionId = randomUUID();
      await client.query(
        `INSERT INTO contributions (id, campaign_id, contributor_address, amount, token_amount, tx_hash)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          contributionId,
          campaignId,
          data.contributor,
          data.amount,
          data.tokenAmount,
          event.txHash
        ]
      );

      // Update campaign total_raised and contributor_count
      await client.query(
        `UPDATE campaigns SET total_raised = total_raised + $1, 
                             contributor_count = contributor_count + 1,
                             updated_at = NOW()
         WHERE id = $2`,
        [data.amount, campaignId]
      );
      break;
    }

    case 'withdraw': {
      await client.query(
        'UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2',
        ['succeeded', campaignId]
      );
      break;
    }

    case 'refund': {
      const refundId = randomUUID();
      await client.query(
        `INSERT INTO refunds (id, campaign_id, contributor_address, amount, status, tx_hash)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          refundId,
          campaignId,
          data.contributor,
          data.amount,
          'claimed',
          event.txHash
        ]
      );

      await client.query(
        'UPDATE refunds SET claimed_at = NOW() WHERE id = $1',
        [refundId]
      );
      break;
    }
  }
}

export async function getLastProcessedLedger(): Promise<number> {
  const pool = getPool();
  const result = await pool.query('SELECT last_processed_ledger FROM sync_state WHERE id = 1');
  return result.rows[0]?.last_processed_ledger || 0;
}
