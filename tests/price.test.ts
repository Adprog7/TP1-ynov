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

  it("applique la réduction étudiante sur 2 places", () => {
    expect(calculatePrice(1150, 2, "STUDENT")).toBe(1610);
  });

  it("applique la réduction de groupe sur 4 places au tarif normal", () => {
    expect(calculatePrice(1150, 4, "NORMAL")).toBe(4140);
  });

  it("cumule réduction étudiante et réduction de groupe sur 4 places", () => {
    expect(calculatePrice(1150, 4, "STUDENT")).toBe(2898);
  });
});

describe("countRemainingSeats", () => {
  it("calcule les places restantes", () => {
    const service = new BookingStatsService();
    expect(service.countRemainingSeats(120, 35)).toBe(85);
  });
});
