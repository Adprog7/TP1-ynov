import express from "express";
import { bookSeatsRouter } from "./adapters/in/http/bookSeatsRouter";
import { domainErrorHandler } from "./adapters/in/http/domainErrorHandler";
import { ConsoleNotifier } from "./adapters/out/notification/ConsoleNotifier";
import { FakePaymentGateway } from "./adapters/out/payment/FakePaymentGateway";
import { InMemoryBookingRepository } from "./adapters/out/persistence/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "./adapters/out/persistence/InMemoryScreeningRepository";
import { SystemClock } from "./adapters/out/system/SystemClock";
import { UuidGenerator } from "./adapters/out/system/UuidGenerator";
import { BookSeatsService } from "./application/usecases/BookSeatsService";
import { readDb } from "./data/JsonDatabase";
import { Screening } from "./domain/types";
import legacyRouter from "./presentation/routes";

// Séances de départ : lues dans db.json, converties avec de vraies Date
const screenings: Screening[] = readDb().screenings.map((s: any) => ({
  ...s,
  startsAt: new Date(s.startsAt),
}));

const bookSeats = new BookSeatsService(
  new InMemoryScreeningRepository(screenings),
  new InMemoryBookingRepository(),
  new FakePaymentGateway(() => Math.random() > 0.05), // comme le legacy : ~1 refus sur 20
  new ConsoleNotifier(),
  new SystemClock(),
  new UuidGenerator()
);

const app = express();
app.use(express.json());
app.use(bookSeatsRouter(bookSeats));
app.use(legacyRouter); // lister, annuler, mes réservations : inchangées jusqu'au TP3
app.use(domainErrorHandler);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`CinéResa sur http://localhost:${PORT}`));
}

export default app;