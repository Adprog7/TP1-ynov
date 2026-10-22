import { BookingRepository } from "../../../application/ports/out/BookingRepository";
import { Booking } from "../../../domain/types";

export class InMemoryBookingRepository implements BookingRepository {
  private readonly bookings: Booking[];

  constructor(initial: Booking[] = []) {
    this.bookings = [...initial];
  }

  async countConfirmedSeats(screeningId: string): Promise<number> {
    return this.bookings
      .filter((b) => b.screeningId === screeningId && b.status === "CONFIRMED")
      .reduce((total, b) => total + b.seats, 0);
  }

  async save(booking: Booking): Promise<void> {
    const index = this.bookings.findIndex((b) => b.id === booking.id);
    if (index === -1) this.bookings.push(booking);
    else this.bookings[index] = booking;
  }

  // Utile pour les tests : vérifier ce qui a été enregistré
  all(): Booking[] {
    return [...this.bookings];
  }
}