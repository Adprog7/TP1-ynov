import { describe, expect, it } from "vitest";
import { InMemoryBookingRepository } from "../src/adapters/out/persistence/InMemoryBookingRepository";
import { InMemoryScreeningRepository } from "../src/adapters/out/persistence/InMemoryScreeningRepository";
import { CancelBookingService } from "../src/application/usecases/CancelBookingService";
import { Booking, Screening } from "../src/domain/types";
import { SpyNotifier } from "./helps/SpyNotifier";

const NOW = new Date("2026-10-20T10:00:00Z");
const TWO_HOURS = 2 * 60 * 60 * 1000;

function screeningAt(startsAt: Date): Screening {
  return { id: "s1", movie: "Dune", room: "Salle 1", startsAt, unitPrice: 1000, capacity: 10 };
}

const confirmed: Booking = {
  id: "b1",
  screeningId: "s1",
  email: "a@b.fr",
  seats: 2,
  tariff: "NORMAL",
  total: 2000,
  status: "CONFIRMED",
  createdAt: NOW,
};

function setup(startsAt: Date, booking: Booking = confirmed) {
  const bookings = new InMemoryBookingRepository([booking]);
  const notifier = new SpyNotifier();
  const service = new CancelBookingService(
    bookings,
    new InMemoryScreeningRepository([screeningAt(startsAt)]),
    notifier,
    { now: () => NOW }
  );
  return { service, bookings, notifier };
}

describe("CancelBookingService", () => {
  it("annule une réservation, l'enregistre et notifie le client", async () => {
    const { service, bookings, notifier } = setup(new Date(NOW.getTime() + 5 * 60 * 60 * 1000));

    const result = await service.execute({ bookingId: "b1" });

    expect(result.status).toBe("CANCELLED");
    expect(result.cancelledAt).toEqual(NOW);
    expect(bookings.all()[0].status).toBe("CANCELLED");
    expect(notifier.cancelled).toHaveLength(1);
  });

  it("refuse une réservation inconnue (NOT_FOUND)", async () => {
    const { service } = setup(new Date(NOW.getTime() + 5 * 60 * 60 * 1000));
    await expect(service.execute({ bookingId: "b0" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuse une réservation déjà annulée (CONFLICT)", async () => {
    const { service } = setup(new Date(NOW.getTime() + 5 * 60 * 60 * 1000), { ...confirmed, status: "CANCELLED" });
    await expect(service.execute({ bookingId: "b1" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Déjà annulée",
    });
  });

  it("accepte l'annulation pile 2 h avant la séance", async () => {
    const { service } = setup(new Date(NOW.getTime() + TWO_HOURS));
    await expect(service.execute({ bookingId: "b1" })).resolves.toMatchObject({ status: "CANCELLED" });
  });

  it("refuse l'annulation une milliseconde avant la limite de 2 h (CONFLICT)", async () => {
    const { service, notifier } = setup(new Date(NOW.getTime() + TWO_HOURS - 1));

    await expect(service.execute({ bookingId: "b1" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Annulation impossible moins de 2h avant la séance",
    });
    expect(notifier.cancelled).toHaveLength(0);
  });
});