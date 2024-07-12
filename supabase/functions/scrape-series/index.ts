// supabase/functions/scrape-series/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";

const MOVIE_API_URL = "https://api.themoviedb.org/3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const fetchWrapper = async (url: string, options?: RequestInit) => {
  // Fetch series details and episode data from TMDB API
  const tmdbApiKey = Deno.env.get("TMDB_API_KEY") as string;

  const response = await fetch(url, {
    ...(options || {}),
    headers: {
      ...(options?.headers || {}),
      "Authorization": `Bearer ${tmdbApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return response.json();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { seriesId } = await req.json();
    console.info(`Scraping series for ${seriesId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existingSeries, error } = await supabase
      .from("series")
      .select("id, series_id, is_scraped")
      .eq("series_id", seriesId)
      .single();

    if (error) {
      console.error(
        `Error fetching series for ${seriesId}. Error: ${error.message}`,
      );
    }

    if (existingSeries?.is_scraped) {
      return new Response(
        JSON.stringify({ message: "Series already scraped" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const seriesDetails = await fetchWrapper(
      `${MOVIE_API_URL}/tv/${seriesId}`,
    );

    const { data: series, error: isError } = await supabase
      .from("series")
      .upsert({
        id: existingSeries?.id,
        series_id: seriesId,
        is_scraped: false,
        start_at: seriesDetails.first_air_date,
        end_at: seriesDetails.last_air_date,
      })
      .select().single();

    if (isError) {
      throw new Error(`Error inserting series for ${seriesId}`);
    }

    for (const season of seriesDetails.seasons) {
      console.info(
        `Scraping ${seriesDetails.name} Season ${season.season_number}`,
      );
      const seasonDetails = await fetchWrapper(
        `${MOVIE_API_URL}/tv/${seriesId}/season/${season.season_number}`,
      );
      for (const episode of seasonDetails.episodes) {
        console.info(
          `Scraping ${seriesDetails.name} Season ${season.season_number} Episode ${episode.episode_number}`,
        );

        const { data: creditData } = await supabase
          .from("episode_credits")
          .select("*")
          .eq("series_id", series.id)
          .eq("season_number", season.season_number)
          .eq("episode_number", episode.episode_number)
          .single();

        if (creditData) {
          continue;
        }

        const episodeDetails = await fetchWrapper(
          `${MOVIE_API_URL}/tv/${seriesId}/season/${season.season_number}/episode/${episode.episode_number}`,
        );
        const credits = await fetchWrapper(
          `${MOVIE_API_URL}/tv/${seriesId}/season/${season.season_number}/episode/${episode.episode_number}/credits`,
        );

        let cast = credits.cast;
        if (!cast || cast.length === 0) {
          continue;
        }

        if (credits.guest_stars) {
          cast = cast.concat(credits.guest_stars);
        }

        await supabase.from("episode_credits").insert({
          series_id: series.id,
          season_number: season.season_number,
          episode_number: episode.episode_number,
          air_date: episodeDetails.air_date,
          credits: credits.cast,
        });
      }
    }

    await supabase
      .from("series")
      .update({
        is_scraped: true,
      })
      .eq("series_id", seriesId);

    return new Response(
      JSON.stringify({ message: "Scraping completed successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
