import { useMemo, useRef } from "react";
import { SummernoteEditor } from "@eaeao/summernote-react";
import "@eaeao/summernote-react/styles.css";
import "@eaeao/summernote-react/icons.css";
import DOMPurify from "dompurify";
import styles from "./RichTextEditor.module.css";

const TOOLBAR = [
  ["style", ["style"]],
  ["font", ["bold", "italic", "underline", "strikethrough", "clear"]],
  ["para", ["ul", "ol", "paragraph"]],
  ["insert", ["link", "table", "hr"]],
  ["history", ["undo", "redo"]],
  ["view", ["codeview"]],
];

const sanitizeRichText = (value) =>
  DOMPurify.sanitize(String(value ?? ""), {
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick"],
  });

const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Write rich text…",
  rows = 8,
  disabled = false,
  ariaLabel,
  fieldName,
  ariaRequired = false,
  ariaInvalid = false,
  ariaDescribedBy,
}) => {
  const editorRef = useRef(null);
  const safeValue = useMemo(() => sanitizeRichText(value), [value]);
  const minHeight = `${Math.max(150, rows * 24)}px`;

  if (disabled) {
    return (
      <div
        className={`${styles.wrapper} ${styles.readOnly}`}
        data-product-field={fieldName}
        role="document"
        aria-label={ariaLabel}
        aria-required={ariaRequired}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        style={{ "--rich-editor-min-height": minHeight }}
      >
        {safeValue ? (
          <div
            className={styles.readOnlyContent}
            dangerouslySetInnerHTML={{ __html: safeValue }}
          />
        ) : (
          <p className={styles.empty}>{placeholder}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={styles.wrapper}
      data-product-field={fieldName}
      role="group"
      aria-label={ariaLabel}
      aria-required={ariaRequired}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      tabIndex={-1}
      onFocus={(event) => {
        if (event.target === event.currentTarget) editorRef.current?.focus();
      }}
      style={{ "--rich-editor-min-height": minHeight }}
    >
      <SummernoteEditor
        ref={editorRef}
        value={safeValue}
        onChange={(html) => onChange?.(sanitizeRichText(html))}
        toolbar={TOOLBAR}
        colorScheme="dark"
        theme="lite"
        placeholder={placeholder}
        disableResize={false}
      />
    </div>
  );
};

export default RichTextEditor;
