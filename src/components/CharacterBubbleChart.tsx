import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Character {
  name: string;
  frequency: number;
}

interface CharacterBubbleChartProps {
  data: Character[];
}

const CharacterBubbleChart: React.FC<CharacterBubbleChartProps> = ({
  data,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 1200;
    const height = 600;
    svg.attr("width", width).attr("height", height);

    // Filter out any invalid data and sort by frequency
    const validData = data.filter(
      (d) => d.frequency != null && !isNaN(d.frequency) && d.frequency > 0
    );
    const sortedData = validData.sort((a, b) => b.frequency - a.frequency);

    const maxFrequency = d3.max(sortedData, (d) => d.frequency) || 1;

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, maxFrequency])
      .range([10, 50]); // Adjusted max radius to allow for more spacing

    const simulation = d3
      .forceSimulation(sortedData)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("charge", d3.forceManyBody().strength(-30)) // Adjusted repulsion
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((d) => radiusScale(d.frequency) + 5)
          .strength(0.9)
          .iterations(4)
      ); // Adjusted collision force

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Remove old nodes
    svg.selectAll(".node").remove();

    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll(".node")
      .data(sortedData)
      .enter()
      .append("g")
      .attr("class", "node");

    node
      .append("circle")
      .attr("r", (d) => radiusScale(d.frequency))
      .style("fill", (d, i) => color(i.toString()));

    node
      .append("text")
      .attr("dy", ".3em")
      .style("text-anchor", "middle")
      .style(
        "font-size",
        (d) => `${Math.max(8, radiusScale(d.frequency) / 3)}px`
      )
      .text((d) =>
        truncateText(d.name, Math.max(5, radiusScale(d.frequency) / 3))
      );

    node.append("title").text((d) => `${d.name}\nFrequency: ${d.frequency}`);

    simulation.on("tick", () => {
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Add zoom functionality
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        svg.selectAll(".nodes").attr("transform", event.transform);
      });

    svg.call(zoom);

    // Initial zoom to center
    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
    );

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [data]);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, Math.max(3, maxLength - 3)) + "...";
  };

  return <svg ref={svgRef}></svg>;
};

export default CharacterBubbleChart;
