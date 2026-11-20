import { useCallback, useEffect, useState } from "react";
import { publicPublisherApi } from "../apis/publisher/api";
import { parsePublicPublisherEnvelope } from "../model/marketplaceContract";
import { toMarketplaceError } from "../model/marketplaceError";

export function usePublicPublisher(username) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    data: null,
    loading: Boolean(username),
    error: null,
  }));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!username) {
      queueMicrotask(() => {
        if (active) setState({ data: null, loading: false, error: null });
      });
      return () => {
        active = false;
      };
    }

    queueMicrotask(() => {
      if (active) {
        setState({ data: null, loading: true, error: null });
      }
    });

    publicPublisherApi
      .get(username, { signal: controller.signal })
      .then((response) => parsePublicPublisherEnvelope(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: null,
          loading: false,
          error: toMarketplaceError(error, "Unable to load this publisher."),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey, username]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
