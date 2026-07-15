export class ResearchTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResearchTimeoutError';
  }
}

export class ResearchHttpError extends Error {
  readonly status: number;
  readonly retryAfterMs: number | null;

  constructor(
    status: number,
    retryAfterMs: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'ResearchHttpError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

interface FetchJsonPolicy {
  timeoutMs: number;
  signal?: AbortSignal;
  maxAttempts?: number;
  retryTimeouts?: boolean;
  label: string;
}

interface DeadlineSignal {
  signal: AbortSignal;
  didTimeout: () => boolean;
  dispose: () => void;
}

function createAbortError(reason?: unknown): Error {
  if (reason instanceof Error) return reason;
  const error = new Error('The research request was aborted.');
  error.name = 'AbortError';
  return error;
}

export function isAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || /abort/i.test(error.message);
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw createAbortError(signal.reason);
}

export function createDeadlineSignal(
  parentSignal: AbortSignal | undefined,
  timeoutMs: number,
): DeadlineSignal {
  const controller = new AbortController();
  let timedOut = false;

  const abortFromParent = () => controller.abort(parentSignal?.reason);
  if (parentSignal?.aborted) {
    abortFromParent();
  } else {
    parentSignal?.addEventListener('abort', abortFromParent, { once: true });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort(new ResearchTimeoutError(`Request exceeded ${timeoutMs}ms.`));
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    dispose: () => {
      clearTimeout(timeoutId);
      parentSignal?.removeEventListener('abort', abortFromParent);
    },
  };
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

function isRetryable(error: unknown, retryTimeouts: boolean): boolean {
  if (error instanceof ResearchTimeoutError) return retryTimeouts;
  if (error instanceof ResearchHttpError) {
    return error.status === 408 || error.status === 429 || error.status >= 500;
  }
  return error instanceof TypeError;
}

function getRetryDelay(error: unknown, attempt: number): number {
  if (error instanceof ResearchHttpError && error.retryAfterMs !== null) {
    return Math.min(error.retryAfterMs, 5_000);
  }
  const exponentialDelay = Math.min(500 * 2 ** (attempt - 1), 2_000);
  return exponentialDelay + Math.floor(Math.random() * 200);
}

async function waitForRetry(ms: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
      reject(createAbortError(signal?.reason));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function fetchJsonWithPolicy<T>(
  url: string,
  options: Omit<RequestInit, 'signal'>,
  policy: FetchJsonPolicy,
): Promise<T> {
  const maxAttempts = Math.max(1, policy.maxAttempts ?? 2);
  const retryTimeouts = policy.retryTimeouts ?? false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    throwIfAborted(policy.signal);
    const attemptScope = createDeadlineSignal(policy.signal, policy.timeoutMs);
    let retryDelayMs: number | null = null;

    try {
      const response = await fetch(url, { ...options, signal: attemptScope.signal });
      if (!response.ok) {
        throw new ResearchHttpError(
          response.status,
          parseRetryAfter(response.headers.get('retry-after')),
          `${policy.label} returned status ${response.status}.`,
        );
      }
      return await response.json() as T;
    } catch (rawError) {
      if (policy.signal?.aborted) throw createAbortError(policy.signal.reason);

      const error = attemptScope.didTimeout()
        ? new ResearchTimeoutError(`${policy.label} timed out after ${policy.timeoutMs}ms.`)
        : rawError;
      const canRetry = attempt < maxAttempts && isRetryable(error, retryTimeouts);
      if (!canRetry) throw error;

      retryDelayMs = getRetryDelay(error, attempt);
      console.warn(
        `[Deep Research] ${policy.label} attempt ${attempt}/${maxAttempts} failed; retrying in ${retryDelayMs}ms.`,
      );
    } finally {
      attemptScope.dispose();
    }

    if (retryDelayMs !== null) {
      await waitForRetry(retryDelayMs, policy.signal);
    }
  }

  throw new Error(`${policy.label} exhausted its request attempts.`);
}

export async function mapWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length);

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      throwIfAborted(signal);
      const index = nextIndex++;
      await worker(items[index], index);
    }
  }));
}
