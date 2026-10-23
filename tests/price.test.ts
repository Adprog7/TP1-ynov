import { describe, expect, it } from "vitest";
import { computeTotal, remainingSeats } from "../src/domain/rules";

describe("computeTotal", () => {
  it("calcule le prix normal", () => expect(computeTotal(1150, 2, "NORMAL")).toBe(2300));
  it("applique la réduction étudiante", () => expect(computeTotal(1000, 1, "STUDENT")).toBe(700));
  it("applique la réduction de groupe", () => expect(computeTotal(1000, 4, "NORMAL")).toBe(3600));
  it("étudiant, 2 places", () => expect(computeTotal(1150, 2, "STUDENT")).toBe(1610));
  it("normal, 4 places", () => expect(computeTotal(1150, 4, "NORMAL")).toBe(4140));
  it("étudiant, 4 places", () => expect(computeTotal(1150, 4, "STUDENT")).toBe(2898));
});

describe("remainingSeats", () => {
  it("calcule les places restantes", () => expect(remainingSeats(120, 35)).toBe(85));
});