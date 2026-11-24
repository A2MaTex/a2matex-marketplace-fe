import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import { adminSystemSettingApi } from "../api/adminSystemSettingApi";
import SepayBankAccountCard from "../components/SepayBankAccountCard";
import SystemSettingCard from "../components/SystemSettingCard";
import SaveSystemSettingDialog from "../components/SaveSystemSettingDialog";
import { useAdminSystemSettings } from "../hooks/useAdminSystemSettings";
import { parseSystemSettingUpdateResponse } from "../model/systemSettingContract";
import { toSystemSettingError } from "../model/systemSettingError";
import {
  createSystemSettingDraft,
  deriveSepayStatus,
  isSystemSettingDraftDirty,
  stableValue,
  validateSystemSettingDraft,
} from "../model/systemSettingForm";
import { settingGroup } from "../model/systemSettingPresentation";
import styles from "./AdminSystemSettingsPage.module.css";

const mergeServerSettings = (items, currentDrafts) => {
  const next = {};
  for (const setting of items) {
    const existing = currentDrafts[setting.key];
    if (existing && isSystemSettingDraftDirty(existing)) {
      next[setting.key] = {
        ...existing,
        stale:
          existing.stale ||
          existing.serverSnapshot !== stableValue(setting.value),
      };
    } else {
      next[setting.key] = createSystemSettingDraft(setting);
    }
  }
  return next;
};

const formatRefreshTime = (date) =>
  date
    ? new Intl.DateTimeFormat("en-GB", { timeStyle: "medium" }).format(date)
    : "Not refreshed";

