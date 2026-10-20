
import { readDb } from "./JsonDatabase";

export class ScreeningRepository {
  findAll() {
    const db = readDb();
    return db.screenings;
  }

  findById(id: string) {
    const db = readDb();
    return db.screenings.find((s: any) => s.id === id);
  }
}
