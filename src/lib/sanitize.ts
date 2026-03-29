const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "ul", "ol", "li",
  "strong", "em", "u", "s", "b", "i",
  "a", "img",
  "blockquote", "pre", "code",
  "table", "thead", "tbody", "tr", "th", "td",
  "div", "span",
  "figure", "figcaption",
];

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height", "loading"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  "*": ["class", "style"],
};

const TAG_RE = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
const ATTR_RE = /\s([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

function isAllowedAttr(tag: string, attr: string): boolean {
  const tagAttrs = ALLOWED_ATTRS[tag];
  const globalAttrs = ALLOWED_ATTRS["*"];
  if (tagAttrs?.includes(attr)) return true;
  if (globalAttrs?.includes(attr)) return true;
  return false;
}

/**
 * Server-side HTML sanitizer for WYSIWYG content.
 * Strips disallowed tags and attributes to prevent XSS.
 * For a more robust solution, consider using DOMPurify with jsdom.
 */
export function sanitizeHtml(html: string): string {
  let result = html;

  result = result.replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  result = result.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  result = result.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  result = result.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "");
  result = result.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "");
  result = result.replace(/<embed\b[^>]*>/gi, "");

  result = result.replace(TAG_RE, (match, tag: string) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.includes(lower)) return "";

    const cleaned = match.replace(ATTR_RE, (attrMatch, attr: string) => {
      if (isAllowedAttr(lower, attr.toLowerCase())) return attrMatch;
      return "";
    });

    return cleaned;
  });

  result = result.replace(/javascript:/gi, "");
  result = result.replace(/data:text\/html/gi, "");

  return result;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

export function truncateHtml(html: string, maxLength: number): string {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
