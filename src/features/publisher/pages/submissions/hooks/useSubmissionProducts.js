import { useCallback, useEffect, useMemo, useState } from "react";
import { publisherProductApi } from "../../api/product/api";
import { parseProductPageEnvelope } from "../../products/model/productContract";
import { toPublisherProductError } from "../../products/model/publisherProductError";

const PAGE_LIMIT = 100;
const productCache = new Map();

const loadStatus = async (status, signal) => {
  const products = [];
  let page = 1;
  while (true) {
    const response = await publisherProductApi.getProducts({
      page,
      limit: PAGE_LIMIT,
      status,
      signal,
    });
    const parsed = parseProductPageEnvelope(response.data);
    products.push(...parsed.items);
    if (page >= parsed.totalPages) break;
    page += 1;
  }
  return products;
};

export function useSubmissionProducts(statuses = null) {
  const cacheKey = useMemo(
    () => (statuses?.length ? [...statuses].sort().join(",") : "ALL"),
    [statuses],
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    cacheKey,
    data: productCache.get(cacheKey) ?? [],
    loading: !productCache.has(cacheKey),
    error: null,
  }));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      const cached = reloadKey === 0 ? productCache.get(cacheKey) : null;
      setState({ cacheKey, data: cached ?? [], loading: !cached, error: null });
      if (cached) return;
      try {
        const groups = statuses?.length ? statuses : [undefined];
        const pages = await Promise.all(
          groups.map((status) => loadStatus(status, controller.signal)),
        );
        const unique = new Map();
        pages.flat().forEach((product) => unique.set(product.id, product));
        const data = [...unique.values()].sort((left, right) =>
          (left.name ?? left.slug ?? "").localeCompare(right.name ?? right.slug ?? ""),
        );
        productCache.set(cacheKey, data);
        if (active) setState({ cacheKey, data, loading: false, error: null });
      } catch (error) {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          cacheKey,
          data: [],
          loading: false,
          error: toPublisherProductError(
            error,
            "Unable to load products for submissions.",
          ),
        });
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [cacheKey, reloadKey, statuses]);

  const refetch = useCallback(() => {
    productCache.delete(cacheKey);
    setReloadKey((value) => value + 1);
  }, [cacheKey]);

  if (state.cacheKey !== cacheKey) {
    const cached = productCache.get(cacheKey);
    return { data: cached ?? [], loading: !cached, error: null, refetch };
  }
  return { data: state.data, loading: state.loading, error: state.error, refetch };
}
