import { ScreeningRepository } from "../data/ScreeningRepository";
import { BookingStatsService } from "./BookingStatsService";
export class ScreeningService {
  private screeningRepository = new ScreeningRepository();
  private bookingStatsService = new BookingStatsService();
  

  listUpcomingScreenings() {
    const screenings = this.screeningRepository.findAll();
    const now = new Date();

    const result = [];

    for (const screening of screenings) {
      if (new Date(screening.startsAt) < now) continue;

      const taken = this.bookingStatsService.countTakenSeats(screening.id);

      result.push({
        id: screening.id,
        movie: screening.movie,
        room: screening.room,
        startsAt: screening.startsAt,
        price: screening.price,
        remaining: this.bookingStatsService.countRemainingSeats(
          screening.capacity,
          taken
        ),
      });
    }

    return result;
  }
}
