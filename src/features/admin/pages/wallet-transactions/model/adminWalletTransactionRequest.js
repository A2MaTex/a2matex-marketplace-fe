import { isCommerceUuid } from "@/features/commerce/model/commerceContract";
import { WALLET_TRANSACTION_TYPES } from "./adminWalletTransactionContract";

export const LEDGER_PAGE_SIZE = 20;

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isDay = (value) => DAY_PATTERN.test(value) && !Number.isNaN(Date.parse(value));

// `to` của API so sánh `lt`, nên ngày người dùng chọn phải đẩy sang 00:00 hôm sau thì
// mới bao trọn ngày đó.
const exclusiveEnd = (day) => {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
};

export const readLedgerFilters = (searchParams) => ({
  userId: searchParams.get("userId") ?? "",
  type: searchParams.get("type") ?? "",
  from: searchParams.get("from") ?? "",
  to: searchParams.get("to") ?? "",
});

export const validateLedgerFilters = ({ userId, type, from, to }) => {
  if (userId && !isCommerceUuid(userId)) return "User filter must be a valid UUID.";
  if (type && !WALLET_TRANSACTION_TYPES.includes(type)) return "Unknown transaction type.";
  if (from && !isDay(from)) return "The start date is not a valid date.";
  if (to && !isDay(to)) return "The end date is not a valid date.";
  if (from && to && from > to) return "The start date must not be after the end date.";
  return "";
};

export const buildLedgerQuery = ({ page, filters }) => ({
  page,
  limit: LEDGER_PAGE_SIZE,
  ...(filters.userId ? { userId: filters.userId } : {}),
  ...(filters.type ? { types: filters.type } : {}),
  ...(filters.from ? { from: new Date(`${filters.from}T00:00:00.000Z`).toISOString() } : {}),
  ...(filters.to ? { to: exclusiveEnd(filters.to) } : {}),
});
