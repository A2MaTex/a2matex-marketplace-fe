import { useCallback, useEffect, useMemo, useState } from "react";
import { publisherSubmissionApi } from "../../api/submission/api";
import { parseSubmissionPageEnvelope } from "../model/submissionContract";
import {
  isCanceledSubmissionRequest,
  toPublisherSubmissionError,
} from "../model/submissionError";

const CACHE_TTL_MS = 15_000;
const listCache = new Map();

const emptyPage = (page, limit) => ({
  items: [],
  totalItems: 0,
  page,
  limit,
  totalPages: 0,
});

const readCache = (key) => {
  const cached = listCache.get(key);
  if (!cached || Date.now() - cached.cachedAt > CACHE_TTL_MS) return null;
  return cached.data;
};

export const invalidatePublisherSubmissions = () => listCache.clear();

export function usePublisherSubmissions({ page, limit, status, productId }) {
  const cacheKey = useMemo(
    () => JSON.stringify({ page, limit, status: status ?? null, productId: productId ?? null }),
    [limit, page, productId, status],
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => {
    const cached = readCache(cacheKey);
    return {
      cacheKey,
      data: cached ?? emptyPage(page, limit),
      loading: !cached,
      error: null,
    };
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      const cached = reloadKey === 0 ? readCache(cacheKey) : null;
      setState({
        cacheKey,
        data: cached ?? emptyPage(page, limit),
        loading: !cached,
        error: null,
      });
      if (cached) return;
      try {
        const response = await publisherSubmissionApi.getSubmissions({
          page,
          limit,
          status,
          productId,
          signal: controller.signal,
        });
        const data = parseSubmissionPageEnvelope(response.data);
        listCache.set(cacheKey, { data, cachedAt: Date.now() });
        if (active) setState({ cacheKey, data, loading: false, error: null });
      } catch (error) {
        if (!active || isCanceledSubmissionRequest(error)) return;
        setState({
          cacheKey,
          data: emptyPage(page, limit),
          loading: false,
          error: toPublisherSubmissionError(
            error,
            "Unable to load publisher submissions.",
          ),
        });
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [cacheKey, limit, page, productId, reloadKey, status]);

  const refetch = useCallback(() => {
    listCache.delete(cacheKey);
    setReloadKey((value) => value + 1);
  }, [cacheKey]);

  if (state.cacheKey !== cacheKey) {
    const cached = readCache(cacheKey);
    return {
      data: cached ?? emptyPage(page, limit),
      loading: !cached,
      error: null,
      refetch,
    };
  }
  return { data: state.data, loading: state.loading, error: state.error, refetch };
}
