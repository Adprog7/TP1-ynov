export interface PaymentGateway {
  charge(amountInCents: number): Promise<boolean>;
}