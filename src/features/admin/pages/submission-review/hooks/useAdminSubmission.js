import { useCallback, useEffect, useRef, useState } from "react";
import { adminSubmissionApi } from "../api/adminSubmissionApi";
import { parseAdminSubmissionDetailEnvelope } from "../model/adminSubmissionContract";
import {
  isCanceledAdminSubmissionRequest,
  toAdminSubmissionError,
} from "../model/adminSubmissionError";

export function useAdminSubmission(submissionId) {
  const requestId = useRef(0);
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const load = useCallback(
    async (signal) => {
      const currentRequest = ++requestId.current;
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await adminSubmissionApi.detail(submissionId, { signal });
        const data = parseAdminSubmissionDetailEnvelope(response.data);
        if (currentRequest === requestId.current) {
          setState({ data, loading: false, error: null });
        }
        return data;
      } catch (error) {
        if (isCanceledAdminSubmissionRequest(error)) return null;
        if (currentRequest === requestId.current) {
          setState({
            data: null,
            loading: false,
            error: toAdminSubmissionError(error, "Unable to load this submission."),
          });
        }
        return null;
      }
    },
    [submissionId],
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
