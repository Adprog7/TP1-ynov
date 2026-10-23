import { Booking } from "../../../domain/types";

export type MyBookingView = Booking & { movie: string; startsAt: Date | null };

export interface ListMyBookings {
  execute(query: { email: string }): Promise<MyBookingView[]>;
}