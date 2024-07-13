import * as d3 from "d3";
import React, { useEffect, useRef } from "react";

export type Character = {
  id: number;
  name: string;
  image: string;
  frequency: number;
};

type CharacterBubbleChartProps = {
  data: Character[];
};

const CharacterBubbleChart: React.FC<CharacterBubbleChartProps> = ({
  data,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
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
      .range([10, 500]); // Adjusted max radius to allow for more spacing

    const simulation = d3
      .forceSimulation<d3.SimulationNodeDatum & Character>(sortedData)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "charge",
        d3
          .forceManyBody<d3.SimulationNodeDatum & Character>()
          .strength((d) => -radiusScale(d.frequency))
      )
      .force(
        "collide",
        d3
          .forceCollide<d3.SimulationNodeDatum & Character>()
          .radius((d) => radiusScale(d.frequency))
          .strength(0.2)
          .iterations(10)
      );

    const defs = svg.select("defs");
    if (defs.empty()) {
      svg.append("defs");
    }

    const patterns = svg
      .select("defs")
      .selectAll("pattern")
      .data(sortedData, (d: any) => d.id);

    patterns
      .enter()
      .append("pattern")
      .attr("id", (d) => `image-${d.id}`)
      .attr("patternUnits", "objectBoundingBox")
      .attr("width", 1)
      .attr("height", 1)
      .append("image")
      .attr("href", (d) =>
        d.image
          ? `https://image.tmdb.org/t/p/w500/${d.image}`
          : "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
      )
      .attr("width", (d) => radiusScale(d.frequency) * 2)
      .attr("height", (d) => radiusScale(d.frequency) * 2)
      .attr("preserveAspectRatio", "xMidYMid slice");

    patterns
      .select("image")
      .attr("href", (d) =>
        d.image
          ? `https://image.tmdb.org/t/p/w500/${d.image}`
          : "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
      )
      .attr("width", (d) => radiusScale(d.frequency) * 2)
      .attr("height", (d) => radiusScale(d.frequency) * 2);

    patterns.exit().remove();

    const nodes = svg.select(".nodes");
    if (nodes.empty()) {
      svg.append("g").attr("class", "nodes");
    }

    // Update nodes
    const node = svg
      .select(".nodes")
      .selectAll(".node")
      .data(sortedData, (d: any) => d.id) as unknown as d3.Selection<
      SVGGElement,
      Character,
      SVGSVGElement,
      unknown
    >;

    const nodeEnter = node.enter().append("g").attr("class", "node");

    nodeEnter
      .append("circle")
      .attr("r", 0) // Start with radius 0 for smooth transition
      .attr("fill", (d) => `url(#image-${d.id}})`)
      .transition()
      .duration(750)
      .attr("r", (d) => radiusScale(d.frequency));

    nodeEnter
      .append("text")
      .attr("dy", ".3em")
      .style("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("opacity", 0) // Start with opacity 0 for smooth transition
      .transition()
      .duration(750)
      .style(
        "font-size",
        (d) => `${Math.max(10, radiusScale(d.frequency) / 5)}px`
      )
      .style("opacity", 1)
      .text((d) =>
        truncateText(d.name, Math.max(5, radiusScale(d.frequency) / 20))
      );

    nodeEnter
      .append("title")
      .text((d) => `${d.name}\nEpisodes: ${d.frequency}`);

    // Update existing nodes
    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate
      .select("circle")
      .transition()
      .duration(750)
      .attr("r", (d) => radiusScale(d.frequency))
      .attr("fill", (d) => `url(#image-${d.id})`);

    nodeUpdate
      .select("text")
      .transition()
      .duration(750)
      .style(
        "font-size",
        (d) => `${Math.max(10, radiusScale(d.frequency) / 5)}px`
      )
      .text((d) =>
        truncateText(d.name, Math.max(5, radiusScale(d.frequency) / 20))
      );

    nodeUpdate
      .select("title")
      .text((d) => `${d.name}\nEpisodes: ${d.frequency}`);

    node.exit().remove();

    simulation.on("tick", () => {
      nodeUpdate
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
        .transition()
        .duration(10);
    });

    // Add zoom functionality
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8]) // Allow more zoom out
      .on("zoom", (event) => {
        svg.selectAll(".nodes").attr("transform", event.transform);
      });

    svg.call(zoom);

    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.1)
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

  return <svg ref={svgRef} style={{ width: "100%", height: "80vh" }}></svg>;
};

export default CharacterBubbleChart;
