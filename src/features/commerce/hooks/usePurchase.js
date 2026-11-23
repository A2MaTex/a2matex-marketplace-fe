import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { userApi } from "@/common/api/user/userApi";
import { orderApi } from "../api/orderApi";
import {
  CommerceContractError,
  parseCreatedOrderEnvelope,
} from "../model/commerceContract";
import {
  hasActiveProductAccess,
  isConfirmedOrderForIntent,
} from "../model/entitlementAccess";
import { toCommerceError } from "../model/commerceError";
import { invalidateCommerceResources } from "../model/commerceInvalidation";
import {
  clearOrderIntent,
  createOrderIntent,
  isSameOrderIntent,
  readOrderIntent,
  saveOrderIntent,
  setOrderIntentState,
} from "../model/orderIntent";

const phaseForIntent = (intent) => {
  if (intent?.state === "UNCERTAIN") return "uncertain";
  if (intent?.state === "AWAITING_TOPUP") return "awaiting_topup";
  return intent ? "ready_retry" : "idle";
};

const initialState = (productId) => {
  const intent = readOrderIntent(productId);
  return {
    phase: phaseForIntent(intent),
    dialogOpen: false,
    topUpOpen: false,
    intent,
    offerId: intent?.productOfferId ?? null,
    candidateOfferId: null,
    result: null,
    error: null,
    profileRefreshFailed: false,
  };
};

const STALE_PRODUCT_CODES = new Set([
  "Error.ProductOfferNotFound",
  "Error.ProductNotFound",
  "Error.ProductNotPurchasable",
]);

