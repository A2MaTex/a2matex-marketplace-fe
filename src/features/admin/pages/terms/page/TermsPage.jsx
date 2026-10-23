import { useState, useEffect, useMemo } from "react";
import {
  MdSearch,
  MdAdd,
  MdCheckCircle,
  MdAccessTime,
  MdHistory,
  MdOutlineArticle,
  MdCalendarToday,
  MdPublish,
  MdGavel,
} from "react-icons/md";
import { BsTagFill } from "react-icons/bs";
import { HiOutlineDocumentText } from "react-icons/hi";
import { termApi } from "@/features/term/termApi";
import TERM_TYPE from "@/constants/term";
import TERM_STATUS from "@/constants/termStatus";
import styles from "./TermsPage.module.css";
import CreateTermModal from "../components/CreateTermModal";

// ─── Helpers ──────────────────────────────────────────────
const TYPE_TABS = [
  { key: TERM_TYPE.PUBLISHER_TERMS, label: "Publisher" },
  { key: TERM_TYPE.CUSTOMER_TERMS, label: "Customer" },
  { key: TERM_TYPE.PRIVACY_POLICY, label: "Privacy" },
];

const STATUS_OPTS = ["All Status", TERM_STATUS.ACTIVE, TERM_STATUS.DRAFT, TERM_STATUS.ARCHIVED];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";
}

function truncateId(id) {
  if (!id) return "—";
  return id.slice(0, 8) + "…" + id.slice(-4);
}

function StatusBadge({ status }) {
  if (status === TERM_STATUS.ACTIVE)
    return <span className={styles.badgeActive}><MdCheckCircle size={11} /> ACTIVE</span>;
  if (status === TERM_STATUS.DRAFT)
    return <span className={styles.badgeDraft}><MdAccessTime size={11} /> DRAFT</span>;
  return <span className={styles.badgeArchived}><MdHistory size={11} /> ARCHIVED</span>;
}

