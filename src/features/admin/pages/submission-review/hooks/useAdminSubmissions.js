import { useCallback, useEffect, useRef, useState } from "react";
import { adminSubmissionApi } from "../api/adminSubmissionApi";
import { parseAdminSubmissionPageEnvelope } from "../model/adminSubmissionContract";
import {
  isCanceledAdminSubmissionRequest,
  toAdminSubmissionError,
} from "../model/adminSubmissionError";

const emptyPage = (page, limit) => ({
  items: [],
  totalItems: 0,
  page,
  limit,
  totalPages: 0,
});

export function useAdminSubmissions(query) {
  const requestId = useRef(0);
  const [state, setState] = useState(() => ({
    data: emptyPage(query.page, query.limit),
    loading: true,
    error: null,
  }));

  const load = useCallback(
    async (signal) => {
      const currentRequest = ++requestId.current;
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await adminSubmissionApi.list({ ...query, signal });
        const data = parseAdminSubmissionPageEnvelope(response.data);
        if (currentRequest === requestId.current) {
          setState({ data, loading: false, error: null });
        }
        return data;
      } catch (error) {
        if (isCanceledAdminSubmissionRequest(error)) return null;
        if (currentRequest === requestId.current) {
          setState({
            data: emptyPage(query.page, query.limit),
            loading: false,
            error: toAdminSubmissionError(error, "Unable to load submissions."),
          });
        }
        return null;
      }
    },
    [query],
  );

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) void load(controller.signal);
    });
    return () => controller.abort();
  }, [load]);

  const refetch = useCallback(() => load(), [load]);
  return { ...state, refetch };
}
