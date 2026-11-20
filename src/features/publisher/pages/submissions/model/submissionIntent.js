const STORAGE_PREFIX = "a2matex:publisher-submission-intent:";

const intentKey = (productId) => `${STORAGE_PREFIX}${productId}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

export const createSubmissionIntent = (body, idempotencyKey = crypto.randomUUID()) => ({
  idempotencyKey,
  body: clone(body),
  createdAt: new Date().toISOString(),
});

export const readSubmissionIntent = (productId, storage = sessionStorage) => {
  if (!productId) return null;
  try {
    const raw = storage.getItem(intentKey(productId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.idempotencyKey !== "string" ||
      parsed.idempotencyKey.length === 0 ||
      parsed?.body?.productId !== productId ||
      typeof parsed.createdAt !== "string"
    ) {
      storage.removeItem(intentKey(productId));
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(intentKey(productId));
    return null;
  }
};

export const saveSubmissionIntent = (intent, storage = sessionStorage) => {
  storage.setItem(intentKey(intent.body.productId), JSON.stringify(intent));
  return intent;
};

export const clearSubmissionIntent = (productId, storage = sessionStorage) => {
  if (productId) storage.removeItem(intentKey(productId));
};

export const sameSubmissionInput = (left, right) =>
  JSON.stringify(left) === JSON.stringify(right);
