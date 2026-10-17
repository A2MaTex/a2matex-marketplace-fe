import AppLayout from "../../../common/components/layout/AppLayout";
import styles from "./LauncherPage.module.css";

import { FiDownload, FiMonitor, FiCpu, FiWifi } from "react-icons/fi";
import {
  BsLightningChargeFill,
  BsShieldCheck,
  BsAndroid2,
  BsArrowRepeat,
} from "react-icons/bs";
import { MdOutlineDashboardCustomize, MdOutlineMemory } from "react-icons/md";
import { HiOutlineTerminal } from "react-icons/hi";
import { TbPlugConnected } from "react-icons/tb";
import { GoArrowRight } from "react-icons/go";
import { RiLoader4Line } from "react-icons/ri";
import Button from "../../../common/components/common/Button";

/* ─── Data ───────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: <BsLightningChargeFill size={22} />,
    title: "1-Click Zero Setup",
    desc: "Built-in Go Runtime and essential dependencies. No manual environment configuration, PATH setup, or additional installations required.",
    note: "No manual configuration required.",
  },
  {
    icon: <BsAndroid2 size={22} />,
    title: "Seamless Android Integration",
    desc: "Connect and manage Android emulators and physical devices through built-in ADB support.",
    note: "No complicated device setup.",
  },
  {
    icon: <BsArrowRepeat size={22} />,
    title: "Smart Runtime Updates",
    desc: "Keep the Go Runtime and automation tools up to date with user-approved updates — no manual reinstallation required.",
    note: "No manual reinstallation required.",
  },
  {
    icon: <MdOutlineDashboardCustomize size={22} />,
    title: "Centralized Workflow Management",
    desc: "Download, configure, and execute automation tools from one desktop application with real-time execution status and progress tracking.",
    note: "No scattered tools or fragmented workflows.",
  },
];

const STEPS = [
  {
    num: 1,
    title: "Download and launch A2MaTeX Launcher-Setup.exe",
    desc: "Click the Download button above to download the lightweight installer, then launch the app on your computer.",
  },
  {
    num: 2,
    title: "Login Account",
    desc: "Log in using the A2MaTeX account used to purchase the tool, and the system will automatically synchronize all owned tools.",
  },
  {
    num: 3,
    title: "Select Tool and Run",
    desc: "Download tool and click Run. The tool automatically unpacks files into RAM and executes them immediately. Simply enter the input parameters (such as cookies, links, or keywords) and watch the tool go to work!",
  },
];

const SYS_REQS = [
  {
    icon: <FiMonitor size={14} />,
    label: "Operating System",
    value: "Windows 10 / 11 (64-bit)",
  },
  {
    icon: <MdOutlineMemory size={14} />,
    label: "Minimum RAM",
    value: "512 MB (Launcher) / 2 GB (Total)",
  },
  {
    icon: <HiOutlineTerminal size={14} />,
    label: "Free disk space",
    value: "180 MB cho Launcher core",
  },
  {
    icon: <FiWifi size={14} />,
    label: "Connect Internet",
    value: "Internet (Only when validate license)",
  },
];

/* ─── Live mockup data ───────────────────────────────────────────── */
const ACTIVE_TOOLS = [
  {
    name: "TikTok Auto-Uploader Suite.exe",
    status: "running",
    badge: "Logs",
  },
  {
    name: "Telegram Lead Scraper v3.3.exe",
    status: "idle",
    badge: "Start",
  },
];

const LOG_LINES = [
  { time: "2025-05-18 14:22:01", msg: "MKID Handshake: OK (SHA-256 Verified)" },
  {
    time: "2025-05-18 14:22:04",
    msg: "Decrypting TikTok_Runner.exe into RAM Enclave...",
  },
  {
    time: "2025-05-18 14:22:05",
    msg: "Process #3692 spawned safely. No system drivers injected.",
  },
];

/* ─── Component ─────────────────────────────────────────────────── */

