export type Tariff = "NORMAL" | "STUDENT";

export interface Screening {
  id: string;
  movie: string;
  room: string;
  startsAt: Date;
  unitPrice: number; // centimes
  capacity: number;
}

export interface Booking {
  id: string;
  screeningId: string;
  email: string;
  seats: number;
  tariff: Tariff;
  total: number; // centimes
  status: "CONFIRMED" | "CANCELLED";
  createdAt: Date;
  cancelledAt?: Date;
}