import { assertBookable, assertValidEmail, assertValidSeats, computeTotal } from "../../domain/rules";
import { DomainError } from "../../domain/errors";
import { Booking, Tariff } from "../../domain/types";
import { BookSeats, BookSeatsCommand } from "../ports/in/BookSeats";
import { BookingRepository } from "../ports/out/BookingRepository";
import { Clock } from "../ports/out/Clock";
import { IdGenerator } from "../ports/out/IdGenerator";
import { Notifier } from "../ports/out/Notifier";
import { PaymentGateway } from "../ports/out/PaymentGateway";
import { ScreeningRepository } from "../ports/out/ScreeningRepository";

export class BookSeatsService implements BookSeats {
  constructor(
    private readonly screenings: ScreeningRepository,
    private readonly bookings: BookingRepository,
    private readonly payment: PaymentGateway,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(command: BookSeatsCommand): Promise<Booking> {
    // Même ordre que le legacy : séance, email, places, début, capacité, paiement
    const screening = await this.screenings.findById(command.screeningId);
    if (!screening) throw new DomainError("NOT_FOUND", "Séance introuvable");

    assertValidEmail(command.email);
    assertValidSeats(command.seats);

    const taken = await this.bookings.countConfirmedSeats(screening.id);
    assertBookable(screening, command.seats, taken, this.clock.now());

    const tariff: Tariff = command.tariff === "STUDENT" ? "STUDENT" : "NORMAL";
    const total = computeTotal(screening.price, command.seats, tariff);

    if (!(await this.payment.charge(total))) {
      throw new DomainError("PAYMENT_REFUSED", "Paiement refusé");
    }

    const booking: Booking = {
      id: this.ids.next(),
      screeningId: screening.id,
      email: command.email,
      seats: command.seats,
      tariff,
      total,
      status: "CONFIRMED",
      createdAt: this.clock.now(),
    };
    await this.bookings.save(booking);
    await this.notifier.bookingConfirmed(booking, screening.movie);
    return booking;
  }
}