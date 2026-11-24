import { useCallback, useEffect, useState } from "react";
import { adminUserApi } from "../api/adminUserApi";
import { parseAdminUserPageEnvelope } from "../model/adminUserModel";
import { toAdminUserError } from "../model/adminUserError";

const emptyPage = (page, pageSize) => ({
  items: [],
  totalItems: 0,
  page,
  pageSize,
  totalPages: 0,
});

export function useAdminUsers({ query, enabled = true }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    data: emptyPage(query.page, query.pageSize),
    loading: enabled,
    error: null,
  }));

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() =>
        setState({
          data: emptyPage(query.page, query.pageSize),
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
          data: emptyPage(query.page, query.pageSize),
          loading: true,
          error: null,
        });
      }
    });

    adminUserApi
      .list({ params: query, signal: controller.signal })
      .then((response) => parseAdminUserPageEnvelope(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: emptyPage(query.page, query.pageSize),
          loading: false,
          error: toAdminUserError(error, "Unable to load users."),
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
