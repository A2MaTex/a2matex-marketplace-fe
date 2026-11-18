import { useCallback, useEffect, useState } from "react";
import { publisherProductApi } from "../../api/product/api";
import { parseProductPageEnvelope } from "../model/productContract";
import { toPublisherProductError } from "../model/publisherProductError";

const emptyPage = (page, limit) => ({
  items: [],
  page,
  limit,
  totalItems: 0,
  totalPages: 0,
});

export function usePublisherProducts({ page, limit, status }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    data: emptyPage(page, limit),
    loading: true,
    error: null,
  }));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setState({ data: emptyPage(page, limit), loading: true, error: null });
      try {
        const response = await publisherProductApi.getProducts({
          page,
          limit,
          status,
          signal: controller.signal,
        });
        const data = parseProductPageEnvelope(response.data);
        if (active) setState({ data, loading: false, error: null });
      } catch (error) {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: emptyPage(page, limit),
          loading: false,
          error: toPublisherProductError(error, "Unable to load publisher products."),
        });
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [limit, page, reloadKey, status]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
