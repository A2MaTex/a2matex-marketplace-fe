import { useMemo } from "react";
import DOMPurify from "dompurify";

const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;

const sanitizeProductHtml = (value) => {
  const sanitized = DOMPurify.sanitize(value, {
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["style"],
  });
  const documentNode = new DOMParser().parseFromString(sanitized, "text/html");
  documentNode.querySelectorAll("a[href]").forEach((anchor) => {
    const target = new URL(anchor.getAttribute("href"), window.location.origin);
    if (target.origin !== window.location.origin) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
  });
  return documentNode.body.innerHTML;
};

export default function SafeProductContent({ value, className }) {
  const isHtml = HTML_PATTERN.test(value);
  const sanitized = useMemo(
    () => (isHtml ? sanitizeProductHtml(value) : null),
    [isHtml, value],
  );

  if (!isHtml) return <p className={className}>{value}</p>;

  return (
    <div
      className={className}
      // Publisher copy is rich text, so sanitize it again at the public boundary.
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
