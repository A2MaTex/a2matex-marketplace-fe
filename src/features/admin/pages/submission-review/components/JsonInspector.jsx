import { FiCode } from "react-icons/fi";
import styles from "../page/AdminSubmissionReview.module.css";

const MAX_PREVIEW_CHARACTERS = 4_096;

export default function JsonInspector({ title, value, compact = false }) {
  const serialized = JSON.stringify(value, null, 2);
  const truncated = serialized.length > MAX_PREVIEW_CHARACTERS;
  return (
    <details className={`${styles.jsonInspector} ${compact ? styles.jsonInspectorCompact : ""}`}>
      <summary><FiCode />{title}{truncated ? <span>Preview limited</span> : null}</summary>
      <pre>{truncated ? `${serialized.slice(0, MAX_PREVIEW_CHARACTERS)}\n…` : serialized}</pre>
    </details>
  );
}
