import { describe, expect, it } from "vitest";
import { InMemoryBookingRepository } from "../src/adapters/out/persistence/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "../src/adapters/out/persistence/InMemoryScreeningRepository";
import { FakePaymentGateway } from "../src/adapters/out/payment/FakePaymentGateway";
import { SpyNotifier } from "./helps/SpyNotifier";
import { BookSeatsService } from "../src/application/usecases/BookSeatsService";
import { Booking, Screening } from "../src/domain/types";

const NOW = new Date("2026-10-20T10:00:00Z");

const upcoming: Screening = {
  id: "s1",
  movie: "Dune",
  room: "Salle 1",
  startsAt: new Date("2026-10-20T18:00:00Z"),
  price: 1000, // 10 €
  capacity: 10,
};

const started: Screening = {
  ...upcoming,
  id: "s2",
  startsAt: new Date("2026-10-20T09:00:00Z"),
};

// Notifier « espion » : mémorise les appels

function existingBooking(seats: number): Booking {
  return {
    id: "old",
    screeningId: "s1",
    email: "old@b.fr",
    seats,
    tariff: "NORMAL",
    total: 0,
    status: "CONFIRMED",
    createdAt: NOW,
  };
}

function setup(options: { paid?: boolean; existing?: Booking[] } = {}) {
  const bookings = new InMemoryBookingRepository(options.existing ?? []);
  const notifier = new SpyNotifier();
  const service = new BookSeatsService(
    new InMemoryScreeningRepository([upcoming, started]),
    bookings,
    new FakePaymentGateway(() => options.paid ?? true),
    notifier,
    { now: () => NOW },
    { next: () => "b1" }
  );
  return { service, bookings, notifier };
}

const validCommand = { screeningId: "s1", email: "a@b.fr", seats: 2, tariff: "NORMAL" };

describe("BookSeatsService", () => {
  it("réserve des places, calcule le prix (4 places étudiant = 2 520 centimes pour 10 €) et notifie le client", async () => {
    const { service, bookings, notifier } = setup();

    const booking = await service.execute({ ...validCommand, seats: 4, tariff: "STUDENT" });

    expect(booking.id).toBe("b1");
    expect(booking.total).toBe(2520);
    expect(booking.status).toBe("CONFIRMED");
    expect(bookings.all()).toHaveLength(1);
    expect(notifier.confirmed).toHaveLength(1);
    expect(notifier.confirmed[0].movie).toBe("Dune");
  });

  it("refuse si la capacité de la salle est dépassée", async () => {
    const { service } = setup({ existing: [existingBooking(9)] });

    await expect(service.execute({ ...validCommand, seats: 2 })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Plus assez de places",
    });
  });

  it("refuse une séance déjà commencée (code CONFLICT)", async () => {
    const { service } = setup();

    await expect(service.execute({ ...validCommand, screeningId: "s2" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "La séance a déjà commencé",
    });
  });

  it("refuse plus de 6 places (code INVALID)", async () => {
    const { service } = setup();

    await expect(service.execute({ ...validCommand, seats: 7 })).rejects.toMatchObject({
      code: "INVALID",
    });
  });

  it("refuse un email invalide (code INVALID)", async () => {
    const { service } = setup();

    await expect(service.execute({ ...validCommand, email: "nope" })).rejects.toMatchObject({
      code: "INVALID",
      message: "Email invalide",
    });
  });

  it("refuse une séance inconnue (code NOT_FOUND)", async () => {
    const { service } = setup();

    await expect(service.execute({ ...validCommand, screeningId: "s99" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("n'enregistre rien et ne notifie pas si le paiement est refusé (code PAYMENT_REFUSED)", async () => {
    const { service, bookings, notifier } = setup({ paid: false });

    await expect(service.execute(validCommand)).rejects.toMatchObject({
      code: "PAYMENT_REFUSED",
    });

    expect(bookings.all()).toHaveLength(0);
    expect(notifier.confirmed).toHaveLength(0);
  });
});