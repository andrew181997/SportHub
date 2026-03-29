import { describe, it, expect } from "vitest";
import { sanitizeHtml, stripHtml, truncateHtml } from "../sanitize";

describe("sanitizeHtml", () => {
  it("removes script tags", () => {
    expect(sanitizeHtml('<p>Hello</p><script>alert("xss")</script>')).toBe(
      "<p>Hello</p>"
    );
  });

  it("removes event handlers", () => {
    const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain("onerror");
  });

  it("removes iframe tags", () => {
    expect(sanitizeHtml('<iframe src="evil.com"></iframe>')).toBe("");
  });

  it("removes javascript: protocol", () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain("javascript:");
  });

  it("keeps allowed tags", () => {
    const input = "<p>Hello <strong>world</strong></p>";
    expect(sanitizeHtml(input)).toBe(input);
  });

  it("keeps allowed attributes", () => {
    const input = '<a href="https://example.com">link</a>';
    expect(sanitizeHtml(input)).toContain('href="https://example.com"');
  });
});

describe("stripHtml", () => {
  it("removes all HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe(
      "Hello world"
    );
  });

  it("handles empty strings", () => {
    expect(stripHtml("")).toBe("");
  });
});

describe("truncateHtml", () => {
  it("truncates long text", () => {
    const result = truncateHtml("<p>" + "a".repeat(200) + "</p>", 50);
    expect(result.length).toBeLessThanOrEqual(52);
    expect(result).toContain("…");
  });

  it("does not truncate short text", () => {
    expect(truncateHtml("<p>Short</p>", 100)).toBe("Short");
  });
});
