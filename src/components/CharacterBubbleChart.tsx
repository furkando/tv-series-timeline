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
  data: Character[];
};

const CharacterBubbleChart: React.FC<CharacterBubbleChartProps> = ({
  data,
  width = 1200,
  height = 800,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    renderChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, height]);

  const renderChart = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear svg content before rendering

    const pack = d3.pack<Character>().size([width, height]).padding(0);

    const root = d3
      .hierarchy({ children: data })
      .sum((d: any) => d.value)
      .sort((a: any, b: any) => b.value - a.value);

    const nodes = pack(root as any).leaves();

    // Add zoom functionality
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        svg.select(".bubble-chart").attr("transform", event.transform);
      });

    svg.call(zoom as any);

    const initialTransform = d3.zoomIdentity.translate(0, 0);

    svg.call(zoom.transform, initialTransform);

    renderBubbles(nodes, initialTransform);
  };

  const renderBubbles = (
    nodes: d3.HierarchyCircularNode<Character>[],
    initialTransform: d3.ZoomTransform
  ) => {
    const bubbleChart = d3
      .select(svgRef.current)
      .append("g")
      .attr("class", "bubble-chart")
      .attr("transform", initialTransform.toString());

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
      .style("fill", "none")
      .style("stroke", "#ccc");

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
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ touchAction: "none" }}
    ></svg>
  );
};

export default CharacterBubbleChart;
