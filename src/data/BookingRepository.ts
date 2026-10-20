
import { readDb, writeDb } from "./JsonDatabase";

export class BookingRepository {
  findAll() {
    const db = readDb();
    return db.bookings;
  }

  findById(id: string) {
    const db = readDb();
    return db.bookings.find((b: any) => b.id === id);
  }

  saveBooking(booking: any) {
    const db = readDb();
    const index = db.bookings.findIndex((b: any) => b.id === booking.id);

    if (index === -1) {
      db.bookings.push(booking);
    } else {
      db.bookings[index] = booking;
    }

    writeDb(db);
    return booking;
  }
}
