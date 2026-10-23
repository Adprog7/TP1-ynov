import { BookingRepository } from "../../../application/ports/out/BookingRepository";
import { Booking } from "../../../domain/types";
import { BookingRecord, JsonFile } from "./JsonFile";

function toDomain(r: BookingRecord): Booking {
  const booking: Booking = {
    id: r.id,
    screeningId: r.screeningId,
    email: r.email,
    seats: r.seats,
    tariff: r.tariff,
    total: r.total,
    status: r.status,
    createdAt: new Date(r.createdAt),
  };
  if (r.cancelledAt) booking.cancelledAt = new Date(r.cancelledAt);
  return booking;
}

function toRecord(b: Booking): BookingRecord {
  const record: BookingRecord = {
    id: b.id,
    screeningId: b.screeningId,
    email: b.email,
    seats: b.seats,
    tariff: b.tariff,
    total: b.total,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
  };
  if (b.cancelledAt) record.cancelledAt = b.cancelledAt.toISOString();
  return record;
}

export class JsonBookingRepository implements BookingRepository {
  constructor(private readonly file: JsonFile) {}

  async findById(id: string): Promise<Booking | null> {
    const record = this.file.read().bookings.find((b) => b.id === id);
    return record ? toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Booking[]> {
    return this.file.read().bookings.filter((b) => b.email === email).map(toDomain);
  }

  async countConfirmedSeats(screeningId: string): Promise<number> {
    return this.file
      .read()
      .bookings.filter((b) => b.screeningId === screeningId && b.status === "CONFIRMED")
      .reduce((total, b) => total + b.seats, 0);
  }

  async save(booking: Booking): Promise<void> {
    const data = this.file.read();
    const index = data.bookings.findIndex((b) => b.id === booking.id);
    if (index === -1) data.bookings.push(toRecord(booking));
    else data.bookings[index] = toRecord(booking);
    this.file.write(data);
  }
}