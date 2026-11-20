import { useCallback, useEffect, useState } from "react";
import { publisherSubmissionApi } from "../../api/submission/api";
import { parseSubmissionPageEnvelope } from "../model/submissionContract";
import {
  isCanceledSubmissionRequest,
  toPublisherSubmissionError,
} from "../model/submissionError";

const OPEN_STATUSES = ["PENDING_SCAN", "READY_FOR_REVIEW"];

export function useOpenSubmission(productId) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    productId: null,
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!productId) return undefined;
    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setState({ productId, data: null, loading: true, error: null });
      try {
        const responses = await Promise.all(
          OPEN_STATUSES.map((status) =>
            publisherSubmissionApi.getSubmissions({
              page: 1,
              limit: 1,
              status,
              productId,
              signal: controller.signal,
            }),
          ),
        );
        const items = responses.flatMap(
          (response) => parseSubmissionPageEnvelope(response.data).items,
        );
        const data = items.sort(
          (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
        )[0] ?? null;
        if (active) setState({ productId, data, loading: false, error: null });
      } catch (error) {
        if (!active || isCanceledSubmissionRequest(error)) return;
        setState({
          productId,
          data: null,
          loading: false,
          error: toPublisherSubmissionError(
            error,
            "Unable to check for an open submission.",
          ),
        });
      }
    };

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [productId, reloadKey]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  if (!productId) return { data: null, loading: false, error: null, refetch };
  if (state.productId !== productId) {
    return { data: null, loading: true, error: null, refetch };
  }
  return { data: state.data, loading: state.loading, error: state.error, refetch };
}
