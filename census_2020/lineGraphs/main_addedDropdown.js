/* CONSTANTS AND GLOBALS */
const width = window.innerWidth * 0.9,
  height = window.innerHeight * 0.7,
  margin = { top: 20, bottom: 50, left: 50, right: 40 },
  radius = 5;

// these variables allow us to access anything we manipulate in init() but need access to in draw().
// All these variables are empty before we assign something to them.
let svg;
let xScale;
let yScale;
let tooltip;
let yAxis;
let tooltipLine;


const formatTime = d3.timeFormat("%B %d, %Y");

const eventDates = [['April 1, 2020', "Census Day"], ['May 5, 2020', 'Cinco de Mayo']]

function dateToX (date) {
      return (xScale(new Date (date)))
      }
//FROM: https://bl.ocks.org/mbostock/8027637
function closestPoint(pathNode, point) {
  let pathLength = pathNode.getTotalLength(),
      precision = 8,
      best,
      bestLength,
      bestDistance = Infinity;

  // linear scan for coarse approximation
  for (let scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
    if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
      best = scan, bestLength = scanLength, bestDistance = scanDistance;
    }
  }

  // binary search for precise estimate
  precision /= 2;
  while (precision > 0.5) {
    let before,
        after,
        beforeLength,
        afterLength,
        beforeDistance,
        afterDistance;
    if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
      best = before, bestLength = beforeLength, bestDistance = beforeDistance;
    } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
      best = after, bestLength = afterLength, bestDistance = afterDistance;
    } else {
      precision /= 2;
    }
  }

  best = [best.x, best.y];
  best.distance = Math.sqrt(bestDistance);
  return best;

  function distance2(p) {
    let dx = p.x - point[0],
        dy = p.y - point[1];
    return dx * dx + dy * dy;
  }
}


/* APPLICATION STATE */
let state = {
  data: [],
  dateRange: [],
  selectedState: "Alabama",
  selectedType: "All",
  selectedResponse: "All Responses", 
  selectedCounty: null// + YOUR FILTER SELECTION
};

d3.csv("../data/countyRatesForLines_current.csv", d => ({
  fips: d.fips,
  date: new Date(d.date),
  dateString: d.date,
  crrall: +d.crrall,
  crrint: +d.crrint,
  drrall: +d.drrall,
  drrint: +d.drrint,
  stateName: d.stateName,
  countyName: d.countyName,
  plurality: d.plurality
})).then(raw_data => {
  console.log("raw_data", raw_data);
  state.data = raw_data;
  state.dateRange = Array.from(new Set(raw_data.map(d => d.dateString))).map(d => new Date(d));
  init()});
 
  
  function init() {
    // + SCALES
    xScale = d3
      .scaleTime()
      .domain(d3.extent(state.data, d => d.date))
      .range([margin.left, width - margin.right]);  
  
    yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);
  
  
    // + AXES
    const xAxis = d3.axisBottom(xScale);
    yAxis = d3.axisLeft(yScale);
      

    const selectState = d3.select("#dropdownState").on("change", function() {
      // `this` === the selectElement
      // 'this.value' holds the dropdown value a user just selected
      state.selectedState = this.value
      console.log("new state is", this.value);
      draw();
    });

    const selectType = d3.select("#dropdownType").on("change", function() {
      // `this` === the selectElement
      // 'this.value' holds the dropdown value a user just selected
      state.selectedType = this.value
      console.log("new type is", this.value);
      draw();
    });

    const selectResponse = d3.select("#dropdownResponse").on("change", function() {
      // `this` === the selectElement
      // 'this.value' holds the dropdown value a user just selected
      state.selectedResponse = this.value
      console.log("new repsonse type is", this.value);
      draw();
    });

    selectState
      .selectAll("option")
      .data([
        ...Array.from(new Set(state.data.map(d => d.stateName))
        )
      ])
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    selectState.property("value", "Alabama");

    selectType
      .selectAll("option")
      .data(["All", "Internet First", "Internet Choice", "Update/Leave", "Update/Enumerate or Remote Alaska"])
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    selectType.property("value", "All");

    selectResponse
      .selectAll("option")
      .data(["All Responses", "Internet Only", "Mail and/or Phone"])
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    selectResponse.property("value", "All Responses");

    tooltip = d3
        .select("#d3-container")
        .append("div")
        .attr("class", "tooltip")
        .attr("width", 100)
        .attr("height", 100)
        .style("position", "absolute");  

  // + CREATE SVG ELEMENT
      svg = d3
        .select("#d3-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      // + CALL AXES
      svg
        .append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxis)
        .append("text")
          .attr("class", "axis-label")
          .attr("x", "50%")
          .attr("dy", "3em")
          .text("Date");

      svg
        .append("g")
        .attr("class", "axis y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis)
        .append("text")
          .attr("class", "axis-label")
          .attr("y", "-5%")
          .attr("dx", "-18em")
          .attr("transform", "rotate(-90)", "writing-mode: tb", "vertical-lr")
          .text("Self-Response Rate");

      tooltipLine = svg
        .append("line")
        .attr("class", "tooltipLine")
        .attr('x1', `${margin.left}px`)
        .attr('y1', margin.top)
        .attr('x2', `${margin.left}px`)
        .attr('y2', height - margin.bottom)

      //Event Lines for Census Bureau operational dates.
      
      const eventLines = svg
        .append("g")

      eventLines
          .selectAll("line")
          .data(eventDates)
            .join("line")
              .attr("class", "eventLines")
              .attr("x1", d => dateToX(d[0]))
              .attr("y1", margin.top)
              .attr("x2", d => dateToX(d[0]))
              .attr('y2', height - margin.bottom) 

      eventLines
        .selectAll("text")
        .data(eventDates)
          .join("text")
          .attr("class", "eventText")
            .text(d => d[1])
            .attr("x", d => dateToX(d[0]) + 5)
            .attr('y', margin.top)
            

      draw(); // calls the draw function
};

