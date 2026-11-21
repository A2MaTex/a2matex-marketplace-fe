import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { publisherReleaseApi } from "../../api/release/api";
import { parseReleasePageEnvelope } from "../model/releaseContract";
import {
  isCanceledReleaseRequest,
  toPublisherReleaseError,
} from "../model/releaseError";
import {
  pollDelayForAttempt,
  shouldPollProductReleases,
} from "../../model/publisherPolling";

const CACHE_TTL_MS = 10_000;
const releaseListCache = new Map();

const emptyPage = (page, limit) => ({
  items: [],
  page,
  limit,
  totalItems: 0,
  totalPages: 0,
});

const cacheKeyOf = (productId, page, limit) => `${productId}:${page}:${limit}`;

const readCache = (key) => {
  const cached = releaseListCache.get(key);
  if (!cached || Date.now() - cached.cachedAt > CACHE_TTL_MS) return null;
  return cached.data;
};

export const invalidateProductReleases = (productId) => {
  if (!productId) {
    releaseListCache.clear();
    return;
  }
  [...releaseListCache.keys()]
    .filter((key) => key.startsWith(`${productId}:`))
    .forEach((key) => releaseListCache.delete(key));
};

export function useProductReleases({ productId, page, limit, poll = true }) {
  const cacheKey = useMemo(
    () => cacheKeyOf(productId, page, limit),
    [limit, page, productId],
  );
  const requestRef = useRef(0);
  const pollAttemptRef = useRef(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    cacheKey: null,
    data: emptyPage(page, limit),
    loading: Boolean(productId),
    error: null,
  });

  useEffect(() => {
    if (!productId) return undefined;
    const controller = new AbortController();
    const requestId = ++requestRef.current;
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
        const response = await publisherReleaseApi.getReleases({
          productId,
          page,
          limit,
          signal: controller.signal,
        });
        const data = parseReleasePageEnvelope(response.data);
        releaseListCache.set(cacheKey, { data, cachedAt: Date.now() });
        if (active && requestId === requestRef.current) {
          setState({ cacheKey, data, loading: false, error: null });
        }
      } catch (error) {
        if (!active || isCanceledReleaseRequest(error)) return;
        if (requestId === requestRef.current) {
          setState({
            cacheKey,
            data: emptyPage(page, limit),
            loading: false,
            error: toPublisherReleaseError(error, "Unable to load product releases."),
          });
        }
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [cacheKey, limit, page, productId, reloadKey]);

  const refetch = useCallback(() => {
    invalidateProductReleases(productId);
    setReloadKey((value) => value + 1);
  }, [productId]);

  const data = state.cacheKey === cacheKey ? state.data : readCache(cacheKey) ?? emptyPage(page, limit);

  useEffect(() => {
    if (!shouldPollProductReleases({ poll, productId, releases: data.items })) {
      pollAttemptRef.current = 0;
      return undefined;
    }
    let timer = null;
    const schedule = () => {
      if (document.visibilityState !== "visible") return;
      const delay = pollDelayForAttempt(pollAttemptRef.current);
      timer = window.setTimeout(() => {
        pollAttemptRef.current += 1;
        refetch();
      }, delay);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (timer) window.clearTimeout(timer);
        refetch();
      } else if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    };
    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [data.items, poll, productId, refetch]);

  if (!productId) {
    return { data: emptyPage(page, limit), loading: false, error: null, refetch };
  }
  return {
    data,
    loading: state.cacheKey === cacheKey ? state.loading : !readCache(cacheKey),
    error: state.cacheKey === cacheKey ? state.error : null,
    refetch,
  };
}
