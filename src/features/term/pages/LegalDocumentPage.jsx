import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "@/lib/errorMessageHandler";
import {
  FiAlertTriangle,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiFileText,
  FiLock,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import { termApi } from "../termApi";
import styles from "./LegalDocumentPage.module.css";

const DEFAULT_ERROR_MESSAGE =
  "We couldn't load this document. Please try again in a moment.";

const PAGE_VARIANTS = {
  terms: {
    icon: FiBookOpen,
    description:
      "The shared ground rules that keep A2MaTeX useful, transparent, and safe for everyone who creates, buys, and builds here.",
    relatedPath: "/privacy",
    relatedLabel: "Privacy Policy",
  },
  privacy: {
    icon: FiShield,
    description:
      "A straightforward look at what we collect, why we use it, and the choices you have when you use A2MaTeX.",
    relatedPath: "/terms",
    relatedLabel: "Terms of Service",
  },
};

function formatPublishedDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function createHeadingId(value, index, usedIds) {
  const base =
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `section-${index + 1}`;

  let id = base;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);
  return id;
}

function prepareDocumentContent(content) {
  const sanitized = DOMPurify.sanitize(content ?? "", {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["form", "iframe", "object", "embed", "style"],
    FORBID_ATTR: ["style"],
  });

  if (!sanitized) {
    return { html: "", sections: [] };
  }

  const parsed = new DOMParser().parseFromString(sanitized, "text/html");
  const usedIds = new Set();
  const sections = Array.from(parsed.body.querySelectorAll("h2, h3")).map(
    (heading, index) => {
      const label = heading.textContent?.trim() || `Section ${index + 1}`;
      const id = createHeadingId(label, index, usedIds);
      heading.id = id;

      return {
        id,
        label,
        level: heading.tagName.toLowerCase(),
      };
    },
  );

  return {
    html: parsed.body.innerHTML,
    sections,
  };
}

async function getCurrentDocument(type, signal) {
  const response = await termApi.getCurrentTerms(type, { signal });
  const currentDocument = response?.data?.data ?? response?.data;

  if (!currentDocument || typeof currentDocument !== "object") {
    throw new Error("The API returned an invalid legal document.");
  }

  return currentDocument;
}

function getRequestErrorMessage(requestError) {
  return getApiErrorMessage(requestError, DEFAULT_ERROR_MESSAGE);
}

