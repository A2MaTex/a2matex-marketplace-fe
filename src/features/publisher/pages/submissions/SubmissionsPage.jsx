import { FiPlus, FiRefreshCw } from "react-icons/fi";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import SubmissionDetail from "./SubmissionDetail";
import SubmissionDirectory from "./SubmissionDirectory";
import { usePublisherSubmission } from "./hooks/usePublisherSubmission";
import { usePublisherSubmissions } from "./hooks/usePublisherSubmissions";
import { useSubmissionProducts } from "./hooks/useSubmissionProducts";
import { SUBMISSION_STATUSES } from "./model/submissionContract";
import styles from "./SubmissionsPage.module.css";

const PAGE_SIZE = 10;
const FILTER_STATUSES = ["ALL", ...SUBMISSION_STATUSES];
const VALID_STATUSES = new Set(SUBMISSION_STATUSES);

const positivePage = (value) => {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const SubmissionsPage = () => {
  const { submissionId = null } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const status = VALID_STATUSES.has(requestedStatus) ? requestedStatus : "ALL";
  const productId = searchParams.get("productId") || null;
  const page = positivePage(searchParams.get("page"));
  const productsState = useSubmissionProducts();
  const submissionsState = usePublisherSubmissions({
    page,
    limit: PAGE_SIZE,
    status: status === "ALL" ? undefined : status,
    productId,
  });
  const detailState = usePublisherSubmission(submissionId);

  const queryWith = ({
    nextPage = page,
    nextStatus = status,
    nextProductId = productId,
  } = {}) => {
    const next = new URLSearchParams();
    if (nextPage > 1) next.set("page", String(nextPage));
    if (nextStatus && nextStatus !== "ALL") next.set("status", nextStatus);
    if (nextProductId) next.set("productId", nextProductId);
    const value = next.toString();
    return value ? `?${value}` : "";
  };

  const navigateToList = (query) => navigate(`/publisher/submissions${query}`);

  const handleStatusChange = (nextStatus) =>
    navigateToList(queryWith({ nextPage: 1, nextStatus }));

  const handleProductChange = (nextProductId) =>
    navigateToList(
      queryWith({ nextPage: 1, nextProductId: nextProductId || null }),
    );

  const handleSelect = (nextSubmissionId) =>
    navigate(`/publisher/submissions/${nextSubmissionId}${queryWith()}`);

  const handlePageChange = (nextPage) =>
    navigateToList(queryWith({ nextPage }));

  const handleCreate = () => {
    const next = new URLSearchParams();
    if (productId) next.set("productId", productId);
    navigate(`/publisher/submissions/new${next.size ? `?${next}` : ""}`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Trust & safety</p>
          <h1>Submissions & Scans</h1>
          <span>Track immutable review snapshots without exposing administrator-only scanner evidence.</span>
        </div>
        <button type="button" className={styles.createButton} onClick={handleCreate}>
          <FiPlus /> New submission
        </button>
      </header>

      <section className={styles.toolbar} aria-label="Submission filters">
        <div className={styles.statusFilters}>
          {FILTER_STATUSES.map((value) => (
            <button
              type="button"
              key={value}
              className={status === value ? styles.filterActive : ""}
              onClick={() => handleStatusChange(value)}
              aria-pressed={status === value}
            >
              {value.replaceAll("_", " ")}
            </button>
          ))}
        </div>
        <label className={styles.productFilter}>
          <span>Product</span>
          <select
            value={productId ?? ""}
            onChange={(event) => handleProductChange(event.target.value)}
            disabled={productsState.loading}
          >
            <option value="">All products</option>
            {productsState.data.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name || product.slug || "Untitled product"}
              </option>
            ))}
          </select>
        </label>
        {productsState.error ? (
          <button type="button" className={styles.iconAction} onClick={productsState.refetch} title={productsState.error.message}>
            <FiRefreshCw /> Reload products
          </button>
        ) : null}
      </section>

      <main className={styles.workspace}>
        <SubmissionDirectory
          data={submissionsState.data}
          loading={submissionsState.loading}
          error={submissionsState.error}
          selectedId={submissionId}
          onSelect={handleSelect}
          onPageChange={handlePageChange}
          onRetry={submissionsState.refetch}
        />
        <SubmissionDetail
          data={detailState.data}
          loading={detailState.loading}
          error={detailState.error}
          onRetry={detailState.refetch}
        />
      </main>
    </div>
  );
};

export default SubmissionsPage;
