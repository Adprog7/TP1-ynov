import { Booking } from "../../../domain/types";

export interface Notifier {
  bookingConfirmed(booking: Booking, movie: string): Promise<void>;
  bookingCancelled(booking: Booking): Promise<void>;
}