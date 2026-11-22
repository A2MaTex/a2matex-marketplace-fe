import { useCallback, useEffect, useState } from "react";
import { entitlementApi } from "../api/entitlementApi";
import { parseEntitlementPageEnvelope } from "../model/commerceContract";
import { toCommerceError } from "../model/commerceError";
import { COMMERCE_INVALIDATED_EVENT } from "../model/commerceInvalidation";

const emptyPage = (page, pageSize) => ({
  items: [],
  totalItems: 0,
  page,
  pageSize,
  totalPages: 0,
});

export function useMyEntitlements({ page, limit }) {
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

    entitlementApi
      .getMine({ page, limit, signal: controller.signal })
      .then((response) => parseEntitlementPageEnvelope(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: emptyPage(page, limit),
          loading: false,
          error: toCommerceError(error, "Unable to load your products."),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [limit, page, reloadKey]);

  useEffect(() => {
    const handleInvalidation = (event) => {
      if (event.detail?.resources?.includes("entitlements")) {
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
