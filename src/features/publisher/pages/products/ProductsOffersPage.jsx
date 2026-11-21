import { useEffect, useState } from "react";
import { FiBox, FiPlus, FiRefreshCw } from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { marketplaceProductApi } from "../../../marketplace/apis/product/api";
import { publisherProductApi } from "../api/product/api";
import { publisherReleaseApi } from "../api/release/api";
import { useProductRelease } from "../releases/hooks/useProductRelease";
import { parseReleaseDetailEnvelope } from "../releases/model/releaseContract";
import { toPublisherReleaseError } from "../releases/model/releaseError";
import {
  activationReadinessReason,
  buildActivationReadiness,
  isEligibleSubscriptionOffer,
} from "../releases/model/releasePermissions";
import ProductDirectory from "./ProductDirectory";
import ProductEditor from "./ProductEditor";
import ProductLifecycleDialog from "./ProductLifecycleDialog";
import { usePublisherProduct } from "./hooks/usePublisherProduct";
import { usePublisherProducts } from "./hooks/usePublisherProducts";
import { parseProductEnvelope } from "./model/productContract";
import { toPublisherProductError } from "./model/publisherProductError";
import styles from "./ProductsOffersPage.module.css";

const PAGE_SIZE = 10;
const VALID_STATUSES = new Set(["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"]);

