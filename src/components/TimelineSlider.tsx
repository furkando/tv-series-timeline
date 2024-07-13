import React, { useState, useEffect } from "react";
import moment from "moment";

import { Slider } from "@/components/ui/slider";

interface Episode {
  air_date: string;
  episode_number: number;
  id: number;
  season_number: number;
}

interface TimelineSliderProps {
  episodes: Episode[];
  onDateRangeChange: (start: string, end: string) => void;
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({
  episodes,
  onDateRangeChange,
}) => {
  const [range, setRange] = useState<number[]>([0, 100]);

  // Sort episodes by air_date
  const sortedEpisodes = episodes.sort((a, b) =>
    moment(a.air_date).diff(moment(b.air_date))
  );

  const startMoment = moment(sortedEpisodes[0].air_date);
  const endMoment = moment(sortedEpisodes[sortedEpisodes.length - 1].air_date);
  const totalDays = endMoment.diff(startMoment, "days");

  const handleChange = (newValue: number[]) => {
    setRange(newValue);

    const startDate = startMoment
      .clone()
      .add((newValue[0] / 100) * totalDays, "days")
      .format("YYYY-MM-DD");
    const endDate = startMoment
      .clone()
      .add((newValue[1] / 100) * totalDays, "days")
      .format("YYYY-MM-DD");

    onDateRangeChange(startDate, endDate);
  };

  // Function to get episode info based on slider position
  const getEpisodeInfo = (value: number) => {
    const daysFromStart = (value / 100) * totalDays;
    const currentDate = startMoment.clone().add(daysFromStart, "days");

    const closestEpisode = sortedEpisodes.reduce((prev, curr) => {
      return Math.abs(moment(curr.air_date).diff(currentDate)) <
        Math.abs(moment(prev.air_date).diff(currentDate))
        ? curr
        : prev;
    });

    return `S${closestEpisode.season_number}E${closestEpisode.episode_number}`;
  };

  return (
    <div className="w-full py-4">
      <Slider
        defaultValue={range}
        max={100}
        step={1}
        onValueChange={handleChange}
      />
      <div className="flex justify-between mt-2 text-sm text-gray-600">
        <div>
          <span>
            {startMoment
              .clone()
              .add((range[0] / 100) * totalDays, "days")
              .format("YYYY-MM-DD")}
          </span>
          <span> ({getEpisodeInfo(range[0])})</span>
        </div>
        <div>
          <span>
            {startMoment
              .clone()
              .add((range[1] / 100) * totalDays, "days")
              .format("YYYY-MM-DD")}
          </span>
          <span> ({getEpisodeInfo(range[1])})</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;
