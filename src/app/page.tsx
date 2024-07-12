"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TVSeries } from "@/types";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TVSeries[]>([]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(searchQuery)}`
      );
      const results = await response.json();
      setSearchResults(results);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">TV Series Tracker</h1>
      <div className="flex space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Search TV series"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchResults?.map((series) => (
          <Link href={`/series/${series.id}`} key={series.id}>
            <div key={series.id} className="border p-4 rounded">
              <h2 className="text-xl font-semibold">{series.name}</h2>
              {/* <p clafssName="text-sm text-gray-600">{series.overview}</p> */}
              <Image
                src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                alt={series.name}
                width={500}
                height={750}
              />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
