import { useCallback, useEffect, useState } from "react";
import { orderApi } from "../api/orderApi";
import { parseOrderPageEnvelope } from "../model/commerceContract";
import { toCommerceError } from "../model/commerceError";
import { COMMERCE_INVALIDATED_EVENT } from "../model/commerceInvalidation";

const emptyPage = (page, pageSize) => ({
  items: [],
  totalItems: 0,
  page,
  pageSize,
  totalPages: 0,
});

export function useMyOrders({ page, limit }) {
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
        setState({ data: emptyPage(page, limit), loading: true, error: null });
      }
    });

    orderApi
      .getMine({ page, limit, signal: controller.signal })
      .then((response) => parseOrderPageEnvelope(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: emptyPage(page, limit),
          loading: false,
          error: toCommerceError(error, "Unable to load your orders."),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [limit, page, reloadKey]);

  useEffect(() => {
    const handleInvalidation = (event) => {
      if (event.detail?.resources?.includes("orders")) {
        setReloadKey((value) => value + 1);
      }
    };
    window.addEventListener(COMMERCE_INVALIDATED_EVENT, handleInvalidation);
    return () =>
      window.removeEventListener(COMMERCE_INVALIDATED_EVENT, handleInvalidation);
  }, []);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
