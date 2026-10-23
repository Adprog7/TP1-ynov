import { NextFunction, Request, RequestHandler, Response, Router } from "express";
import { BookSeats } from "../../../application/ports/in/BookSeats";
import { CancelBooking } from "../../../application/ports/in/CancelBooking";
import { ListMyBookings } from "../../../application/ports/in/ListMyBooking";
import { ListUpcomingScreenings } from "../../../application/ports/in/ListUpcommingScreenings";

export interface UseCases {
  bookSeats: BookSeats;
  cancelBooking: CancelBooking;
  listUpcomingScreenings: ListUpcomingScreenings;
  listMyBookings: ListMyBookings;
}

// Évite de répéter le try/catch dans chaque route (Express 4 ne capte pas les promesses rejetées)
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

export function httpRouter(useCases: UseCases): Router {
  const router = Router();

  router.get(
    "/screenings",
    asyncHandler(async (_req, res) => {
      res.json(await useCases.listUpcomingScreenings.execute());
    })
  );

  router.post(
    "/screenings/:id/bookings",
    asyncHandler(async (req, res) => {
      const booking = await useCases.bookSeats.execute({
        screeningId: req.params.id,
        email: req.body.email,
        seats: Number(req.body.seats),
        tariff: req.body.tariff,
      });
      res.status(201).json(booking);
    })
  );

  router.delete(
    "/bookings/:id",
    asyncHandler(async (req, res) => {
      res.json(await useCases.cancelBooking.execute({ bookingId: req.params.id }));
    })
  );

  router.get(
    "/bookings",
    asyncHandler(async (req, res) => {
      res.json(await useCases.listMyBookings.execute({ email: req.query.email as string }));
    })
  );

  return router;
}