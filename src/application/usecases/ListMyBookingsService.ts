import { ListMyBookings, MyBookingView } from "../ports/in/ListMyBooking";
import { BookingRepository } from "../ports/out/BookingRepository";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class ListMyBookingsService implements ListMyBookings {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly screenings: ScreeningRepository
  ) {}

  async execute(query: { email: string }): Promise<MyBookingView[]> {
    const mine = await this.bookings.findByEmail(query.email);
    const views: MyBookingView[] = [];
    for (const b of mine) {
      const s = await this.screenings.findById(b.screeningId);
      views.push({ ...b, movie: s ? s.movie : "?", startsAt: s ? s.startsAt : null });
    }
    return views;
  }
}