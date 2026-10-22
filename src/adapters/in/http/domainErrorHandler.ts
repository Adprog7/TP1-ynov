import { NextFunction, Request, Response } from "express";
import { DomainError, DomainErrorCode } from "../../../domain/errors";

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  NOT_FOUND: 404,
  INVALID: 400,
  CONFLICT: 409,
  PAYMENT_REFUSED: 402,
};

export function domainErrorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (!(error instanceof DomainError)) return next(error);
  res.status(STATUS_BY_CODE[error.code]).json({ error: error.message });
}