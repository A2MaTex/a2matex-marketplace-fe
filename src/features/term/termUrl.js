export const getCurrentTermsUrl = (termType) =>
  `/terms/current?${new URLSearchParams({ type: termType }).toString()}`;

export const createTermUrl = "/terms";
export const getTermsUrl = "/terms";
export const getTermUrl = (termId) => `/terms/${termId}`;
export const changeTermStatusUrl = (termId) => `/terms/${termId}/status`;
