import { useMemo } from "react";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowUpRight,
  FiBox,
  FiInfo,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import {
  buildSubmissionNodeIndex,
  decodeSubmissionWorkflowRevision,
  resolveSubmissionNode,
} from "../model/adminSubmissionWorkflow";
import { compactId } from "../model/adminSubmissionPresentation";
import JsonInspector from "./JsonInspector";
import styles from "../page/AdminSubmissionReview.module.css";

const GROUPS = [
  { severity: "ERROR", label: "Errors", icon: FiAlertCircle },
  { severity: "WARNING", label: "Warnings", icon: FiAlertTriangle },
  { severity: "INFO", label: "Information", icon: FiInfo },
];

export default function ScanFindings({ findings, revision, submissionId, catalog }) {
  const nodeIndex = useMemo(() => {
    try {
      return buildSubmissionNodeIndex(
        decodeSubmissionWorkflowRevision(revision),
        catalog,
      );
    } catch {
      return new Map();
    }
  }, [catalog, revision]);

  if (!findings.length) {
    return <p className={styles.noFindings}>The scanner reported no individual findings.</p>;
  }
  return (
    <div className={styles.findingGroups}>
      {GROUPS.map(({ severity, label, icon: Icon }) => {
        const items = findings.filter((finding) => finding.severity === severity);
        if (!items.length) return null;
        return (
          <section className={`${styles.findingGroup} ${styles[`finding${severity}`]}`} key={severity}>
            <header><Icon /><h3>{label}</h3><span>{items.length}</span></header>
            <ol>
              {items.map((finding, index) => {
                const node = finding.nodeId
                  ? resolveSubmissionNode(nodeIndex, finding.nodeId)
                  : null;
                return (
                  <li key={`${finding.code}:${finding.nodeId ?? "global"}:${index}`}>
                    <div className={styles.findingHeading}>
                      <code>{finding.code}</code>
                      {!finding.nodeId ? <span>Submission-wide finding</span> : null}
                    </div>
                    {finding.nodeId ? (
                      node ? (
                        <Link
                          className={styles.findingNode}
                          to={`/admin/submissions/${submissionId}/workflows/${encodeURIComponent(node.workflowKey)}?node=${encodeURIComponent(node.id)}`}
                          title={`Frozen node ID: ${node.id}`}
                        >
                          <FiBox aria-hidden="true" />
                          <span>
                            <strong>{node.name}</strong>
                            <small>{node.type} · {node.workflowLabel}{node.ambiguous ? " · duplicate ID" : ""}</small>
                          </span>
                          <FiArrowUpRight aria-hidden="true" />
                        </Link>
                      ) : (
                        <div className={styles.findingNodeUnavailable}>
                          <FiBox aria-hidden="true" />
                          <span><strong>Node unavailable in frozen graph</strong><small title={finding.nodeId}>{compactId(finding.nodeId)}</small></span>
                        </div>
                      )
                    ) : null}
                    <p>{finding.message}</p>
                    {finding.details ? (
                      <JsonInspector title="Opaque scanner details" value={finding.details} compact />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
