const STORAGE_PREFIX = "a2matex:order-intent:";
const VERSION = 1;
const STATES = new Set(["READY", "UNCERTAIN", "AWAITING_TOPUP"]);

const storageKey = (productId) => `${STORAGE_PREFIX}${productId}`;

const getDefaultStorage = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const isValidDate = (value) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const isValidIntent = (intent, productId) =>
  intent?.version === VERSION &&
  intent.productId === productId &&
  typeof intent.productOfferId === "string" &&
  intent.productOfferId.length > 0 &&
  typeof intent.idempotencyKey === "string" &&
  intent.idempotencyKey.length > 0 &&
  isValidDate(intent.createdAt) &&
  STATES.has(intent.state);

export const createOrderIntent = (
  productId,
  productOfferId,
  idempotencyKey = crypto.randomUUID(),
) => ({
  version: VERSION,
  productId,
  productOfferId,
  idempotencyKey,
  createdAt: new Date().toISOString(),
  state: "READY",
});

export const readOrderIntent = (productId, storage = getDefaultStorage()) => {
  if (!productId || !storage) return null;
  try {
    const raw = storage.getItem(storageKey(productId));
    if (!raw) return null;
    const intent = JSON.parse(raw);
    if (!isValidIntent(intent, productId)) {
      storage.removeItem(storageKey(productId));
      return null;
    }
    return intent;
  } catch {
    try {
      storage.removeItem(storageKey(productId));
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
    }
    return null;
  }
};

export const saveOrderIntent = (intent, storage = getDefaultStorage()) => {
  if (!storage || !isValidIntent(intent, intent?.productId)) return intent;
  storage.setItem(storageKey(intent.productId), JSON.stringify(intent));
  return intent;
};

export const setOrderIntentState = (intent, state, storage) => {
  if (!intent || !STATES.has(state)) return intent;
  const nextIntent = { ...intent, state };
  return saveOrderIntent(nextIntent, storage);
};

export const clearOrderIntent = (productId, storage = getDefaultStorage()) => {
  if (!productId || !storage) return;
  storage.removeItem(storageKey(productId));
};

export const isSameOrderIntent = (intent, productId, productOfferId) =>
  intent?.productId === productId &&
  intent?.productOfferId === productOfferId;

export const ORDER_INTENT_STATES = [...STATES];
