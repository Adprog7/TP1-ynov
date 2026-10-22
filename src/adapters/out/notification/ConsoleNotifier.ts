import { Notifier } from "../../../application/ports/out/Notifier";
import { Booking } from "../../../domain/types";

export class ConsoleNotifier implements Notifier {
  async bookingConfirmed(booking: Booking, movie: string): Promise<void> {
    console.log(
      `[SMTP] To: ${booking.email} — Votre réservation ${booking.id} pour "${movie}" ` +
        `(${booking.seats} place(s), ${(booking.total / 100).toFixed(2)} €) est confirmée.`
    );
  }
}