// ─── Main ─────────────────────────────────────────────────
export default function TermsPage() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  // cache: termId -> full detail object (includes content)
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeType, setActiveType] = useState(TERM_TYPE.PUBLISHER_TERMS);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [activating, setActivating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Fetch list ───────────────────────────────────────────
  const fetchTerms = async () => {
    try {
      const res = await termApi.getAllTerms();
      const items = res?.data?.data?.items ?? res?.data?.items ?? [];
      setTerms(items);
      return items;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms().then((items) => {
      // default select first item of active tab
      const first = items.find((t) => t.type === TERM_TYPE.PUBLISHER_TERMS);
      if (first) setSelectedId(first.id);
    });
  }, []);

  // ── Fetch detail when selection changes ──────────────────
  useEffect(() => {
    if (!selectedId) return;
    // already cached — no refetch needed
    if (detailCache[selectedId]) return;

    let cancelled = false;
    setDetailLoading(true);
    termApi
      .getTerm(selectedId)
      .then((res) => {
        if (cancelled) return;
        const detail = res?.data?.data ?? res?.data ?? {};
        setDetailCache((prev) => ({ ...prev, [selectedId]: detail }));
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // ── Filtered list ────────────────────────────────────────
  const filtered = useMemo(() => {
    return terms.filter((t) => {
      if (t.type !== activeType) return false;
      if (statusFilter !== "All Status" && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.title?.toLowerCase().includes(q) &&
          !t.version?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [terms, activeType, statusFilter, search]);

  // Auto-select first when tab changes
  useEffect(() => {
    const first = filtered[0];
    setSelectedId(first?.id ?? null);
  }, [activeType]);

  // Merge list item with cached detail (detail has content, list doesn't)
  const selectedBase = terms.find((t) => t.id === selectedId);
  const selected = selectedId
    ? { ...selectedBase, ...(detailCache[selectedId] ?? {}) }
    : null;

  // ── Activate ─────────────────────────────────────────────
  const handleActivate = async () => {
    if (!selected || activating) return;
    setActivating(true);
    try {
      await termApi.changeTermStatus(selected.id, TERM_STATUS.ACTIVE);
      // update list statuses
      setTerms((prev) =>
        prev.map((t) =>
          t.type === selected.type
            ? t.id === selected.id
              ? { ...t, status: TERM_STATUS.ACTIVE, publishedAt: new Date().toISOString() }
              : t.status === TERM_STATUS.ACTIVE
              ? { ...t, status: TERM_STATUS.ARCHIVED }
              : t
            : t,
        ),
      );
      // invalidate cache so detail re-fetches fresh data
      setDetailCache((prev) => {
        const next = { ...prev };
        delete next[selected.id];
        return next;
      });
      showToastMsg("success", `"${selected.title}" is now active.`);
    } catch (err) {
      showToastMsg("error", "Failed to activate term.");
    } finally {
      setActivating(false);
    }
  };

  // ── Create ───────────────────────────────────────────────
  const handleCreated = (newTerm) => {
    setTerms((prev) => [newTerm, ...prev]);
    // pre-populate cache since we already have full data from the create response
    setDetailCache((prev) => ({ ...prev, [newTerm.id]: newTerm }));
    setSelectedId(newTerm.id);
    setActiveType(newTerm.type);
    showToastMsg("success", `"${newTerm.title}" saved as draft.`);
  };

  const showToastMsg = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Render ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <MdOutlineArticle size={28} />
          <p>Loading terms…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1>Terms &amp; Policy Management</h1>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowCreateModal(true)}>
          <MdAdd size={15} />
          Draft New Version
        </button>
      </div>

      {/* ── Body: two columns ── */}
      <div className={styles.body}>
        {/* ── Left: list ── */}
        <div className={styles.listCol}>
          {/* Type tabs */}
          <div className={styles.typeTabs}>
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.typeTab} ${activeType === tab.key ? styles.typeTabActive : ""}`}
                onClick={() => setActiveType(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + status filter */}
          <div className={styles.listToolbar}>
            <div className={styles.searchBox}>
              <MdSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search version, title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className={styles.statusSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Term cards */}
          <div className={styles.termList}>
            {filtered.length === 0 ? (
              <div className={styles.emptyList}>No terms found.</div>
            ) : (
              filtered.map((t) => (
                <div
                  key={t.id}
                  className={`${styles.termCard} ${selectedId === t.id ? styles.termCardActive : ""}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className={styles.termCardTop}>
                    <span className={styles.termCardType}>{t.type}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className={styles.termCardTitle}>{t.title}</div>
                  <div className={styles.termCardMeta}>
                    <span className={styles.versionTag}>
                      <BsTagFill size={9} />
                      {t.version}
                    </span>
                    <span className={styles.termCardId}>ID: {truncateId(t.id)}</span>
                  </div>
                  <div className={styles.termCardFooter}>
                    <MdAccessTime size={11} />
                    {t.status === TERM_STATUS.ACTIVE
                      ? `Published: ${formatDate(t.publishedAt)}`
                      : `Updated: ${formatDate(t.updatedAt)}`}
                    {t.status === TERM_STATUS.DRAFT && (
                      <span className={styles.readyLabel}>Ready for activation</span>
                    )}
                    {t.status === TERM_STATUS.ACTIVE && (
                      <span className={styles.activeNode}>Active Node</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right: detail ── */}
        <div className={styles.detailCol}>
          {!selectedBase ? (
            <div className={styles.emptyDetail}>
              <HiOutlineDocumentText size={40} />
              <p>Select a term to view details</p>
            </div>
          ) : (
            <TermDetail
              term={selected}
              detailLoading={detailLoading}
              onActivate={handleActivate}
              activating={activating}
            />
          )}
        </div>
      </div>

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <CreateTermModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.type === "success" ? <MdCheckCircle size={15} /> : null}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────
function TermDetail({ term, detailLoading, onActivate, activating }) {
  const isActive = term.status === TERM_STATUS.ACTIVE;

  return (
    <div className={styles.detail}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderLeft}>
          <span className={styles.detailTypeBadge}>{term.type}</span>
        </div>
        {isActive ? (
          <span className={styles.currentlyActive}>
            <MdCheckCircle size={14} /> CURRENTLY ACTIVE
          </span>
        ) : (
          <button
            className={styles.btnActivate}
            onClick={onActivate}
            disabled={activating}
          >
            <MdPublish size={14} />
            {activating ? "Activating…" : "ACTIVATE"}
          </button>
        )}
      </div>

      {/* Title + version */}
      <div className={styles.detailTitleRow}>
        <h2 className={styles.detailTitle}>{term.title}</h2>
        <span className={styles.detailVersion}>{term.version}</span>
      </div>

      {/* Timestamps */}
      <div className={styles.detailMeta}>
        <div className={styles.detailMetaItem}>
          <span className={styles.detailMetaLabel}>
            <MdCalendarToday size={11} /> CREATED TIMESTAMP
          </span>
          <span className={styles.detailMetaValue}>{formatDate(term.createdAt)}</span>
        </div>
        <div className={styles.detailMetaItem}>
          <span className={styles.detailMetaLabel}>
            <MdPublish size={11} /> PUBLISHED TIMESTAMP
          </span>
          <span
            className={`${styles.detailMetaValue} ${term.publishedAt ? styles.highlight : ""}`}
          >
            {formatDate(term.publishedAt)}
          </span>
        </div>
        <div className={styles.detailMetaItem}>
          <span className={styles.detailMetaLabel}>
            <MdGavel size={11} /> LAST ENFORCED AUDIT
          </span>
          <span
            className={`${styles.detailMetaValue} ${term.publishedAt ? styles.highlight : ""}`}
          >
            {formatDate(term.publishedAt)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={styles.detailContent}>
        {detailLoading ? (
          <div className={styles.contentLoading}>
            <div className={styles.skeletonLine} style={{ width: "60%" }} />
            <div className={styles.skeletonLine} style={{ width: "90%" }} />
            <div className={styles.skeletonLine} style={{ width: "80%" }} />
            <div className={styles.skeletonLine} style={{ width: "70%", marginTop: 16 }} />
            <div className={styles.skeletonLine} style={{ width: "95%" }} />
            <div className={styles.skeletonLine} style={{ width: "85%" }} />
          </div>
        ) : term.content ? (
          <div
            className={styles.richContent}
            dangerouslySetInnerHTML={{ __html: term.content }}
          />
        ) : (
          <div className={styles.noContent}>No content available.</div>
        )}
      </div>
    </div>
  );
}
