
import { BookingRepository } from "../data/BookingRepository";
import { ScreeningRepository } from "../data/ScreeningRepository";
import { BookingError } from "./BookingError";
import { Payment } from "../data/Payment";
import { Mailer } from "../data/Mailer";
import { BookingStatsService } from "./BookingStatsService";
import { calculatePrice } from "./price";

const MAX_SEATS_PER_BOOKING = 6;
const CANCELLATION_DEADLINE_MS = 2 * 60 * 60 * 1000;
export class BookingService {
  private bookingRepository = new BookingRepository();
  private screeningRepository = new ScreeningRepository();
  private bookingStatsService = new BookingStatsService();
  private payment = new Payment();
  private mailer = new Mailer();
  
  
listBookings(email: string) {
  const bookings = this.bookingRepository.findAll();
  const screenings = this.screeningRepository.findAll();

  return bookings
    .filter((b: any) => b.email === email)
    .map((b: any) => {
      const screening = screenings.find(
        (s: any) => s.id === b.screeningId
      );

      return {
        ...b,
        movie: screening ? screening.movie : "?",
        startsAt: screening ? screening.startsAt : null,
      };
    });
}


createBooking(
  screeningId: string,
  email: any,
  seatsInput: any,
  tariff: any
) {
  const screening = this.screeningRepository.findById(screeningId);

  if (!screening) {
    throw new BookingError("SCREENING_NOT_FOUND", "Séance introuvable");
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new BookingError("INVALID_EMAIL", "Email invalide");
  }

  const seats = Number(seatsInput);

  if (!Number.isInteger(seats) || seats < 1 || seats > MAX_SEATS_PER_BOOKING) {
    throw new BookingError(
      "INVALID_SEATS",
      `Entre 1 et ${MAX_SEATS_PER_BOOKING} places par réservation`
    );
  }

  if (new Date(screening.startsAt) <= new Date()) {
    throw new BookingError(
      "SCREENING_STARTED",
      "La séance a déjà commencé"
    );
    
  }
  const taken = this.bookingStatsService.countTakenSeats(screening.id);

  if (taken + seats > screening.capacity) {
    throw new BookingError("NOT_ENOUGH_SEATS", "Plus assez de places");
  }

  const total = calculatePrice(screening.price, seats, tariff);

  if (!this.payment.pay()) {
    throw new BookingError("PAYMENT_REFUSED", "Paiement refusé");
  }

  const booking = {
    id: "b" + Date.now(),
    screeningId: screening.id,
    email: email,
    seats: seats,
    tariff: tariff === "STUDENT" ? "STUDENT" : "NORMAL",
    total: total,
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  };

  this.bookingRepository.saveBooking(booking);

  this.mailer.sendConfirmation(
    email,
    booking.id,
    screening.movie,
    seats,
    total
  );

  return booking;
}

cancelBooking(id: string) {
  const booking = this.bookingRepository.findById(id);

  if (!booking) {
    throw new BookingError(
      "BOOKING_NOT_FOUND",
      "Réservation introuvable"
    );
  }

  if (booking.status === "CANCELLED") {
    throw new BookingError("ALREADY_CANCELLED", "Déjà annulée");
  }

  const screening = this.screeningRepository.findById(
    booking.screeningId
  );

  const diff =
    new Date(screening.startsAt).getTime() - new Date().getTime();

  if (diff < CANCELLATION_DEADLINE_MS) {
    throw new BookingError(
      "CANCELLATION_TOO_LATE",
      "Annulation impossible moins de 2h avant la séance"
    );
  }

  booking.status = "CANCELLED";
  booking.cancelledAt = new Date().toISOString();

  this.bookingRepository.saveBooking(booking);

  this.mailer.sendCancellation(
    booking.email,
    booking.id,
    booking.total
  );

  return booking;
}


}
