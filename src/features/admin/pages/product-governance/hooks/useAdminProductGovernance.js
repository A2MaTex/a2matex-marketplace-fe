import { useCallback, useEffect, useMemo, useState } from "react";
import { adminProductApi } from "../api/adminProductApi";
import { adminPublisherApi } from "../../publisher-moderation/api/adminPublisherApi";
import { parseAdminPublisherDetailEnvelope } from "../../publisher-moderation/model/adminPublisherContract";
import {
  parseAdminProductDetailEnvelope,
  parseAdminProductPageEnvelope,
  parseAdminProductReleaseDetailEnvelope,
  parseAdminProductReleasePageEnvelope,
  hasReleasedProductEvidence,
} from "../model/adminProductContract";
import { toAdminProductError } from "../model/adminProductError";

const emptyPage = (page, limit) => ({
  items: [],
  totalItems: 0,
  page,
  limit,
  totalPages: 0,
});

function useRequest({ enabled = true, emptyData, request, parse, fallbackMessage }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    data: emptyData,
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => setState({ data: emptyData, loading: false, error: null }));
      return undefined;
    }
    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (active) setState({ data: emptyData, loading: true, error: null });
    });
    request(controller.signal)
      .then((response) => parse(response.data))
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: emptyData,
          loading: false,
          error: toAdminProductError(error, fallbackMessage),
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [emptyData, enabled, fallbackMessage, parse, reloadKey, request]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}

export function useAdminProducts({ query }) {
  const request = useCallback(
    (signal) => adminProductApi.list({ params: query, signal }),
    [query],
  );
  const parse = useCallback((payload) => parseAdminProductPageEnvelope(payload), []);
  const emptyData = useMemo(
    () => emptyPage(query.page, query.limit),
    [query.limit, query.page],
  );
  return useRequest({
    emptyData,
    request,
    parse,
    fallbackMessage: "Unable to load Products.",
  });
}

const RELEASED_PRODUCTS_FETCH_LIMIT = 100;

async function loadAllProducts({ status, signal }) {
  const params = {
    page: 1,
    limit: RELEASED_PRODUCTS_FETCH_LIMIT,
    ...(status ? { status } : {}),
  };
  const firstResponse = await adminProductApi.list({ params, signal });
  const first = parseAdminProductPageEnvelope(firstResponse.data);
  if (first.totalPages <= 1) return first.items;
  const remaining = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, index) =>
      adminProductApi
        .list({ params: { ...params, page: index + 2 }, signal })
        .then((response) => parseAdminProductPageEnvelope(response.data)),
    ),
  );
  return [first, ...remaining].flatMap((entry) => entry.items);
}

async function loadProductReleaseEvidence(product, signal) {
  const firstResponse = await adminProductApi.listReleases(product.id, {
    params: { page: 1, limit: RELEASED_PRODUCTS_FETCH_LIMIT },
    signal,
  });
  const first = parseAdminProductReleasePageEnvelope(
    firstResponse.data,
    product.id,
  );
  const pages = [first];
  if (first.totalPages > 1) {
    const remaining = await Promise.all(
      Array.from({ length: first.totalPages - 1 }, (_, index) =>
        adminProductApi
          .listReleases(product.id, {
            params: {
              page: index + 2,
              limit: RELEASED_PRODUCTS_FETCH_LIMIT,
            },
            signal,
          })
          .then((response) =>
            parseAdminProductReleasePageEnvelope(response.data, product.id),
          ),
      ),
    );
    pages.push(...remaining);
  }
  const releases = pages.flatMap((entry) => entry.items);
  if (!hasReleasedProductEvidence(releases)) return null;
  return {
    ...product,
    releases,
    currentRelease:
      releases.find((release) => release.id === product.currentReleaseId) ?? null,
  };
}

async function loadReleasedProducts(products, signal) {
  const results = await Promise.all(
    products.map((product) => loadProductReleaseEvidence(product, signal)),
  );
  return results.filter(Boolean);
}

