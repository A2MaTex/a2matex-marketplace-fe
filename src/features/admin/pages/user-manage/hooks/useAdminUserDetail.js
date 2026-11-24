import { useCallback, useEffect, useState } from "react";
import { adminUserApi } from "../api/adminUserApi";
import { parseAdminUserDetailEnvelope } from "../model/adminUserModel";
import { toAdminUserError } from "../model/adminUserError";

export function useAdminUserDetail(userId) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setState((current) => ({
          data: current.data,
          loading: true,
          error: null,
        }));
      }
    });

    adminUserApi
      .detail(userId, { signal: controller.signal })
      .then((response) => parseAdminUserDetailEnvelope(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: null,
          loading: false,
          error: toAdminUserError(error, "Unable to load this user."),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey, userId]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
