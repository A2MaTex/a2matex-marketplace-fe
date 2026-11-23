import { useCallback, useEffect, useState } from "react";
import { entitlementApi } from "../api/entitlementApi";
import { orderApi } from "../api/orderApi";
import {
  parseEntitlementPageEnvelope,
  parseOrderPageEnvelope,
} from "../model/commerceContract";
import {
  findCurrentProductOrder,
  isActiveProductEntitlement,
} from "../model/entitlementAccess";
import { toCommerceError } from "../model/commerceError";
import { COMMERCE_INVALIDATED_EVENT } from "../model/commerceInvalidation";

const PAGE_SIZE = 50;

export function useProductAccess({ productId, enabled }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    serverEntitlements: [],
    serverOrders: [],
    serverProductId: null,
    resolvedKey: null,
    errorKey: null,
    error: null,
  });
  const requestKey = `${enabled ? "on" : "off"}:${productId ?? "none"}:${reloadKey}`;

  useEffect(() => {
    if (!enabled || !productId) {
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    const loadEntitlements = async () => {
      let page = 1;
      let totalPages = 1;
      const entitlements = [];

      // Read every server page. A partial page cannot establish whether this
      // Product currently has access or which paid Order is the latest one.
      while (page <= totalPages) {
        const response = await entitlementApi.getMine({
          page,
          limit: PAGE_SIZE,
          signal: controller.signal,
        });
        const data = parseEntitlementPageEnvelope(response.data);
        entitlements.push(
          ...data.items.filter((entitlement) =>
            isActiveProductEntitlement(entitlement, productId),
          ),
        );

        if (page >= data.totalPages) break;
        totalPages = data.totalPages;
        page += 1;
      }

      return entitlements;
    };

    const loadOrders = async () => {
      let page = 1;
      let totalPages = 1;
      const orders = [];

      while (page <= totalPages) {
        const response = await orderApi.getMine({
          page,
          limit: PAGE_SIZE,
          signal: controller.signal,
        });
        const data = parseOrderPageEnvelope(response.data);
        orders.push(...data.items);

        if (page >= data.totalPages) break;
        totalPages = data.totalPages;
        page += 1;
      }

      return orders;
    };

    const loadAccess = async () => {
      const [entitlements, orders] = await Promise.all([
        loadEntitlements(),
        loadOrders(),
      ]);

      if (active) {
        setState((current) => ({
          ...current,
          serverEntitlements: entitlements,
          serverOrders: orders,
          serverProductId: productId,
          resolvedKey: requestKey,
          errorKey: null,
          error: null,
        }));
      }
    };

    loadAccess().catch((error) => {
      if (!active || error?.code === "ERR_CANCELED") return;
      setState((current) => ({
        ...current,
        resolvedKey: requestKey,
        errorKey: requestKey,
        error: toCommerceError(error, "Unable to verify your product access."),
      }));
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, productId, reloadKey, requestKey]);

  useEffect(() => {
    const handleInvalidation = (event) => {
      if (
        event.detail?.resources?.includes("entitlements") ||
        event.detail?.resources?.includes("orders")
      ) {
        setReloadKey((value) => value + 1);
      }
    };
    window.addEventListener(COMMERCE_INVALIDATED_EVENT, handleInvalidation);
    return () =>
      window.removeEventListener(COMMERCE_INVALIDATED_EVENT, handleInvalidation);
  }, []);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);

  const activeEntitlements =
    enabled && state.serverProductId === productId
      ? state.serverEntitlements
      : [];
  const currentOrder =
    enabled && state.serverProductId === productId
      ? findCurrentProductOrder(
          activeEntitlements,
          state.serverOrders,
          productId,
        )
      : null;

  return {
    activeEntitlements,
    currentOrder,
    loading: Boolean(enabled && productId && state.resolvedKey !== requestKey),
    error: state.errorKey === requestKey ? state.error : null,
    refetch,
  };
}
