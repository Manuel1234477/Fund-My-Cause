import express, { Request, Response } from 'express';
import { getPool } from './db/index.js';
import { createLogger } from './logger.js';

const logger = createLogger('rest-api');
const router = express.Router();

// Pagination params
interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

function getPagination(query: PaginationQuery) {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20')));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function getSortOrder(order?: string): 'ASC' | 'DESC' {
  return order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
}

// GET /campaigns
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const { offset, limit } = getPagination(req.query as PaginationQuery);
    const pool = getPool();

    const countResult = await pool.query('SELECT COUNT(*) FROM campaigns');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT id, creator_address, contract_address, title, description, 
              goal, total_raised, status, deadline, contributor_count, created_at
       FROM campaigns
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    logger.error('Error fetching campaigns', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /campaigns/:id
router.get('/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const result = await pool.query(
      `SELECT * FROM campaigns WHERE id = $1 OR contract_address = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error fetching campaign', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /campaigns/:id/contributions
router.get('/campaigns/:id/contributions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { offset, limit } = getPagination(req.query as PaginationQuery);
    const pool = getPool();

    // Get campaign ID if contract address provided
    let campaignId = id;
    const campaignResult = await pool.query(
      'SELECT id FROM campaigns WHERE contract_address = $1 OR id = $1',
      [id]
    );
    if (campaignResult.rows.length > 0) {
      campaignId = campaignResult.rows[0].id;
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM contributions WHERE campaign_id = $1',
      [campaignId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT id, contributor_address, amount, token_amount, contributed_at, tx_hash
       FROM contributions
       WHERE campaign_id = $1
       ORDER BY contributed_at DESC
       LIMIT $2 OFFSET $3`,
      [campaignId, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    logger.error('Error fetching contributions', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const pool = getPool();

    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT id) as total_campaigns,
        COUNT(DISTINCT CASE WHEN status = 'active' THEN id END) as active_campaigns,
        COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as succeeded_campaigns,
        SUM(total_raised) as total_raised,
        SUM(contributor_count) as total_contributors,
        AVG(total_raised::numeric) as avg_raised_per_campaign
      FROM campaigns
    `);

    res.json(stats.rows[0]);
  } catch (err) {
    logger.error('Error fetching stats', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