const LauncherPage = () => {
  return (
    <AppLayout>
      <div className={styles.page}>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            {/* Left */}
            <div className={styles.heroLeft}>
              <div className={styles.badge}>
                <span className={styles.badgeDot} />
                CLIENT RUNTIME ENGINE v2.4.0 &nbsp;/&nbsp; FOR TOOL RUNNERS
              </div>

              <h1 className={styles.heroTitle}>A2MaTeX Client Launcher</h1>
              <p className={styles.heroSubtitle}>
                Automation Tools Launcher &amp; Manager
              </p>

              <p className={styles.heroDesc}>
                A2MaTeX Client Launcher lets you seamlessly download, manage,
                and execute automation tools on your Android devices from one
                centralized desktop application.
              </p>

              <Button
                size="lg"
                leftIcon={<FiDownload size={18} />}
                href="/launcher#download"
              >
                <span>Download for Windows</span>
                <span className={styles.downloadMeta}>
                  x64 • v2.4.0 (.exe / 43.8 MB)
                </span>
              </Button>
            </div>

            {/* Right – live mockup */}
            <div className={styles.heroRight}>
              <div className={styles.mockup}>
                {/* Mockup top bar */}
                <div className={styles.mockupBar}>
                  <div className={styles.mockupDots}>
                    <span className={styles.dotRed} />
                    <span className={styles.dotYellow} />
                    <span className={styles.dotGreen} />
                  </div>
                  <div className={styles.mockupTitle}>
                    <TbPlugConnected size={12} color="#00e5cc" />
                    &nbsp;A2MaTeX Launcher – v2.4.0 [CONNECTED]
                  </div>
                  <div className={styles.mockupLocked}>
                    <BsShieldCheck size={11} /> HKID: LOCKED
                  </div>
                </div>

                {/* Stats row */}
                <div className={styles.mockupStats}>
                  <div className={styles.mockupStat}>
                    <span className={styles.mockupStatLabel}>MEMORY HOOK</span>
                    <span className={styles.mockupStatVal}>18.4 MB</span>
                  </div>
                  <div className={styles.mockupStat}>
                    <span className={styles.mockupStatLabel}>CPU USAGE</span>
                    <span className={styles.mockupStatVal}>0.4 %</span>
                  </div>
                  <div className={styles.mockupStat}>
                    <span className={styles.mockupStatLabel}>ENCLAVE</span>
                    <span className={styles.mockupStatValGreen}>SECURE</span>
                  </div>
                </div>

                {/* Active tools */}
                <div className={styles.mockupSection}>
                  <span className={styles.mockupSectionLabel}>
                    ACTIVE TOOLS
                  </span>
                  {ACTIVE_TOOLS.map((t) => (
                    <div key={t.name} className={styles.toolRow}>
                      <FiCpu size={13} color="#00e5cc" />
                      <span className={styles.toolName}>{t.name}</span>
                      <button
                        className={
                          t.status === "running"
                            ? styles.toolBtnRed
                            : styles.toolBtnGreen
                        }
                      >
                        {t.badge}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Log monitor */}
                <div className={styles.mockupSection}>
                  <div className={styles.logHeader}>
                    <span className={styles.mockupSectionLabel}>
                      REAL-TIME LOG MONITOR
                    </span>
                    <span className={styles.bufferOk}>BUFFER OK</span>
                  </div>
                  {LOG_LINES.map((l) => (
                    <div key={l.time} className={styles.logLine}>
                      <span className={styles.logTime}>[{l.time}]</span>
                      <span className={styles.logMsg}>{l.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quick identify ─────────────────────────────────────── */}
        <section className={styles.quickSection}>
          <div className={styles.container}>
            <div className={styles.quickCard}>
              <div className={styles.quickLeft}>
                <p className={styles.sectionTag}>
                  QUICKLY IDENTIFY YOUR NEEDS.
                </p>
                <h2 className={styles.quickTitle}>
                  Do you just need to run the tool you purchased from the
                  Marketplace?
                </h2>
                <p className={styles.quickDesc}>
                  This is the perfect application for you! There is absolutely
                  no need for coding knowledge, nor do you need to install
                  Python, Node, or Visual Studio. Simply open the Client
                  Launcher, purchase the tool, and click Run.
                </p>
              </div>
              <div className={styles.quickRight}>
                <p className={styles.quickNote}>
                  Need to CREATE / DEVELOP a new tool?{" "}
                  <a href="/studio" className={styles.accentLink}>
                    A2MaTeX Studio
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Core features ──────────────────────────────────────── */}
        <section className={styles.featuresSection}>
          <div className={styles.container}>
            <p className={styles.sectionTag}>INNER TECHNOLOGIES</p>
            <h2 className={styles.sectionTitle}>
              Core features of the Client Launcher
            </h2>
            <p className={styles.sectionSub}>
              Fully optimized to deliver a smooth experience and absolute
              security for every automation tool.
            </p>

            <div className={styles.featuresGrid}>
              {FEATURES.map((f) => (
                <div key={f.title} className={styles.featureCard}>
                  <div className={styles.featureIcon}>{f.icon}</div>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.desc}</p>
                  <p className={styles.featureNote}>
                    <BsShieldCheck size={12} /> {f.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Steps + System Req ─────────────────────────────────── */}
        <section className={styles.bottomSection}>
          <div className={styles.container}>
            <div className={styles.bottomGrid}>
              {/* Steps */}
              <div className={styles.stepsCol}>
                <p className={styles.sectionTag}>INITIAL INTRODUCTION</p>
                <h2 className={styles.sectionTitle}>
                  3 super-fast steps to operate the tool
                </h2>
                <p className={styles.sectionSub}>
                  You can run any automation tool in less than two minutes
                  without needing in-depth technical knowledge.
                </p>

                <div className={styles.steps}>
                  {STEPS.map((s) => (
                    <div key={s.num} className={styles.step}>
                      <div className={styles.stepNum}>{s.num}</div>
                      <div>
                        <h4 className={styles.stepTitle}>{s.title}</h4>
                        <p className={styles.stepDesc}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Requirements */}
              <div className={styles.sysCol}>
                <div className={styles.sysCard}>
                  <h3 className={styles.sysTitle}>
                    <MdOutlineDashboardCustomize size={16} /> System Requirement
                  </h3>

                  <div className={styles.sysRows}>
                    {SYS_REQS.map((r) => (
                      <div key={r.label} className={styles.sysRow}>
                        <span className={styles.sysLabel}>
                          {r.icon} {r.label}
                        </span>
                        <span className={styles.sysVal}>{r.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className={styles.sysNote}>
                    The launcher features an Offline Mode that allows previously
                    authenticated tools to run for up to 30 days without a
                    continuous internet connection.
                  </p>

                  <div className={styles.sysCta}>
                    <p className={styles.sysCtaText}>
                      HAVEN'T HAS ANY TOOL? <br />
                      <a href="/" className={styles.sysCtaLink}>
                        Explore 450+ tool in out market{" "}
                        <GoArrowRight size={13} />
                      </a>
                    </p>
                    <Button href="/">Go to Market →</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────── */}
        <section id="download" className={styles.ctaSection}>
          <Button
            href="/launcher#download"
            leftIcon={<RiLoader4Line size={16} />}
            size="lg"
          >
            Download Launcher Now (.exe)
          </Button>
        </section>
      </div>
    </AppLayout>
  );
};

export default LauncherPage;