async function enrichReleasedProducts(products, signal) {
  const publisherIds = [...new Set(products.map((product) => product.publisherAccountId))];
  const publisherEntries = await Promise.all(
    publisherIds.map(async (publisherAccountId) => {
      try {
        const response = await adminPublisherApi.detail(publisherAccountId, { signal });
        return [
          publisherAccountId,
          parseAdminPublisherDetailEnvelope(response.data),
        ];
      } catch (error) {
        if (error?.code === "ERR_CANCELED") throw error;
        return [publisherAccountId, null];
      }
    }),
  );
  const publishers = new Map(publisherEntries);
  return products.map((product) => ({
    ...product,
    publisher: publishers.get(product.publisherAccountId),
  }));
}

export function useAdminReleasedProducts({ query }) {
  const [reloadKey, setReloadKey] = useState(0);
  const emptyData = useMemo(
    () => emptyPage(query.page, query.limit),
    [query.limit, query.page],
  );
  const [state, setState] = useState({
    data: emptyData,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (active) setState({ data: emptyData, loading: true, error: null });
    });
    loadAllProducts({ status: query.status, signal: controller.signal })
      .then((items) => loadReleasedProducts(items, controller.signal))
      .then(async (items) => {
        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / query.limit);
        const page = Math.min(query.page, Math.max(totalPages, 1));
        const start = (page - 1) * query.limit;
        const pageItems = items.slice(start, start + query.limit);
        const enrichedItems = await enrichReleasedProducts(
          pageItems,
          controller.signal,
        );
        return {
          items: enrichedItems,
          totalItems,
          page,
          limit: query.limit,
          totalPages,
        };
      })
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.code === "ERR_CANCELED") return;
        setState({
          data: emptyData,
          loading: false,
          error: toAdminProductError(
            error,
            "Unable to load released Products.",
          ),
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [emptyData, query.limit, query.page, query.status, reloadKey]);

  const refetch = useCallback(() => setReloadKey((value) => value + 1), []);
  return { ...state, refetch };
}

export function useAdminProductPublisher(
  publisherAccountId,
  { enabled = true } = {},
) {
  const request = useCallback(
    (signal) => adminPublisherApi.detail(publisherAccountId, { signal }),
    [publisherAccountId],
  );
  const parse = useCallback(
    (payload) => parseAdminPublisherDetailEnvelope(payload),
    [],
  );
  return useRequest({
    enabled: enabled && Boolean(publisherAccountId),
    emptyData: null,
    request,
    parse,
    fallbackMessage: "Unable to load the Product Publisher.",
  });
}

export function useAdminProduct(productId, { enabled = true } = {}) {
  const request = useCallback(
    (signal) => adminProductApi.detail(productId, { signal }),
    [productId],
  );
  const parse = useCallback((payload) => parseAdminProductDetailEnvelope(payload), []);
  return useRequest({
    enabled,
    emptyData: null,
    request,
    parse,
    fallbackMessage: "Unable to load this Product.",
  });
}

export function useAdminProductReleases(productId, { query, enabled = true }) {
  const request = useCallback(
    (signal) => adminProductApi.listReleases(productId, { params: query, signal }),
    [productId, query],
  );
  const parse = useCallback(
    (payload) => parseAdminProductReleasePageEnvelope(payload, productId),
    [productId],
  );
  const emptyData = useMemo(
    () => emptyPage(query.page, query.limit),
    [query.limit, query.page],
  );
  return useRequest({
    enabled,
    emptyData,
    request,
    parse,
    fallbackMessage: "Unable to load Product releases.",
  });
}

export function useAdminProductRelease(
  productId,
  releaseId,
  { enabled = true } = {},
) {
  const request = useCallback(
    (signal) => adminProductApi.releaseDetail(productId, releaseId, { signal }),
    [productId, releaseId],
  );
  const parse = useCallback(
    (payload) => parseAdminProductReleaseDetailEnvelope(payload, productId),
    [productId],
  );
  return useRequest({
    enabled: enabled && Boolean(releaseId),
    emptyData: null,
    request,
    parse,
    fallbackMessage: "Unable to load this Product release.",
  });
}

export async function loadAllProductReleases(productId, { signal } = {}) {
  const firstResponse = await adminProductApi.listReleases(productId, {
    params: { page: 1, limit: 100 },
    signal,
  });
  const first = parseAdminProductReleasePageEnvelope(firstResponse.data, productId);
  const pages = [first];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const response = await adminProductApi.listReleases(productId, {
      params: { page, limit: 100 },
      signal,
    });
    pages.push(parseAdminProductReleasePageEnvelope(response.data, productId));
  }
  return pages.flatMap((entry) => entry.items);
}
