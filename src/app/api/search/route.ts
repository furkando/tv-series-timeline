import { NextResponse } from "next/server";
import { searchTVSeries } from "@/lib/tmdb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const results = await searchTVSeries(query);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while searching for TV series" },
      { status: 500 }
    );
  }
}
