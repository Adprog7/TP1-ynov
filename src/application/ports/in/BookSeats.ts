import { Booking } from "../../../domain/types";

export interface BookSeatsCommand {
  screeningId: string;
  email: string;
  seats: number;
  tariff: string;
}

export interface BookSeats {
  execute(command: BookSeatsCommand): Promise<Booking>;
}