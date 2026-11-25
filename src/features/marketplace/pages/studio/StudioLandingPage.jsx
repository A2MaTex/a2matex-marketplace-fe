import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiArrowDownRight,
  FiCheck,
  FiChevronRight,
  FiDownload,
  FiLayers,
  FiRefreshCw,
  FiShield,
  FiZap,
} from "react-icons/fi";
import { FaLinux, FaWindows } from "react-icons/fa";
import { TbCloudUpload, TbDragDrop, TbRoute } from "react-icons/tb";
import demoVideo from "@/assets/demo.mp4";
import styles from "./StudioLandingPage.module.css";
import { CgFileDocument } from "react-icons/cg";
import { staticApi } from "@/common/api/static/staticApi";
import { studioReleaseApi } from "./studioReleaseApi";
import {
  getCurrentStudioRelease,
  getStudioDownload,
  isNoActiveStudioReleaseError,
} from "./studioReleaseState";

const RELEASES = [
  {
    os: "Windows",
    icon: FaWindows,
    description: "Windows 10 / 11 · 64-bit",
    format: ".exe installer",
    href: import.meta.env.VITE_STUDIO_WINDOWS_DOWNLOAD_URL || "",
    usesCurrentRelease: true,
  },
  {
    os: "Linux",
    icon: FaLinux,
    description: "Ubuntu 20.04+ · 64-bit",
    format: "AppImage / .deb",
    href: import.meta.env.VITE_STUDIO_LINUX_DOWNLOAD_URL || "",
    usesCurrentRelease: false,
  },
];

const FEATURES = [
  {
    icon: TbDragDrop,
    index: "01",
    eyebrow: "Visual composition",
    title: "Build automation by connecting ideas, not boilerplate.",
    description:
      "Drag focused actions onto an infinite canvas, connect success and error paths, then inspect every input without losing the shape of your workflow.",
    detail: "No-code speed with developer-level control",
  },
  {
    icon: TbRoute,
    index: "02",
    eyebrow: "Readable workflows",
    title: "Turn complex Android logic into a graph your team can follow.",
    description:
      "Reusable nodes keep conditions, device actions, data transforms and recovery paths visible. Large automations stay understandable as they evolve.",
    detail: "Typed routes · reusable nodes · clear failures",
  },
  {
    icon: FiZap,
    index: "03",
    eyebrow: "Fast feedback",
    title: "Test the workflow while the context is still fresh.",
    description:
      "Run from Studio, follow execution through the graph and inspect node output in one place. Fix the exact step that failed instead of reading an opaque log dump.",
    detail: "Live execution · node-level diagnostics",
  },
  {
    icon: TbCloudUpload,
    index: "04",
    eyebrow: "Cloud publishing",
    title: "Move from local workflow to Publisher Hub without rebuilding it.",
    description:
      "Synchronize project drafts to the cloud, review the exact graph on the web and submit an immutable release for scanning and marketplace review.",
    detail: "Versioned drafts · review-ready releases",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Compose",
    text: "Choose nodes, place them on the canvas and connect the paths your automation can take.",
  },
  {
    number: "02",
    title: "Test",
    text: "Run against your device, inspect each step and resolve validation issues before publishing.",
  },
  {
    number: "03",
    title: "Publish",
    text: "Sync a versioned draft and continue the release workflow from Publisher Hub.",
  },
];

const SIGNALS = [
  "Visual workflow canvas",
  "Android automation",
  "Live node diagnostics",
  "Cloud draft sync",
  "Marketplace publishing",
];

const fetchCurrentReleaseState = async () => {
  try {
    const response = await studioReleaseApi.getCurrent();
    const release = getCurrentStudioRelease(response);
    return release
      ? { status: "ready", release }
      : { status: "error", release: null };
  } catch (error) {
    if (isNoActiveStudioReleaseError(error)) {
      return { status: "unavailable", release: null };
    }
    console.error("Unable to load the current Studio release.", error);
    return { status: "error", release: null };
  }
};

