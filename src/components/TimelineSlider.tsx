import React, { useState, useEffect } from "react";
import moment from "moment";

import { Slider } from "@/components/ui/slider";

interface TimelineSliderProps {
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
}) => {
  const [range, setRange] = useState<number[]>([0, 100]);

  const startMoment = moment(startDate);
  const endMoment = moment(endDate);
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

  return (
    <div className="w-full py-4">
      <Slider
        defaultValue={range}
        max={100}
        step={1}
        onValueChange={handleChange}
      />
      <div className="flex justify-between mt-2 text-sm text-gray-600">
        <span>
          {startMoment
            .clone()
            .add((range[0] / 100) * totalDays, "days")
            .format("YYYY-MM-DD")}
        </span>
        <span>
          {startMoment
            .clone()
            .add((range[1] / 100) * totalDays, "days")
            .format("YYYY-MM-DD")}
        </span>
      </div>
    </div>
  );
};

export default TimelineSlider;
