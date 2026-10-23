import { remainingSeats } from "../../domain/rules";
import { ListUpcomingScreenings, ScreeningView } from "../ports/in/ListUpcommingScreenings";
import { BookingRepository } from "../ports/out/BookingRepository";
import { Clock } from "../ports/out/Clock";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class ListUpcomingScreeningsService implements ListUpcomingScreenings {
  constructor(
    private readonly screenings: ScreeningRepository,
    private readonly bookings: BookingRepository,
    private readonly clock: Clock
  ) {}

  async execute(): Promise<ScreeningView[]> {
    const upcoming = await this.screenings.findStartingAfter(this.clock.now());
    const views: ScreeningView[] = [];
    for (const s of upcoming) {
      const taken = await this.bookings.countConfirmedSeats(s.id);
      views.push({
        id: s.id,
        movie: s.movie,
        room: s.room,
        startsAt: s.startsAt,
        price: s.price,
        remaining: remainingSeats(s.capacity, taken),
      });
    }
    return views;
  }
}