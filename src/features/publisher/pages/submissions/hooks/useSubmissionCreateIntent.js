import { useCallback, useState } from "react";
import {
  clearSubmissionIntent,
  createSubmissionIntent,
  readSubmissionIntent,
  sameSubmissionInput,
  saveSubmissionIntent,
} from "../model/submissionIntent";

export function useSubmissionCreateIntent(productId) {
  const [state, setState] = useState(() => ({
    productId,
    intent: readSubmissionIntent(productId),
  }));
  const intent =
    state.productId === productId ? state.intent : readSubmissionIntent(productId);

  const prepare = useCallback(
    (body) => {
      const stored = readSubmissionIntent(productId);
      if (stored && sameSubmissionInput(stored.body, body)) {
        setState({ productId, intent: stored });
        return stored;
      }
      const next = saveSubmissionIntent(createSubmissionIntent(body));
      setState({ productId, intent: next });
      return next;
    },
    [productId],
  );

  const clear = useCallback(() => {
    clearSubmissionIntent(productId);
    setState({ productId, intent: null });
  }, [productId]);

  return { intent, prepare, clear };
}
