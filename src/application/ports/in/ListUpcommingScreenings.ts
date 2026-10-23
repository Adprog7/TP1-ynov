export interface ScreeningView {
  id: string;
  movie: string;
  room: string;
  startsAt: Date;
  price: number;
  remaining: number;
}

export interface ListUpcomingScreenings {
  execute(): Promise<ScreeningView[]>;
}