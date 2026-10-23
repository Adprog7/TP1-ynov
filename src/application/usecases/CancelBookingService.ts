import { assertCancellable, assertNotAlreadyCancelled } from "../../domain/rules";
import { DomainError } from "../../domain/errors";
import { Booking } from "../../domain/types";
import { CancelBooking, CancelBookingCommand } from "../ports/in/CancelBooking";
import { BookingRepository } from "../ports/out/BookingRepository";
import { Clock } from "../ports/out/Clock";
import { Notifier } from "../ports/out/Notifier";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class CancelBookingService implements CancelBooking {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly screenings: ScreeningRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock
  ) {}

  async execute(command: CancelBookingCommand): Promise<Booking> {
    const booking = await this.bookings.findById(command.bookingId);
    if (!booking) throw new DomainError("NOT_FOUND", "Réservation introuvable");
    assertNotAlreadyCancelled(booking);

    // Comportement legacy conservé : séance disparue = erreur technique (500), pas une erreur métier
    const screening = await this.screenings.findById(booking.screeningId);
    if (!screening) throw new Error(`Séance ${booking.screeningId} introuvable`);

    const now = this.clock.now();
    assertCancellable(screening, now);

    const cancelled: Booking = { ...booking, status: "CANCELLED", cancelledAt: now };
    await this.bookings.save(cancelled);
    await this.notifier.bookingCancelled(cancelled);
    return cancelled;
  }
}