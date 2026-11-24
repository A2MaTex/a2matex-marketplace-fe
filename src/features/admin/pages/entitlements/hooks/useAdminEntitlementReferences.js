import { useCallback, useEffect, useRef, useState } from "react";
import { adminEntitlementReferenceApi } from "../api/adminEntitlementReferenceApi";
import {
  parseEntitlementCustomerReference,
  parseEntitlementProductReference,
} from "../model/adminEntitlementReference";

const SUCCESS_TTL_MS = 5 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 1000;
const customerCache = new Map();
const productCache = new Map();

const uniqueIds = (records, field) =>
  [...new Set(records.map((record) => record?.[field]).filter(Boolean))].sort();

const cached = (cache, id) => {
  const entry = cache.get(id);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(id);
    return null;
  }
  return entry.value;
};

const cacheReference = (cache, id, value, ttl) => {
  cache.set(id, { value, expiresAt: Date.now() + ttl });
  return value;
};

const loadingReference = (id) => ({
  id,
  name: null,
  secondary: null,
  status: "loading",
});

const unavailableReference = (id) => ({
  id,
  name: null,
  secondary: null,
  status: "unavailable",
});

const initialMap = (ids, cache) =>
  Object.fromEntries(
    ids.map((id) => [id, cached(cache, id) ?? loadingReference(id)]),
  );

const loadReference = async ({ id, cache, request, parse, signal }) => {
  try {
    const response = await request(id, { signal });
    return cacheReference(cache, id, parse(response.data), SUCCESS_TTL_MS);
  } catch (error) {
    if (error?.code === "ERR_CANCELED" || signal.aborted) throw error;
    return cacheReference(
      cache,
      id,
      unavailableReference(id),
      FAILURE_TTL_MS,
    );
  }
};

export function useAdminEntitlementReferences(records = []) {
  const customerKey = uniqueIds(records, "customerId").join("|");
  const productKey = uniqueIds(records, "productId").join("|");
  const [reloadKey, setReloadKey] = useState(0);
  const previousReloadKey = useRef(0);
  const [state, setState] = useState({ customers: {}, products: {} });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const customerIds = customerKey ? customerKey.split("|") : [];
    const productIds = productKey ? productKey.split("|") : [];
    const force = previousReloadKey.current !== reloadKey;
    previousReloadKey.current = reloadKey;

    if (force) {
      customerIds.forEach((id) => customerCache.delete(id));
      productIds.forEach((id) => productCache.delete(id));
    }

    const customers = initialMap(customerIds, customerCache);
    const products = initialMap(productIds, productCache);
    queueMicrotask(() => {
      if (active) setState({ customers, products });
    });

    const customerRequests = customerIds
      .filter((id) => customers[id].status === "loading")
      .map(async (id) => [
        id,
        await loadReference({
          id,
          cache: customerCache,
          request: adminEntitlementReferenceApi.customer,
          parse: parseEntitlementCustomerReference,
          signal: controller.signal,
        }),
      ]);
    const productRequests = productIds
      .filter((id) => products[id].status === "loading")
      .map(async (id) => [
        id,
        await loadReference({
          id,
          cache: productCache,
          request: adminEntitlementReferenceApi.product,
          parse: parseEntitlementProductReference,
          signal: controller.signal,
        }),
      ]);

    Promise.all([
      Promise.all(customerRequests),
      Promise.all(productRequests),
    ])
      .then(([loadedCustomers, loadedProducts]) => {
        if (!active) return;
        setState({
          customers: { ...customers, ...Object.fromEntries(loadedCustomers) },
          products: { ...products, ...Object.fromEntries(loadedProducts) },
        });
      })
      .catch((error) => {
        if (active && error?.code !== "ERR_CANCELED") {
          setState({ customers, products });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [customerKey, productKey, reloadKey]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}
