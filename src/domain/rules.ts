import { DomainError } from "./errors";
import { Screening, Tariff } from "./types";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const MIN_SEATS_PER_BOOKING = 1;
export const MAX_SEATS_PER_BOOKING = 6;
const STUDENT_FACTOR = 0.7;
const GROUP_FACTOR = 0.9;
const GROUP_MIN_SEATS = 4;

export function assertValidEmail(email: unknown): asserts email is string {
  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    throw new DomainError("INVALID", "Email invalide");
  }
}

export function assertValidSeats(seats: number): void {
  if (!Number.isInteger(seats) || seats < MIN_SEATS_PER_BOOKING || seats > MAX_SEATS_PER_BOOKING) {
    throw new DomainError("INVALID", "Entre 1 et 6 places par réservation");
  }
}

export function assertBookable(
  screening: Screening,
  seats: number,
  alreadyTaken: number,
  now: Date
): void {
  if (screening.startsAt <= now) {
    throw new DomainError("CONFLICT", "La séance a déjà commencé");
  }
  if (alreadyTaken + seats > screening.capacity) {
    throw new DomainError("CONFLICT", "Plus assez de places");
  }
}

export function computeTotal(unitPrice: number, seats: number, tariff: Tariff): number {
  let unit = unitPrice;
  if (tariff === "STUDENT") unit = Math.round(unit * STUDENT_FACTOR);
  let total = unit * seats;
  if (seats >= GROUP_MIN_SEATS) total = Math.round(total * GROUP_FACTOR);
  return total;
}