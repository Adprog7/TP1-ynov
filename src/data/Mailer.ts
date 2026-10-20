
export class Mailer {
  sendConfirmation(
    email: string,
    bookingId: string,
    movie: string,
    seats: number,
    total: number
  ): void {
    console.log(
      `[SMTP] To: ${email} — Votre réservation ${bookingId} pour "${movie}" ` +
        `(${seats} place(s), ${(total / 100).toFixed(2)} €) est confirmée.`
    );
  }

  sendCancellation(
    email: string,
    bookingId: string,
    total: number
  ): void {
    console.log(
      `[SMTP] To: ${email} — Votre réservation ${bookingId} a été annulée. Remboursement : ${(total / 100).toFixed(2)} €`
    );
  }
}
