import express from "express";
import { domainErrorHandler } from "./adapters/in/http/domainErrorHandler";
import { httpRouter } from "./adapters/in/http/httpRouter";
import { ConsoleNotifier } from "./adapters/out/notification/ConsoleNotifier";
import { FakePaymentGateway } from "./adapters/out/payment/FakePaymentGateway";
import { InMemoryBookingRepository } from "./adapters/out/persistence/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "./adapters/out/persistence/InMemoryScreeningRepository";
import { SystemClock } from "./adapters/out/system/SystemClock";
import { UuidGenerator } from "./adapters/out/system/UuidGenerator";
import { BookSeatsService } from "./application/usecases/BookSeatsService";
import { CancelBookingService } from "./application/usecases/CancelBookingService";
import { ListMyBookingsService } from "./application/usecases/ListMyBookingsService";
import { ListUpcomingScreeningsService } from "./application/usecases/ListUpcomingScreeningsService";
import { Screening } from "./domain/types";

const HOUR = 60 * 60 * 1000;
const inHours = (h: number) => new Date(Date.now() + h * HOUR);

const screenings: Screening[] = [
  { id: "s1", movie: "Dune: Part Three", room: "Salle 1", startsAt: inHours(24), price: 1150, capacity: 120 },
  { id: "s2", movie: "Le Comte de Monte-Cristo", room: "Salle 2", startsAt: inHours(48), price: 1050, capacity: 80 },
  { id: "s3", movie: "Avant-première surprise", room: "Salle 3", startsAt: inHours(1), price: 900, capacity: 4 },
];

const screeningRepo = new InMemoryScreeningRepository(screenings);
const bookingRepo = new InMemoryBookingRepository();
const payment = new FakePaymentGateway(() => Math.random() > 0.05); // comme le legacy
const notifier = new ConsoleNotifier();
const clock = new SystemClock();

const useCases = {
  bookSeats: new BookSeatsService(screeningRepo, bookingRepo, payment, notifier, clock, new UuidGenerator()),
  cancelBooking: new CancelBookingService(bookingRepo, screeningRepo, notifier, clock),
  listUpcomingScreenings: new ListUpcomingScreeningsService(screeningRepo, bookingRepo, clock),
  listMyBookings: new ListMyBookingsService(bookingRepo, screeningRepo),
};

const app = express();
app.use(express.json());
app.use(httpRouter(useCases));
app.use(domainErrorHandler);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`CinéResa sur http://localhost:${PORT}`));
}

export default app;