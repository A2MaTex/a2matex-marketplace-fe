import { useCallback, useEffect, useState } from "react";
import { adminEntitlementApi } from "../api/adminEntitlementApi";
import { parseAdminEntitlementPageEnvelope } from "../model/adminEntitlementContract";
import { toAdminEntitlementError } from "../model/adminEntitlementError";

const emptyPage = (page, pageSize) => ({
  items: [],
  totalItems: 0,
  page,
  pageSize,
  totalPages: 0,
});

export function useAdminEntitlements({ query, enabled = true }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    data: emptyPage(query.page, query.limit),
    loading: enabled,
    error: null,
  }));

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() =>
        setState({
          data: emptyPage(query.page, query.limit),
          loading: false,
          error: null,
        }),
      );
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setState({
          data: emptyPage(query.page, query.limit),
          loading: true,
          error: null,
        });
      }
    });

    adminEntitlementApi
      .list({ params: query, signal: controller.signal })
      .then((response) => parseAdminEntitlementPageEnvelope(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: emptyPage(query.page, query.limit),
          loading: false,
          error: toAdminEntitlementError(
            error,
            "Unable to load entitlements.",
          ),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, query, reloadKey]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
