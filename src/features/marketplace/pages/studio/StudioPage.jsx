import AppLayout from "@components/layout/AppLayout";
import styles from "./StudioPage.module.css";

import { FiDownload, FiMonitor, FiPackage, FiBook } from "react-icons/fi";
import {
  BsNodePlus,
  BsShieldCheck,
  BsBoxArrowUpRight,
  BsTerminal,
  BsGrid3X3Gap,
} from "react-icons/bs";
import {
  MdOutlineAutoAwesome,
  MdOutlineDashboardCustomize,
  MdOutlinePublish,
} from "react-icons/md";
import { TbBrandNodejs, TbDragDrop } from "react-icons/tb";
import { RiCodeSSlashLine, RiStore2Line } from "react-icons/ri";
import { SiGitforwindows } from "react-icons/si";
import Button from "@components/common/Button";

/* ─── Data ───────────────────────────────────────────────────────── */

const PLATFORM_STATS = [
  {
    icon: <FiMonitor size={15} />,
    label: "Studio Linux",
    value: "AppImage / .deb",
  },
  {
    icon: <SiGitforwindows size={15} />,
    label: "Studio Mac",
    value: "Apple Silicon (ARM64)",
  },
  {
    icon: <BsShieldCheck size={15} />,
    label: "Multi-platform (x86)",
    value: "118 MB",
  },
];

const PILLARS = [
  {
    icon: <TbDragDrop size={24} />,
    title: "Visual No-Code Builder",
    desc: "Build Android automation workflows through an intuitive drag-and-drop interface. Create powerful automation logic without extensive coding, making development faster, simpler, and more accessible to coders of all skill levels.",
  },
  {
    icon: <BsNodePlus size={24} />,
    title: "Node-Based Workflow Design",
    desc: "Connect reusable nodes to create flexible automation workflows. Organize actions, conditions, and operations visually, simplifying complex logic while improving workflow readability, reusability, and maintainability.",
  },
  {
    icon: <BsGrid3X3Gap size={24} />,
    title: "100+ Built-in Nodes",
    desc: "Access a comprehensive library of ready-to-use nodes for Android actions, logic control, data processing, and workflow automation.",
  },
  {
    icon: <MdOutlinePublish size={24} />,
    title: "One-Click Publishing",
    desc: "Publish completed automation tools directly to the A2MaTeX marketplace. Configure tool details and licensing options, then distribute your creations for customers to discover, purchase, and execute through Client Launcher.",
  },
];

const STEPS = [
  {
    num: 1,
    icon: <TbDragDrop size={18} />,
    title: "Building a Logic Node Diagram",
    desc: "Drag and drop functional blocks from the catalog (HTTP request, browser automation, captcha) and connect the data flow.",
  },
  {
    num: 2,
    icon: <BsTerminal size={18} />,
    title: "Execute Test with Live-Step Debugger",
    desc: "Từng bước thực thi đến đây. Then dừng lại đến điểm đó, inspect response HTTP để có thể breakpoint map thời gian hoạt đồng.",
  },
  {
    num: 3,
    icon: <BsBoxArrowUpRight size={18} />,
    title: "Store Version on Cloud and Publish easily with Developer Hub",
    desc: "Versions saved in A2MaTeX Studio all synchronize with the Developer Hub on the Market website. Simply select your preferred version and publish it with a single click.",
  },
];

const SYS_REQS = [
  { label: "OS", value: "Windows 10/11 (x64, x86), macOS 12+, Ubuntu 20.04+" },
  { label: "CPU", value: "4 Core 3.0+ GHz (Intel i5/Ryzen 5 / Apple M1)" },
  { label: "RAM", value: "Khuyến nghị: 8 GB (16 GB nếu có)" },
  { label: "GPU", value: "660 MB min (DX 11+ / 2.0 GB Compiler)" },
  { label: "Disk space", value: "SSD khuyến nghị, 118 MB" },
];