const DownloadAction = ({
  availability,
  downloadFailed,
  downloading,
  onDownload,
  onRetry,
  release,
  version,
}) => {
  const Icon = release.icon;
  if (availability === "external") {
    return (
      <a className={styles.releaseAction} href={release.href}>
        <Icon aria-hidden="true" /> Download for {release.os}{" "}
        <FiDownload aria-hidden="true" />
      </a>
    );
  }
  if (availability === "ready") {
    return (
      <button
        type="button"
        className={`${styles.primaryAction} ${styles.releaseActionButton}`}
        disabled={downloading}
        onClick={onDownload}
      >
        <Icon aria-hidden="true" />
        {downloading
          ? "Preparing download…"
          : downloadFailed
            ? "Retry download"
            : `Download v${version}`}
        {!downloading ? <FiDownload aria-hidden="true" /> : null}
      </button>
    );
  }
  if (availability === "loading") {
    return (
      <span
        className={`${styles.releaseAction} ${styles.releasePending}`}
        aria-disabled="true"
      >
        <Icon aria-hidden="true" /> Checking release…
      </span>
    );
  }
  if (availability === "error") {
    return (
      <button
        type="button"
        className={`${styles.releaseAction} ${styles.releasePending} ${styles.releaseActionButton}`}
        onClick={onRetry}
      >
        <FiRefreshCw aria-hidden="true" /> Retry release check
      </button>
    );
  }
  return (
    <span
      className={`${styles.releaseAction} ${styles.releasePending}`}
      aria-disabled="true"
    >
      <Icon aria-hidden="true" /> Release coming soon
    </span>
  );
};

