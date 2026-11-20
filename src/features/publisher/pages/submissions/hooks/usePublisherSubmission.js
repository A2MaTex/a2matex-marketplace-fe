import { useCallback, useEffect, useRef, useState } from "react";
import { publisherSubmissionApi } from "../../api/submission/api";
import { parseSubmissionDetailEnvelope } from "../model/submissionContract";
import {
  isCanceledSubmissionRequest,
  toPublisherSubmissionError,
} from "../model/submissionError";

const CACHE_TTL_MS = 15_000;
const POLL_DELAYS = [4_000, 8_000, 15_000, 30_000];
const detailCache = new Map();

const readCache = (submissionId) => {
  const cached = detailCache.get(submissionId);
  if (!cached || Date.now() - cached.cachedAt > CACHE_TTL_MS) return null;
  return cached.data;
};

export const invalidatePublisherSubmission = (submissionId) => {
  if (submissionId) detailCache.delete(submissionId);
  else detailCache.clear();
};

export function usePublisherSubmission(submissionId, { poll = true } = {}) {
  const requestRef = useRef(0);
  const pollAttemptRef = useRef(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    submissionId: null,
    data: null,
    loading: false,
    error: null,
  }));

  useEffect(() => {
    if (!submissionId) return undefined;
    const controller = new AbortController();
    const requestId = ++requestRef.current;
    let active = true;

    const load = async () => {
      const cached = reloadKey === 0 ? readCache(submissionId) : null;
      setState({
        submissionId,
        data: cached,
        loading: !cached,
        error: null,
      });
      if (cached) return;
      try {
        const response = await publisherSubmissionApi.getSubmission(submissionId, {
          signal: controller.signal,
        });
        const data = parseSubmissionDetailEnvelope(response.data);
        detailCache.set(submissionId, { data, cachedAt: Date.now() });
        if (active && requestId === requestRef.current) {
          setState({ submissionId, data, loading: false, error: null });
        }
      } catch (error) {
        if (!active || isCanceledSubmissionRequest(error)) return;
        if (requestId === requestRef.current) {
          setState({
            submissionId,
            data: null,
            loading: false,
            error: toPublisherSubmissionError(
              error,
              "Unable to load this submission.",
            ),
          });
        }
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey, submissionId]);

  const refetch = useCallback(() => {
    if (submissionId) detailCache.delete(submissionId);
    setReloadKey((value) => value + 1);
  }, [submissionId]);

  const data = state.submissionId === submissionId ? state.data : readCache(submissionId);

  useEffect(() => {
    if (!poll || !submissionId || data?.status !== "PENDING_SCAN") {
      pollAttemptRef.current = 0;
      return undefined;
    }

    let timer = null;
    const schedule = () => {
      if (document.visibilityState !== "visible") return;
      const delay = POLL_DELAYS[Math.min(pollAttemptRef.current, POLL_DELAYS.length - 1)];
      timer = window.setTimeout(() => {
        pollAttemptRef.current += 1;
        refetch();
      }, delay);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (timer) window.clearTimeout(timer);
        refetch();
      } else if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    schedule();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [data?.status, poll, refetch, submissionId]);

  if (!submissionId) {
    return { data: null, loading: false, error: null, refetch };
  }
  if (state.submissionId !== submissionId) {
    const cached = readCache(submissionId);
    return { data: cached, loading: !cached, error: null, refetch };
  }
  return { data: state.data, loading: state.loading, error: state.error, refetch };
}
