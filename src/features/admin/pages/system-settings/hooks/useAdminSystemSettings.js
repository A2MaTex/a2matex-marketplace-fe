import { useCallback, useEffect, useState } from "react";
import { adminSystemSettingApi } from "../api/adminSystemSettingApi";
import { parseSystemSettingListResponse } from "../model/systemSettingContract";
import { toSystemSettingError } from "../model/systemSettingError";

export function useAdminSystemSettings() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    items: [],
    loading: true,
    refreshing: false,
    error: null,
    refreshedAt: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setState((current) => ({
        ...current,
        loading: current.items.length === 0,
        refreshing: current.items.length > 0,
        error: null,
      }));
    });

    adminSystemSettingApi
      .list({ signal: controller.signal })
      .then((response) => parseSystemSettingListResponse(response))
      .then((items) => {
        if (!active) return;
        setState({
          items,
          loading: false,
          refreshing: false,
          error: null,
          refreshedAt: new Date(),
        });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState((current) => ({
          ...current,
          loading: false,
          refreshing: false,
          error: toSystemSettingError(error, "Unable to load the system settings registry."),
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
