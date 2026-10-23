import { Booking } from "../../../domain/types";

export interface BookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByEmail(email: string): Promise<Booking[]>;
  countConfirmedSeats(screeningId: string): Promise<number>;
  save(booking: Booking): Promise<void>;
}