import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Start date and end date are required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("episode_credits")
      .select("*, series(series_id)")
      .eq("series.series_id", id)
      .gte("air_date", startDate)
      .lte("air_date", endDate);

    if (error) throw error;

    const characterFrequency: { [key: string]: number } = {};

    data.forEach((episode) => {
      episode.credits.forEach((credit: { id: number; character: string }) => {
        characterFrequency[credit.character] =
          (characterFrequency[credit.character] || 0) + 1;
      });
    });

    const sortedCharacters = Object.entries(characterFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20) // Get top 20 characters
      .map(([name, frequency]) => ({ name, frequency }));

    return NextResponse.json(sortedCharacters);
  } catch (error) {
    console.error("Error fetching character frequency:", error);
    return NextResponse.json(
      { error: "Failed to fetch character frequency" },
      { status: 500 }
    );
  }
}
