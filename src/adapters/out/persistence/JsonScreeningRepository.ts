import { ScreeningRepository } from "../../../application/ports/out/ScreeningRepository";
import { Screening } from "../../../domain/types";
import { JsonFile, ScreeningRecord } from "./JsonFile";

// Le mapping fichier -> domaine appartient à l'adapter : ISO -> Date, price -> unitPrice
function toDomain(r: ScreeningRecord): Screening {
  return {
    id: r.id,
    movie: r.movie,
    room: r.room,
    startsAt: new Date(r.startsAt),
    capacity: r.capacity,
    unitPrice: r.price,
  };
}

export class JsonScreeningRepository implements ScreeningRepository {
  constructor(private readonly file: JsonFile) {}

  async findById(id: string): Promise<Screening | null> {
    const record = this.file.read().screenings.find((s) => s.id === id);
    return record ? toDomain(record) : null;
  }

  async findStartingAfter(date: Date): Promise<Screening[]> {
    return this.file
      .read()
      .screenings.map(toDomain)
      .filter((s) => s.startsAt >= date);
  }
}