export default function AdminSystemSettingsPage() {
  const settings = useAdminSystemSettings();
  const [drafts, setDrafts] = useState({});
  const [saveAction, setSaveAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    queueMicrotask(() =>
      setDrafts((current) => mergeServerSettings(settings.items, current)),
    );
  }, [settings.items]);

  const hasDirtyDraft = useMemo(
    () => Object.values(drafts).some(isSystemSettingDraftDirty),
    [drafts],
  );
  const shouldBlockNavigation = useCallback(
    ({ currentLocation, nextLocation }) =>
      hasDirtyDraft &&
      `${currentLocation.pathname}${currentLocation.search}` !==
        `${nextLocation.pathname}${nextLocation.search}`,
    [hasDirtyDraft],
  );
  const navigationBlocker = useBlocker(shouldBlockNavigation);

  useEffect(() => {
    if (!hasDirtyDraft) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasDirtyDraft]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const grouped = useMemo(
    () => ({
      commerce: settings.items.filter(
        (item) => settingGroup(item) === "commerce",
      ),
      sepay: settings.items.filter((item) => settingGroup(item) === "sepay"),
      other: settings.items.filter((item) => settingGroup(item) === "other"),
    }),
    [settings.items],
  );
  const sepayStatus = deriveSepayStatus(settings.items);

  const updateDraft = (key, field, value) => {
    setDrafts((current) => {
      const serverErrors = { ...current[key]?.serverErrors };
      delete serverErrors[field];
      return {
        ...current,
        [key]: {
          ...current[key],
          values: { ...current[key]?.values, [field]: value },
          serverErrors,
        },
      };
    });
  };

  const discardDraft = (setting) => {
    setDrafts((current) => ({
      ...current,
      [setting.key]: createSystemSettingDraft(setting),
    }));
  };

  const validationFor = (setting) => {
    const validation = validateSystemSettingDraft(setting, drafts[setting.key]);
    const serverErrors = drafts[setting.key]?.serverErrors ?? {};
    const errors = { ...validation.errors, ...serverErrors };
    Object.keys(errors).forEach(
      (key) => errors[key] === undefined && delete errors[key],
    );
    return {
      ...validation,
      errors,
      valid: validation.valid && Object.keys(errors).length === 0,
    };
  };

  const requestSave = (setting) => {
    const validation = validationFor(setting);
    if (!validation.valid || drafts[setting.key]?.stale) return;
    setSaveError(null);
    setSaveAction({ kind: "single", setting, value: validation.value });
  };

  const requestSepaySave = () => {
    if (grouped.sepay.length !== 3) return;
    const changes = grouped.sepay
      .filter((setting) => isSystemSettingDraftDirty(drafts[setting.key]))
      .map((setting) => ({
        setting,
        value: validationFor(setting).value,
      }));
    const canSave =
      changes.length > 0 &&
      grouped.sepay.every(
        (setting) =>
          validationFor(setting).valid && !drafts[setting.key]?.stale,
      );
    if (!canSave) return;
    setSaveError(null);
    setSaveAction({ kind: "sepay-group", changes });
  };

  const closeSaveDialog = useCallback(() => {
    if (saving) return;
    setSaveAction(null);
    setSaveError(null);
  }, [saving]);

  const confirmSave = async () => {
    if (!saveAction || saving) return;
    setSaving(true);
    setSaveError(null);
    const changes =
      saveAction.kind === "sepay-group"
        ? saveAction.changes
        : [{ setting: saveAction.setting, value: saveAction.value }];
    let activeChange = changes[0];
    try {
      for (const change of changes) {
        activeChange = change;
        const response = await adminSystemSettingApi.update(
          change.setting.key,
          change.value,
        );
        parseSystemSettingUpdateResponse(response);
        setDrafts((current) => {
          const next = { ...current };
          delete next[change.setting.key];
          return next;
        });
      }
      setSaveAction(null);
      setToast({
        type: "success",
        message:
          saveAction.kind === "sepay-group"
            ? "Bank account settings saved. The registry has been refreshed."
            : "Setting saved. The registry has been refreshed.",
      });
      settings.refetch();
    } catch (error) {
      const normalized = toSystemSettingError(error);
      setSaveError({
        ...normalized,
        message:
          saveAction.kind === "sepay-group"
            ? `${normalized.message} Earlier bank fields may already have been saved because the backend updates each value independently.`
            : normalized.message,
      });
      if (normalized.field) {
        setDrafts((current) => ({
          ...current,
          [activeChange.setting.key]: {
            ...current[activeChange.setting.key],
            serverErrors: {
              ...current[activeChange.setting.key]?.serverErrors,
              [normalized.field]: normalized.message,
            },
          },
        }));
      }
      if (
        saveAction.kind === "sepay-group" ||
        normalized.status === null ||
        normalized.status === 404 ||
        normalized.status >= 500
      ) {
        settings.refetch();
      }
    } finally {
      setSaving(false);
    }
  };

  const copyActor = async (actorId) => {
    try {
      await navigator.clipboard.writeText(actorId);
      setToast({ type: "success", message: "Actor UUID copied." });
    } catch {
      setToast({ type: "error", message: "Unable to copy the actor UUID." });
    }
  };

  const renderCard = (setting) => (
    <SystemSettingCard
      key={setting.key}
      setting={setting}
      draft={drafts[setting.key]}
      validation={validationFor(setting)}
      busy={
        saving &&
        saveAction?.kind === "single" &&
        saveAction.setting.key === setting.key
      }
      onChange={(field, value) => updateDraft(setting.key, field, value)}
      onDiscard={() => discardDraft(setting)}
      onSave={() => requestSave(setting)}
      onCopyActor={copyActor}
    />
  );

  const sepayValidations = Object.fromEntries(
    grouped.sepay.map((setting) => [setting.key, validationFor(setting)]),
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Content &amp; Configuration</span>
          <h1>System Settings</h1>
          <p>
            Manage registered platform values using the schema published by the
            backend.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.refreshMeta}>
            Last refresh: {formatRefreshTime(settings.refreshedAt)}
          </span>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={settings.refetch}
            disabled={settings.loading || settings.refreshing}
          >
            <FiRefreshCw
              className={settings.refreshing ? styles.spinning : ""}
            />
            {settings.refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {settings.error && settings.items.length > 0 ? (
        <div className={styles.inlineError} role="alert">
          <FiAlertTriangle />
          <span>{settings.error.message}</span>
        </div>
      ) : null}

      {settings.loading ? (
        <div className={styles.loadingState} aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className={styles.skeletonCard} />
          ))}
        </div>
      ) : settings.error && settings.items.length === 0 ? (
        <div className={styles.statePanel} role="alert">
          <span className={styles.stateIcon}>
            {settings.error.status === 403 ? <FiShield /> : <FiAlertTriangle />}
          </span>
          <h2>
            {settings.error.status === 403
              ? "Administrator permission required"
              : "Unable to load system settings"}
          </h2>
          <p>{settings.error.message}</p>
          {settings.error.retryable ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={settings.refetch}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : settings.items.length === 0 ? (
        <div className={styles.statePanel}>
          <span className={styles.stateIcon}>
            <FiSettings />
          </span>
          <h2>No registered settings</h2>
          <p>The backend registry did not publish any settings.</p>
        </div>
      ) : (
        <>
          {grouped.commerce.length ? (
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.eyebrow}>Commission Rate</span>
                  <h2>Marketplace commission</h2>
                </div>
              </div>
              <div className={styles.cardGrid}>
                {grouped.commerce.map(renderCard)}
              </div>
            </section>
          ) : null}

          {grouped.sepay.length ? (
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.eyebrow}>Top-up bank transfer</span>
                  <h2>Sepay receiving account</h2>
                </div>
                <span
                  className={`${styles.configurationStatus} ${styles[`status${sepayStatus}`]}`}
                >
                  {sepayStatus === "CONFIGURED" ? (
                    <FiCheckCircle />
                  ) : (
                    <FiAlertTriangle />
                  )}
                  {sepayStatus === "CONFIGURED"
                    ? "Configured"
                    : sepayStatus === "INCOMPLETE"
                      ? "Incomplete"
                      : "Unknown"}
                </span>
              </div>
              <SepayBankAccountCard
                settings={grouped.sepay}
                drafts={drafts}
                validations={sepayValidations}
                busy={saving && saveAction?.kind === "sepay-group"}
                onChange={updateDraft}
                onDiscard={() => grouped.sepay.forEach(discardDraft)}
                onSave={requestSepaySave}
              />
            </section>
          ) : null}

          {grouped.other.length ? (
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.eyebrow}>Registry</span>
                  <h2>Other settings</h2>
                </div>
              </div>
              <div className={styles.cardGrid}>
                {grouped.other.map(renderCard)}
              </div>
            </section>
          ) : null}
        </>
      )}

      {saveAction ? (
        <SaveSystemSettingDialog
          action={saveAction}
          saving={saving}
          error={saveError}
          onCancel={closeSaveDialog}
          onConfirm={confirmSave}
        />
      ) : null}

      {navigationBlocker.state === "blocked" ? (
        <UnsavedChangesDialog
          onStay={navigationBlocker.reset}
          onLeave={navigationBlocker.proceed}
        />
      ) : null}

      {toast ? (
        <div
          className={`${styles.toast} ${toast.type === "error" ? styles.errorToast : ""}`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}

function UnsavedChangesDialog({ onStay, onLeave }) {
  const stayRef = useRef(null);

  useEffect(() => {
    stayRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onStay();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onStay]);

  return (
    <div className={styles.overlay}>
      <section
        className={styles.leaveDialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-settings-title"
      >
        <span className={styles.leaveIcon}>
          <FiAlertTriangle />
        </span>
        <h2 id="leave-settings-title">Discard unsaved setting changes?</h2>
        <p>
          Leaving this page will discard every setting draft that has not been
          saved.
        </p>
        <div>
          <button
            ref={stayRef}
            type="button"
            className={styles.secondaryButton}
            onClick={onStay}
          >
            Stay on page
          </button>
          <button
            type="button"
            className={styles.leaveButton}
            onClick={onLeave}
          >
            Leave without saving
          </button>
        </div>
      </section>
    </div>
  );
}
