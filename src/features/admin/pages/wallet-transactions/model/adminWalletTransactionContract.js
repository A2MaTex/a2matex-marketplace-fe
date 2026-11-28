import {
  CommerceContractError,
  isCommerceUuid,
} from "@/features/commerce/model/commerceContract";
import { isDecimalString } from "@/features/commerce/model/money";

// Giữ đúng thứ tự enum của BE (shared/constants/wallet.constant.ts): bộ lọc và chú giải
// đều đọc từ đây, nên thêm loại mới chỉ phải sửa một chỗ.
export const WALLET_TRANSACTION_TYPES = [
  "TOPUP",
  "PURCHASE",
  "EARNING",
  "COMMISSION",
  "ADMIN_GRANT",
  "ISSUED_CREDIT",
  "WITHDRAWAL",
  "WITHDRAWAL_REVERSAL",
];

// titleCase biến TOPUP thành "Topup"; nhãn hiển thị khai riêng để đọc được.
export const WALLET_TRANSACTION_TYPE_LABELS = {
  TOPUP: "Top-up",
  PURCHASE: "Purchase",
  EARNING: "Earning",
  COMMISSION: "Commission",
  ADMIN_GRANT: "Admin grant",
  ISSUED_CREDIT: "Issued credit",
  WITHDRAWAL: "Withdrawal",
  WITHDRAWAL_REVERSAL: "Withdrawal reversal",
};

const TYPE_VALUES = new Set(WALLET_TRANSACTION_TYPES);
const DIRECTION_VALUES = new Set(["CREDIT", "DEBIT"]);

const own = (record, key) => Object.prototype.hasOwnProperty.call(record, key);

const object = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new CommerceContractError(`${label} must be an object.`);
  }
  return value;
};

const uuid = (value, label) => {
  if (!isCommerceUuid(value)) {
    throw new CommerceContractError(`${label} must be a UUID.`);
  }
  return value;
};

const string = (value, label) => {
  if (typeof value !== "string") {
    throw new CommerceContractError(`${label} must be a string.`);
  }
  return value;
};

// Số tiền là BigInt phía server nên đi dây dưới dạng chuỗi thập phân: không ép sang Number.
const decimal = (value, label) => {
  if (!isDecimalString(value)) {
    throw new CommerceContractError(`${label} must be a decimal string.`);
  }
  return value;
};

const isoDate = (value, label) => {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new CommerceContractError(`${label} must be an ISO date.`);
  }
  return value;
};

const integer = (value, label, minimum = 0) => {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new CommerceContractError(
      `${label} must be a safe integer greater than or equal to ${minimum}.`,
    );
  }
  return value;
};

const enumValue = (value, values, label) => {
  if (!values.has(value)) {
    throw new CommerceContractError(`${label} is unsupported.`);
  }
  return value;
};

const requiredNullable = (record, key, label, parser) => {
  if (!own(record, key)) {
    throw new CommerceContractError(`${label} is required and may be null.`);
  }
  return record[key] === null ? null : parser(record[key], label);
};

const parseEntry = (value, label) => {
  const entry = object(value, label);
  return {
    id: uuid(entry.id, `${label}.id`),
    userId: requiredNullable(entry, "userId", `${label}.userId`, uuid),
    systemAccount: requiredNullable(
      entry,
      "systemAccount",
      `${label}.systemAccount`,
      string,
    ),
    type: enumValue(entry.type, TYPE_VALUES, `${label}.type`),
    direction: enumValue(
      entry.direction,
      DIRECTION_VALUES,
      `${label}.direction`,
    ),
    amount: decimal(entry.amount, `${label}.amount`),
    balanceAfter: decimal(entry.balanceAfter, `${label}.balanceAfter`),
    orderId: requiredNullable(entry, "orderId", `${label}.orderId`, uuid),
    topUpTransactionId: requiredNullable(
      entry,
      "topUpTransactionId",
      `${label}.topUpTransactionId`,
      uuid,
    ),
    withdrawalRequestId: requiredNullable(
      entry,
      "withdrawalRequestId",
      `${label}.withdrawalRequestId`,
      uuid,
    ),
    transferId: requiredNullable(
      entry,
      "transferId",
      `${label}.transferId`,
      uuid,
    ),
    note: requiredNullable(entry, "note", `${label}.note`, string),
    createdById: requiredNullable(
      entry,
      "createdById",
      `${label}.createdById`,
      uuid,
    ),
    createdAt: isoDate(entry.createdAt, `${label}.createdAt`),
  };
};

export const parseAdminWalletTransactionPageEnvelope = (payload) => {
  const envelope = object(payload, "adminWalletTransactions envelope");
  const data = object(envelope.data, "adminWalletTransactions.data");
  if (!Array.isArray(data.items)) {
    throw new CommerceContractError(
      "adminWalletTransactions.data.items must be an array.",
    );
  }

  return {
    items: data.items.map((item, index) =>
      parseEntry(item, `adminWalletTransactions.data.items[${index}]`),
    ),
    totalItems: integer(
      data.totalItems,
      "adminWalletTransactions.data.totalItems",
    ),
    page: integer(data.page, "adminWalletTransactions.data.page", 1),
    pageSize: integer(data.pageSize, "adminWalletTransactions.data.pageSize", 1),
    totalPages: integer(
      data.totalPages,
      "adminWalletTransactions.data.totalPages",
    ),
  };
};
