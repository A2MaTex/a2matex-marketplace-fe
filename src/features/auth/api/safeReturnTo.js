export const isSafeInternalReturnTo = (value) =>
  typeof value === "string" &&
  value.startsWith("/") &&
  !value.startsWith("//") &&
  !value.includes("\\");

export const getSafeReturnTo = (
  search,
  { origin = window.location.origin, fallback = "/" } = {},
) => {
  const values = new URLSearchParams(search).getAll("returnTo");
  if (values.length !== 1) return fallback;

  const candidate = values[0];
  if (!isSafeInternalReturnTo(candidate)) {
    return fallback;
  }

  try {
    const url = new URL(candidate, origin);
    if (url.origin !== origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
};
