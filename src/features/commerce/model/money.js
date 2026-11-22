const DECIMAL_PATTERN = /^\d+$/;

export const isDecimalString = (value) =>
  typeof value === "string" && DECIMAL_PATTERN.test(value);

export const normalizeDecimalString = (value, fallback = "0") => {
  if (isDecimalString(value)) return value;
  if (typeof value === "bigint" && value >= 0n) return value.toString();
  if (Number.isSafeInteger(value) && value >= 0) return String(value);
  return fallback;
};

export const formatVndAmount = (value) => {
  const amount = normalizeDecimalString(value);
  return `${new Intl.NumberFormat("vi-VN").format(BigInt(amount))} ₫`;
};

export const formatBalance = (value) =>
  new Intl.NumberFormat("vi-VN").format(
    BigInt(normalizeDecimalString(value)),
  );

export const isZeroAmount = (value) =>
  isDecimalString(value) && BigInt(value) === 0n;
