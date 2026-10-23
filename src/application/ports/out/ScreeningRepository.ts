import { Screening } from "../../../domain/types";

export interface ScreeningRepository {
  findById(id: string): Promise<Screening | undefined>;
  findStartingAfter(date: Date): Promise<Screening[]>;
}