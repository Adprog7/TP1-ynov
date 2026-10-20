import { BookingRepository } from "../data/BookingRepository";

export class BookingStatsService {
  private bookingRepository = new BookingRepository();

  countTakenSeats(screeningId: string): number {
    const bookings = this.bookingRepository.findAll();
    let taken = 0;

    for (const booking of bookings) {
      if (
        booking.screeningId === screeningId &&
        booking.status === "CONFIRMED"
      ) {
        taken += booking.seats;
      }
    }

    return taken;
  }
}