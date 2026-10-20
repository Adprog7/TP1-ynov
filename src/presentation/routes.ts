
import { Router, Request, Response, NextFunction } from "express";
import { BookingService } from "../business/BookingService";
import { ScreeningService } from "../business/ScreeningService";
import { BookingError } from "../business/BookingError";

const router = Router();

const bookingService = new BookingService();
const screeningService = new ScreeningService();

function handleError(
  error: unknown,
  res: Response,
  next: NextFunction
) {
  if (!(error instanceof BookingError)) {
    return next(error);
  }

  const statusByCode: Record<string, number> = {
    SCREENING_NOT_FOUND: 404,
    BOOKING_NOT_FOUND: 404,
    INVALID_EMAIL: 400,
    INVALID_SEATS: 400,
    SCREENING_STARTED: 409,
    NOT_ENOUGH_SEATS: 409,
    PAYMENT_REFUSED: 402,
    ALREADY_CANCELLED: 409,
    CANCELLATION_TOO_LATE: 409,
  };

  return res
    .status(statusByCode[error.code] ?? 500)
    .json({ error: error.message });
}

router.get("/screenings", (_req, res) => {
  res.json(screeningService.listUpcomingScreenings());
});

router.post(
  "/screenings/:id/bookings",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = bookingService.createBooking(
        req.params.id,
        req.body.email,
        req.body.seats,
        req.body.tariff
      );

      return res.status(201).json(booking);
    } catch (error) {
      return handleError(error, res, next);
    }
  }
);

router.delete(
  "/bookings/:id",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = bookingService.cancelBooking(req.params.id);
      return res.json(booking);
    } catch (error) {
      return handleError(error, res, next);
    }
  }
);

router.get("/bookings", (req, res) => {
  res.json(
    bookingService.listBookings(req.query.email as string)
  );
});

export default router;
