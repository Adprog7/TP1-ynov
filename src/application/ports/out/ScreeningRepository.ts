import { Screening } from "../../../domain/types";

export interface ScreeningRepository {
  findById(id: string): Promise<Screening | null>;
  findStartingAfter(date: Date): Promise<Screening[]>;
}