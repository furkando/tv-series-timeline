// supabase/functions/scrape-series/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { seriesId } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if series is already scraped
    const { data: existingData } = await supabase
      .from("series")
      .select("id, series_id, is_scraped")
      .eq("series_id", seriesId)
      .single();

    let series = existingData;

    console.log("Existing data", existingData);

    if (existingData) {
      return new Response(
        JSON.stringify({ message: "Series already scraped" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Fetch series details and episode data from TMDB API
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY") as string;
    const seriesDetails = await fetch(
      `https://api.themoviedb.org/3/tv/${seriesId}`,
      {
        headers: {
          Authorization: `Bearer ${tmdbApiKey}`,
        },
      }
    ).then((res) => res.json());

    console.log("Series details", seriesDetails);

    if (!existingData) {
      const newSeries = await supabase
        .from("series")
        .insert({
          series_id: seriesId,
          is_scraped: false,
          start_at: seriesDetails.first_air_date,
        })
        .select();

      series = newSeries.data[0];
      console.log("New series", series);
    }

    let startDate: string | null = null;
    let endDate: string | null = null;

    for (const season of seriesDetails.seasons) {
      console.log("SCRAPING SEASON ", season.season_number);
      for (let episode = 1; episode <= season.episode_count; episode++) {
        console.log("SCRAPING EPISODE ", episode);
        const episodeDetails = await fetch(
          `https://api.themoviedb.org/3/tv/${seriesId}/season/${season.season_number}/episode/${episode}`,
          {
            headers: {
              Authorization: `Bearer ${tmdbApiKey}`,
            },
          }
        ).then((res) => res.json());
        const credits = await fetch(
          `https://api.themoviedb.org/3/tv/${seriesId}/season/${season.season_number}/episode/${episode}/credits`,
          {
            headers: {
              Authorization: `Bearer ${tmdbApiKey}`,
            },
          }
        ).then((res) => res.json());

        if (!startDate || episodeDetails.air_date < startDate) {
          startDate = episodeDetails.air_date;
        }
        if (!endDate || episodeDetails.air_date > endDate) {
          endDate = episodeDetails.air_date;
        }

        if (!credits.cast || credits.cast.length === 0) {
          continue;
        }

        const res = await supabase
          .from("episode_credits")
          .select("*")
          .eq("series_id", series.id)
          .eq("season_number", season.season_number)
          .eq("episode_number", episode)
          .single();

        if (!res.data) {
          await supabase.from("episode_credits").insert({
            series_id: series.id,
            season_number: season.season_number,
            episode_number: episode,
            air_date: episodeDetails.air_date,
            credits: credits.cast,
          });
        }
      }
    }

    await supabase
      .from("series")
      .update({
        is_scraped: true,
        start_at: startDate,
        end_at: endDate,
      })
      .eq("series_id", seriesId);

    return new Response(
      JSON.stringify({ message: "Scraping completed successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
