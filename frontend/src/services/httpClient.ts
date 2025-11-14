const MAX_CONCURRENT_REQUESTS = 3;
const DEFAULT_COOLDOWN_MS = 500;
const MAX_RETRIES = 3;

const queue: Array<() => void> = [];
let activeCount = 0;

const inflight = new Map<string, Promise<Response>>();
const lastRequestAt = new Map<string, number>();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const acquire = async () => {
  if (activeCount < MAX_CONCURRENT_REQUESTS) {
    activeCount += 1;
    return;
  }

  await new Promise<void>(resolve => {
    queue.push(() => {
      activeCount += 1;
      resolve();
    });
  });
};

const release = () => {
  activeCount = Math.max(0, activeCount - 1);
  const next = queue.shift();
  if (next) next();
};

const ensureCooldown = async (key: string, cooldownMs: number) => {
  const last = lastRequestAt.get(key);
  if (!last) return;
  const elapsed = Date.now() - last;
  if (elapsed < cooldownMs) {
    const waitFor = cooldownMs - elapsed + Math.random() * 50;
    await sleep(waitFor);
  }
};

const executeWithRetry = async (
  execute: () => Promise<Response>,
  attempt = 0
): Promise<Response> => {
  try {
    const response = await execute();
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
      const baseDelay = Number.isFinite(retryAfterSeconds)
        ? Math.max(retryAfterSeconds * 1000, 400)
        : 500 * Math.pow(2, attempt);
      const jitter = Math.random() * 250;
      await sleep(baseDelay + jitter);
      return executeWithRetry(execute, attempt + 1);
    }
    return response;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      const backoff = 500 * Math.pow(2, attempt) + Math.random() * 200;
      await sleep(backoff);
      return executeWithRetry(execute, attempt + 1);
    }
    throw error;
  }
};

interface RequestOptions {
  key: string;
  execute: () => Promise<Response>;
  cooldownMs?: number;
}

export const requestWithPolicies = async ({
  key,
  execute,
  cooldownMs = DEFAULT_COOLDOWN_MS,
}: RequestOptions): Promise<Response> => {
  if (inflight.has(key)) {
    return inflight.get(key)!;
  }

  const promise = (async () => {
    await ensureCooldown(key, cooldownMs);
    await acquire();
    try {
      return await executeWithRetry(execute);
    } finally {
      lastRequestAt.set(key, Date.now());
      release();
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
};
