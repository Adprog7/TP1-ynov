import { Booking } from "../../../domain/types";

export interface CancelBookingCommand {
  bookingId: string;
}

export interface CancelBooking {
  execute(command: CancelBookingCommand): Promise<Booking>;
}