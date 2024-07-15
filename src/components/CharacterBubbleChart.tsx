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
  valueFont: {
    family: string;
    size: number;
    color: string;
    weight: string;
  };
  labelFont: {
    family: string;
    size: number;
    color: string;
    weight: string;
  };
  data: Character[];
};

const CharacterBubbleChart: React.FC<CharacterBubbleChartProps> = ({
  overflow = false,
  graph = {
    zoom: 1.1,
    offsetX: -0.05,
    offsetY: -0.01,
  },
  height = 800,
  width = 1000,
  padding = 0,
  valueFont = {
    family: "Arial",
    size: 16,
    color: "#fff",
    weight: "bold",
  },
  labelFont = {
    family: "Arial",
    size: 11,
    color: "#fff",
    weight: "normal",
  },
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
      .size([width * graph.zoom, width * graph.zoom])
      .padding(padding);

    const root = d3
      .hierarchy({ children: data })
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value)
      .each((d) => {
        if (d.data.name) {
          d.data.name = d.data.name;
        }
      });

    const nodes = pack(root).leaves();
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
      .attr("id", (d) => {
        return d.data.id.toString();
      })
      .attr("r", (d) => d.r - d.r * 0.04)
      .style("fill", (d) =>
        d.data.image ? `url(#image-${d.data.id})` : color(nodes.indexOf(d))
      )
      .style("z-index", 1);

    node
      .append("clipPath")
      .attr("id", (d) => `clip-${d.data.id}`)
      .append("circle")
      .attr("r", (d) => d.r - d.r * 0.04);

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
      .attr("width", (d) => 2 * d.r);
  };

  return <svg ref={svgRef} width={width} height={height}></svg>;
};

export default CharacterBubbleChart;
