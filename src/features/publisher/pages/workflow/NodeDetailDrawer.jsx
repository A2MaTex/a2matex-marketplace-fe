import { FiX } from "react-icons/fi";
import styles from "./NodeDetailDrawer.module.css";

const displayValue = (value) => {
  if (value === null) return "null";
  if (typeof value === "string") return value || "(empty string)";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
};

const ValueBlock = ({ value }) => {
  const complex = value !== null && typeof value === "object";
  return complex ? <pre>{displayValue(value)}</pre> : <span>{displayValue(value)}</span>;
};

const orderedEntries = (values, schema) => {
  const source = values ?? {};
  const schemaKeys = Object.keys(schema?.properties ?? {});
  const extraKeys = Object.keys(source).filter((key) => !schemaKeys.includes(key));
  return [...schemaKeys, ...extraKeys].flatMap((key) =>
    Object.hasOwn(source, key) ? [[key, source[key]]] : [],
  );
};

const fieldTitle = (schema, key) => schema?.properties?.[key]?.title || key;

const NodeDetailDrawer = ({ node, definition, issues = [], onClose }) => {
  if (!node) return null;
  const configEntries = orderedEntries(node.config, definition?.configSchema);
  const bindingEntries = orderedEntries(node.bindings, definition?.inputSchema);
  return (
    <aside className={styles.drawer} aria-label="Node details">
      <header className={styles.header}>
        <div>
          <p>Node detail</p>
          <h2>{node.name?.trim() || definition?.displayName || node.type}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close node details">
          <FiX aria-hidden="true" />
        </button>
      </header>

      <div className={styles.body}>
        <section className={styles.identity}>
          <span className={styles.type}>{node.type}</span>
          <p>{definition?.description || node.description || "No catalog description is available."}</p>
          <dl>
            <div><dt>Status</dt><dd>{node.disabled ? "Disabled" : "Enabled"}</dd></div>
            <div><dt>Error policy</dt><dd>{node.errorPolicy}</dd></div>
          </dl>
        </section>

        {issues.length > 0 ? (
          <section className={styles.issues}>
            <h3>Validation issues</h3>
            <ul>
              {issues.map((issue, index) => (
                <li key={`${issue.code ?? "issue"}-${index}`}>
                  <strong>{issue.code || "ISSUE"}</strong>
                  <span>{issue.message || "Unknown validation issue"}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h3>Configuration</h3>
            <span>{configEntries.length}</span>
          </div>
          {configEntries.length > 0 ? (
            <dl className={styles.values}>
              {configEntries.map(([key, value]) => (
                <div key={key}>
                  <dt>{fieldTitle(definition?.configSchema, key)}</dt>
                  <dd><ValueBlock value={value} /></dd>
                </div>
              ))}
            </dl>
          ) : <p className={styles.empty}>No configuration values.</p>}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h3>Bindings</h3>
            <span>{bindingEntries.length}</span>
          </div>
          {bindingEntries.length > 0 ? (
            <dl className={styles.values}>
              {bindingEntries.map(([key, binding]) => (
                <div key={key}>
                  <dt>
                    {fieldTitle(definition?.inputSchema, key)}
                    <span className={styles.kind}>{binding?.kind || "unknown"}</span>
                  </dt>
                  <dd>
                    <ValueBlock
                      value={binding?.kind === "literal" && Object.hasOwn(binding, "value")
                        ? binding.value
                        : binding}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          ) : <p className={styles.empty}>No input bindings.</p>}
        </section>
      </div>
    </aside>
  );
};

export default NodeDetailDrawer;
