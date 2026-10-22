import { PaymentGateway } from "../../../application/ports/out/PaymentGateway";

export class FakePaymentGateway implements PaymentGateway {
  constructor(private readonly decide: () => boolean = () => true) {}

  async charge(_amountInCents: number): Promise<boolean> {
    return this.decide();
  }
}