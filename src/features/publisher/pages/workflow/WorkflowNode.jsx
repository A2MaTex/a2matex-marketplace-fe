import { Handle, Position } from "@xyflow/react";
import {
  FiAlertCircle,
  FiBox,
  FiPlay,
  FiSmartphone,
  FiStopCircle,
  FiZap,
} from "react-icons/fi";
import styles from "./WorkflowNode.module.css";

const NodeIcon = ({ data }) => {
  if (data.catalogMissing) return <FiAlertCircle aria-hidden="true" size={14} />;
  if (data.isEntry) return <FiPlay aria-hidden="true" size={14} />;
  if (data.isTerminal) return <FiStopCircle aria-hidden="true" size={14} />;
  if (data.category === "ANDROID") return <FiSmartphone aria-hidden="true" size={14} />;
  if (data.category === "UTILITY") return <FiZap aria-hidden="true" size={14} />;
  return <FiBox aria-hidden="true" size={14} />;
};

const nodeTone = (data) => {
  if (data.catalogMissing) return "warning";
  if (data.isEntry || data.isTerminal) return "flow";
  if (data.category === "ANDROID") return "android";
  if (data.category === "UTILITY") return "utility";
  return "default";
};

const WorkflowNode = ({ data, selected }) => {
  const iconOnly = data.labelMode === "icon";

  return (
    <div
      className={`${styles.node} ${iconOnly ? styles.iconOnly : ""} ${selected ? styles.selected : ""} ${data.disabled ? styles.disabled : ""}`}
      data-tone={nodeTone(data)}
      aria-label={`${data.label}, ${data.nodeType}`}
      title={data.description || data.label}
    >
      {!data.isEntry ? (
        <Handle
          id="in"
          type="target"
          position={Position.Left}
          className={styles.inputHandle}
          isConnectable={false}
        />
      ) : null}

      <div className={styles.body}>
        <span className={styles.icon}>
          <NodeIcon data={data} />
        </span>
        {!iconOnly ? (
          <span className={styles.text}>
            <strong>{data.label}</strong>
            <small className={styles.type}>{data.nodeType}</small>
          </span>
        ) : null}
        <span className={styles.activity} aria-hidden="true" />
      </div>

      {data.outputPorts.map((port, index) => (
        <Handle
          key={port}
          id={port}
          type="source"
          position={Position.Right}
          className={`${styles.outputHandle} ${port === "error" ? styles.errorHandle : ""}`}
          style={{ top: `calc(42% + ${(index - (data.outputPorts.length - 1) / 2) * 16}px)` }}
          isConnectable={false}
        />
      ))}
    </div>
  );
};

export default WorkflowNode;
