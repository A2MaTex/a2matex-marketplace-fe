import { useCallback, useEffect, useMemo } from "react";
import { FiAlertTriangle, FiLayers, FiRefreshCw, FiShield } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import AdminSubmissionFilters from "../components/AdminSubmissionFilters";
import AdminSubmissionTable from "../components/AdminSubmissionTable";
import { useAdminSubmissions } from "../hooks/useAdminSubmissions";
import {
  buildAdminSubmissionSearchParams,
  readAdminSubmissionQuery,
  withAdminSubmissionQuery,
} from "../model/adminSubmissionQuery";
import styles from "./AdminSubmissionReview.module.css";

export default function AdminSubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const query = useMemo(
    () => readAdminSubmissionQuery(new URLSearchParams(searchKey)),
    [searchKey],
  );
  const submissions = useAdminSubmissions(query);

  const updateQuery = useCallback(
    (patch, options) => {
      const next = withAdminSubmissionQuery(query, patch);
      setSearchParams(buildAdminSubmissionSearchParams(next), options);
    },
    [query, setSearchParams],
  );

  useEffect(() => {
    if (
      !submissions.loading &&
      !submissions.error &&
      query.page > 1 &&
      query.page > submissions.data.totalPages
    ) {
      updateQuery({ page: Math.max(submissions.data.totalPages, 1) }, { replace: true });
    }
  }, [query.page, submissions.data.totalPages, submissions.error, submissions.loading, updateQuery]);

  return (
    <div className={styles.page}>
      <header className={styles.listHero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Trust &amp; safety workspace</span>
          <h1>Submission Review</h1>
          <p>Inspect immutable release evidence, recover scanner jobs, and make Publisher-safe decisions.</p>
        </div>
        <div className={styles.heroStats}>
          <div>
            <FiLayers />
            <strong>{submissions.loading ? "—" : submissions.data.totalItems.toLocaleString()}</strong>
            <span>submissions</span>
          </div>
          <button type="button" onClick={submissions.refetch} disabled={submissions.loading}>
            <FiRefreshCw className={submissions.loading ? styles.spinning : ""} />
            Refresh
          </button>
        </div>
      </header>

      <AdminSubmissionFilters
        key={query.productId}
        query={query}
        disabled={submissions.loading}
        onChange={updateQuery}
      />

      {submissions.error ? (
        <section
          className={`${styles.errorState} ${submissions.error.kind === "forbidden" ? styles.forbiddenState : ""}`}
          role="alert"
        >
          <span>{submissions.error.kind === "forbidden" ? <FiShield /> : <FiAlertTriangle />}</span>
          <div>
            <p>{submissions.error.kind === "forbidden" ? "Permission required" : "Submissions unavailable"}</p>
            <h2>{submissions.error.message}</h2>
            {submissions.error.detail ? <code>{submissions.error.detail}</code> : null}
          </div>
          {submissions.error.kind !== "forbidden" ? (
            <button type="button" onClick={submissions.refetch}><FiRefreshCw /> Try again</button>
          ) : null}
        </section>
      ) : (
        <AdminSubmissionTable
          data={submissions.data}
          loading={submissions.loading}
          filtered={Boolean(query.status || query.productId)}
          onPageChange={(page) => updateQuery({ page })}
        />
      )}
    </div>
  );
}
