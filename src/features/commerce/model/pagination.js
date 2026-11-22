export const parseCommercePage = (value) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export const buildCommercePageSearch = (page) => {
  const search = new URLSearchParams();
  if (page > 1) search.set("page", String(page));
  return search;
};