export function usePurchase({
  productId,
  offers,
  refetchProduct,
  activeEntitlements = [],
}) {
  const [state, setState] = useState(() => initialState(productId));
  const [blockedOfferIds, setBlockedOfferIds] = useState(() => new Set());
  const [productPurchaseBlocked, setProductPurchaseBlocked] = useState(false);
  const inFlightRef = useRef(null);
  const mountedRef = useRef(true);
  const currentProductRef = useRef(productId);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (currentProductRef.current === productId) return;
    currentProductRef.current = productId;
    queueMicrotask(() => {
      if (!mountedRef.current) return;
      setState(initialState(productId));
      setBlockedOfferIds(new Set());
      setProductPurchaseBlocked(false);
    });
  }, [productId]);

  const offerMap = useMemo(
    () => new Map(offers.map((offer) => [offer.id, offer])),
    [offers],
  );

  const activeOffer = state.offerId ? offerMap.get(state.offerId) ?? null : null;
  const candidateOffer = state.candidateOfferId
    ? offerMap.get(state.candidateOfferId) ?? null
    : null;

  const openConfirmation = useCallback(
    (offer) => {
      if (hasActiveProductAccess(activeEntitlements, productId)) {
        return;
      }
      const persistedIntent = state.intent ?? readOrderIntent(productId);
      if (
        persistedIntent &&
        !isSameOrderIntent(persistedIntent, productId, offer.id)
      ) {
        setState((current) => ({
          ...current,
          phase: "intent_conflict",
          dialogOpen: true,
          intent: persistedIntent,
          offerId: persistedIntent.productOfferId,
          candidateOfferId: offer.id,
          error: null,
        }));
        return;
      }

      setState((current) => ({
        ...current,
        phase: persistedIntent ? phaseForIntent(persistedIntent) : "confirming",
        dialogOpen: true,
        intent: persistedIntent,
        offerId: offer.id,
        candidateOfferId: null,
        error: null,
        result: null,
      }));
    },
    [activeEntitlements, productId, state.intent],
  );

  const reviewPendingPurchase = useCallback(() => {
    const intent = state.intent ?? readOrderIntent(productId);
    if (!intent) return;
    setState((current) => ({
      ...current,
      phase: phaseForIntent(intent),
      dialogOpen: true,
      intent,
      offerId: intent.productOfferId,
      candidateOfferId: null,
      error: null,
    }));
  }, [productId, state.intent]);

  const completeSuccessfulPurchase = useCallback((result) => {
    clearOrderIntent(productId);
    invalidateCommerceResources(["orders", "entitlements"]);
    setState((current) => ({
      ...current,
      phase: "success",
      dialogOpen: true,
      topUpOpen: false,
      intent: null,
      candidateOfferId: null,
      result,
      error: null,
      profileRefreshFailed: false,
    }));

    userApi.getMyProfile({ forceRefresh: true }).catch(() => {
      if (!mountedRef.current) return;
      setState((current) => ({ ...current, profileRefreshFailed: true }));
    });
  }, [productId]);

  const handleFailure = useCallback(
    (requestIntent, rawError) => {
      const error = toCommerceError(rawError);
      let intent = requestIntent;
      let phase = "error";

      if (error.uncertain) {
        intent = setOrderIntentState(requestIntent, "UNCERTAIN");
        phase = "uncertain";
        invalidateCommerceResources(["orders", "entitlements"]);
      } else if (error.code === "Error.InsufficientBalance") {
        intent = setOrderIntentState(requestIntent, "AWAITING_TOPUP");
        phase = "awaiting_topup";
      } else if (
        error.status === 401 ||
        error.code === "Error.OrderCustomerProfileNotFound"
      ) {
        intent = setOrderIntentState(requestIntent, "READY");
      } else {
        clearOrderIntent(productId);
        intent = null;
      }

      if (error.code === "Error.OneTimeOfferAlreadyUsed") {
        setBlockedOfferIds((current) => {
          const next = new Set(current);
          next.add(requestIntent.productOfferId);
          return next;
        });
      }

      if (error.code === "Error.EntitlementRevoked") {
        setProductPurchaseBlocked(true);
      }

      if (error.code === "Error.EntitlementStillActive") {
        invalidateCommerceResources(["entitlements"]);
      }

      if (STALE_PRODUCT_CODES.has(error.code)) {
        refetchProduct?.();
      }

      setState((current) => ({
        ...current,
        phase,
        dialogOpen: true,
        topUpOpen: false,
        intent,
        offerId: requestIntent.productOfferId,
        error,
        result: null,
      }));
    },
    [productId, refetchProduct],
  );

  const performPurchase = useCallback(
    (intent) => {
      if (inFlightRef.current) return inFlightRef.current;

      setState((current) => ({
        ...current,
        phase: "submitting",
        dialogOpen: true,
        topUpOpen: false,
        intent,
        offerId: intent.productOfferId,
        error: null,
      }));

      const request = orderApi
        .create(
          { productOfferId: intent.productOfferId },
          { idempotencyKey: intent.idempotencyKey },
        )
        .then((response) => parseCreatedOrderEnvelope(response.data))
        .then((result) => {
          if (!isConfirmedOrderForIntent(result, intent)) {
            throw new CommerceContractError(
              "createOrder.data does not confirm the requested product and offer.",
            );
          }
          if (mountedRef.current) completeSuccessfulPurchase(result);
          return result;
        })
        .catch((error) => {
          if (mountedRef.current) handleFailure(intent, error);
          return null;
        })
        .finally(() => {
          inFlightRef.current = null;
        });

      inFlightRef.current = request;
      return request;
    },
    [completeSuccessfulPurchase, handleFailure],
  );

  const confirmPurchase = useCallback(() => {
    if (state.phase === "submitting" || inFlightRef.current) return;
    let intent = state.intent;
    if (!intent) {
      if (!state.offerId) return;
      intent = saveOrderIntent(createOrderIntent(productId, state.offerId));
    }
    performPurchase(intent);
  }, [performPurchase, productId, state.intent, state.offerId, state.phase]);

  const retryPurchase = useCallback(() => {
    const intent = state.intent ?? readOrderIntent(productId);
    if (!intent || inFlightRef.current) return;
    performPurchase(intent);
  }, [performPurchase, productId, state.intent]);

  const closeDialog = useCallback(() => {
    if (state.phase === "submitting") return;
    setState((current) => ({
      ...current,
      dialogOpen: false,
      topUpOpen: false,
      phase: current.intent ? phaseForIntent(current.intent) : "idle",
      error: current.intent ? current.error : null,
      result: null,
    }));
  }, [state.phase]);

  const openTopUp = useCallback(() => {
    setState((current) => ({ ...current, topUpOpen: true }));
  }, []);

  const closeTopUp = useCallback(() => {
    setState((current) => ({ ...current, topUpOpen: false }));
  }, []);

  const markTopUpCompleted = useCallback((newBalance) => {
    setState((current) => {
      const intent = current.intent
        ? setOrderIntentState(current.intent, "READY")
        : null;
      return {
        ...current,
        phase: intent ? "ready_retry" : current.phase,
        topUpOpen: false,
        intent,
        error: null,
        latestBalance: newBalance,
      };
    });
  }, []);

  const discardPendingPurchase = useCallback(
    ({ continueWithCandidate = false } = {}) => {
      clearOrderIntent(productId);
      setState((current) => ({
        ...current,
        phase:
          continueWithCandidate && current.candidateOfferId
            ? "confirming"
            : "idle",
        dialogOpen: Boolean(
          continueWithCandidate && current.candidateOfferId,
        ),
        intent: null,
        offerId:
          continueWithCandidate && current.candidateOfferId
            ? current.candidateOfferId
            : null,
        candidateOfferId: null,
        error: null,
        result: null,
      }));
    },
    [productId],
  );

  return {
    ...state,
    activeOffer,
    candidateOffer,
    blockedOfferIds,
    productPurchaseBlocked,
    hasUnresolvedOrderIntent: Boolean(state.intent),
    openConfirmation,
    reviewPendingPurchase,
    confirmPurchase,
    retryPurchase,
    closeDialog,
    openTopUp,
    closeTopUp,
    markTopUpCompleted,
    discardPendingPurchase,
  };
}
