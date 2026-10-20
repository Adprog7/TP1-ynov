import { describe, it, expect } from "vitest";
import { calculatePrice } from "../src/business/price";
import { BookingStatsService } from "../src/business/BookingStatsService";

describe("calculatePrice", () => {
  it("calcule le prix normal", () => {
    expect(calculatePrice(1150, 2, "NORMAL")).toBe(2300);
  });

  it("applique la réduction étudiante", () => {
    expect(calculatePrice(1000, 1, "STUDENT")).toBe(700);
  });

  it("applique la réduction de groupe", () => {
    expect(calculatePrice(1000, 4, "NORMAL")).toBe(3600);
  });
});

describe("countRemainingSeats", () => {
  it("calcule les places restantes", () => {
    const service = new BookingStatsService();
    expect(service.countRemainingSeats(120, 35)).toBe(85);
  });
});
