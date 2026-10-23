import express, { Express } from "express";
import path from "path";
import { domainErrorHandler } from "./adapters/in/http/domainErrorHandler";
import { httpRouter } from "./adapters/in/http/httpRouter";
import { ConsoleNotifier } from "./adapters/out/notification/ConsoleNotifier";
import { FakePaymentGateway } from "./adapters/out/payment/FakePaymentGateway";
import { InMemoryBookingRepository } from "./adapters/out/persistence/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "./adapters/out/persistence/InMemoryScreeningRepository";
import { JsonBookingRepository } from "./adapters/out/persistence/JsonBookingRepository";
import { JsonFile } from "./adapters/out/persistence/JsonFile";
import { JsonScreeningRepository } from "./adapters/out/persistence/JsonScreeningRepository";
import { SystemClock } from "./adapters/out/system/SystemClock";
import { UuidGenerator } from "./adapters/out/system/UuidGenerator";
import { BookingRepository } from "./application/ports/out/BookingRepository";
import { Clock } from "./application/ports/out/Clock";
import { IdGenerator } from "./application/ports/out/IdGenerator";
import { Notifier } from "./application/ports/out/Notifier";
import { PaymentGateway } from "./application/ports/out/PaymentGateway";
import { ScreeningRepository } from "./application/ports/out/ScreeningRepository";
import { BookSeatsService } from "./application/usecases/BookSeatsService";
import { CancelBookingService } from "./application/usecases/CancelBookingService";
import { ListMyBookingsService } from "./application/usecases/ListMyBookingsService";
import { ListUpcomingScreeningsService } from "./application/usecases/ListUpcomingScreeningsService";
import { Screening } from "./domain/types";

export interface Adapters {
  screenings: ScreeningRepository;
  bookings: BookingRepository;
  payment: PaymentGateway;
  notifier: Notifier;
  clock: Clock;
  ids?: IdGenerator;
}

export function buildApp(adapters: Adapters): Express {
  const ids = adapters.ids ?? new UuidGenerator();
  const { screenings, bookings, payment, notifier, clock } = adapters;

  const useCases = {
    bookSeats: new BookSeatsService(screenings, bookings, payment, notifier, clock, ids),
    cancelBooking: new CancelBookingService(bookings, screenings, notifier, clock),
    listUpcomingScreenings: new ListUpcomingScreeningsService(screenings, bookings, clock),
    listMyBookings: new ListMyBookingsService(bookings, screenings),
  };

  const app = express();
  app.use(express.json());
  app.use(httpRouter(useCases));
  app.use(domainErrorHandler);
  return app;
}

// Comme le legacy : environ 1 paiement refusé sur 20
const randomPayment = () => new FakePaymentGateway(() => Math.random() > 0.05);

export function memoryAdapters(): Adapters {
  const inHours = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000);
  const screenings: Screening[] = [
    { id: "s1", movie: "Dune: Part Three", room: "Salle 1", startsAt: inHours(24), unitPrice: 1150, capacity: 120 },
    { id: "s2", movie: "Le Comte de Monte-Cristo", room: "Salle 2", startsAt: inHours(48), unitPrice: 1050, capacity: 80 },
    { id: "s3", movie: "Avant-première surprise", room: "Salle 3", startsAt: inHours(1), unitPrice: 900, capacity: 4 },
  ];
  return {
    screenings: new InMemoryScreeningRepository(screenings),
    bookings: new InMemoryBookingRepository(),
    payment: randomPayment(),
    notifier: new ConsoleNotifier(),
    clock: new SystemClock(),
  };
}

export function jsonAdapters(dbPath = path.join(__dirname, "..", "data", "db.json")): Adapters {
  const file = new JsonFile(dbPath);
  return {
    screenings: new JsonScreeningRepository(file),
    bookings: new JsonBookingRepository(file),
    payment: randomPayment(),
    notifier: new ConsoleNotifier(),
    clock: new SystemClock(),
  };
}

// --json en argument, ou PERSISTENCE=json en variable d'environnement
export function chooseAdapters(argv: string[] = process.argv, env = process.env): Adapters {
  const useJson = argv.includes("--json") || env.PERSISTENCE === "json";
  return useJson ? jsonAdapters() : memoryAdapters();
}