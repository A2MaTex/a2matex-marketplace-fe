const SESSION_ERROR_CODES = new Set([
  "Error.InvalidAccessToken",
  "Error.SessionExpired",
  "Error.RefreshTokenAlreadyUsed",
]);

const getErrorCodes = (message) => {
  const messages = Array.isArray(message) ? message : [message];

  return messages
    .map((item) => (typeof item === "string" ? item : item?.message))
    .filter(Boolean);
};

export const requiresLogin = (error) => {
  if (error?.response?.status === 401) return true;

  return getErrorCodes(error?.response?.data?.message).some((code) =>
    SESSION_ERROR_CODES.has(code),
  );
};

export const buildSessionExpiredLoginUrl = (location) => {
  const pathname = location?.pathname || "/";
  const params = new URLSearchParams({ reason: "session-expired" });

  if (pathname !== "/login") {
    const returnTo = `${pathname}${location?.search || ""}${location?.hash || ""}`;
    params.set("returnTo", returnTo);
  }

  return `/login?${params.toString()}`;
};

let redirectStarted = false;

export const redirectToLogin = (location = window.location) => {
  if (location.pathname === "/login" || redirectStarted) return;

  redirectStarted = true;
  location.replace(buildSessionExpiredLoginUrl(location));
};
