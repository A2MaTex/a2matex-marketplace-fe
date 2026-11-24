import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiBox,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEdit3,
  FiFile,
  FiPower,
  FiRefreshCw,
  FiSearch,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { staticApi } from "@/common/api/static/staticApi";
import { CHUNK_SIZE, MAX_PARTS_PER_BATCH } from "@/constants/static";
import { uploadAllChunksWithRecovery } from "../../launcher-release/helpers/upload";
import { formatBytes, formatDate } from "../../launcher-release/helpers";
import {
  buildCreateReleaseBody,
  buildUpdateReleaseBody,
  getReleaseError,
  parseCreatedRelease,
  parseReleaseDetail,
  parseReleaseList,
  responseData,
} from "../model/releaseContract";
import styles from "./DistributionReleasePage.module.css";

const PAGE_SIZE = 10;

const pageFromParams = (params) => {
  const page = Number(params.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export default function DistributionReleasePage({ config }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = pageFromParams(searchParams);
  const [list, setList] = useState({
    items: [],
    totalItems: 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [editor, setEditor] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [mutatingId, setMutatingId] = useState(null);
  const [uploadState, setUploadState] = useState({ status: "idle" });
  const fileInputRef = useRef(null);
  const uploadAbortRef = useRef(null);
  const toastTimerRef = useRef(null);
  const pendingSelectionRef = useRef(null);

  const showToast = useCallback((type, message) => {
    window.clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(toastTimerRef.current);
    uploadAbortRef.current?.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setListError(null);
      }
    });

    config.api
      .getAllRelease({ page, pageSize: PAGE_SIZE }, { signal: controller.signal })
      .then((response) => {
        const next = parseReleaseList(response);
        setList(next);
        const pendingId = pendingSelectionRef.current;
        if (pendingId) {
          setSelectedId(pendingId);
          pendingSelectionRef.current = null;
          return;
        }
        setSelectedId((current) => {
          if (current && next.items.some((release) => release.id === current)) return current;
          return next.items.find((release) => release.isActive)?.id ?? next.items[0]?.id ?? null;
        });
      })
      .catch((error) => {
        if (error?.code === "ERR_CANCELED") return;
        setListError(getReleaseError(error, config.kindLabel));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [config, page, refreshKey]);

  useEffect(() => {
    if (!selectedId) {
      queueMicrotask(() => {
        setSelected(null);
        setDetailError(null);
      });
      return undefined;
    }

    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setDetailLoading(true);
        setDetailError(null);
      }
    });
    config.api
      .getDetailRelease(selectedId, { signal: controller.signal })
      .then((response) => setSelected(parseReleaseDetail(response)))
      .catch((error) => {
        if (error?.code === "ERR_CANCELED") return;
        setSelected(null);
        setDetailError(getReleaseError(error, config.kindLabel));
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });

    return () => controller.abort();
  }, [config, detailRefreshKey, selectedId]);

  useEffect(() => {
    if (!loading && !listError && page > 1 && list.totalPages > 0 && page > list.totalPages) {
      setSearchParams({ page: String(list.totalPages) }, { replace: true });
    }
  }, [list.totalPages, listError, loading, page, setSearchParams]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return list.items.filter((release) => {
      if (statusFilter === "ACTIVE" && !release.isActive) return false;
      if (statusFilter === "INACTIVE" && release.isActive) return false;
      return !query || release.version.toLowerCase().includes(query) ||
        release.originalFileName.toLowerCase().includes(query);
    });
  }, [list.items, search, statusFilter]);

  const refreshAuthoritativeState = useCallback((releaseId) => {
    if (releaseId) setSelectedId(releaseId);
    setRefreshKey((value) => value + 1);
    setDetailRefreshKey((value) => value + 1);
  }, []);

  const runLifecycleAction = async () => {
    if (!confirmAction || mutatingId) return;
    const { type, release } = confirmAction;
    setMutatingId(release.id);
    setConfirmAction(null);
    try {
      if (type === "activate") await config.api.activateRelease(release.id);
      else await config.api.deactivateRelease(release.id);
      showToast("success", `${config.productName} ${release.version} ${type === "activate" ? "activated" : "deactivated"}.`);
    } catch (error) {
      const normalized = getReleaseError(error, config.kindLabel);
      showToast("error", normalized.message);
    } finally {
      refreshAuthoritativeState(release.id);
      setMutatingId(null);
    }
  };

  const cancelUpload = useCallback(() => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    setUploadState({ status: "idle" });
  }, []);

  const startUpload = useCallback(async (file) => {
    if (!file || uploadState.status !== "idle") return;
    const validation = config.validateArtifact(file);
    if (validation) {
      showToast("error", validation);
      return;
    }

    const controller = new AbortController();
    uploadAbortRef.current = controller;
    setUploadState({ status: "uploading", file, progress: 0 });

    try {
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
      const firstPartNumbers = Array.from(
        { length: Math.min(totalChunks, MAX_PARTS_PER_BATCH) },
        (_, index) => index + 1,
      );
      const startResponse = await staticApi.startMultipartUpload(
        {
          originalFileName: file.name,
          lastModified: file.lastModified,
          contentType: config.artifactContentType,
          size: file.size,
          prefix: config.uploadPrefix,
          requestedPartNumbers: firstPartNumbers,
        },
        { signal: controller.signal },
      );
      const startData = responseData(startResponse) ?? {};

      if (startData.staticId && !startData.sessionId) {
        const uploaded = {
          staticId: startData.staticId,
          originalFileName: startData.originalFileName ?? file.name,
          size: startData.size ?? file.size,
        };
        setUploadState({ status: "uploaded", file, progress: 100, uploaded });
        setEditor({ mode: "create", staticFile: uploaded });
        return;
      }

      const sessionId = startData.sessionId?.id ?? startData.sessionId;
      let uploadUrls = startData.uploadUrls ?? startData.urls ?? [];
      if (!sessionId || uploadUrls.length === 0) throw new Error("Invalid multipart start response");

      let completedChunks = 0;
      const parts = [];
      let nextPartNumber = firstPartNumbers.length + 1;
      while (uploadUrls.length > 0) {
        const batch = await uploadAllChunksWithRecovery({
          file,
          sessionId,
          uploadUrls,
          signal: controller.signal,
          onChunkDone: () => {
            completedChunks += 1;
            setUploadState({
              status: "uploading",
              file,
              progress: Math.min(99, Math.round((completedChunks / totalChunks) * 99)),
            });
          },
        });
        parts.push(...batch);
        if (nextPartNumber > totalChunks) break;
        const requestedPartNumbers = Array.from(
          { length: Math.min(MAX_PARTS_PER_BATCH, totalChunks - nextPartNumber + 1) },
          (_, index) => nextPartNumber + index,
        );
        const urlsResponse = await staticApi.getUrlsForRetry(
          { sessionId, partNumbers: requestedPartNumbers },
          { signal: controller.signal },
        );
        uploadUrls = responseData(urlsResponse)?.uploadUrls ?? [];
        if (!uploadUrls.length) throw new Error("Unable to obtain multipart URLs");
        nextPartNumber += requestedPartNumbers.length;
      }

      parts.sort((left, right) => left.partNumber - right.partNumber);
      const completeResponse = await staticApi.completeMultipartUpload(
        { sessionId, parts },
        { signal: controller.signal },
      );
      const uploaded = responseData(completeResponse);
      if (!uploaded?.staticId) throw new Error("Invalid multipart completion response");
      setUploadState({ status: "uploaded", file, progress: 100, uploaded });
      setEditor({ mode: "create", staticFile: uploaded });
    } catch (error) {
      if (error?.name === "AbortError" || error?.code === "ERR_CANCELED") return;
      showToast("error", getReleaseError(error, config.kindLabel).message);
      setUploadState({ status: "idle" });
    } finally {
      uploadAbortRef.current = null;
    }
  }, [config, showToast, uploadState.status]);

  const saveEditor = async (values) => {
    if (editor.mode === "create") {
      const response = await config.api.createRelease(
        buildCreateReleaseBody({ ...values, staticId: editor.staticFile.staticId }),
      );
      const created = parseCreatedRelease(response);
      pendingSelectionRef.current = created.id;
      setEditor(null);
      setUploadState({ status: "idle" });
      if (page !== 1) setSearchParams({ page: "1" });
      else refreshAuthoritativeState(created.id);
      showToast("success", `${config.productName} release registered.`);
      return;
    }

    const release = editor.release;
    const body = buildUpdateReleaseBody({
      ...values,
      initialVersion: release.version,
      initialReleaseNotes: release.releaseNotes,
      canEditVersion: config.canEditVersion(release),
    });
    if (!Object.keys(body).length) {
      setEditor(null);
      return;
    }
    await config.api.updateRelease(release.id, body);
    setEditor(null);
    refreshAuthoritativeState(release.id);
    showToast("success", `${config.productName} release updated.`);
  };

  const changePage = (nextPage) => {
    setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {});
  };

  const firstResult = list.totalItems ? (list.page - 1) * list.pageSize + 1 : 0;
  const lastResult = Math.min(list.page * list.pageSize, list.totalItems);
  const isUploading = uploadState.status === "uploading";

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Distribution</span>
          <h1>{config.productName} Releases</h1>
          <p>{config.description}</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.totalBadge}><FiBox />{loading ? "Loading" : `${list.totalItems} releases`}</span>
          <button className={styles.secondaryButton} type="button" onClick={() => setRefreshKey((v) => v + 1)} disabled={loading}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </header>

      {config.uploadEnabled ? (
        <section className={styles.uploadSection}>
          <div className={styles.sectionHeading}>
            <div><FiUploadCloud /><span>Register new release</span></div>
            <span>{config.artifactHint}</span>
          </div>
          {uploadState.status === "idle" ? (
            <button
              type="button"
              className={styles.dropZone}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                startUpload(event.dataTransfer.files?.[0]);
              }}
            >
              <span className={styles.uploadIcon}><FiUploadCloud /></span>
              <strong>Drop the {config.productName} artifact here</strong>
              <small>{config.artifactHint}. The release is registered only after upload completes.</small>
              <span className={styles.browsePill}>Choose file</span>
            </button>
          ) : (
            <div className={styles.uploadProgress} aria-live="polite">
              <span className={styles.fileIcon}><FiFile /></span>
              <div className={styles.uploadFileInfo}>
                <strong>{uploadState.file?.name}</strong>
                <span>{formatBytes(uploadState.file?.size)} · {isUploading ? "Uploading" : "Upload complete"}</span>
                <div className={styles.progressTrack}><span style={{ width: `${uploadState.progress}%` }} /></div>
              </div>
              <b>{uploadState.progress}%</b>
              {isUploading ? (
                <button type="button" className={styles.iconButton} onClick={cancelUpload} aria-label="Cancel upload"><FiX /></button>
              ) : (
                <div className={styles.uploadActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setEditor({ mode: "create", staticFile: uploadState.uploaded })}>Register release</button>
                  <button type="button" className={styles.iconButton} onClick={cancelUpload} aria-label="Start over"><FiX /></button>
                </div>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            className={styles.hiddenInput}
            type="file"
            accept={config.accept}
            onChange={(event) => {
              startUpload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </section>
      ) : (
        <div className={styles.dependencyNotice} role="status">
          <FiAlertTriangle />
          <div><strong>Artifact registration is waiting on backend support</strong><span>{config.uploadBlockedReason}</span></div>
        </div>
      )}

      <section className={styles.workspace}>
        <div className={styles.directory}>
          <div className={styles.directoryHeader}>
            <div><span className={styles.eyebrow}>Release history</span><h2>Deployed artifacts</h2></div>
            {!loading && !listError ? <span>{firstResult}–{lastResult} of {list.totalItems}</span> : null}
          </div>
          <div className={styles.filters}>
            <label className={styles.searchField}>
              <FiSearch />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter this page" />
            </label>
            <div className={styles.statusTabs}>
              {["ALL", "ACTIVE", "INACTIVE"].map((status) => (
                <button key={status} type="button" className={statusFilter === status ? styles.activeTab : ""} onClick={() => setStatusFilter(status)}>{status === "INACTIVE" ? "Staged" : status[0] + status.slice(1).toLowerCase()}</button>
              ))}
            </div>
          </div>

          <div className={styles.releaseList} aria-live="polite">
            {loading ? Array.from({ length: 5 }, (_, index) => <div className={styles.skeletonRow} key={index} />) :
              listError ? <StatePanel error={listError} onRetry={() => setRefreshKey((v) => v + 1)} /> :
              filteredItems.length === 0 ? <StatePanel message="No releases match this page filter." /> :
              filteredItems.map((release) => (
                <button
                  type="button"
                  key={release.id}
                  className={`${styles.releaseRow} ${selectedId === release.id ? styles.selectedRow : ""}`}
                  onClick={() => setSelectedId(release.id)}
                >
                  <span className={styles.releaseGlyph}><FiBox /></span>
                  <span className={styles.releaseIdentity}>
                    <span><strong>{release.version}</strong><StatusBadge active={release.isActive} /></span>
                    <small>{release.originalFileName}</small>
                    <small>{formatBytes(release.size)} · {formatDate(release.publishedAt || release.createdAt)}</small>
                  </span>
                  <FiChevronRight className={styles.rowChevron} />
                </button>
              ))}
          </div>
          <div className={styles.pagination}>
            <span>Page {list.page} of {Math.max(list.totalPages, 1)}</span>
            <div>
              <button type="button" onClick={() => changePage(page - 1)} disabled={page <= 1 || loading} aria-label="Previous page"><FiChevronLeft /></button>
              <button type="button" onClick={() => changePage(page + 1)} disabled={loading || page >= list.totalPages} aria-label="Next page"><FiChevronRight /></button>
            </div>
          </div>
        </div>

        <div className={styles.detailPane}>
          {!selectedId ? <StatePanel message="Select a release to inspect its artifact and lifecycle." /> :
            detailLoading ? <div className={styles.detailLoading}>{Array.from({ length: 5 }, (_, index) => <div className={styles.skeletonLine} key={index} />)}</div> :
            detailError ? <StatePanel error={detailError} onRetry={() => setDetailRefreshKey((v) => v + 1)} /> :
            selected ? (
              <ReleaseDetail
                release={selected}
                config={config}
                mutating={mutatingId === selected.id}
                onEdit={() => setEditor({ mode: "edit", release: selected })}
                onActivate={() => setConfirmAction({ type: "activate", release: selected })}
                onDeactivate={() => setConfirmAction({ type: "deactivate", release: selected })}
                onToast={showToast}
              />
            ) : null}
        </div>
      </section>

      {editor ? <ReleaseEditorDialog editor={editor} config={config} onClose={() => setEditor(null)} onSave={saveEditor} /> : null}
      {confirmAction ? <ConfirmDialog action={confirmAction} productName={config.productName} onCancel={() => setConfirmAction(null)} onConfirm={runLifecycleAction} /> : null}
      {toast ? <div className={`${styles.toast} ${toast.type === "error" ? styles.errorToast : ""}`} role="status">{toast.message}</div> : null}
    </div>
  );
}

function StatusBadge({ active }) {
  return <span className={`${styles.statusBadge} ${active ? styles.statusActive : styles.statusStaged}`}><i />{active ? "Active" : "Staged"}</span>;
}

function StatePanel({ error, message, onRetry }) {
  return (
    <div className={styles.statePanel} role={error ? "alert" : undefined}>
      <span className={styles.stateIcon}>{error ? "!" : <FiBox />}</span>
      <h3>{error?.status === 403 ? "Administrator permission required" : error ? "Unable to load releases" : "Nothing to show"}</h3>
      <p>{error?.message ?? message}</p>
      {onRetry && error?.retryable ? <button type="button" className={styles.secondaryButton} onClick={onRetry}>Try again</button> : null}
    </div>
  );
}

function ReleaseDetail({ release, config, mutating, onEdit, onActivate, onDeactivate, onToast }) {
  const handleDownload = async () => {
    try {
      const response = await staticApi.getFileDownloadUrl(release.staticId);
      const downloadUrl = responseData(response)?.downloadUrl;
      if (!downloadUrl) throw new Error("Missing download URL");
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = release.static.originalFileName;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      onToast("error", getReleaseError(error, config.kindLabel).message);
    }
  };

  return (
    <article className={styles.detail}>
      <header className={styles.detailHeader}>
        <div><span className={styles.eyebrow}>Selected release</span><h2>{release.version}</h2><StatusBadge active={release.isActive} /></div>
        <div className={styles.detailActions}>
          <button type="button" className={styles.secondaryButton} onClick={onEdit}><FiEdit3 /> Edit</button>
          {!release.isActive ? <button type="button" className={styles.primaryButton} onClick={onActivate} disabled={mutating}><FiPower /> Activate</button> : null}
          {release.isActive && config.supportsDeactivate ? <button type="button" className={styles.dangerButton} onClick={onDeactivate} disabled={mutating}><FiPower /> Deactivate</button> : null}
        </div>
      </header>
      <div className={styles.detailContent}>
        <section className={styles.metadataGrid}>
          <Metadata label="Artifact" value={release.static.originalFileName} />
          <Metadata label="Content type" value={release.static.contentType} />
          <Metadata label="Size" value={`${formatBytes(release.static.size)} (${release.static.size.toLocaleString()} bytes)`} />
          <Metadata label="Published" value={formatDate(release.publishedAt)} />
          <Metadata label="Created" value={formatDate(release.createdAt)} />
          <Metadata label="Updated" value={formatDate(release.updatedAt)} />
        </section>
        <section className={styles.notesSection}>
          <span className={styles.eyebrow}>Release notes</span>
          {release.releaseNotes ? <p>{release.releaseNotes}</p> : <p className={styles.muted}>No release notes provided.</p>}
        </section>
      </div>
      <footer className={styles.detailFooter}>
        <button type="button" className={styles.downloadButton} onClick={handleDownload}><FiDownload /><span><strong>Download {release.static.originalFileName}</strong></span></button>
      </footer>
    </article>
  );
}

function Metadata({ label, value }) {
  return <div className={styles.metadata}><span>{label}</span><strong title={value}>{value}</strong></div>;
}

function ReleaseEditorDialog({ editor, config, onClose, onSave }) {
  const release = editor.release;
  const [version, setVersion] = useState(release?.version ?? "");
  const [releaseNotes, setReleaseNotes] = useState(release?.releaseNotes ?? "");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const canEditVersion = !release || config.canEditVersion(release);

  const submit = async (event) => {
    event.preventDefault();
    const versionError = config.validateVersion(version);
    if (versionError) {
      setError(versionError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ version, releaseNotes });
    } catch (saveError) {
      setError(getReleaseError(saveError, config.kindLabel).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="release-dialog-title" onSubmit={submit}>
        <header><div><span className={styles.eyebrow}>{editor.mode === "create" ? "New release" : "Release metadata"}</span><h2 id="release-dialog-title">{editor.mode === "create" ? `Register ${config.productName}` : `Edit ${release.version}`}</h2></div><button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close dialog"><FiX /></button></header>
        <div className={styles.dialogBody}>
          {editor.staticFile ? <div className={styles.artifactSummary}><FiFile /><div><strong>{editor.staticFile.originalFileName}</strong><span>{formatBytes(editor.staticFile.size)}</span></div></div> : null}
          <label className={styles.dialogField}><span>Version</span><input value={version} onChange={(event) => setVersion(event.target.value)} disabled={!canEditVersion} placeholder={config.versionPlaceholder} autoFocus /></label>
          {!canEditVersion ? <p className={styles.fieldHelp}>Version and artifact are immutable while this Studio release is active.</p> : null}
          <label className={styles.dialogField}><span>Release notes</span><textarea value={releaseNotes} onChange={(event) => setReleaseNotes(event.target.value)} rows={7} placeholder="Summarize changes for this release" /></label>
          {error ? <div className={styles.formError} role="alert">{error}</div> : null}
        </div>
        <footer><button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button><button type="submit" className={styles.primaryButton} disabled={saving}>{saving ? "Saving…" : editor.mode === "create" ? "Register release" : "Save changes"}</button></footer>
      </form>
    </div>
  );
}

function ConfirmDialog({ action, productName, onCancel, onConfirm }) {
  const activating = action.type === "activate";
  return (
    <div className={styles.overlay}>
      <div className={styles.confirmDialog} role="alertdialog" aria-modal="true" aria-labelledby="confirm-release-title">
        <span className={styles.confirmIcon}><FiPower /></span>
        <h2 id="confirm-release-title">{activating ? "Activate" : "Deactivate"} {productName} {action.release.version}?</h2>
        <p>{activating ? "The currently active release will be replaced. You can roll back later by activating an older release." : "Studio downloads may become unavailable until another release is activated."}</p>
        <div><button type="button" className={styles.secondaryButton} onClick={onCancel}>Cancel</button><button type="button" className={activating ? styles.primaryButton : styles.dangerButton} onClick={onConfirm}>{activating ? "Activate release" : "Deactivate release"}</button></div>
      </div>
    </div>
  );
}

