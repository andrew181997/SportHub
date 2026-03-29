import { describe, it, expect } from "vitest";
import { getSportConfig, getPositionsForSport, getEventTypesForSport, SPORT_CONFIGS } from "../sport-config";

describe("getSportConfig", () => {
  it("returns hockey config", () => {
    const config = getSportConfig("HOCKEY");
    expect(config.label).toBe("Хоккей");
    expect(config.terminology.period).toBe("Период");
    expect(config.terminology.periods).toBe(3);
  });

  it("returns football config", () => {
    const config = getSportConfig("FOOTBALL");
    expect(config.label).toBe("Футбол");
    expect(config.terminology.period).toBe("Тайм");
    expect(config.terminology.periods).toBe(2);
  });

  it("returns basketball config", () => {
    const config = getSportConfig("BASKETBALL");
    expect(config.terminology.period).toBe("Четверть");
    expect(config.terminology.periods).toBe(4);
  });
});

describe("getPositionsForSport", () => {
  it("returns hockey positions", () => {
    const positions = getPositionsForSport("HOCKEY");
    expect(positions.map((p) => p.value)).toContain("GOALIE");
    expect(positions.map((p) => p.value)).toContain("FORWARD");
  });

  it("returns football positions", () => {
    const positions = getPositionsForSport("FOOTBALL");
    expect(positions.map((p) => p.value)).toContain("MIDFIELDER");
    expect(positions.map((p) => p.value)).toContain("DEFENDER");
  });

  it("returns volleyball positions", () => {
    const positions = getPositionsForSport("VOLLEYBALL");
    expect(positions.map((p) => p.value)).toContain("SETTER");
    expect(positions.map((p) => p.value)).toContain("LIBERO");
  });
});

describe("getEventTypesForSport", () => {
  it("hockey has GOAL and ASSIST", () => {
    const types = getEventTypesForSport("HOCKEY");
    const values = types.map((t) => t.value);
    expect(values).toContain("GOAL");
    expect(values).toContain("ASSIST");
  });

  it("football has cards", () => {
    const types = getEventTypesForSport("FOOTBALL");
    const values = types.map((t) => t.value);
    expect(values).toContain("YELLOW_CARD");
    expect(values).toContain("RED_CARD");
  });

  it("all sports have at least GOAL", () => {
    for (const sport of Object.keys(SPORT_CONFIGS)) {
      const types = getEventTypesForSport(sport as keyof typeof SPORT_CONFIGS);
      expect(types.map((t) => t.value)).toContain("GOAL");
    }
  });
});
