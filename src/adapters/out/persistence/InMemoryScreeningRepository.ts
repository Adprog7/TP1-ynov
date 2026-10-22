import { ScreeningRepository } from "../../../application/ports/out/ScreeningRepository";
import { Screening } from "../../../domain/types";

export class InMemoryScreeningRepository implements ScreeningRepository {
  constructor(private readonly screenings: Screening[] = []) {}

  async findById(id: string): Promise<Screening | undefined> {
    return this.screenings.find((s) => s.id === id);
  }
}