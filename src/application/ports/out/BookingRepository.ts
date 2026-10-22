import { Booking } from "../../../domain/types";

export interface BookingRepository {
  countConfirmedSeats(screeningId: string): Promise<number>;
  save(booking: Booking): Promise<void>;
}