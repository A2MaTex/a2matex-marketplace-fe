export function createVietQrImageUrl({
  accountNumber,
  bankName,
  accountHolder,
  amount,
  transferContent,
}) {
  const normalizedAccount = String(accountNumber ?? "").trim();
  const normalizedBank = String(bankName ?? "").trim();
  if (!normalizedAccount || !normalizedBank) return "";

  const params = new URLSearchParams({
    acc: normalizedAccount,
    bank: normalizedBank,
    template: "compact",
    showinfo: "true",
  });
  if (accountHolder) params.set("holder", String(accountHolder).trim());
  if (amount !== undefined && amount !== null && String(amount).trim()) {
    params.set("amount", String(amount));
  }
  if (transferContent) params.set("des", String(transferContent).trim());

  return `https://vietqr.app/img?${params.toString()}`;
}
