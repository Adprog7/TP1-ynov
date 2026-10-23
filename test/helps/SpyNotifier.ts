import { Notifier } from "../../src/application/ports/out/Notifier";
import { Booking } from "../../src/domain/types";

export class SpyNotifier implements Notifier {
  confirmed: { booking: Booking; movie: string }[] = [];
  cancelled: Booking[] = [];

  async bookingConfirmed(booking: Booking, movie: string): Promise<void> {
    this.confirmed.push({ booking, movie });
  }

  async bookingCancelled(booking: Booking): Promise<void> {
    this.cancelled.push(booking);
  }
}