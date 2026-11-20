import { useEffect, useState } from "react";
import { FiPackage, FiRefreshCw } from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { publisherProductApi } from "../api/product/api";
import { publisherReleaseApi } from "../api/release/api";
import { usePublisherProduct } from "../products/hooks/usePublisherProduct";
import { parseProductEnvelope } from "../products/model/productContract";
import { useSubmissionProducts } from "../submissions/hooks/useSubmissionProducts";
import ReleaseDetail from "./ReleaseDetail";
import ReleaseDirectory from "./ReleaseDirectory";
import ReleaseReadiness from "./ReleaseReadiness";
import { useProductRelease } from "./hooks/useProductRelease";
import { useProductReleases } from "./hooks/useProductReleases";
import { toPublisherReleaseError } from "./model/releaseError";
import styles from "./ProductReleasesPage.module.css";

const PAGE_SIZE = 10;

const positivePage = (value) => {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const ProductReleasesPage = () => {
  const { productId = null, releaseId = null } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const page = positivePage(searchParams.get("page"));
  const expectedSubmissionId = searchParams.get("submissionId") || null;
  const productsState = useSubmissionProducts();
  const productState = usePublisherProduct(productId);
  const releasesState = useProductReleases({ productId, page, limit: PAGE_SIZE });
  const releaseState = useProductRelease(productId, releaseId);
  const separateCurrentId =
    productState.data?.currentReleaseId && productState.data.currentReleaseId !== releaseId
      ? productState.data.currentReleaseId
      : null;
  const currentReleaseState = useProductRelease(productId, separateCurrentId);
  const currentRelease =
    productState.data?.currentReleaseId === releaseId
      ? releaseState.data
      : currentReleaseState.data;
  const [action, setAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);

  const queryWith = ({ nextPage = page } = {}) => {
    const next = new URLSearchParams();
    if (nextPage > 1) next.set("page", String(nextPage));
    if (expectedSubmissionId) next.set("submissionId", expectedSubmissionId);
    const value = next.toString();
    return value ? `?${value}` : "";
  };

  useEffect(() => {
    if (!productId || releaseId || releasesState.loading || !releasesState.data.items.length) return;
    const next = new URLSearchParams();
    if (page > 1) next.set("page", String(page));
    if (expectedSubmissionId) next.set("submissionId", expectedSubmissionId);
    const suffix = next.size ? `?${next}` : "";
    navigate(
      `/publisher/releases/${productId}/${releasesState.data.items[0].id}${suffix}`,
      { replace: true },
    );
  }, [expectedSubmissionId, navigate, page, productId, releaseId, releasesState.data.items, releasesState.loading]);

  const handleProductChange = (nextProductId) => {
    setActionError(null);
    setNotice(null);
    navigate(nextProductId ? `/publisher/releases/${nextProductId}` : "/publisher/releases");
  };

  const handleReleaseSelect = (nextReleaseId) =>
    navigate(`/publisher/releases/${productId}/${nextReleaseId}${queryWith()}`);

  const handlePageChange = (nextPage) =>
    navigate(`/publisher/releases/${productId}${queryWith({ nextPage })}`);

  const refetchEverything = async () => {
    releasesState.refetch();
    releaseState.refetch();
    currentReleaseState.refetch();
    if (!productId) return;
    try {
      const response = await publisherProductApi.getProduct(productId);
      productState.replace(parseProductEnvelope(response.data));
    } catch {
      productState.refetch();
    }
  };

  const handleSelectCurrent = async () => {
    if (!releaseState.data || action) return;
    const confirmed = window.confirm(
      `Set version ${releaseState.data.version} as the current release? This changes the version used for future Marketplace executions, but does not activate a draft product.`,
    );
    if (!confirmed) return;
    setAction("select");
    setActionError(null);
    setNotice(null);
    try {
      await publisherReleaseApi.selectCurrent({ productId, releaseId: releaseState.data.id });
      await refetchEverything();
      setNotice(`Version ${releaseState.data.version} is now the current release.`);
    } catch (error) {
      await refetchEverything();
      setActionError(toPublisherReleaseError(error, "Unable to select this release."));
    } finally {
      setAction(null);
    }
  };

  const handleActivate = async () => {
    if (!productState.data || action) return;
    const confirmed = window.confirm(
      `Activate ${productState.data.name || productState.data.slug || "this product"} on Marketplace using its current release and subscription offers?`,
    );
    if (!confirmed) return;
    setAction("activate");
    setActionError(null);
    setNotice(null);
    try {
      await publisherProductApi.changeProductLifecycle(productId, { action: "ACTIVATE" });
      await refetchEverything();
      setNotice("The server activated this product on Marketplace.");
    } catch (error) {
      await refetchEverything();
      setActionError(toPublisherReleaseError(error, "Unable to activate this product."));
    } finally {
      setAction(null);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Deployment</p>
          <h1>Release Versions</h1>
          <span>Inspect immutable build artifacts, choose current explicitly and verify Marketplace readiness.</span>
        </div>
        <label className={styles.productPicker}>
          <span>Product</span>
          <select value={productId ?? ""} onChange={(event) => handleProductChange(event.target.value)} disabled={productsState.loading}>
            <option value="">Choose a product</option>
            {productsState.data.map((product) => (
              <option key={product.id} value={product.id}>{product.name || product.slug || "Untitled product"} · {product.status}</option>
            ))}
          </select>
        </label>
      </header>

      {productsState.error ? (
        <div className={styles.topError} role="alert">
          <span>{productsState.error.message}</span>
          <button type="button" onClick={productsState.refetch}><FiRefreshCw /> Retry products</button>
        </div>
      ) : null}
      {productId && productState.error ? (
        <div className={styles.topError} role="alert">
          <span>{productState.error.message}</span>
          <button type="button" onClick={productState.refetch}><FiRefreshCw /> Retry product detail</button>
        </div>
      ) : null}

      {!productId ? (
        <main className={styles.emptyPage}>
          <FiPackage />
          <strong>Choose a product</strong>
          <p>Release history is scoped to one Product so current and activation state cannot be mixed across Products.</p>
        </main>
      ) : (
        <main className={styles.workspace}>
          <ReleaseDirectory
            data={releasesState.data}
            loading={releasesState.loading}
            error={releasesState.error}
            selectedId={releaseId}
            expectedSubmissionId={expectedSubmissionId}
            onSelect={handleReleaseSelect}
            onPageChange={handlePageChange}
            onRetry={releasesState.refetch}
          />
          <ReleaseDetail
            data={releaseState.data}
            product={productState.data}
            loading={releaseState.loading}
            error={releaseState.error}
            busy={action === "select"}
            notice={notice}
            actionError={actionError}
            onRetry={releaseState.refetch}
            onSelectCurrent={handleSelectCurrent}
          />
          <ReleaseReadiness
            product={productState.data}
            currentRelease={currentRelease}
            loading={
              productState.loading ||
              (separateCurrentId
                ? currentReleaseState.loading
                : Boolean(productState.data?.currentReleaseId) && releaseState.loading)
            }
            busy={action === "activate"}
            onActivate={handleActivate}
          />
        </main>
      )}
    </div>
  );
};

export default ProductReleasesPage;
