"use client";

import { ChevronLeftIcon } from "@radix-ui/react-icons";
import moment from "moment";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Character } from "@/components/CharacterBubbleChart";
import TimelineSlider from "@/components/TimelineSlider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { debounce } from "@/lib/utils";
import { TVSeries } from "@/types";
import WordCloud from "react-d3-cloud";

const CharacterBubbleChart = dynamic(
  () => import("@/components/CharacterBubbleChart"),
  { ssr: false }
);

export default function SeriesDetail() {
  const { id } = useParams();
  const [series, setSeries] = useState<TVSeries | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrapingComplete, setIsScrapingComplete] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [characterData, setCharacterData] = useState<Character[]>([]);
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
      .select("is_scraped, start_at, end_at")
      .eq("series_id", seriesId)
      .single();

    if (seriesData?.is_scraped) {
      setIsScrapingComplete(true);
      setStartDate(seriesData.start_at);
      setEndDate(seriesData.end_at);
      fetchCharacterData(seriesId, seriesData.start_at, seriesData.end_at);
    } else {
      startScraping(seriesId);
    }

    setIsLoading(false);
  };

  const startScraping = async (seriesId: number) => {
    try {
      const response = await fetch(
        "https://eorjahtiettxyfwqvfdz.supabase.co/functions/v1/scrape-series",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ seriesId }),
        }
      );

      if (response.ok) {
        setTimeout(() => {
          checkScrapingStatus(seriesId);
        }, 5000);
      } else {
        console.error("Failed to start scraping");
      }
      console.log("Scraping started");
    } catch (error) {
      console.error("Error starting scraping:", error);
    }
  };

  const fetchCharacterData = async (
    seriesId: number,
    start: string,
    end: string
  ) => {
    try {
      const response = await fetch(
        `/api/series/${seriesId}/characters?startDate=${moment(start)
          .subtract(1, "day")
          .format("YYYY-MM-DD")}&endDate=${moment(end)
          .add(1, "d")
          .format("YYYY-MM-DD")}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch character data");
      }
      const data = await response.json();
      setCharacterData(data);
    } catch (error) {
      console.error("Error fetching character data:", error);
    }
  };

  const handleDateRangeChange = debounce((start: string, end: string) => {
    if (!id) return;
    fetchCharacterData(Number(id), start, end);
  }, 2000);

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
            onClick={() => window.history.back()}
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
          {startDate && endDate && (
            <TimelineSlider
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={handleDateRangeChange}
            />
          )}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Character Frequency</h2>
            <div className="w-full h-full overflow-hidden ring ring-2 ring-gray-200 rounded-lg">
              {wordCloud ? (
                <WordCloud
                  spiral="rectangular"
                  data={characterData.map((d) => ({
                    text: d.name,
                    value: d.frequency * 15,
                  }))}
                />
              ) : (
                <CharacterBubbleChart data={characterData} />
              )}
            </div>
          </div>
        </>
      ) : (
        <p>Scraping episode data... This may take a few minutes.</p>
      )}
    </div>
  );
}