const StudioLandingPage = () => {
  const pageRef = useRef(null);
  const [releaseState, setReleaseState] = useState({
    status: "loading",
    release: null,
  });
  const [downloadState, setDownloadState] = useState("idle");

  const loadCurrentRelease = useCallback(() => {
    setReleaseState({ status: "loading", release: null });
    fetchCurrentReleaseState().then(setReleaseState);
  }, []);

  const downloadCurrentRelease = useCallback(async () => {
    if (releaseState.status !== "ready" || !releaseState.release?.staticId) return;
    setDownloadState("loading");
    try {
      const response = await staticApi.getFileDownloadUrl(
        releaseState.release.staticId,
      );
      const download = getStudioDownload(response);
      if (!download) throw new Error("The download service returned an invalid response.");
      const url = new URL(download.downloadUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("The download service returned an unsafe URL.");
      }
      const anchor = document.createElement("a");
      anchor.href = url.toString();
      anchor.download = download.fileName;
      anchor.rel = "noopener";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setDownloadState("idle");
    } catch (error) {
      console.error("Unable to prepare the Studio download.", error);
      setDownloadState("error");
    }
  }, [releaseState]);

  useEffect(() => {
    let active = true;
    fetchCurrentReleaseState().then((nextState) => {
      if (active) setReleaseState(nextState);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const elements = pageRef.current?.querySelectorAll("[data-reveal]") ?? [];
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add(styles.revealed));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(styles.revealed);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6%" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <main ref={pageRef} className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.auroraOne} aria-hidden="true" />
        <div className={styles.auroraTwo} aria-hidden="true" />
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy} data-reveal>
            <h1>
              Design automation
              <span>as a living workflow.</span>
            </h1>
            <p className={styles.heroLead}>
              A visual environment for building, testing and publishing Android
              automation without hiding the logic that makes it work.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#download">
                Get Studio <FiArrowDownRight aria-hidden="true" />
              </a>
              <a className={styles.secondaryAction} href="#guide">
                <CgFileDocument aria-hidden="true" /> A2MaTeX Studio Guide
              </a>
            </div>
            <div className={styles.platformNote}>
              <span>
                <FaWindows aria-hidden="true" /> Windows
              </span>
              <span>
                <FaLinux aria-hidden="true" /> Linux
              </span>
              <small>No macOS release</small>
            </div>
          </div>

          <div id="demo" className={styles.demoStage} data-reveal>
            <div className={styles.videoGlow} aria-hidden="true" />
            <div className={styles.videoShell}>
              <div className={styles.videoTopbar}>
                <span className={styles.windowDots}>
                  <i />
                  <i />
                  <i />
                </span>
                <span>A2MaTeX Studio · Workflow preview</span>
                <span className={styles.liveState}>
                  <i /> Live
                </span>
              </div>
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                disablePictureInPicture
                controlsList="nodownload nofullscreen noplaybackrate"
                aria-label="A2MaTeX Studio workflow demonstration"
              >
                <source src={demoVideo} type="video/mp4" />
                Your browser does not support the demo video.
              </video>
            </div>
            <div className={`${styles.floatingLabel} ${styles.floatingTop}`}>
              <FiCheck aria-hidden="true" /> Graph validated
            </div>
            <div className={`${styles.floatingLabel} ${styles.floatingBottom}`}>
              <FiZap aria-hidden="true" /> Ready to run
            </div>
          </div>
        </div>
      </section>

      <div className={styles.signalRail} aria-label="Studio capabilities">
        <div className={styles.signalTrack}>
          {[...SIGNALS, ...SIGNALS].map((signal, index) => (
            <span
              key={`${signal}-${index}`}
              aria-hidden={index >= SIGNALS.length}
            >
              <i /> {signal}
            </span>
          ))}
        </div>
      </div>

      <section className={styles.features}>
        <div className={styles.container}>
          <header className={styles.sectionIntro} data-reveal>
            <p>Built for the whole workflow</p>
            <h2>Less interface. More momentum.</h2>
            <span>
              Studio keeps creation, testing and publishing in one continuous
              flow instead of splitting your work across rigid tools.
            </span>
          </header>

          <div className={styles.featureFlow}>
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.index}
                  className={styles.featureRow}
                  data-reveal
                >
                  <span className={styles.featureIndex}>{feature.index}</span>
                  <div className={styles.featureIcon}>
                    <Icon aria-hidden="true" />
                  </div>
                  <div className={styles.featureCopy}>
                    <p>{feature.eyebrow}</p>
                    <h3>{feature.title}</h3>
                    <span>{feature.description}</span>
                  </div>
                  <div className={styles.featureDetail}>
                    <FiChevronRight aria-hidden="true" />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className={styles.workflowSection}>
        <div className={`${styles.container} ${styles.workflowGrid}`}>
          <div className={styles.workflowIntro} data-reveal>
            <p>From idea to release</p>
            <h2>One smooth path, three clear moments.</h2>
            <span>
              Keep the graph as the source of truth from the first node through
              the marketplace submission.
            </span>
          </div>
          <div className={styles.steps}>
            {STEPS.map((step, index) => (
              <article
                key={step.number}
                className={styles.step}
                data-reveal
                style={{ "--delay": `${index * 90}ms` }}
              >
                <span>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="download" className={styles.downloadSection}>
        <div className={styles.downloadAura} aria-hidden="true" />
        <div className={styles.container}>
          <header className={styles.downloadIntro} data-reveal>
            <p>Desktop releases</p>
            <h2>Choose the system you build on.</h2>
            <span>
              A2MateX Studio is planned for Windows and Linux. macOS is
              not supported.
            </span>
          </header>

          <div className={styles.releaseList}>
            {RELEASES.map((release, index) => {
              const Icon = release.icon;
              const currentReleaseReady =
                release.usesCurrentRelease && releaseState.status === "ready";
              const availability = currentReleaseReady
                ? "ready"
                : release.href
                  ? "external"
                  : release.usesCurrentRelease
                    ? releaseState.status
                    : "unavailable";
              return (
                <article
                  key={release.os}
                  className={styles.releaseRow}
                  data-reveal
                  style={{ "--delay": `${index * 100}ms` }}
                >
                  <div className={styles.releaseIcon}>
                    <Icon aria-hidden="true" />
                  </div>
                  <div className={styles.releaseName}>
                    <h3>{release.os}</h3>
                    <p>{release.description}</p>
                  </div>
                  <span className={styles.releaseFormat}>{release.format}</span>
                  <DownloadAction
                    availability={availability}
                    downloadFailed={downloadState === "error"}
                    downloading={downloadState === "loading"}
                    onDownload={downloadCurrentRelease}
                    onRetry={
                      downloadState === "error"
                        ? downloadCurrentRelease
                        : loadCurrentRelease
                    }
                    release={release}
                    version={releaseState.release?.version}
                  />
                </article>
              );
            })}
          </div>

          <div className={styles.closingLine} data-reveal>
            <span>
              <FiLayers aria-hidden="true" /> Visual by default
            </span>
            <span>
              <FiShield aria-hidden="true" /> Versioned and reviewable
            </span>
            <a href="/launcher">
              Only running tools? Get Launcher <FiChevronRight />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default StudioLandingPage;
