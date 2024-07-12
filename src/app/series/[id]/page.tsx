"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TVSeries } from "@/types";
import TimelineSlider from "@/components/TimelineSlider";
import dynamic from "next/dynamic";
import moment from "moment";

const CharacterBubbleChart = dynamic(
  () => import("@/components/CharacterBubbleChart"),
  { ssr: false }
);

interface CharacterFrequency {
  name: string;
  frequency: number;
}

export default function SeriesDetail() {
  const { id } = useParams();
  const [series, setSeries] = useState<TVSeries | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrapingComplete, setIsScrapingComplete] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [characterData, setCharacterData] = useState<CharacterFrequency[]>([]);

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
        checkScrapingStatus(seriesId);
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

  const handleDateRangeChange = (start: string, end: string) => {
    if (id) {
      fetchCharacterData(Number(id), start, end);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!series) {
    return <div>Series not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{series?.name}</h1>
      <p className="mb-4">{series?.overview}</p>
      {isScrapingComplete ? (
        <>
          <p className="text-green-600 mb-4">Data scraping complete!</p>
          {startDate && endDate && (
            <TimelineSlider
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={handleDateRangeChange}
            />
          )}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Character Frequency</h2>
            <div className="w-full h-[600px] overflow-hidden">
              <CharacterBubbleChart data={characterData} />
            </div>
          </div>
        </>
      ) : (
        <p>Scraping episode data... This may take a few minutes.</p>
      )}
    </div>
  );
}
