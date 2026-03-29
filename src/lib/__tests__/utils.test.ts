import { describe, it, expect } from "vitest";
import { formatDate, formatDateLong, slugify, formatNumber, cn } from "../utils";

describe("formatDate", () => {
  it("formats date as DD.MM.YYYY", () => {
    expect(formatDate("2025-03-15")).toBe("15.03.2025");
  });

  it("handles Date objects", () => {
    expect(formatDate(new Date(2025, 2, 15))).toBe("15.03.2025");
  });
});

describe("formatDateLong", () => {
  it("formats date with month name in Russian", () => {
    const result = formatDateLong("2025-03-15");
    expect(result).toContain("марта");
    expect(result).toContain("2025");
  });
});

describe("slugify", () => {
  it("converts Russian text to Latin slug", () => {
    expect(slugify("Единая Хоккейная Лига")).toBe("edinaya-hokkejnaya-liga");
  });

  it("handles mixed text", () => {
    expect(slugify("My Liga 2025")).toBe("my-liga-2025");
  });

  it("trims to 50 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(50);
  });

  it("removes leading and trailing dashes", () => {
    expect(slugify("--test--")).toBe("test");
  });
});

describe("formatNumber", () => {
  it("formats numbers with Russian locale", () => {
    const result = formatNumber(1000);
    expect(result).toContain("1");
    expect(result).toContain("000");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-2")).toBe("px-2 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden")).toBe("base");
  });
});
