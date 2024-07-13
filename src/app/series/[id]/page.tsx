"use client";

import { ChevronLeftIcon } from "@radix-ui/react-icons";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";
import WordCloud from "react-d3-cloud";

import TimelineSlider from "@/components/TimelineSlider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { TVSeries } from "@/types";
import moment from "moment";

const CharacterBubbleChart = dynamic(
  () => import("@/components/CharacterBubbleChart"),
  { ssr: false }
);

export default function SeriesDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [series, setSeries] = useState<TVSeries | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: "", endDate: "" });
  const [episodeData, setEpisodeData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrapingComplete, setIsScrapingComplete] = useState(false);

  const [wordCloud, setWordCloud] = useState(true);

  useEffect(() => {
    const fetchSeriesDetails = async () => {
      if (id) {
        try {
          const response = await fetch(`/api/series/${id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch series details");
          }
          const details = await response.json();
          setSeries(details);
          checkScrapingStatus(Number(id));
        } catch (error) {
          console.error("Error fetching series details:", error);
          setIsLoading(false);
        }
      }
    };

    fetchSeriesDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const checkScrapingStatus = async (seriesId: number) => {
    const { data: seriesData } = await supabase
      .from("series")
      .select("*,episode_credits(*)")
      .eq("series_id", seriesId)
      .single();

    if (!seriesData) {
      startScraping(seriesId);
    }

    if (seriesData?.is_scraped) {
      setDateRange({
        startDate: moment(seriesData.start_at).format("YYYY-MM-DD"),
        endDate: moment(seriesData.end_at).format("YYYY-MM-DD"),
      });
      setEpisodeData(seriesData.episode_credits);
      setIsScrapingComplete(true);
    } else {
      setTimeout(() => {
        checkScrapingStatus(seriesId);
      }, 5000);
    }

    setIsLoading(false);
  };

  const startScraping = async (seriesId: number) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scrape-series`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ seriesId }),
        }
      );

      console.log("Scraping started");
    } catch (error) {
      console.error("Error starting scraping:", error);
    }
  };

  const characterData = useMemo(() => {
    if (!episodeData) return [];

    const characterFrequency: { [key: string]: any } = {};

    episodeData.forEach((episode) => {
      if (
        !moment(episode.air_date).isBetween(
          moment(dateRange.startDate),
          moment(dateRange.endDate),
          "d",
          "[]"
        )
      )
        return;

      episode.credits.forEach(
        (credit: { id: number; character: string; profile_path: string }) => {
          if (!credit.character) return;

          const character = credit.character
            .toLowerCase()
            .replace("(voice)", "");
          if (characterFrequency[character]) {
            characterFrequency[character] = {
              ...characterFrequency[character],
              frequency: characterFrequency[character].frequency + 1,
            };
          } else {
            characterFrequency[character] = {
              id: credit.id,
              name: character,
              image: credit.profile_path,
              frequency: 1,
            };
          }
        }
      );
    });

    const characterCount = Object.keys(characterFrequency).length;
    const totalFrequency = Object.values(characterFrequency).reduce(
      (acc, character) => acc + character.frequency,
      0
    );

    const characterData = Object.values(characterFrequency)
      .sort((a, b) => b.frequency - a.frequency)
      .map((character) => {
        const value = character.frequency;

        return {
          ...character,
          text: character.name,
          value,
        };
      });

    return characterData;
  }, [episodeData, dateRange]);

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex justify-center items-center h-screen">
        Series not found
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => router.push("/")}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold ml-2">{series?.name}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="word-cloud"
            checked={wordCloud}
            onCheckedChange={setWordCloud}
          />
          <Label htmlFor="word-cloud">Word Cloud</Label>
        </div>
      </div>
      {isScrapingComplete ? (
        <>
          <p className="text-lg mb-4 mt-8">
            Select range to view character frequency
          </p>
          {episodeData && (
            <TimelineSlider
              episodes={episodeData}
              onDateRangeChange={handleDateRangeChange}
            />
          )}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Character Frequency</h2>
            <div className="w-full h-full overflow-hidden ring ring-2 ring-gray-200 rounded-lg">
              {wordCloud ? (
                <WordCloud data={characterData} random={() => 0} />
              ) : (
                <CharacterBubbleChart data={characterData} />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-[80vh]">
          Scraping episode data... This may take a few minutes.
        </div>
      )}
    </div>
  );
}
