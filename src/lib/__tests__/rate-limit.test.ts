import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../rate-limit";

describe("checkRateLimit", () => {
  it("allows requests within limit", () => {
    const result = checkRateLimit("test-ip-1", "api");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it("blocks requests exceeding limit", () => {
    const ip = "test-ip-block-" + Date.now();
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, "login");
    }
    const result = checkRateLimit(ip, "login");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("uses separate counters for different identifiers", () => {
    const ip1 = "rate-test-a-" + Date.now();
    const ip2 = "rate-test-b-" + Date.now();

    for (let i = 0; i < 4; i++) {
      checkRateLimit(ip1, "otp");
    }

    const result = checkRateLimit(ip2, "otp");
    expect(result.allowed).toBe(true);
  });

  it("returns reset time", () => {
    const ip = "rate-test-reset-" + Date.now();
    const result = checkRateLimit(ip, "api");
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});
