const width = window.innerWidth * 0.9,
  height = window.innerHeight * 0.9,
  margin = { top: 20, bottom: 50, left: 60, right: 30 }

let svg;
let state = {
    geojson: null,
    rates: null,
    dateIndex: 0,
    geojsonHover: {
      County: null,
      FIPS: null,
    },
    ratesHover: {
      Rate: null
    }
};
let rateLookup;
let groupedCounties;
let dates;
let tooltip;
let g;


Promise.all([
    d3.json("../data/counties-albers-10m.json"),
    d3.csv("../data/countyRatesForLines_current.csv", d => ({
      fips: +d.fips,
      date: new Date(d.date),
      dateString: d.date,
      crrall: +d.crrall,
      crrint: +d.crrint,
      drrall: +d.drrall,
      drrint: +d.drrint,
      stateName: d.stateName,
      countyName: d.countyName,
      firstGTChoice: +d.firstGTChoice,
      choiceGTFirst: +d.choiceGTFirst,
      ulAboveAvg: +d.ulAboveAvg
    })),
  ]).then(([geojson, rates]) => {
    // + SET STATE WITH DATA
    state.geojson = geojson;
    state.rates = rates;
    console.log("state: ", state);
    init();
  });

function colorScale(d) {
  if (d <= 15) {
    return 'rgb(179,88,6)'
  }
  else if (d > 15 && d <= 30) {
    return 'rgb(224,130,20)'
  }
  else if (d > 30 && d <= 40) {
    return 'rgb(253,184,99)'
  }
  else if (d > 40 && d <= 50) {
    return 'rgb(254,224,144)'
  }
  else if (d > 50 && d <= 56) {
    return 'rgb(224,243,248)'
  }
  else if (d > 56 && d <= 62) {
    return 'rgb(171,217,233)'
  }
  else if (d > 62 && d <= 68) {
    return 'rgb(116,173,209)'
  }
  else if (d > 68 && d <= 74) {
    return 'rgb(69,117,180)'
  }
  else if (d > 74 && d <= 85) {
    return 'rgb(49,54,149)'
  }
  else {
    return 'rgb(17,46,81)'
  }
}

const path = d3.geoPath()//.projection(null)//.translate([width/2, height/2]);

const zoom = d3.zoom()
  .scaleExtent([1, 5])
  .on("zoom", zoomed);

function zoomed() {
    const {transform} = d3.event;
    svg.attr("transform", transform);
    svg.attr("stroke-width", 1 / transform.k);
  }


const colors = [['rgb(17,46,81)', "85% or more"],
['rgb(49,54,149)', "74 to 85%"],
['rgb(69,117,180)',"68 to 74%"],
['rgb(116,173,209)',"62 to 68%"],
['rgb(171,217,233)',"56 to 62%"],
['rgb(224,243,248)',"50 to 56%"],
['rgb(254,224,144)',"40 to 50%"],
['rgb(253,184,99)',"30 to 40%"],
['rgb(224,130,20)',"15 to 30%"],
['rgb(179,88,6)',"15% or less"],
['rgb(255,255,255)',"No data"]]


function init () {
  const slider = d3.select("#slider").on("change", function() {
    state.dateIndex = this.value;
    console.log(this.value)
    draw();
  })

  tooltip = d3
        .select("#d3-container")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute");
  
  svg = d3
        .select("#d3-container")
        .append("svg")
        .attr("viewBox", [0, 0, width, height])
       // .attr("width", width - margin.right - margin.left)
       // .attr("height", height - margin.bottom);

    g = svg.append("g")

    groupedCounties = d3.group(state.rates, d => d.dateString)//.map(d => d[1])
    
    dates = Array.from(new Set(state.rates.map(d => d.dateString)))  

    slider
      .attr("min", 0)
      .attr("max", dates.length - 1)
      
    slider.property("value", 0);

    rateLookup = new Map(groupedCounties.get(dates[state.dateIndex]).map(d => [d.fips, d.crrall]))
    
    g.append("g")
            .attr("cursor", "pointer")
        .selectAll(".county")
        .data(topojson.feature(state.geojson, state.geojson.objects.counties).features)
        .join("path")
         .attr("d", path)
         .attr("class", "county")
         .attr("fill", d => {
            const countyFips = parseInt(d.id)
            const countyRate = rateLookup.get(countyFips)

            if  (countyRate){
            return colorScale(countyRate) 
            }
            else return "white"
            })

    //Draw states on top of counties
    g.selectAll(".state")
      .data(topojson.feature(state.geojson, state.geojson.objects.states).features)
      .join("path")
      .attr("d", path)
      .attr("class", "state")
    
    
    //Make legend
    const xScale = d3.scaleBand()
      .domain(colors)
      .rangeRound([margin.left, width - margin.right]);

    const legend = d3
        .select("#d3-container")
        .append("div")
        .attr("class", "legend")
        .style("position", "absolute")

    legend.append("div")
        .attr("width", width)
        .attr("height", "40")
        .selectAll("g.legend")
        .data(colors)
        .join(
        enter =>
            enter
            .append("g")
            .attr("class", "legend")
            .call(enter => enter.append("text"))
    )

    legend.selectAll("text")
        .attr("x", d => xScale(d))
        .attr("y", 10)
        .style("background-color", d => d[0])
        .style("color", "white")
        .style("padding", "5px")
        .text(d => d[1]);
    
    draw();
    };

      function draw() {
        
        console.log("drawing")
        d3.select("#date").html(dates[state.dateIndex])

        rateLookup = new Map(groupedCounties.get(dates[state.dateIndex]).map(d => [d.fips, d.crrall]))
        
        g.selectAll(".county")
          .attr("fill", d => {
            const countyFips = parseInt(d.id)
            const countyRate = rateLookup.get(countyFips)
          if  (countyRate){
            return colorScale(countyRate) 
            }
          else return "white"
          })
          .on("mousemove", d => {
            const countyFips = parseInt(d.id)
            const countyRate = rateLookup.get(countyFips)
            state.geojsonHover["County"] = d.properties.name;
            state.geojsonHover["FIPS"] = d.id;
            state.ratesHover["Rate"] = countyRate;
            
            tooltip
              .html(
                
                `
                <div>County: ${state.geojsonHover.County}</div>
                <div>Rate: ${state.ratesHover.Rate}</div>
  
                `
            )
              .transition()
              .duration(50)
              .style("left", (d3.event.pageX + 15) + "px")
              .style("top", (d3.event.pageY + 5) + "px")
          
          })/* .on("click", clicked)
              .attr("d", path) */
         /*  .on("mouseout", function() {
             tooltip.transition()		
              .duration(300)		
              .style("visibility", "hidden");
      }) */
      svg.call(zoom);


      // zoom to bounding box tutorial:
  // https://observablehq.com/@d3/zoom-to-bounding-box
    /* function reset() {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
      );
    } */

  /*   function clicked(d) {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      d3.event.stopPropagation();
      svg.transition().duration(250).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        d3.mouse(svg.node())
      );
    } */


    return svg.node();

 
    }