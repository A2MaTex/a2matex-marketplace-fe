import { useCallback, useEffect, useRef, useState } from "react";
import { publisherProductApi } from "../../api/product/api";
import { parseProductEnvelope } from "../model/productContract";
import { toPublisherProductError } from "../model/publisherProductError";

export function usePublisherProduct(productId) {
  const requestRef = useRef(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ data: null, loading: false, error: null });

  useEffect(() => {
    if (!productId) return undefined;

    const controller = new AbortController();
    const requestId = ++requestRef.current;
    let active = true;

    const load = async () => {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await publisherProductApi.getProduct(productId, {
          signal: controller.signal,
        });
        const data = parseProductEnvelope(response.data);
        if (active && requestId === requestRef.current) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (!active || error?.code === "ERR_CANCELED") return;
        if (requestId === requestRef.current) {
          setState({
            data: null,
            loading: false,
            error: toPublisherProductError(error, "Unable to load this product."),
          });
        }
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [productId, reloadKey]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  const replace = useCallback((data) => {
    requestRef.current += 1;
    setState({ data, loading: false, error: null });
  }, []);

  if (!productId) {
    return { data: null, loading: false, error: null, refetch, replace };
  }

  return { ...state, refetch, replace };
}
