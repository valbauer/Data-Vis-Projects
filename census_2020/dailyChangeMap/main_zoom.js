import { geoAlbersUsaPr } from "./geoAlbersUsaPr.js"


const width = window.innerWidth,
height = window.innerHeight * 0.8,
margin = { top: 20, bottom: 50, left: 60, right: 30 }


let svg;
let state = {
    geojson: null,
    rates: null,
    dateIndex: 0,
    duration: null,
    delay: null,
    selectedClass: null,
    geojsonHover: {
      County: null,
      FIPS: null,
    },
    ratesHover: {
      Rate: null
    }
};
let rateLookup;
let fsrr2010Lookup;
let groupedCounties;
let dates;
let tooltip;
let g;
let counties;
let countyOverlay;
let states; 

Promise.all([
    d3.json("../data/counties-10m.json"),
    d3.csv("../data/countyRatesForMap_current.csv", d => ({
      fips: +d.fips,
      date: new Date(d.date),
      dateString: d.date,
      fsrr2010: +d.fsrr2010,
      crrall: +d.crrall,
      crrint: +d.crrint,
      drrall: +d.drrall,
      drrint: +d.drrint,
      stateName: d.stateName,
      countyName: d.countyName
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

//https://observablehq.com/@d3/zoom-to-bounding-box
const zoom = d3.zoom()
  .scaleExtent([1, 12])
  .on("zoom", zoomed);

//ADDED LAST TWO LINES TO SCALE STATE LABELS BASED ON SCALE
function zoomed() {
    const {transform} = d3.event;
    g.attr("transform", transform);
    g.attr("stroke-width", 2 / transform.k);
    g.selectAll("text")
      .attr("font-size", 15 / transform.k);
  }

/* //This function will zoom into the county on click. Tried to use it to zoom to state bbox on click.
function clicked(d) {
  const [[x0, y0], [x1, y1]] = path.bounds(d);
  console.log(state.geojson.objects.state)
  d3.event.stopPropagation();
  svg.transition().duration(750).call(
    zoom.transform,
    d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
    d3.mouse(svg.node())
  );
} */

function reset() {
  svg.transition().duration(750).call(
    zoom.transform,
    d3.zoomIdentity,
    d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
  );
}

//Colors for legend
const colors = [['rgb(17,46,81)', "85% or more"],
['rgb(49,54,149)', "74 to 85%"],
['rgb(69,117,180)',"68 to 74%"],
['rgb(116,173,209)',"62 to 68%"],
['rgb(171,217,233)',"56 to 62%"],
['rgb(224,243,248)',"50 to 56%"],
['rgb(254,224,144)',"40 to 50%"],
['rgb(253,184,99)',"30 to 40%"],
['rgb(224,130,20)',"15 to 30%"],
['rgb(179,88,6)',"15% or less"]]

//['rgb(255,255,255)',"No data"]

function init () {
  //Draw counties and states
  const geoData = topojson.feature(state.geojson, state.geojson.objects.counties).features

  //Changed the projection from geoAlbersUsa()
  const projection = geoAlbersUsaPr()
  //const projection = d3.geoAlbersUsa()

  const path = d3.geoPath()
    .projection(projection)
  
  //Re-sizes the map to fit the user's window.   
  fitSize([width, height], {type:"FeatureCollection", features: geoData})

  //Function to fit the map to the size of the user's window. 
  function fitSize(size, object){
    var width = size[0],
        height = size[1];
  
    projection
        .scale(1)
        .translate([0, 0]);
  
    var b = path.bounds(object),
        s = 1 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
  
    projection
        .scale(s)
        .translate(t);
  }

  //Build slider for UI
  let mouseDown = false;

  const slider = d3.select("#slider")
    .on("mousedown", function(){
      mouseDown = true;
      })
      .on("mousemove", function () {
        if (mouseDown === true && +this.value !== state.dateIndex) {
          state.dateIndex = +this.value;
          d3.select("#date").html(dates[state.dateIndex])
          state.duration = 0;
          state.delay = 0;
          draw();
        }
      })
      .on("mouseout", function() {
        mouseDown = false;
      }) 
  
  dates = Array.from(new Set(state.rates.map(d => d.dateString)))  
  
  //Maybe a loop function then a setTimeout or setInterval?
  function loop (i) {
    i = state.dateIndex; 
    while (i < dates.length) {
      slider.property("value", state.dateIndex);
      console.log(state.dateIndex, state.duration, state.delay);
      draw();
      state.dateIndex++;
    }  
   }

  //Couldn't figure out how to animate the map. I also tried incorporating setTimeout(), but that did not go well. 
  const play = d3
    .select("#play")
    .on("click", function (i) {
    //This will loop through each dateIndex and update and draw, but it does it too fast.
        for (i = state.dateIndex; i < dates.length ; state.dateIndex++) {
        state.duration = 5000;
        state.delay = 5000;
        slider.property("value", state.dateIndex);
        console.log(state.dateIndex, state.duration, state.delay);
        draw();
      }
    });
  
  tooltip = d3
        .select("#d3-container")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
  
  //Create interactive legend
  const interactiveLegend = d3
        .select("#interactiveLegend")
        .append("svg")
        .attr("class", "interactiveLegend")
        .attr("width", width)
        .attr("height", "30px")
        .style("position", "relative")
  
  const interactiveLegendSpace = (width-margin.right-margin.left)/(colors.length)

  colors.forEach(function (d,i) {
  
    const g = interactiveLegend.append("g")
    
    g.append("rect")
      .attr("class", function () {
        return d[1]
      })
      .attr("height", "20px")
      .attr("width", interactiveLegendSpace)
      .attr("x", i * interactiveLegendSpace)
      .style("fill", function () {
        return d[0]
      })
      .style("border-style", "solid")
      .style("border", "gray")

    g.append("text")
      .attr("class", function () {
        return d[1]
      })
      .attr("x", i * interactiveLegendSpace + (interactiveLegendSpace/2))
      .attr("y", "50%")
      .style("text-anchor", "middle")
      .style("fill", function () {
        if (d[1] === "56 to 62%" || d[1] === "50 to 56%" || d[1] === "40 to 50%" || d[1] === "No data") {
          return "gray";
        }
        else return "white"
      })
      .text(function () {
        return d[1]})

    g.attr("cursor", "pointer")
      .on("click", function () {
        state.selectedClass = d
        console.log(state.selectedClass)
        draw();
      })
      .on("dblclick", function () {
        state.selectedClass = null
        draw();
      }
      )
    })  
    
    //Make a reset button to reset zoom of map.
    const resetMap = d3.select("#d3-container")
        .append("g")
        .attr("class", "resetMap")

    resetMap.append("text")
        .text("Reset Zoom")
        .on("click", reset)
        
    svg = d3
        .select("#d3-container")
        .append("svg")
        .attr("class", "viewBox")
        .attr("viewBox", [0, 0, width, height])
        

    //Group for map
    g = svg.append("g")
      .attr("class", "map")

    //Group county rates by date
    groupedCounties = d3.group(state.rates, d => d.dateString)
    console.log(groupedCounties)
    dates = Array.from(new Set(state.rates.map(d => d.dateString)))  

    slider
      .attr("min", 0)
      .attr("max", dates.length - 1)
      
    slider.property("value", 0);

    rateLookup = new Map(groupedCounties.get(dates[state.dateIndex]).map(d => [d.fips, d.crrall]))
    fsrr2010Lookup = new Map(groupedCounties.get(dates[0]).map(d => [d.fips, d.fsrr2010]))

    counties = g.selectAll(".county")
        .data(topojson.feature(state.geojson, state.geojson.objects.counties).features)
        .join("path")
          //.on("click", clicked)
          .attr("d", path)
          .attr("class", "county")
          .attr("fill", d => {
            const countyFips = parseInt(d.id)
            const countyRate = rateLookup.get(countyFips)

            if (countyRate !== null) {
              return colorScale(countyRate) 
            }
            else {return "white";}
            })
            .attr("stroke", d => {
              const countyFips = parseInt(d.id)
              const countyRate = rateLookup.get(countyFips)
              const finalRate2010 = fsrr2010Lookup.get(countyFips)
                if (countyRate >= finalRate2010) {
                  return "lime";
                }
              })

    /* countyOverlay = g.selectAll(".countyOverlay")
        .data(topojson.feature(state.geojson, state.geojson.objects.counties).features)
        .join("path")
          .attr("d", path)
          .attr("class", "countyOverlay")
          .attr("stroke", d => {
            const countyFips = parseInt(d.id)
            const countyRate = rateLookup.get(countyFips)
            const finalRate2010 = fsrr2010Lookup.get(countyFips)
              if (countyRate >= finalRate2010) {
                return "white";
              }
            }) */

    //Draw states on top of counties for outline.
    states = g.selectAll(".state")
      .data(topojson.feature(state.geojson, state.geojson.objects.states).features)
      .join("path")
        .attr("class", "state")
        .attr("d", path)
    
    //ADD LABLES FOR STATES  
    g.selectAll(".stateLabel")
      .data(topojson.feature(state.geojson, state.geojson.objects.states).features)
      .join("text") 
      .attr("class", "stateLabel")
      .attr("transform", function(d) {
        const coords = path.centroid(d)
        if (d.properties.usps)
        {return `translate(${coords})`;}
        } 
      )
      .text(d => d.properties.usps)
      
    draw();
    };

  function draw() {
    let clicked = false;
    //Update date for each date drawn
    dates = Array.from(new Set(state.rates.map(d => d.dateString)))  
    d3.select("#date").html(dates[state.dateIndex])
    console.log("Drawing date: ", dates[state.dateIndex])
    
    rateLookup = new Map(groupedCounties.get(dates[state.dateIndex]).map(d => [d.fips, d.crrall]))
    console.log(rateLookup)
    fsrr2010Lookup = new Map(groupedCounties.get(dates[0]).map(d => [d.fips, d.fsrr2010]))
    
    counties
      .attr("fill", d => {
        const countyFips = parseInt(d.id)
        const countyRate = rateLookup.get(countyFips)
        const finalRate2010 = fsrr2010Lookup.get(countyFips)
        
        if (countyRate && state.selectedClass === null /* && countyRate < finalRate2010 */) {
          return colorScale(countyRate); 
          }
        else if (countyRate && state.selectedClass !== null /* && countyRate < finalRate2010 */) {
          return(colorScale(countyRate) === state.selectedClass[0] ? colorScale(countyRate) : "white");
        }
        else {return "white";}
        })
        .attr("stroke", d => {
          const countyFips = parseInt(d.id)
          const countyRate = rateLookup.get(countyFips)
          const finalRate2010 = fsrr2010Lookup.get(countyFips)
          if (countyRate >= finalRate2010) {
            return "lime";
          }
        })
      .on("mouseover", d => {
        
        const [mx,my] = d3.mouse(svg.node())
        const countyFips = parseInt(d.id)
        const countyRate = rateLookup.get(countyFips)
        const finalRate2010 = fsrr2010Lookup.get(countyFips)
        if (mx) {tooltip
          .html(
            
            `
            <big>County: ${d.properties.name}
            <br/>Rate: ${countyRate}</big>
            <br/><i>2010 Rate: ${finalRate2010}</i>

            `
        )
          .transition()
            .duration(50)
            .style("left", mx + "px")
            .style("top", my + "px")
          }
        else {
          tooltip
            .transition()
            .duration(50)
            .style("hide")
        }
      }) 

   /*  countyOverlay = g.selectAll(".countyOverlay")
      .attr("stroke", d => {
        const countyFips = parseInt(d.id)
        const countyRate = rateLookup.get(countyFips)
        const finalRate2010 = fsrr2010Lookup.get(countyFips)
        if (countyRate >= finalRate2010) {
          return "white";
        }
      }) */
  svg.call(zoom);
}