const positivePage = (value) => {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const ProductsOffersPage = () => {
  const { productId = null } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveError, setArchiveError] = useState(null);
  const [activationBusy, setActivationBusy] = useState(false);
  const [activationError, setActivationError] = useState(null);
  const [activationNotice, setActivationNotice] = useState(null);
  const [activationProductId, setActivationProductId] = useState(null);
  const requestedStatus = searchParams.get("status");
  const status = VALID_STATUSES.has(requestedStatus) ? requestedStatus : "ALL";
  const page = positivePage(searchParams.get("page"));

  const productsState = usePublisherProducts({
    page,
    limit: PAGE_SIZE,
    status: status === "ALL" ? undefined : status,
  });
  const productState = usePublisherProduct(productId);
  const currentReleaseState = useProductRelease(
    productId,
    productState.data?.currentReleaseId ?? null,
  );
  const activationReason = currentReleaseState.error
    ? currentReleaseState.error.message
    : currentReleaseState.loading
      ? "Current release details are still loading."
      : activationReadinessReason({
          product: productState.data,
          currentRelease: currentReleaseState.data,
        });

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const mayLeave = () =>
    !dirty || window.confirm("Discard your unsaved product changes?");

  const queryWith = ({ nextPage = page, nextStatus = status } = {}) => {
    const next = new URLSearchParams();
    if (nextPage > 1) next.set("page", String(nextPage));
    if (nextStatus && nextStatus !== "ALL") next.set("status", nextStatus);
    const value = next.toString();
    return value ? `?${value}` : "";
  };

  const goToProduct = (nextProductId) => {
    if (!mayLeave()) return;
    setDirty(false);
    navigate(`/publisher/products/${nextProductId}${queryWith()}`);
  };

  const handleStatusChange = (nextStatus) => {
    if (!mayLeave()) return;
    setDirty(false);
    navigate(`/publisher/products${queryWith({ nextPage: 1, nextStatus })}`);
  };

  const handlePageChange = (nextPage) => {
    if (!mayLeave()) return;
    setDirty(false);
    navigate(`/publisher/products${queryWith({ nextPage })}`);
  };

  const handleNewProduct = () => {
    if (!mayLeave()) return;
    setDirty(false);
    const next = new URLSearchParams();
    if (status !== "ALL") next.set("returnStatus", status);
    if (page > 1) next.set("returnPage", String(page));
    const value = next.toString();
    navigate(`/publisher/products/create${value ? `?${value}` : ""}`);
  };

  const handleSaved = (refreshed) => {
    productState.replace(refreshed);
    productsState.refetch();
  };

  const handleArchive = async () => {
    if (!productState.data || archiveBusy) return;
    setArchiveBusy(true);
    setArchiveError(null);
    try {
      await publisherProductApi.changeProductLifecycle(productState.data.id, { action: "ARCHIVE" });
      const [productResult] = await Promise.allSettled([
        publisherProductApi.getProduct(productState.data.id),
        publisherReleaseApi.getReleases({ productId: productState.data.id, page: 1, limit: 10 }),
        marketplaceProductApi.get(productState.data.id),
      ]);
      if (productResult.status === "fulfilled") {
        productState.replace(parseProductEnvelope(productResult.value.data));
      } else {
        productState.refetch();
      }
      productsState.refetch();
      setArchiveOpen(false);
    } catch (error) {
      setArchiveError(toPublisherProductError(error, "Unable to archive this product."));
    } finally {
      setArchiveBusy(false);
    }
  };

  const handleActivate = async () => {
    if (!productState.data || productState.data.status !== "DRAFT" || activationBusy) return;
    setActivationProductId(productState.data.id);
    setActivationBusy(true);
    setActivationError(null);
    setActivationNotice(null);

    try {
      const productResponse = await publisherProductApi.getProduct(productState.data.id);
      const latestProduct = parseProductEnvelope(productResponse.data);
      productState.replace(latestProduct);

      let latestRelease = null;
      if (latestProduct.currentReleaseId) {
        const releaseResponse = await publisherReleaseApi.getRelease({
          productId: latestProduct.id,
          releaseId: latestProduct.currentReleaseId,
        });
        latestRelease = parseReleaseDetailEnvelope(releaseResponse.data);
      }

      const reason = activationReadinessReason({
        product: latestProduct,
        currentRelease: latestRelease,
      });
      const readiness = buildActivationReadiness({
        product: latestProduct,
        currentRelease: latestRelease,
      });
      if (reason || !readiness.activatable) {
        setActivationError({
          code: "READINESS_STALE",
          message: reason ?? "The latest server state is not ready for activation.",
        });
        currentReleaseState.refetch();
        return;
      }

      const offerCount = latestProduct.offers.filter(isEligibleSubscriptionOffer).length;
      const confirmed = window.confirm(
        `Activate ${latestProduct.name || latestProduct.slug || "this product"} on Marketplace using current release v${latestRelease.version} and ${offerCount} eligible subscription offer${offerCount === 1 ? "" : "s"}?`,
      );
      if (!confirmed) return;

      await publisherProductApi.changeProductLifecycle(latestProduct.id, {
        action: "ACTIVATE",
      });
      const [productResult] = await Promise.allSettled([
        publisherProductApi.getProduct(latestProduct.id),
        publisherReleaseApi.getReleases({
          productId: latestProduct.id,
          page: 1,
          limit: 10,
        }),
        marketplaceProductApi.get(latestProduct.id),
      ]);
      if (productResult.status === "fulfilled") {
        productState.replace(parseProductEnvelope(productResult.value.data));
      } else {
        productState.refetch();
      }
      productsState.refetch();
      currentReleaseState.refetch();
      setActivationNotice("The server activated this product on Marketplace.");
    } catch (error) {
      setActivationError(
        toPublisherReleaseError(error, "Unable to activate this product."),
      );
      productState.refetch();
      currentReleaseState.refetch();
    } finally {
      setActivationBusy(false);
    }
  };

  const listIsEmpty =
    !productsState.loading &&
    !productsState.error &&
    productsState.data.items.length === 0;
  const statusLabel = status === "ALL" ? null : status.toLowerCase();

  return (
    <div className={styles.page}>
      <ProductDirectory
        products={productsState.data.items}
        page={productsState.data.page}
        totalPages={productsState.data.totalPages}
        loading={productsState.loading}
        error={productsState.error}
        search={search}
        status={status}
        selectedProductId={productId}
        onSearchChange={setSearch}
        onStatusChange={handleStatusChange}
        onProductSelect={goToProduct}
        onPageChange={handlePageChange}
        onNewProduct={handleNewProduct}
        onRetry={productsState.refetch}
      />

      <main className={styles.workspace}>
        {productId && productState.loading ? (
          <div className={styles.workspaceState}><span className={styles.spinner} /><strong>Loading product detail...</strong></div>
        ) : null}

        {productId && productState.error ? (
          <div className={styles.workspaceState} role="alert">
            <FiBox />
            <strong>Product unavailable</strong>
            <p>{productState.error.message}</p>
            {productState.error.retryable ? <button type="button" onClick={productState.refetch}><FiRefreshCw /> Retry</button> : null}
          </div>
        ) : null}

        {productId && !productState.loading && !productState.error && productState.data?.id === productId ? (
          <ProductEditor
            key={productState.data.id}
            creating={false}
            product={productState.data}
            project={productState.data.project}
            onCreated={() => {}}
            onSaved={handleSaved}
            onArchive={() => {
              setArchiveError(null);
              setArchiveOpen(true);
            }}
            onActivate={handleActivate}
            activationBusy={activationBusy}
            activationReason={activationReason}
            activationError={activationProductId === productId ? activationError : null}
            activationNotice={activationProductId === productId ? activationNotice : null}
            onDirtyChange={setDirty}
          />
        ) : null}

        {!productId ? (
          <div className={styles.workspaceState} aria-live="polite">
            <span className={styles.emptyArtwork}><FiBox /></span>
            <span className={styles.emptyEyebrow}>{statusLabel ? `${status} catalog` : "All products"}</span>
            <strong>{listIsEmpty ? (statusLabel ? `No ${statusLabel} products yet` : "No products yet") : "Choose a product to edit"}</strong>
            <p>
              {listIsEmpty
                ? statusLabel
                  ? `Nothing is currently ${statusLabel}. Switch status or create a new draft product.`
                  : "Create your first product from an eligible active project."
                : "Select a product card above to load its latest details and media."}
            </p>
            <div className={styles.workspaceActions}>
              <button type="button" className={styles.primaryAction} onClick={handleNewProduct}><FiPlus /> Create product</button>
            </div>
          </div>
        ) : null}
      </main>

      {archiveOpen && productState.data ? (
        <ProductLifecycleDialog
          product={productState.data}
          busy={archiveBusy}
          error={archiveError}
          onClose={() => !archiveBusy && setArchiveOpen(false)}
          onArchive={handleArchive}
        />
      ) : null}
    </div>
  );
};

export default ProductsOffersPage;
