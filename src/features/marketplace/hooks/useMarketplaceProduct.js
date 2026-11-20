import { useCallback, useEffect, useState } from "react";
import { marketplaceProductApi } from "../apis/product/api";
import { parseMarketplaceProductEnvelope } from "../model/marketplaceContract";
import { toMarketplaceError } from "../model/marketplaceError";

export function useMarketplaceProduct(productId) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    data: null,
    loading: Boolean(productId),
    error: null,
  }));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!productId) {
      queueMicrotask(() => {
        if (active) setState({ data: null, loading: false, error: null });
      });
      return () => {
        active = false;
      };
    }

    queueMicrotask(() => {
      if (active) setState({ data: null, loading: true, error: null });
    });

    marketplaceProductApi
      .get(productId, { signal: controller.signal })
      .then((response) => parseMarketplaceProductEnvelope(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: null,
          loading: false,
          error: toMarketplaceError(error, "Unable to load this product."),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [productId, reloadKey]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