export default function LegalDocumentPage({
  type,
  fallbackTitle,
  variant = "terms",
}) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const contentRef = useRef(null);
  const pageVariant = PAGE_VARIANTS[variant] ?? PAGE_VARIANTS.terms;
  const VariantIcon = pageVariant.icon;

  const retry = async () => {
    setLoading(true);
    setError("");

    try {
      setDocument(await getCurrentDocument(type));
    } catch (requestError) {
      setDocument(null);
      setError(getRequestErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    getCurrentDocument(type, controller.signal)
      .then((currentDocument) => {
        if (!controller.signal.aborted) setDocument(currentDocument);
      })
      .catch((requestError) => {
        if (requestError?.code === "ERR_CANCELED") return;

        setDocument(null);
        setError(getRequestErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [type]);

  useEffect(() => {
    const previousTitle = window.document.title;
    window.document.title = `${fallbackTitle} | A2MaTeX`;

    return () => {
      window.document.title = previousTitle;
    };
  }, [fallbackTitle]);

  const preparedContent = useMemo(
    () => prepareDocumentContent(document?.content),
    [document?.content],
  );

  useEffect(() => {
    const headings = Array.from(
      contentRef.current?.querySelectorAll("h2[id], h3[id]") ?? [],
    );

    if (!headings.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleHeading = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visibleHeading) setActiveSection(visibleHeading.target.id);
      },
      { rootMargin: "-96px 0px -68% 0px", threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [preparedContent.html]);

  const publishedDate = formatPublishedDate(document?.publishedAt);
  const title = document?.title || fallbackTitle;
  const displayedActiveSection = preparedContent.sections.some(
    (section) => section.id === activeSection,
  )
    ? activeSection
    : preparedContent.sections[0]?.id;

  return (
    <div className={`${styles.page} ${styles[variant] || ""}`}>
      <div className={styles.ambientTop} aria-hidden="true" />
      <div className={styles.ambientSide} aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true" />

      <main className={styles.container}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>{title}</h1>
            <p className={styles.intro}>{pageVariant.description}</p>

            {!loading && !error && (
              <div className={styles.heroMeta} aria-label="Document information">
                {document?.version && (
                  <span>
                    <FiFileText aria-hidden="true" />
                    Version {document.version}
                  </span>
                )}
                {publishedDate && (
                  <span>
                    <FiCalendar aria-hidden="true" />
                    Effective {publishedDate}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={styles.heroMark} aria-hidden="true">
            <div className={styles.orbit}>
              <span />
            </div>
            <div className={styles.seal}>
              <VariantIcon />
            </div>
          </div>
        </header>

        <div className={styles.documentLayout}>
          <aside className={styles.sidebar} aria-label="Document navigation">
            <div className={styles.sidebarInner}>
              <div className={styles.tocCard}>
                <div className={styles.tocHeading}>
                  <span>On this page</span>
                  <FiBookOpen aria-hidden="true" />
                </div>

                {loading ? (
                  <div className={styles.tocSkeleton} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : preparedContent.sections.length ? (
                  <nav className={styles.toc} aria-label="Table of contents">
                    {preparedContent.sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className={[
                          section.level === "h3" ? styles.tocNested : "",
                          displayedActiveSection === section.id
                            ? styles.tocActive
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {section.label}
                      </a>
                    ))}
                  </nav>
                ) : (
                  <p className={styles.tocEmpty}>A clear, single-page document.</p>
                )}
              </div>

              <div className={styles.trustCard}>
                <span className={styles.trustIcon}>
                  <FiLock aria-hidden="true" />
                </span>
                <div>
                  <strong>Official document</strong>
                  <p>Published and maintained by A2MaTeX.</p>
                </div>
              </div>

              <div className={styles.relatedCard}>
                <span>Related</span>
                <Link to={pageVariant.relatedPath}>{pageVariant.relatedLabel}</Link>
              </div>
            </div>
          </aside>

          <article className={styles.card} aria-live="polite">
            <div className={styles.cardTopbar}>
              <span className={styles.windowDots} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className={styles.documentStatus}>
                <FiCheck aria-hidden="true" /> Current document
              </span>
            </div>

            <div className={styles.cardBody}>
              {loading ? (
                <div className={styles.loadingState} role="status">
                  <div className={styles.loadingOrb}>
                    <FiRefreshCw className={styles.spinner} aria-hidden="true" />
                  </div>
                  <strong>Preparing the document</strong>
                  <span>Fetching the latest published version…</span>
                  <div className={styles.contentSkeleton} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              ) : error ? (
                <div className={styles.errorState} role="alert">
                  <span className={styles.errorIcon}>
                    <FiAlertTriangle aria-hidden="true" />
                  </span>
                  <p className={styles.stateEyebrow}>Connection interrupted</p>
                  <h2>Document unavailable</h2>
                  <p>{error}</p>
                  <button type="button" onClick={retry}>
                    <FiRefreshCw aria-hidden="true" />
                    Try again
                  </button>
                </div>
              ) : preparedContent.html ? (
                <>
                  <div
                    ref={contentRef}
                    className={styles.content}
                    dangerouslySetInnerHTML={{ __html: preparedContent.html }}
                  />
                  <footer className={styles.documentFooter}>
                    <span className={styles.footerCheck}>
                      <FiCheck aria-hidden="true" />
                    </span>
                    <div>
                      <strong>You reached the end.</strong>
                      <p>
                        This is the current published version of {title.toLowerCase()}.
                      </p>
                    </div>
                  </footer>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <FiFileText aria-hidden="true" />
                  <h2>Content is on its way</h2>
                  <p>This document does not have any published content yet.</p>
                </div>
              )}
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
