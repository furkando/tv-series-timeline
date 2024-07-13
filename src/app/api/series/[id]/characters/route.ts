import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Start date and end date are required" },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabase
      .from("episode_credits")
      .select("*, series(series_id)")
      .eq("series.series_id", id)
      .not("series", "is", null)
      .gte("air_date", startDate)
      .lte("air_date", endDate);

    if (error) throw error;

    const characterFrequency: { [key: string]: any } = {};

    data.forEach((episode) => {
      episode.credits.forEach(
        (credit: { id: number; character: string; profile_path: string }) => {
          if (!credit.character) return;

          const character = credit.character.toLowerCase().replace(
            "(voice)",
            "",
          );
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
        },
      );
    });

    const characterData = Object.values(characterFrequency).sort(
      (a, b) => b.frequency - a.frequency,
    ).map((character) => ({
      ...character,
      text: character.name,
      value: character.frequency,
    }));

    return NextResponse.json(characterData);
  } catch (error) {
    console.error("Error fetching character frequency:", error);
    return NextResponse.json(
      { error: "Failed to fetch character frequency" },
      { status: 500 },
    );
  }
}
