import { useCallback, useEffect, useState } from "react";
import { marketplaceProductApi } from "../apis/product/api";
import { parseMarketplaceProductPageEnvelope } from "../model/marketplaceContract";
import { toMarketplaceError } from "../model/marketplaceError";

const emptyPage = (page, limit) => ({
  items: [],
  totalItems: 0,
  page,
  limit,
  totalPages: 0,
});

export function useMarketplaceProducts({ page, limit, q }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    data: emptyPage(page, limit),
    loading: true,
    error: null,
  }));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    queueMicrotask(() => {
      if (active) {
        setState((current) => ({ ...current, loading: true, error: null }));
      }
    });

    marketplaceProductApi
      .list({ page, limit, q, signal: controller.signal })
      .then((response) => parseMarketplaceProductPageEnvelope(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: emptyPage(page, limit),
          loading: false,
          error: toMarketplaceError(error, "Unable to load marketplace products."),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [limit, page, q, reloadKey]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
