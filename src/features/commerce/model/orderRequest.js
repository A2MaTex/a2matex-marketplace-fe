export const buildCreateOrderRequest = (productOfferId, idempotencyKey) => ({
  body: { productOfferId },
  config: {
    headers: { "Idempotency-Key": idempotencyKey },
  },
});