/* ─── IDE Mockup nodes ───────────────────────────────────────────── */
const NODES = [
  { label: "Trigger", color: "#6366f1", x: 8, y: 50 },
  { label: "License Check", color: "#00e5cc", x: 28, y: 50 },
  { label: "Upload Video", color: "#f59e0b", x: 48, y: 30 },
  { label: "Verify", color: "#22c55e", x: 68, y: 50 },
  { label: "Error Handler", color: "#ef4444", x: 58, y: 78 },
];

/* ─── Component ─────────────────────────────────────────────────── */

const StudioPage = () => {
  return (
    <AppLayout>
      <div className={styles.page}>
        {/* ══ Hero ════════════════════════════════════════════════ */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              STUDIO v2.4.0 &nbsp;/&nbsp; FOR TOOL DEVELOPMENT
            </div>

            <h1 className={styles.heroTitle}>A2MaTeX Visual Studio</h1>
            <p className={styles.heroSubtitle}>
              Design, Develop &amp; Package Tool .EXE
            </p>

            <p className={styles.heroDesc}>
              A2MaTeX Studio empowers developers to visually design, build,
              test, and publish Android automation workflows with an intuitive,
              node-based development environment. 1-click thanh thử (exe) Không
              mất thêm.
            </p>

            {/* Download button */}
            <div className={styles.heroCtas}>
              <Button
                leftIcon={<FiDownload size={17} />}
                href={"/studio#download"}
              >
                <span>Download A2MaTeX Visual Studio cho Windows (x64)</span>
                <span className={styles.downloadMeta}>v2.4.0 • 118 MB</span>
              </Button>
              <Button
                variant={"ghost"}
                size={"md"}
                leftIcon={<FiBook size={15} />}
              >
                Quick Instruction
              </Button>
            </div>

            {/* Platform stats */}
            <div className={styles.platformRow}>
              <span className={styles.platformLabel}>
                Multi-platform support
              </span>
              {PLATFORM_STATS.map((s) => (
                <div key={s.label} className={styles.platformStat}>
                  {s.icon}
                  <span className={styles.platformStatName}>{s.label}</span>
                  <span className={styles.platformStatVal}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ IDE Mockup ══════════════════════════════════════════ */}
        <section className={styles.mockupSection}>
          <div className={styles.container}>
            <div className={styles.ide}>
              {/* title bar */}
              <div className={styles.ideBar}>
                <div className={styles.ideDots}>
                  <span className={styles.dotRed} />
                  <span className={styles.dotYellow} />
                  <span className={styles.dotGreen} />
                </div>
                <span className={styles.ideTitle}>
                  <RiCodeSSlashLine size={12} color="#00e5cc" /> A2MaTeX Studio
                </span>
                <span className={styles.ideWorkflow}>My Video Workflow ▾</span>
                <div className={styles.ideActions}>
                  <span className={styles.idePill}>+ Add Node</span>
                  <span className={styles.idePillGreen}>▶ Run Workflow</span>
                </div>
                <span className={styles.ideReady}>● Ready</span>
              </div>

              {/* body */}
              <div className={styles.ideBody}>
                {/* sidebar */}
                <div className={styles.ideSidebar}>
                  {["Login", "Projects", "Workflow", "Settings"].map(
                    (item, i) => (
                      <div
                        key={item}
                        className={`${styles.sideItem} ${i === 2 ? styles.sideActive : ""}`}
                      >
                        {i === 0 && <FiMonitor size={13} />}
                        {i === 1 && <FiPackage size={13} />}
                        {i === 2 && <TbBrandNodejs size={13} />}
                        {i === 3 && <MdOutlineDashboardCustomize size={13} />}
                        <span>{item}</span>
                      </div>
                    ),
                  )}
                </div>

                {/* node palette */}
                <div className={styles.palette}>
                  <span className={styles.paletteTitle}>Node Palette</span>
                  <span className={styles.paletteGroup}>▸ Core</span>
                  {[
                    "Trigger",
                    "License Check",
                    "Upload Video",
                    "Verify",
                    "Error Handler",
                  ].map((n) => (
                    <div key={n} className={styles.paletteNode}>
                      {n}
                    </div>
                  ))}
                  <span className={styles.paletteGroup}>▸ Utilities</span>
                  {["Custom Script", "Wait", "Condition"].map((n) => (
                    <div key={n} className={styles.paletteNode}>
                      {n}
                    </div>
                  ))}
                </div>

                {/* canvas */}
                <div className={styles.canvas}>
                  <svg
                    className={styles.canvasSvg}
                    viewBox="0 0 500 160"
                    preserveAspectRatio="none"
                  >
                    {/* edges */}
                    <line
                      x1="72"
                      y1="80"
                      x2="118"
                      y2="80"
                      stroke="#1e2537"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="192"
                      y1="80"
                      x2="238"
                      y2="50"
                      stroke="#1e2537"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="192"
                      y1="80"
                      x2="238"
                      y2="110"
                      stroke="#1e2537"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="312"
                      y1="50"
                      x2="358"
                      y2="80"
                      stroke="#1e2537"
                      strokeWidth="1.5"
                    />
                    <line
                      x1="312"
                      y1="110"
                      x2="358"
                      y2="80"
                      stroke="#1e2537"
                      strokeWidth="1.5"
                    />
                  </svg>
                  {NODES.map((n) => (
                    <div
                      key={n.label}
                      className={styles.canvasNode}
                      style={{
                        left: `${n.x}%`,
                        top: `${n.y}%`,
                        borderColor: n.color,
                      }}
                    >
                      <span
                        className={styles.canvasNodeDot}
                        style={{ background: n.color }}
                      />
                      {n.label}
                    </div>
                  ))}
                </div>

                {/* properties panel */}
                <div className={styles.propsPanel}>
                  <span className={styles.propsPanelTitle}>
                    Node Properties
                  </span>
                  <div className={styles.propRow}>
                    <span className={styles.propKey}>License Check</span>
                  </div>
                  <div className={styles.propTabs}>
                    <span className={styles.propTabActive}>General</span>
                    <span className={styles.propTab}>Advanced</span>
                  </div>
                  <span className={styles.propKey}>Node Name</span>
                  <div className={styles.propInput}>License Check</div>
                  <span className={styles.propKey}>API Endpoint</span>
                  <div className={styles.propInput}>
                    https://a2matex.io/verify
                  </div>
                  <span className={styles.propKey}>API Key</span>
                  <div className={styles.propInput}>{"{{API_KEY}}"}</div>
                  <span className={styles.propKey}>Timeout (seconds)</span>
                  <div className={styles.propInput}>30</div>
                  <div className={styles.propToggleRow}>
                    <span className={styles.propKey}>Continue on Failure</span>
                    <span className={styles.propToggle} />
                  </div>
                </div>
              </div>

              {/* log bar */}
              <div className={styles.ideLog}>
                {[
                  "[2025-05-18 14:22:01] Node 'Trigger' Ready to run: My Video Workflow",
                  "[2025-05-18 14:22:03] 0 ready, 2 selections",
                  "[2025-05-18 14:22:05] Trigger node waiting for trigger...",
                ].map((l, i) => (
                  <div key={i} className={styles.logLine}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ Dev & Creator CTA ═══════════════════════════════════ */}
        <section className={styles.devCta}>
          <div className={styles.container}>
            <div className={styles.devCtaCard}>
              <div className={styles.devCtaLeft}>
                <p className={styles.sectionTag}>
                  ONLY FOR DEVELOPER &amp; CREATOR
                </p>
                <h3 className={styles.devCtaTitle}>
                  Automation Logic Design &amp; Profit-Generating Tool
                  Deployment
                </h3>
                <p className={styles.devCtaDesc}>
                  Integrate and reverse engineering algorithms and
                  hardware-based licensing, then list directly on the A2MaTeX
                  Marketplace to earn 85% of recurring revenue.
                </p>
              </div>
              <div className={styles.devCtaRight}>
                <Button href={"/launcher"}>
                  You only want to run TOOL? Download Client Launcher →
                </Button>
                <p className={styles.devCtaFree}>Free · Default to push file</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ 4 Pillars ═══════════════════════════════════════════ */}
        <section className={styles.pillarsSection}>
          <div className={styles.container}>
            <p className={styles.sectionTag}>ARCHITECTURAL STACK</p>
            <h2 className={styles.sectionTitle}>
              The 4 Technological Pillars of Visual IDE Studio
            </h2>
            <p className={styles.sectionSub}>
              Engineered from a high-technical perspective to liberate you from
              repetitive coding tasks, while providing state-of-the-art binary
              defense technologies.
            </p>

            <div className={styles.pillarsGrid}>
              {PILLARS.map((p) => (
                <div key={p.title} className={styles.pillarCard}>
                  <div className={styles.pillarIcon}>{p.icon}</div>
                  <h3 className={styles.pillarTitle}>{p.title}</h3>
                  <p className={styles.pillarDesc}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Steps + Sys Req ═════════════════════════════════════ */}
        <section className={styles.bottomSection}>
          <div className={styles.container}>
            <div className={styles.bottomGrid}>
              {/* Steps */}
              <div className={styles.stepsCol}>
                <p className={styles.sectionTag}>GET STARTED IN MINUTES</p>
                <h2 className={styles.sectionTitle}>
                  3 Steps to Create &amp; Commercialize First Tool
                </h2>
                <div className={styles.steps}>
                  {STEPS.map((s) => (
                    <div key={s.num} className={styles.step}>
                      <div className={styles.stepNum}>{s.num}</div>
                      <div className={styles.stepContent}>
                        <div className={styles.stepTitleRow}>
                          {s.icon}
                          <h4 className={styles.stepTitle}>{s.title}</h4>
                        </div>
                        <p className={styles.stepDesc}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Requirements */}
              <div className={styles.sysCol}>
                <div className={styles.sysCard}>
                  <div className={styles.sysTitleRow}>
                    <h3 className={styles.sysTitle}>
                      Recommended Computer Configuration
                    </h3>
                    <span className={styles.sysBadge}>ML / 3T GPU+</span>
                  </div>
                  <div className={styles.sysRows}>
                    {SYS_REQS.map((r) => (
                      <div key={r.label} className={styles.sysRow}>
                        <span className={styles.sysLabel}>{r.label}</span>
                        <span className={styles.sysVal}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className={styles.sysNote}>
                    <BsShieldCheck size={11} /> Máy tính bạn đã đủ điều kiện để
                    cài đặt và sử dụng A2MaTeX Visual Studio tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ Final CTA ═══════════════════════════════════════════ */}
        <section id="download" className={styles.finalCta}>
          <div className={styles.finalCtaInner}>
            <MdOutlineAutoAwesome size={32} color="#00e5cc" />
            <h2 className={styles.finalCtaTitle}>
              Ready to become Automation tool Developer?
            </h2>
            <p className={styles.finalCtaDesc}>
              Download Visual IDE Studio today, start building your first tool,
              and unlock a new stream of income within the A2MaTeX Marketplace
              ecosystem.
            </p>
            <div className={styles.finalCtaBtns}>
              <Button size={"lg"} href="#" variant={"primary"}>
                <FiDownload size={16} /> Download Installer Local - 118 MB
              </Button>
              <Button size={"lg"} href="/" variant={"ghost"}>
                <RiStore2Line size={16} /> Explore Marketplace
              </Button>
            </div>
            <p className={styles.finalCtaNote}>
              Miễn phí cài đặt • Chạy trên Windows, Linux, macOS • A2MaTeX Free
              Certificates
            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default StudioPage;
