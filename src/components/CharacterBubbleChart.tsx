import * as d3 from "d3";
import React, { useEffect, useRef } from "react";

export type Character = {
  id: number;
  name: string;
  image: string;
  frequency: number;
  value: number;
};

type CharacterBubbleChartProps = {
  width: number;
  height: number;
  overflow: boolean;
  graph: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
  padding: number;
  data: Character[];
};

const CharacterBubbleChart: React.FC<CharacterBubbleChartProps> = ({
  overflow = false,
  graph = {
    zoom: 0.8,
    offsetX: 0.3,
    offsetY: -0.05,
  },
  height = 800,
  width = 1000,
  padding = 0,
  data,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    renderChart();
  }, [data]);

  const renderChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear svg content before rendering

    if (overflow) {
      svg.style("overflow", "visible");
    }

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pack = d3
      .pack<Character>()
      .size([height * graph.zoom, width * graph.zoom])
      .padding(padding);

    const root = d3
      .hierarchy({ children: data })
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);

    const nodes = pack(root).leaves();

    // Add zoom functionality
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8]) // Allow more zoom out
      .on("zoom", (event) => {
        svg.select(".bubble-chart").attr("transform", event.transform);
      });

    d3.select(svgRef.current).call(zoom);

    renderBubbles(width, nodes, color);
  };

  const renderBubbles = (
    width: number,
    nodes: d3.HierarchyCircularNode<Character>[],
    color: d3.ScaleOrdinal<string, string>
  ) => {
    const bubbleChart = d3
      .select(svgRef.current)
      .append("g")
      .attr("class", "bubble-chart")
      .attr(
        "transform",
        `translate(${width * graph.offsetX}, ${width * graph.offsetY})`
      );

    const node = bubbleChart
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`);

    node
      .append("circle")
      .attr("id", (d) => d.data.id.toString())
      .attr("r", (d) => d.r)
      .style("fill", (d) => color(nodes.indexOf(d)))
      .style("z-index", 1);

    node
      .append("clipPath")
      .attr("id", (d) => `clip-${d.data.id}`)
      .append("circle")
      .attr("r", (d) => d.r);

    node
      .append("image")
      .attr("xlink:href", (d) =>
        d.data.image
          ? `https://image.tmdb.org/t/p/w500/${d.data.image}`
          : "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
      )
      .attr("clip-path", (d) => `url(#clip-${d.data.id})`)
      .attr("x", (d) => -d.r)
      .attr("y", (d) => -d.r)
      .attr("height", (d) => 2 * d.r)
      .attr("width", (d) => 2 * d.r)
      .attr("preserveAspectRatio", "xMidYMid slice");
  };

  return (
    <svg ref={svgRef} width={width} height={height}>
      <g />
    </svg>
  );
};

export default CharacterBubbleChart;
