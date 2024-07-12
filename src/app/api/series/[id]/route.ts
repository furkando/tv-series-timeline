import { NextResponse } from "next/server";
import { getSeriesDetails } from "@/lib/tmdb";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const seriesDetails = await getSeriesDetails(Number(id));
    return NextResponse.json(seriesDetails);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch series details" },
      { status: 500 }
    );
  }
}