function draw () {
  let filteredData 
  console.log("drawing")

// I am SURE there's an better way to do this than a gajillion if/else statements, right?! 
        if (state.selectedType === "Internet First" && state.selectedState !== "null" && state.selectedResponse === "All Responses") { 
            filteredData = state.data.filter(d => d.plurality === "IntFirst" && d.stateName === state.selectedState);
            lineFunc = d3.line()
                .x(d => xScale(d.date))
                .y(d => yScale(d.crrall));
            }

        if (state.selectedType === "Internet First" && state.selectedState !== "null" && state.selectedResponse === "Internet Only") { 
            filteredData = state.data.filter(d => d.plurality === "IntFirst" && d.stateName === state.selectedState);
            lineFunc = d3.line()
                .x(d => xScale(d.date))
                .y(d => yScale(d.crrint));
            }

        if (state.selectedType === "Internet First" && state.selectedState !== "null" && state.selectedResponse === "Mail and/or Phone") { 
            filteredData = state.data.filter(d => d.plurality === "IntFirst" && d.stateName === state.selectedState);
            lineFunc = d3.line()
                .x(d => xScale(d.date))
                .y(d => yScale(d.crrall - d.crrint));
            }

        else if (state.selectedType === "Internet Choice" && state.selectedState !== "null" && state.selectedResponse === "All Responses") {
            filteredData = state.data.filter(d => d.plurality === "IntChoice" && d.stateName === state.selectedState)
            lineFunc = d3.line()
                .x(d => xScale(d.date))
                .y(d => yScale(d.crrall));
            }

        else if (state.selectedType === "Internet Choice" && state.selectedState !== "null" && state.selectedResponse === "Internet Only") {
            filteredData = state.data.filter(d => d.plurality === "IntChoice" && d.stateName === state.selectedState)
            lineFunc = d3.line()
                  .x(d => xScale(d.date))
                  .y(d => yScale(d.crrint));
            }

        else if (state.selectedType === "Internet Choice" && state.selectedState !== "null" && state.selectedResponse === "Mail and/or Phone") {
            filteredData = state.data.filter(d => d.plurality === "IntChoice" && d.stateName === state.selectedState)
            lineFunc = d3.line()
                  .x(d => xScale(d.date))
                  .y(d => yScale(d.crrall - d.crrint));
          }

        else if (state.selectedType === "Update/Leave" && state.selectedState !== "null" && state.selectedResponse === "All Responses") {
            filteredData = state.data.filter(d => d.plurality === "UL" && d.stateName === state.selectedState)
            lineFunc = d3.line()
                  .x(d => xScale(d.date))
                  .y(d => yScale(d.crrall));
          }

        else if (state.selectedType === "Update/Leave" && state.selectedState !== "null" && state.selectedResponse === "Internet Only") {
            filteredData = state.data.filter(d => d.plurality === "UL" && d.stateName === state.selectedState)
            lineFunc = d3.line()
                .x(d => xScale(d.date))
                .y(d => yScale(d.crrint));
            }

        else if (state.selectedType === "Update/Leave" && state.selectedState !== "null" && state.selectedResponse === "Mail and/or Phone") {
            filteredData = state.data.filter(d => d.plurality === "UL" && d.stateName === state.selectedState)
            lineFunc = d3.line()
                  .x(d => xScale(d.date))
                  .y(d => yScale(d.crrall - d.crrint)); 
            }
        else if (state.selectedType === "Update/Enumerate or Remote Alaska" && state.selectedState !== "null" && state.selectedResponse === "All Responses") {
          filteredData = state.data.filter(d => d.plurality === "UE_RA" && d.stateName === state.selectedState)
          lineFunc = d3.line()
                .x(d => xScale(d.date))
                .y(d => yScale(d.crrall));
        }

      else if (state.selectedType === "Update/Enumerate or Remote Alaska" && state.selectedState !== "null" && state.selectedResponse === "Internet Only") {
          filteredData = state.data.filter(d => d.plurality === "UE_RA" && d.stateName === state.selectedState)
          lineFunc = d3.line()
              .x(d => xScale(d.date))
              .y(d => yScale(d.crrint));
          }

      else if (state.selectedType === "Update/Enumerate or Remote Alaska" && state.selectedState !== "null" && state.selectedResponse === "Mail and/or Phone") {
          filteredData = state.data.filter(d => d.plurality === "UE_RA" && d.stateName === state.selectedState)
          lineFunc = d3.line()
                .x(d => xScale(d.date))
                .y(d => yScale(d.crrall - d.crrint)); 
          }

        else if (state.selectedType === "All" && state.selectedState !== "null" && state.selectedResponse === "All Responses") {
            filteredData = state.data.filter(d => d.stateName === state.selectedState)
            lineFunc = d3.line()
                .x(d => xScale(d.date))
                .y(d => yScale(d.crrall));
            }

        else if (state.selectedType === "All" && state.selectedState !== "null" && state.selectedResponse === "Internet Only") {
            filteredData = state.data.filter(d => d.stateName === state.selectedState)
            lineFunc = d3.line()
                  .x(d => xScale(d.date))
                  .y(d => yScale(d.crrint));
            }

        else if (state.selectedType === "All" && state.selectedState !== "null" && state.selectedResponse === "Mail and/or Phone") {
            filteredData = state.data.filter(d => d.stateName === state.selectedState)
            lineFunc = d3.line()
                  .x(d => xScale(d.date))
                  .y(d => yScale(d.crrall - d.crrint));
            }

        const groupedData = d3.groups(filteredData, d => d.fips).map(d => d[1])
        
        d3.select("g.y-axis")
            .transition()
            .duration(1000)
            .call(yAxis.scale(yScale));

        const line = svg
        .selectAll("path.trend")
        .data(groupedData, d => d.countyName)
        .join(
            enter =>
            enter
                .append("path")
                .attr("class", "trend")
                .attr("opacity", 0)
                .on("click", function(d) {
                  const [mx, my] = d3.mouse(svg.node())
                  const dataPoint = d[d3.bisectLeft(state.dateRange, xScale.invert(mx+5))-1]
                  state.selectedCounty = dataPoint.countyName;
                  console.log(state.selectedCounty)
                  
                })
                .on("mousemove", d => {
                  const [mx, my] = d3.mouse(svg.node())
                  const dataPoint = d[d3.bisectLeft(state.dateRange, xScale.invert(mx+5))-1]
                  const formatNum = d3.format(".1f")
                  tooltipLine.transition()
                      .duration(50)
                      .style("opacity", 1)
                      .attr("x1", mx  + "px")
                      .attr("x2", mx  + "px")
                  tooltip.transition()
                      .duration(50)
                      .style("opacity", .9);
                  tooltip.html(
                      "Date: " + formatTime(dataPoint.date) +
                      "<br/>County: " + dataPoint.countyName + " County" +
                      "<br/>Overall Rate: " + dataPoint.crrall +
                      "<br/>Internet Only Rate: " + dataPoint.crrint +
                      "<br/>Mail and/or Phone Rate: " + formatNum((dataPoint.crrall - dataPoint.crrint)))
                      .style("left", (d3.event.pageX + 15) + "px")
                      .style("top", (d3.event.pageY - 15) + "px");
                    })
                .on("mouseout", d =>  {		
                  tooltip.transition()		
                      .duration(300)		
                      .style("opacity", 0);
                  tooltipLine.transition()		
                      .duration(300)		
                      .style("opacity", 0);	
                  })
                

                ,
            update => update,
            exit => exit.remove()
            )
            .call(selection =>
              selection
                .transition()
                .duration(1000)
                .attr("opacity", 1)
                .attr("stroke", d => {
                if (d[0].plurality === "IntChoice") return "green";
                else if (d[0].plurality === "IntFirst") return "purple";
                else if (d[0].plurality === "UL") return "orange";
                else return "magenta"
                })
                .attr("d", d => lineFunc(d)));  
};
