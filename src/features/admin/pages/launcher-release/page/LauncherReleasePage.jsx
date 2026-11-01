import { useState, useEffect, useRef, useCallback } from "react";
import {
  MdSearch,
  MdCloudUpload,
  MdCheckCircle,
  MdHistory,
  MdFlashOn,
  MdDownload,
  MdMoreVert,
  MdOutlineRocketLaunch,
  MdSchedule,
  MdFolderZip,
} from "react-icons/md";
import { releaseApi } from "../api/api";
import { staticApi } from "@/common/api/static/staticApi";
import ConfigureReleaseModal from "./components/ConfigureReleaseModal";
import styles from "./LauncherReleasePage.module.css";
import { CHUNK_SIZE } from "@/common/api/static/constants";
import { formatBytes, formatDate } from "../helpers";
import { uploadAllChunksWithRecovery } from "../helpers/upload";
import { StatusBadge } from "./components/StatusBadge";

const FILTER_TABS = ["All", "Active", "Staged"];

// ─── Main page ────────────────────────────────────────────
export default function LauncherReleasePage() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterTab, setFilterTab] = useState("All");
  const [search, setSearch] = useState("");
  const [activating, setActivating] = useState(false);

  // upload state
  const [uploadProgress, setUploadProgress] = useState(null); // null | 0-100
  const [uploadFile, setUploadFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedStatic, setUploadedStatic] = useState(null); // {id, originalFileName, size, contentType}
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // ── fetch list ───────────────────────────────────────────
  const fetchReleases = useCallback(async () => {
    try {
      const res = await releaseApi.getAllRelease();
      const items = res?.data?.data?.items ?? res?.data?.items ?? [];
      setReleases(items);
      return items;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReleases().then((items) => {
      const active = items.find((r) => r.isActive);
      setSelectedId(active?.id ?? items[0]?.id ?? null);
    });
  }, [fetchReleases]);

  const fetchReleaseDetail = async () => {
    if (!selectedId) return;
    if (detailCache[selectedId]) return;
    setDetailLoading(true);
    const release = await releaseApi
      .getDetailRelease(selectedId)
      .then((res) => {
        const detail = res?.data?.data ?? res?.data ?? {};
        setDetailCache((prev) => ({ ...prev, [selectedId]: detail }));
      })
      .catch(console.error)
      .finally(() => {
        setDetailLoading(false);
      });
    return release;
  };

  // ── fetch detail ─────────────────────────────────────────
  useEffect(() => {
    fetchReleaseDetail();
  }, [selectedId]);

  // ── filtered list ────────────────────────────────────────
  const filtered = releases.filter((r) => {
    if (filterTab === "Active" && !r.isActive) return false;
    if (filterTab === "Staged" && r.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.version?.toLowerCase().includes(q) &&
        !r.originalFileName?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── multipart upload ──────────────────────────────────────
  const startUpload = useCallback(
    async (file) => {
      if (!file) return;
      setUploadFile(file);
      setUploadProgress(0);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // ── 1. Tách file thành các chunk theo CHUNK_SIZE ──────
        const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
        const requestedPartNumbers = Array.from(
          { length: totalChunks },
          (_, i) => i + 1, // partNumber là 1-indexed
        );

        // ── 2. Khởi động session + lấy toàn bộ presigned URLs ─
        //      (start đã gộp luôn việc lấy uploadUrls)
        const startRes = await staticApi.startMultipartUpload({
          originalFileName: file.name,
          lastModified: file.lastModified,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          requestedPartNumbers,
        });

        const startData = startRes?.data?.data ?? startRes?.data ?? {};
        const sessionId = startData?.sessionId?.id ?? startData?.sessionId;
        const uploadUrls = startData?.uploadUrls ?? startData?.urls ?? [];

        if (!sessionId || uploadUrls.length === 0) {
          throw new Error("Invalid startMultipartUpload response");
        }

        // ── 3. Upload chunk (có retry + tự xin URL mới cho chunk fail) ─
        let uploadedChunks = 0;
        const handleChunkDone = () => {
          uploadedChunks += 1;
          const pct = Math.round((uploadedChunks / totalChunks) * 99); // dừng ở 99% cho đến complete
          setUploadProgress(pct);
        };

        const parts = await uploadAllChunksWithRecovery({
          file,
          sessionId,
          uploadUrls,
          signal: abortController.signal,
          onChunkDone: handleChunkDone,
        });

        if (abortController.signal.aborted)
          throw new DOMException("Aborted", "AbortError");

        // ── 4. Hoàn thành multipart upload ───────────────────
        const completeRes = await staticApi.completeMultipartUpload({
          sessionId,
          parts,
        });
        const staticObj = completeRes?.data?.data ?? completeRes?.data ?? {};

        setUploadProgress(100);

        // Mở modal configure sau khi upload hoàn tất
        setTimeout(() => {
          setUploadedStatic(staticObj);
          setShowConfigModal(true);
        }, 600);
      } catch (err) {
        if (err.name === "AbortError" || err.name === "CanceledError") return;
        console.error("Multipart upload error:", err);
        showToast("error", "Upload failed. Please try again.");
        setUploadProgress(null);
        setUploadFile(null);
      }
    },
    [showToast],
  );

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) startUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) startUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);

  // ── activate ─────────────────────────────────────────────
  const handleActivate = async (releaseId) => {
    if (activating) return;
    setActivating(true);
    try {
      await releaseApi.activateRelease(releaseId);
      setReleases((prev) =>
        prev.map((r) => ({ ...r, isActive: r.id === releaseId })),
      );
      setDetailCache((prev) => {
        const next = { ...prev };
        delete next[releaseId];
        return next;
      });
      setSelectedId(releaseId);
      showToast("success", "Release activated successfully.");
    } catch {
      showToast("error", "Failed to activate release.");
    } finally {
      setActivating(false);
    }
  };

  // ── after configure modal saves ──────────────────────────
  const handleReleaseCreated = (newRelease) => {
    fetchReleases();
    setSelectedId(newRelease.id);
    setShowConfigModal(false);
    setUploadProgress(null);
    setUploadFile(null);
    setUploadedStatic(null);
    showToast("success", `Release ${newRelease.version} registered.`);
  };

  const handleModalClose = () => {
    setShowConfigModal(false);
    setUploadProgress(null);
    setUploadFile(null);
    setUploadedStatic(null);
  };

  // ── selected detail ──────────────────────────────────────
  const selectedBase = releases.find((r) => r.id === selectedId);
  const selected = selectedId
    ? { ...selectedBase, ...(detailCache[selectedId] ?? {}) }
    : null;

  const isUploading = uploadProgress !== null && uploadProgress < 100;

  // ── render ───────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <h1>Client Launcher Release</h1>
      </div>

      {/* ── Upload zone ── */}
      <div className={styles.uploadSection}>
        <div className={styles.uploadSectionLabel}>
          <span
            className={`${styles.dot} ${isUploading ? styles.dotPulse : ""}`}
          />
          {isUploading ? "UPLOADING NEW VERSION" : "UPLOAD NEW VERSION"}
        </div>

        {/* Drop zone (hide when uploading) */}
        {uploadProgress === null && (
          <div
            className={`${styles.dropZone} ${isDragOver ? styles.dropZoneOver : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={styles.dropIcon}>
              <MdCloudUpload size={36} />
            </div>
            <div className={styles.dropTitle}>
              Drag &amp; drop new Client Launcher installer
            </div>
            <div className={styles.dropSub}>
              Supported formats: <code>.exe</code>, <code>.msi</code>,{" "}
              <code>.zip</code>. Max payload size: 500 MB. File will
              automatically undergo hardware tamper validation.
            </div>
            <button
              className={styles.browseBtn}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".exe,.msi,.zip"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Progress row */}
        {uploadProgress !== null && (
          <div className={styles.progressCard}>
            <div className={styles.progressCardLeft}>
              <div className={styles.progressFileIcon}>
                <MdFolderZip size={18} />
              </div>
              <div className={styles.progressFileInfo}>
                <span className={styles.progressFileName}>
                  {uploadFile?.name ?? "Uploading…"}
                </span>
                <span className={styles.progressFileMeta}>
                  {formatBytes(uploadFile?.size)} • Verified Chunk Signatures
                </span>
              </div>
            </div>
            <div className={styles.progressStatus}>
              {uploadProgress < 100 ? (
                <span className={styles.uploadingLabel}>⟳ UPLOADING…</span>
              ) : (
                <span className={styles.doneLabel}>
                  <MdCheckCircle size={14} /> DONE
                </span>
              )}
            </div>
          </div>
        )}

        {uploadProgress !== null && (
          <div className={styles.progressBarWrap}>
            <div
              className={styles.progressBar}
              style={{ width: `${uploadProgress}%` }}
            />
            <span className={styles.progressPct}>
              {uploadProgress}% Upload Completed
            </span>
          </div>
        )}
      </div>

      {/* ── Body: list + detail ── */}
      <div className={styles.body}>
        {/* ── Left: release list ── */}
        <div className={styles.listCol}>
          <div className={styles.listHeader}>
            <span className={styles.listTitle}>
              <MdHistory size={15} /> Release History
            </span>
            <div className={styles.searchBox}>
              <MdSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Filter version…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className={styles.filterTabs}>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                className={`${styles.filterTab} ${filterTab === tab ? styles.filterTabActive : ""}`}
                onClick={() => setFilterTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Release cards */}
          <div className={styles.releaseList}>
            {loading ? (
              <div className={styles.listLoading}>Loading releases…</div>
            ) : filtered.length === 0 ? (
              <div className={styles.listEmpty}>No releases found.</div>
            ) : (
              filtered.map((r) => (
                <ReleaseCard
                  key={r.id}
                  release={r}
                  isSelected={selectedId === r.id}
                  onSelect={() => setSelectedId(r.id)}
                  onActivate={() => handleActivate(r.id)}
                  activating={activating}
                />
              ))
            )}
          </div>

          {/* Pagination placeholder */}
          <div className={styles.listFooter}>
            Showing {filtered.length} of {releases.length} deployed releases
          </div>
        </div>

        {/* ── Right: detail panel ── */}
        <div className={styles.detailCol}>
          {!selected ? (
            <div className={styles.emptyDetail}>
              <MdOutlineRocketLaunch size={36} />
              <p>Select a release to view details</p>
            </div>
          ) : (
            <ReleaseDetail
              release={selected}
              loading={detailLoading}
              onActivate={() => handleActivate(selected.id)}
              activating={activating}
              showToast={showToast}
            />
          )}
        </div>
      </div>

      {/* ── Configure modal ── */}
      {showConfigModal && uploadedStatic && (
        <ConfigureReleaseModal
          staticFile={uploadedStatic}
          onClose={handleModalClose}
          onCreated={handleReleaseCreated}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`${styles.toast} ${styles[`toast${toast.type === "success" ? "Success" : "Error"}`]}`}
        >
          {toast.type === "success" && <MdCheckCircle size={14} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Release card ──────────────────────────────────────────
function ReleaseCard({
  release,
  isSelected,
  onSelect,
  onActivate,
  activating,
}) {
  return (
    <div
      className={`${styles.releaseCard} ${isSelected ? styles.releaseCardActive : ""}`}
      onClick={onSelect}
    >
      <div className={styles.releaseCardLeft}>
        <div className={styles.releaseCardIcon}>
          {release.isActive ? (
            <MdFlashOn size={16} />
          ) : (
            <MdSchedule size={16} />
          )}
        </div>
        <div className={styles.releaseCardInfo}>
          <div className={styles.releaseCardTop}>
            <span className={styles.releaseVersion}>{release.version}</span>
            <StatusBadge isActive={release.isActive} />
          </div>
          <div className={styles.releaseCardFileName}>
            {release.originalFileName}
          </div>
          <div className={styles.releaseCardMeta}>
            {formatDate(release.publishedAt || release.createdAt)} •{" "}
            {formatBytes(release.size)}
          </div>
        </div>
      </div>
      <div className={styles.releaseCardActions}>
        {isSelected && (
          <span className={styles.selectedLabel}>
            <MdCheckCircle size={12} /> Selected
          </span>
        )}
        {!release.isActive && (
          <button
            className={styles.btnActivateSmall}
            onClick={(e) => {
              e.stopPropagation();
              onActivate();
            }}
            disabled={activating}
          >
            <MdFlashOn size={12} />
            ACTIVATE
          </button>
        )}
        <button className={styles.btnMore} onClick={(e) => e.stopPropagation()}>
          <MdMoreVert size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Detail panel ──────────────────────────────────────────
function ReleaseDetail({
  release,
  loading,
  onActivate,
  activating,
  showToast,
}) {
  const staticObj = release.static ?? {};  
  const handleDownload = async () => {   
    try {
      const response = await staticApi.getFileDownloadUrl(release.staticId);
      
      const { downloadUrl } = response.data.data;
      
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
      showToast("error", "Failed to get download url. Please try again.");
    }
  };

  return (
    <div className={styles.detail}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <div className={styles.detailTitleRow}>
          <span className={styles.detailVersionLabel}>
            Release {release.version}
          </span>
          {release.isActive && (
            <span className={styles.activeBadge}>● ACTIVE</span>
          )}
        </div>
        {!release.isActive && (
          <button
            className={styles.btnActivateLarge}
            onClick={onActivate}
            disabled={activating}
          >
            <MdFlashOn size={14} />
            {activating ? "Activating…" : "ACTIVATE"}
          </button>
        )}
      </div>

      <div className={styles.detailBody}>
        {/* Timestamps */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            ENTITY UUIDS &amp; TIMESTAMPS
          </div>
          <div className={styles.detailGrid}>
            <span className={styles.detailLabel}>publishedAt</span>
            <span className={styles.detailValue}>
              {formatDate(release.publishedAt)}
            </span>
            <span className={styles.detailLabel}>createdAt</span>
            <span className={styles.detailValue}>
              {formatDate(release.createdAt)}
            </span>
            <span className={styles.detailLabel}>updatedAt</span>
            <span className={styles.detailValue}>
              {formatDate(release.updatedAt)}
            </span>
          </div>
        </div>

        {/* Static object details */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            <MdFolderZip size={13} /> STATIC OBJECT DETAILS
          </div>
          <div className={styles.detailGrid2}>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>FILENAME</span>
              <span className={styles.detailValue}>
                {staticObj.originalFileName ?? release.originalFileName ?? "—"}
              </span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>BYTE SIZE</span>
              <span className={styles.detailValue}>
                {staticObj.size != null
                  ? `${staticObj.size?.toLocaleString()} bytes (${formatBytes(staticObj.size)})`
                  : formatBytes(release.size)}
              </span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>CONTENT-TYPE</span>
              <span className={styles.detailValue}>
                {staticObj.contentType ??
                  "application/vnd.microsoft.portable-executable"}
              </span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>TARGET PLATFORM</span>
              <span className={`${styles.detailValue} ${styles.platformValue}`}>
                <MdCheckCircle size={12} className={styles.verifiedIcon} />
                x86_64 / Windows 10 &amp; 11 Hardware Enclave Verified
              </span>
            </div>
          </div>
        </div>

        {/* Release notes */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            RELEASE NOTES (MARKDOWN PREVIEW)
          </div>
          {loading ? (
            <div className={styles.skeletonBlock}>
              <div className={styles.skeletonLine} style={{ width: "55%" }} />
              <div className={styles.skeletonLine} style={{ width: "88%" }} />
              <div className={styles.skeletonLine} style={{ width: "76%" }} />
              <div className={styles.skeletonLine} style={{ width: "65%" }} />
            </div>
          ) : release.releaseNotes ? (
            <pre className={styles.releaseNotes}>{release.releaseNotes}</pre>
          ) : (
            <div className={styles.noNotes}>No release notes provided.</div>
          )}
        </div>
      </div>

      {/* Footer: download button */}
      <div className={styles.detailFooter}>
        <button onClick={handleDownload} className={styles.btnDownload}>
          <MdDownload size={15} />
          Download Installer (.exe)
          <span className={styles.downloadSize}>
            {formatBytes(staticObj.size ?? release.size)}
          </span>
        </button>
      </div>
    </div>
  );
}
