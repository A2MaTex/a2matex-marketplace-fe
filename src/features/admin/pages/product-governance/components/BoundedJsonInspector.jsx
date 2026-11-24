import { useState } from "react";
import styles from "../page/AdminProductGovernance.module.css";

const DEFAULT_LIMIT = 4096;

export default function BoundedJsonInspector({ value, limit = DEFAULT_LIMIT }) {
  const [expanded, setExpanded] = useState(false);
  const serialized = JSON.stringify(value, null, 2);
  const truncated = serialized.length > limit;
  const visible = truncated && !expanded
    ? `${serialized.slice(0, limit)}\n…`
    : serialized;
  return (
    <div className={styles.jsonInspector}>
      <pre>{visible}</pre>
      {truncated ? (
        <button type="button" className={styles.textButton} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show less" : `Show all ${serialized.length.toLocaleString()} characters`}
        </button>
      ) : null}
    </div>
  );
}
