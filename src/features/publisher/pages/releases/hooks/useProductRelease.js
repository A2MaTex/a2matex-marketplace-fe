import { useCallback, useEffect, useRef, useState } from "react";
import { publisherReleaseApi } from "../../api/release/api";
import { parseReleaseDetailEnvelope } from "../model/releaseContract";
import {
  isCanceledReleaseRequest,
  toPublisherReleaseError,
} from "../model/releaseError";

const detailCache = new Map();

const keyOf = (productId, releaseId) => `${productId}:${releaseId}`;

export const invalidateProductRelease = (productId, releaseId) => {
  if (productId && releaseId) detailCache.delete(keyOf(productId, releaseId));
  else detailCache.clear();
};

export function useProductRelease(productId, releaseId) {
  const requestRef = useRef(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ key: null, data: null, loading: false, error: null });
  const key = productId && releaseId ? keyOf(productId, releaseId) : null;

  useEffect(() => {
    if (!key) return undefined;
    const controller = new AbortController();
    const requestId = ++requestRef.current;
    let active = true;
    const load = async () => {
      const cached = reloadKey === 0 ? detailCache.get(key) : null;
      setState({ key, data: cached ?? null, loading: !cached, error: null });
      if (cached) return;
      try {
        const response = await publisherReleaseApi.getRelease({
          productId,
          releaseId,
          signal: controller.signal,
        });
        const data = parseReleaseDetailEnvelope(response.data);
        detailCache.set(key, data);
        if (active && requestId === requestRef.current) {
          setState({ key, data, loading: false, error: null });
        }
      } catch (error) {
        if (!active || isCanceledReleaseRequest(error)) return;
        if (requestId === requestRef.current) {
          setState({
            key,
            data: null,
            loading: false,
            error: toPublisherReleaseError(error, "Unable to load this release."),
          });
        }
      }
    };
    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [key, productId, releaseId, reloadKey]);

  const refetch = useCallback(() => {
    if (key) detailCache.delete(key);
    setReloadKey((value) => value + 1);
  }, [key]);

  if (!key) return { data: null, loading: false, error: null, refetch };
  if (state.key !== key) {
    const cached = detailCache.get(key) ?? null;
    return { data: cached, loading: !cached, error: null, refetch };
  }
  return { data: state.data, loading: state.loading, error: state.error, refetch };
}
