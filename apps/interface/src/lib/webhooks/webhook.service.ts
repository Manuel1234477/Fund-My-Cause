/**
 * Webhook service — Issue #677
 *
 * Let creators/integrators subscribe to campaign events via webhooks.
 * Features: registration, signing-secret management, signed payload delivery,
 * retries with exponential backoff, dead-letter queue, delivery log.
 */

import * as crypto from 'crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

export type WebhookEventType =
  | 'campaign.created'
  | 'campaign.updated'
  | 'campaign.funded'
  | 'campaign.successful'
  | 'campaign.cancelled'
  | 'contribution.received'
  | 'milestone.reached';

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  createdAt: string;
  active: boolean;
  /** Owner wallet address */
  ownerId: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEventType;
  payload: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed' | 'dead';
  attempts: number;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
  responseCode: number | null;
  error: string | null;
  createdAt: string;
}

// ── In-process store (replace with DB in production) ─────────────────────────

const subscriptions = new Map<string, WebhookSubscription>();
const deliveries = new Map<string, WebhookDelivery>();

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [0, 30_000, 300_000, 1_800_000, 7_200_000]; // 0s, 30s, 5m, 30m, 2h
const SIGNATURE_HEADER = 'x-fmc-signature';
const TIMESTAMP_HEADER = 'x-fmc-timestamp';

// ── Signature helpers ─────────────────────────────────────────────────────────

/**
 * Generate a HMAC-SHA256 signature for payload delivery.
 *
 * Signature = HMAC-SHA256(secret, `${timestamp}.${body}`)
 */
export function signPayload(secret: string, body: string, timestamp: number): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
}

/**
 * Verify an incoming webhook signature.
 *
 * @param secret    - Webhook signing secret
 * @param signature - Value of x-fmc-signature header
 * @param body      - Raw request body string
 * @param timestamp - Value of x-fmc-timestamp header (Unix ms)
 * @param tolerance - Max age of timestamp in ms (default 5 min)
 */
export function verifySignature(
  secret: string,
  signature: string,
  body: string,
  timestamp: number,
  tolerance = 5 * 60 * 1000,
): boolean {
  if (Math.abs(Date.now() - timestamp) > tolerance) return false;
  const expected = signPayload(secret, body, timestamp);
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}

// ── Registration ──────────────────────────────────────────────────────────────

/**
 * Register a new webhook subscription.
 * Generates a random signing secret.
 */
export function registerWebhook(
  ownerId: string,
  url: string,
  events: WebhookEventType[],
): WebhookSubscription {
  if (!url.startsWith('https://')) {
    throw new Error('Webhook URL must use HTTPS');
  }
  if (events.length === 0) {
    throw new Error('At least one event type is required');
  }

  const id = crypto.randomUUID();
  const secret = crypto.randomBytes(32).toString('hex');

  const sub: WebhookSubscription = {
    id,
    url,
    events,
    secret,
    ownerId,
    active: true,
    createdAt: new Date().toISOString(),
  };

  subscriptions.set(id, sub);
  return sub;
}

/** Update an existing webhook subscription. */
export function updateWebhook(
  id: string,
  ownerId: string,
  updates: Partial<Pick<WebhookSubscription, 'url' | 'events' | 'active'>>,
): WebhookSubscription {
  const sub = subscriptions.get(id);
  if (!sub) throw new Error('Webhook not found');
  if (sub.ownerId !== ownerId) throw new Error('Unauthorized');

  Object.assign(sub, updates);
  subscriptions.set(id, sub);
  return sub;
}

/** Delete a webhook subscription. */
export function deleteWebhook(id: string, ownerId: string): void {
  const sub = subscriptions.get(id);
  if (!sub) throw new Error('Webhook not found');
  if (sub.ownerId !== ownerId) throw new Error('Unauthorized');
  subscriptions.delete(id);
}

