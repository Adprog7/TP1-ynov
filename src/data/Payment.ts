
const PAYMENT_FAILURE_RATE = 0.05;

export class Payment {
  pay(): boolean {
    return Math.random() > PAYMENT_FAILURE_RATE;
  }
}
