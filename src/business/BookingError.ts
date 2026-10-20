export class BookingError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "BookingError";
  }
}