/** List all webhooks for an owner. */
export function listWebhooks(ownerId: string): WebhookSubscription[] {
  return Array.from(subscriptions.values())
    .filter(s => s.ownerId === ownerId)
    .map(s => ({ ...s, secret: s.secret.slice(0, 8) + '...' })); // mask secret
}

/** Rotate the signing secret for a webhook. */
export function rotateSecret(id: string, ownerId: string): string {
  const sub = subscriptions.get(id);
  if (!sub) throw new Error('Webhook not found');
  if (sub.ownerId !== ownerId) throw new Error('Unauthorized');
  sub.secret = crypto.randomBytes(32).toString('hex');
  subscriptions.set(id, sub);
  return sub.secret;
}

// ── Delivery ──────────────────────────────────────────────────────────────────

/**
 * Dispatch a campaign event to all matching webhook subscriptions.
 * Creates delivery records and attempts immediate delivery.
 */
export async function dispatchEvent(
  event: WebhookEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  const matching = Array.from(subscriptions.values()).filter(
    s => s.active && s.events.includes(event),
  );

  await Promise.allSettled(matching.map(sub => attemptDelivery(sub, event, payload, true)));
}

/**
 * Attempt delivery to a single webhook. Creates or updates a delivery record.
 */
async function attemptDelivery(
  sub: WebhookSubscription,
  event: WebhookEventType,
  payload: Record<string, unknown>,
  isFirst = false,
): Promise<void> {
  const deliveryId = isFirst ? crypto.randomUUID() : undefined;
  const body = JSON.stringify({ event, data: payload, timestamp: Date.now() });
  const ts = Date.now();
  const sig = signPayload(sub.secret, body, ts);

  let delivery: WebhookDelivery = deliveryId
    ? {
        id: deliveryId,
        webhookId: sub.id,
        event,
        payload,
        status: 'pending',
        attempts: 0,
        lastAttemptAt: null,
        nextRetryAt: null,
        responseCode: null,
        error: null,
        createdAt: new Date().toISOString(),
      }
    : deliveries.get(deliveryId!)!;

  if (deliveryId) deliveries.set(delivery.id, delivery);

  delivery.attempts++;
  delivery.lastAttemptAt = new Date().toISOString();

  try {
    const res = await fetch(sub.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [SIGNATURE_HEADER]: sig,
        [TIMESTAMP_HEADER]: String(ts),
        'User-Agent': 'Fund-My-Cause-Webhooks/1.0',
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    delivery.responseCode = res.status;

    if (res.ok) {
      delivery.status = 'success';
      delivery.nextRetryAt = null;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    delivery.error = err instanceof Error ? err.message : 'Unknown error';
    delivery.responseCode = delivery.responseCode ?? null;

    if (delivery.attempts >= MAX_ATTEMPTS) {
      delivery.status = 'dead';
    } else {
      delivery.status = 'failed';
      const delay = RETRY_DELAYS_MS[delivery.attempts] ?? RETRY_DELAYS_MS.at(-1)!;
      delivery.nextRetryAt = new Date(Date.now() + delay).toISOString();

      // Schedule retry
      setTimeout(() => {
        void attemptDelivery(sub, event, payload, false);
      }, delay);
    }
  }

  deliveries.set(delivery.id, delivery);
}

// ── Delivery log ──────────────────────────────────────────────────────────────

/** List delivery log for a webhook (newest first). */
export function getDeliveryLog(
  webhookId: string,
  ownerId: string,
  limit = 50,
): WebhookDelivery[] {
  const sub = subscriptions.get(webhookId);
  if (!sub || sub.ownerId !== ownerId) throw new Error('Webhook not found');

  return Array.from(deliveries.values())
    .filter(d => d.webhookId === webhookId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

/** List all dead-letter deliveries for a webhook. */
export function getDeadLetterQueue(webhookId: string, ownerId: string): WebhookDelivery[] {
  return getDeliveryLog(webhookId, ownerId, 200).filter(d => d.status === 'dead');
}
