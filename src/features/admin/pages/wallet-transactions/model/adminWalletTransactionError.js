import { CommerceContractError } from "@/features/commerce/model/commerceContract";

const MESSAGES = {
  "Error.LedgerDateRangeInvalid": "The start date must not be after the end date.",
  "Error.WalletUserNotFound": "No user was found for this UUID.",
};

const validationMessage = (message) => {
  if (!Array.isArray(message)) return null;
  const issues = message
    .map((issue) => (typeof issue?.message === "string" ? issue.message : null))
    .filter(Boolean);
  return issues.join(" · ") || null;
};

export const toAdminWalletTransactionError = (
  error,
  fallbackMessage = "The wallet ledger could not be loaded.",
) => {
  if (error instanceof CommerceContractError) {
    return {
      code: "INVALID_RESPONSE",
      status: null,
      message:
        "The server returned an unsupported ledger response. Refresh to verify the authoritative state.",
      retryable: false,
    };
  }

  const status = error?.response?.status ?? null;
  const rawMessage = error?.response?.data?.message;
  const code = typeof rawMessage === "string" ? rawMessage : null;

  return {
    code: code ?? (status === 403 ? "FORBIDDEN" : "UNKNOWN"),
    status,
    message:
      validationMessage(rawMessage) ??
      MESSAGES[code] ??
      ({
        403: "Your account is not allowed to read the wallet ledger.",
        404: "The wallet ledger endpoint was not found.",
        503: "The wallet ledger is temporarily unavailable.",
      }[status] || fallbackMessage),
    retryable: status === null || status === 408 || status === 429 || status === 503,
  };
};
