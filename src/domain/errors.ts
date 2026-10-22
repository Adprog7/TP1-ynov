export type DomainErrorCode = "NOT_FOUND" | "INVALID" | "CONFLICT" | "PAYMENT_REFUSED";

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string
  ) {
    super(message);
    this.name = "DomainError";
  }
}