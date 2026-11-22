import { useCallback, useEffect, useState } from "react";
import { orderApi } from "../api/orderApi";
import {
  isCommerceUuid,
  parseOrderDetailEnvelope,
} from "../model/commerceContract";
import { toCommerceError } from "../model/commerceError";
import { COMMERCE_INVALIDATED_EVENT } from "../model/commerceInvalidation";

export function useOrderDetail(orderId) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => ({
    data: null,
    loading: isCommerceUuid(orderId),
    error: isCommerceUuid(orderId)
      ? null
      : {
          code: "Error.OrderNotFound",
          status: 404,
          message: "This order is unavailable or does not belong to your account.",
        },
  }));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!isCommerceUuid(orderId)) {
      queueMicrotask(() => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: {
              code: "Error.OrderNotFound",
              status: 404,
              message:
                "This order is unavailable or does not belong to your account.",
            },
          });
        }
      });
      return () => {
        active = false;
      };
    }

    queueMicrotask(() => {
      if (active) setState({ data: null, loading: true, error: null });
    });
    orderApi
      .getById(orderId, { signal: controller.signal })
      .then((response) => parseOrderDetailEnvelope(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: null,
          loading: false,
          error: toCommerceError(
            error,
            "This order is unavailable or does not belong to your account.",
          ),
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [orderId, reloadKey]);

  useEffect(() => {
    const handleInvalidation = (event) => {
      if (event.detail?.resources?.includes("orders")) {
        setReloadKey((value) => value + 1);
      }
    };
    window.addEventListener(COMMERCE_INVALIDATED_EVENT, handleInvalidation);
    return () =>
      window.removeEventListener(COMMERCE_INVALIDATED_EVENT, handleInvalidation);
  }, []);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
