console.log(d3.version);
const svg = d3.select("svg");
const tooltip = d3.select("#tooltip");
const path = d3.geoPath();
const color = d3.scaleThreshold()
  .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
  .range(d3.schemeBlues[9]);

const eduURL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const countyURL = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

Promise.all([
  d3.json(countyURL),
  d3.json(eduURL)
]).then(([us, education]) => {
  const eduMap = new Map(education.map(d => [d.fips, d]));

  svg.append("g")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .join("path")
    .attr("class", "county")
    .attr("d", path)
    .attr("fill", d => {
      const edu = eduMap.get(d.id);
      return edu ? color(edu.bachelorsOrHigher) : "#ccc";
    })
    .attr("data-fips", d => d.id)
    .attr("data-education", d => {
      const edu = eduMap.get(d.id);
      return edu ? edu.bachelorsOrHigher : 0;
    })
    .on("mouseover", (event, d) => {
      const edu = eduMap.get(d.id);
      tooltip.style("opacity", 0.9)
        .html(`${edu.area_name}, ${edu.state}<br>${edu.bachelorsOrHigher}%`)
        .attr("data-education", edu.bachelorsOrHigher)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 30) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // Legend
  const legendWidth = 400;
  const legendHeight = 30;
  const legendThresholds = color.domain();
  const legendScale = d3.scaleLinear()
    .domain([legendThresholds[0], legendThresholds[legendThresholds.length - 1]])
    .range([0, legendWidth]);

  const legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform", `translate(500,40)`);

  legend.selectAll("rect")
    .data(color.range().map(clr => {
      const domain = color.invertExtent(clr);
      if (!domain[0]) domain[0] = legendThresholds[0];
      if (!domain[1]) domain[1] = legendThresholds[legendThresholds.length - 1];
      return { color: clr, val: domain };
    }))
    .enter()
    .append("rect")
    .attr("x", d => legendScale(d.val[0]))
    .attr("y", 0)
    .attr("width", d => legendScale(d.val[1]) - legendScale(d.val[0]))
    .attr("height", legendHeight)
    .attr("fill", d => d.color);

  const xAxis = d3.axisBottom(legendScale)
    .tickValues(legendThresholds)
    .tickFormat(d => `${Math.round(d)}%`);

  legend.append("g")
    .attr("transform", `translate(0,${legendHeight})`)
    .call(xAxis);
});