import { Router } from "express";
import { BookSeats } from "../../../application/ports/in/BookSeats";

export function bookSeatsRouter(bookSeats: BookSeats): Router {
  const router = Router();

  router.post("/screenings/:id/bookings", async (req, res, next) => {
    try {
      const booking = await bookSeats.execute({
        screeningId: req.params.id,
        email: req.body.email,
        seats: Number(req.body.seats),
        tariff: req.body.tariff,
      });
      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  });

  return router;
}