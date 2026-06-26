export interface CachePurgeOptions {
  endpoint: string;
  apiKey?: string;
  surrogateKeys: string[];
  soft?: boolean;
}

export interface CachePurgeResult {
  success: boolean;
  purged: string[];
  failed?: Array<{ key: string; reason: string }>;
  timestamp: string;
}

export async function purgeCache(options: CachePurgeOptions): Promise<CachePurgeResult> {
  const { endpoint, apiKey, surrogateKeys, soft } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const response = await fetch(`${endpoint}/api/cache`, {
    method: "POST",
    headers,
    body: JSON.stringify({ surrogateKeys, soft }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cache purge failed (${response.status}): ${text}`);
  }

  return response.json();
}

export function getSurrogateKeysForCampaign(contractId: string): string[] {
  return ["campaigns", `campaign:${contractId}`];
}

export function getSurrogateKeysForUser(address: string): string[] {
  return ["campaigns", `user:${address}`];
}
