import axios from "axios";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${TMDB_API_KEY}`,
  },
});

export const searchTVSeries = async (query: string) => {
  const response = await tmdbApi.get("/search/tv", {
    params: {
      query,
    },
  });
  return response.data.results;
};

export const getSeriesDetails = async (seriesId: number) => {
  const response = await tmdbApi.get(`/tv/${seriesId}`);
  return response.data;
};

export const getEpisodeCredits = async (
  seriesId: number,
  seasonNumber: number,
  episodeNumber: number
) => {
  const response = await tmdbApi.get(
    `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/credits`
  );
  return response.data.cast;
};
