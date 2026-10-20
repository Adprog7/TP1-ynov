
const STUDENT_DISCOUNT = 0.7;
const GROUP_DISCOUNT_THRESHOLD = 4;
const GROUP_DISCOUNT = 0.9;

export function calculatePrice(
  price: number,
  seats: number,
  tariff: string
): number {
  let unit = price;

  if (tariff === "STUDENT") {
    unit = Math.round(unit * STUDENT_DISCOUNT);
  }

  let total = unit * seats;

  if (seats >= GROUP_DISCOUNT_THRESHOLD) {
    total = Math.round(total * GROUP_DISCOUNT);
  }

  return total;
}
