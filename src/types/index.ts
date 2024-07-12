export interface TVSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
}

export interface Actor {
  id: number;
  name: string;
  character: string;
}

export interface Episode {
  id: number;
  name: string;
  season_number: number;
  episode_number: number;
  air_date: string;
}
