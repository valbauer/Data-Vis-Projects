import { geoAlbersUsaPr } from "./geoAlbersUsaPr.js"


const width = window.innerWidth,
height = window.innerHeight * 0.8,
margin = { top: 20, bottom: 50, left: 60, right: 30 }


let svg;
let state = {
    cd_geojson: null,
    sldu_geojson: null,
    sldl_geojson:null,
    cd_csv: null,
    sldu_csv: null,
    sldl_csv: null,
    selectedGeography: "Congressional District",
    selectedVariable: "pct_tot_pop_change",
    state_geojson: null
};
let tooltip;
let g;
let dists;
let states;



Promise.all([
    d3.json("../data/tl_2016_us_cd116_wgs84.json"),
    d3.json("../data/sldu_2019_wgs84.json"),
    d3.json("../data/sldl_2019_wgs84.json"),
    d3.json("../data/counties-10m.json"),
    d3.csv("../data/cd_acs12_19.csv", d3.autoType),
    d3.csv("../data/sldu_acs12_19.csv", d3.autoType),
    d3.csv("../data/sldl_acs12_19.csv", d3.autoType)
  ]).then(([cd_geojson, sldu_geojson, sldl_geojson, state_geojson, cd_csv, sldu_csv, sldl_csv]) => {
    // + SET STATE WITH DATA
    state.cd_geojson = cd_geojson;
    state.sldu_geojson = sldu_geojson;
    state.sldl_geojson = sldl_geojson;
    state.state_geojson = state_geojson;
    state.cd_csv = cd_csv;
    state.sldu_csv = sldu_csv;
    state.sldl_csv = sldl_csv;
    console.log("state: ", state);
    init();
  });
  
  
function colorScale(d) {
  if (d >= 25) {
    return '#488f31'
  }
  if (d < 25 && d >= 10) {
    return '#82a143'
  }
  else if (d < 10 && d >= 5) {
    return '#b1b35e'
  }
  else if (d < 5 && d >= 1) {
    return '#dbc580'
  }
  else if (d < 1 && d >= -1) {
    return '#ffd9a6'
  }
  else if (d < -1 && d >= -5) {
    return '#f6b783'
  }
  else if (d < -5 && d >= -10) {
    return '#ed9268'
  }
  else if (d < -10 && d >= -25) {
    return '#e26a58'
  }
  else if (d < -25) {
    return '#de425b'
  }
  else return "light gray"
}

//Colors for legend
const legendArray = [['#488f31', "25% or more"],
['#82a143', "10 to 25%"],
['#b1b35e', "5 to 10%"],
['#dbc580',"1 to 5%"],
['#ffd9a6',"-1 to 1%"],
['#f6b783',"-1 to -5%"],
['#ed9268',"-5 to -10%"],
['#e26a58',"-10% to -25%"],
['#de425b',"-25% or more"]]

const numFormat = d3.format(",")

//https://observablehq.com/@d3/zoom-to-bounding-box
const zoom = d3.zoom()
  .scaleExtent([1, 12])
  .on("zoom", zoomed);

//ADDED LAST TWO LINES TO SCALE STATE LABELS BASED ON SCALE
function zoomed() {
    const {transform} = d3.event;
    g.attr("transform", transform);
    states.attr("stroke-width", 4 / transform.k);
    g.attr("stroke-width", 2 / transform.k)
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

function init () {

  //For vertical legend
  const legend = d3.select("#legend")
    .append("svg")
    .attr("class", "legend")
    .attr("width", width)
    .attr("height", "30")

    legendArray.forEach(function (d,i) {
      const g = legend.append("g")
          g.append("rect")
          .attr("class", "legendRects")
          .attr("width", (width - margin.right - margin.left)/9)
          .attr("height", "100%")
          .attr("x", (i * (width - margin.right - margin.left)/9))
          .style("fill", function() {
              return d[0];
          })
          .style("stroke", "white")

          g.append("text")
          .attr("class", "legendText")
          .attr("x", (i * (width - margin.right - margin.left)/9)+(width - margin.right - margin.left)/18)
          .attr("y", "65%")          
          .text(function () {
              return d[1]})
          /* .style("fill", function() {
              if (d.value === "7-10%" || d.value === "Over 10%") {
                  return  "white"}
              else return "black";
          }) */
        })

  const selectGeography = d3.select("#dropdownGeography").on("change", function() {
    // `this` === the selectElement
    // 'this.value' holds the dropdown value a user just selected
    state.selectedGeography = this.value
    console.log("new geography is", this.value);
    g.selectAll("#dist").remove();
    draw();
  });

  selectGeography
      .selectAll("option")
      .data(["Congressional District", "State Upper Leg. District", "State Lower Leg. District"])
      .join("option")
      .attr("value", d => d)
      .text(d => d);

  const selectVariable = d3.select("#dropdownVariable").on("change", function() {
    // `this` === the selectElement
    // 'this.value' holds the dropdown value a user just selected
    state.selectedVariable = this.value
    console.log("new variable is", this.value)
    draw();
  });

  selectVariable
      .selectAll("option")
      .data([["Percent Change Total Pop.","pct_tot_pop_change"], ["Percent Change Black", "pct_nh_black_change"], ["Percent Change AIAN", "pct_nh_aian_change"], 
        ["Percent Change Asian", "pct_nh_asian_change"], ["Percent Change Hawaiian/PI","pct_nh_haw_pi_change"], ["Percent Change Other","pct_nh_other_change"], 
        ["Percent Two or More Races", "pct_nh_two_plus_change"], ["Percent Change Hispanic","pct_hispanic_change"]])
      .join("option")
      .attr("value", d => d[1])
      .text(d => d[0]);

  //Draw counties and states
  const geoData = topojson.feature(state.state_geojson, state.state_geojson.objects.states).features

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
  
  tooltip = d3
        .select("#d3-container")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")  
    
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
    draw();
    };

  function draw() {
    console.log("drawing")
    const geoData = topojson.feature(state.state_geojson, state.state_geojson.objects.states).features
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
    
    //Update date for each date drawn
    if (state.selectedGeography === "Congressional District") {
        console.log(state.selectedVariable)
        dists = g.selectAll(".dist")
          .data(topojson.feature(state.cd_geojson, state.cd_geojson.objects.tl_2016_us_cd116_wgs84).features)
          .join(enter => enter.append("path")
            .attr("d", path)
            .attr("id", "dist")
            .attr("class", d => `cd_${d.properties.GEOID}`)
            .attr("fill", d => {
              if (state.selectedVariable === 'pct_tot_pop_change') {
                return colorScale(d.properties.pct_tot_pop_change)
              }
              else if (state.selectedVariable === 'pct_nh_black_change'){
                return colorScale(d.properties.pct_nh_black_change)
              }
              else if (state.selectedVariable === 'pct_nh_aian_change'){
                return colorScale(d.properties.pct_nh_aian_change)
              } 
              else if (state.selectedVariable === 'pct_nh_asian_change'){
                return colorScale(d.properties.pct_nh_asian_change)
              }
              else if (state.selectedVariable === 'pct_nh_haw_pi_change'){
                return colorScale(d.properties.pct_nh_haw_pi_change)
              }
              else if (state.selectedVariable === 'pct_nh_other_change'){
                return colorScale(d.properties.pct_nh_other_change)
              }
              else if (state.selectedVariable === 'pct_nh_two_plus_change'){
                return colorScale(d.properties.pct_nh_two_plus_change)
              }
              else if (state.selectedVariable === 'pct_hispanic_change'){
                return colorScale(d.properties.pct_hispanic_change)
              }
            }))
              .attr("stroke", "black"),
              update => update,
              exit => exit  
                .remove()

            dists
            .on("mouseover", function (d) {
                const [mx,my] = d3.mouse(svg.node())
                tooltip.html(
                    `<big>Change in Population for ${d.properties.GEOID}</big>
                    </br>Total: ${numFormat(d.properties.tot_pop_change)} (${(d.properties.pct_tot_pop_change && d.properties.pct_tot_pop_change < 0) ? d.properties.pct_tot_pop_change.toPrecision(2) : "+" + d.properties.pct_tot_pop_change.toPrecision(2)}%)
                    </br>Black: ${numFormat(d.properties.nh_black_change)} (${(d.properties.pct_nh_black_change && d.properties.pct_nh_black_change < 0) ? numFormat(d.properties.pct_nh_black_change.toPrecision(2)) : "+" + numFormat(d.properties.pct_nh_black_change.toPrecision(2))}%)
                    </br>Asian: ${numFormat(d.properties.nh_asian_change)} (${(d.properties.pct_nh_asian_change && d.properties.pct_nh_asian_change < 0) ? numFormat(d.properties.pct_nh_asian_change.toPrecision(2)) : "+" + numFormat(d.properties.pct_nh_asian_change.toPrecision(2))}%)
                    </br>AIAN: ${numFormat(d.properties.nh_aian_change)} (${(d.properties.pct_nh_aian_change && d.properties.pct_nh_aian_change < 0) ? numFormat(d.properties.pct_nh_aian_change.toPrecision(2)) : "+" + numFormat(d.properties.pct_nh_aian_change.toPrecision(2))}%)
                    </br>Hawaiian/Pac. Islander: ${numFormat(d.properties.nh_haw_pi_change)} (${(d.properties.pct_nh_haw_pi_change && d.properties.pct_nh_haw_pi_change < 0) ? numFormat(d.properties.pct_nh_haw_pi_change.toPrecision(2)) : "+" + numFormat(d.properties.pct_nh_haw_pi_change.toPrecision(2))}%)
                    </br>Hispanic: ${numFormat(d.properties.hispanic_change)} (${(d.properties.pct_hispanic_change && d.properties.pct_hispanic_change < 0) ? numFormat(d.properties.pct_hispanic_change.toPrecision(2)) : "+" + numFormat(d.properties.pct_hispanic_change.toPrecision(2))}%)
                
                  `
                    )
            tooltip.transition()
                .duration(50)
                .style("left", mx + "px")
                .style("top", my + "px")
                .style("visibility", "visible")
              })

            dists.on("mouseout", () => {
                tooltip
                    .transition()
                    .duration(50)
                    .style("visibility", "hidden")
            })
      }

    else if (state.selectedGeography === "State Upper Leg. District") {
        dists = g.selectAll(".dist")
          .data(topojson.feature(state.sldu_geojson, state.sldu_geojson.objects.sldu_2019_wgs84).features)
          .join(enter => enter.append("path") 
            .attr("d", path)
            .attr("id", "dist")
            .attr("class", d => `sldu_${d.properties.GEOID}`)
            .attr("fill", d => {
              const geoid = d.properties.GEOID
              const sldu_variable = state.sldu_csv.find(sldu => sldu.geoid.toString().padStart(5, '0') === geoid)
              if (state.selectedVariable === 'pct_tot_pop_change' && sldu_variable) {
                return colorScale(sldu_variable.pct_tot_pop_change)}
              else if (state.selectedVariable === 'pct_nh_black_change' && sldu_variable){
                return colorScale(sldu_variable.pct_nh_black_change)
              }
              else if (state.selectedVariable === 'pct_nh_aian_change' && sldu_variable){
                return colorScale(sldu_variable.pct_nh_aian_change)
              } 
              else if (state.selectedVariable === 'pct_nh_asian_change' && sldu_variable){
                return colorScale(sldu_variable.pct_nh_asian_change)
              }
              else if (state.selectedVariable === 'pct_nh_haw_pi_change' && sldu_variable){
                return colorScale(sldu_variable.pct_nh_haw_pi_change)
              }
              else if (state.selectedVariable === 'pct_nh_other_change' && sldu_variable){
                return colorScale(sldu_variable.pct_nh_other_change)
              }
              else if (state.selectedVariable === 'pct_nh_two_plus_change' && sldu_variable){
                return colorScale(sldu_variable.pct_nh_two_plus_change)
              }
              else if (state.selectedVariable === 'pct_hispanic_change' && sldu_variable){
                return colorScale(sldu_variable.pct_hispanic_change)
              }
            }))
            .attr("stroke", "black"),
            update => update,
            exit => exit  
              .remove()

          dists
          .on("mouseover", function (d) {
              const [mx,my] = d3.mouse(svg.node())
              const geoid = d.properties.GEOID
              const sldu_variable = state.sldu_csv.find(sldu => sldu.geoid.toString().padStart(5, '0') === geoid)
              tooltip.html(
                  `<big>Change in Population for ${sldu_variable.geoid}</big>
                  </br>Total: ${numFormat(sldu_variable.tot_pop_change)} (${(sldu_variable.pct_tot_pop_change !== null && sldu_variable.pct_tot_pop_change < 0) ? numFormat(sldu_variable.pct_tot_pop_change.toPrecision(3)) : "+" + numFormat(sldu_variable.pct_tot_pop_change.toPrecision(3))}%)
                  </br>Black: ${numFormat(sldu_variable.nh_black_change)} (${(sldu_variable.pct_nh_black_change !== null && sldu_variable.pct_nh_black_change < 0) ? numFormat(sldu_variable.pct_nh_black_change.toPrecision(3)) : "+" + numFormat(sldu_variable.pct_nh_black_change.toPrecision(3))}%)
                  </br>Asian: ${numFormat(sldu_variable.nh_asian_change)} (${(sldu_variable.pct_nh_asian_change !== null && sldu_variable.pct_nh_asian_change < 0) ? numFormat(sldu_variable.pct_nh_asian_change.toPrecision(3)) : "+" + numFormat(sldu_variable.pct_nh_asian_change.toPrecision(3))}%)
                  </br>AIAN: ${numFormat(sldu_variable.nh_aian_change)} (${(sldu_variable.pct_nh_aian_change !== null && sldu_variable.pct_nh_aian_change < 0) ? numFormat(sldu_variable.pct_nh_aian_change.toPrecision(3)) : "+" + numFormat(sldu_variable.pct_nh_aian_change.toPrecision(3))}%)
                  </br>Hawaiian/Pac. Islander: ${numFormat(sldu_variable.nh_haw_pi_change)} (${(sldu_variable.pct_nh_haw_pi_change !== null && sldu_variable.pct_nh_haw_pi_change < 0) ? numFormat(sldu_variable.pct_nh_haw_pi_change.toPrecision(3)) : "+" + numFormat(sldu_variable.pct_nh_haw_pi_change.toPrecision(3))}%)
                  </br>Hispanic: ${numFormat(sldu_variable.hispanic_change)} (${(sldu_variable.pct_hispanic_change!== null && sldu_variable.pct_hispanic_change < 0) ? numFormat(sldu_variable.pct_hispanic_change.toPrecision(3)) : "+" + numFormat(sldu_variable.pct_hispanic_change.toPrecision(3))}%)
                `
                  )
          tooltip.transition()
              .duration(50)
              .style("left", mx + "px")
              .style("top", my + "px")
              .style("visibility", "visible")
            })

          dists.on("mouseout", () => {
              tooltip
                  .transition()
                  .duration(50)
                  .style("visibility", "hidden")
          })
        }

    else if (state.selectedGeography === "State Lower Leg. District") {
      dists = g.selectAll(".dist") 
        .data(topojson.feature(state.sldl_geojson, state.sldl_geojson.objects.sldl_2019_wgs84).features)
        .join(enter => enter.append("path")
          .attr("d", path)
          .attr("id", "dist")
          .attr("class", d => `sldl_${d.properties.GEOID}`)
            .attr("fill", d => {
            const geoid = d.properties.GEOID
            const sldl_variable = state.sldl_csv.find(sldl => sldl.geoid.toString().padStart(5, '0') === geoid)
            if (sldl_variable === null) {
              return 'light gray'
            }
            else if (state.selectedVariable === 'pct_tot_pop_change' && sldl_variable) {
              return colorScale(sldl_variable.pct_tot_pop_change)
            }
            else if (state.selectedVariable === 'pct_nh_black_change' && sldl_variable){
              return colorScale(sldl_variable.pct_nh_black_change)
            }
            else if (state.selectedVariable === 'pct_nh_aian_change' && sldl_variable){
              return colorScale(sldl_variable.pct_nh_aian_change)
            } 
            else if (state.selectedVariable === 'pct_nh_asian_change' && sldl_variable){
              return colorScale(sldl_variable.pct_nh_asian_change)
            }
            else if (state.selectedVariable === 'pct_nh_haw_pi_change' && sldl_variable){
              return colorScale(sldl_variable.pct_nh_haw_pi_change)
            }
            else if (state.selectedVariable === 'pct_nh_other_change' && sldl_variable){
              return colorScale(sldl_variable.pct_nh_other_change)
            }
            else if (state.selectedVariable === 'pct_nh_two_plus_change' && sldl_variable){
              return colorScale(sldl_variable.pct_nh_two_plus_change)
            }
            else if (state.selectedVariable === 'pct_hispanic_change' && sldl_variable){
              return colorScale(sldl_variable.pct_hispanic_change)
            }
          })
          .attr("stroke", "black")),
          update => update,
          exit => exit  
            .remove()   
            
            dists
            .on("mouseover", function (d) {
                const [mx,my] = d3.mouse(svg.node())
                const geoid = d.properties.GEOID
                const sldl_variable = state.sldl_csv.find(sldl => sldl.geoid.toString().padStart(5, '0') === geoid)
                tooltip.html(
                    `<big>Change in Population for ${sldl_variable.geoid}</big>
                    </br>Total: ${numFormat(sldl_variable.tot_pop_change)} (${(sldl_variable.pct_tot_pop_change !== null && sldl_variable.pct_tot_pop_change < 0) ? numFormat(sldl_variable.pct_tot_pop_change.toPrecision(3)) : "+" + numFormat(sldl_variable.pct_tot_pop_change.toPrecision(3))}%)
                    </br>Black: ${numFormat(sldl_variable.nh_black_change)} (${(sldl_variable.pct_nh_black_change !== null && sldl_variable.pct_nh_black_change < 0) ? numFormat(sldl_variable.pct_nh_black_change.toPrecision(3)) : "+" + numFormat(sldl_variable.pct_nh_black_change.toPrecision(3))}%)
                    </br>Asian: ${numFormat(sldl_variable.nh_asian_change)} (${(sldl_variable.pct_nh_asian_change !== null && sldl_variable.pct_nh_asian_change < 0) ? numFormat(sldl_variable.pct_nh_asian_change.toPrecision(3)) : "+" + numFormat(sldl_variable.pct_nh_asian_change.toPrecision(3))}%)
                    </br>AIAN: ${numFormat(sldl_variable.nh_aian_change)} (${(sldl_variable.pct_nh_aian_change !== null && sldl_variable.pct_nh_aian_change < 0) ? numFormat(sldl_variable.pct_nh_aian_change.toPrecision(3)) : "+" + numFormat(sldl_variable.pct_nh_aian_change.toPrecision(3))}%)
                    </br>Hawaiian/Pac. Islander: ${numFormat(sldl_variable.nh_haw_pi_change)} (${(sldl_variable.pct_nh_haw_pi_change !== null && sldl_variable.pct_nh_haw_pi_change < 0) ? numFormat(sldl_variable.pct_nh_haw_pi_change.toPrecision(3)) : "+" + numFormat(sldl_variable.pct_nh_haw_pi_change.toPrecision(3))}%)
                    </br>Hispanic: ${numFormat(sldl_variable.hispanic_change)} (${(sldl_variable.pct_hispanic_change!== null && sldl_variable.pct_hispanic_change < 0) ? numFormat(sldl_variable.pct_hispanic_change.toPrecision(3)) : "+" + numFormat(sldl_variable.pct_hispanic_change.toPrecision(3))}%)
                  `
                    )
            tooltip.transition()
                .duration(50)
                .style("left", mx + "px")
                .style("top", my + "px")
                .style("visibility", "visible")
              })
  
            dists.on("mouseout", () => {
                tooltip
                    .transition()
                    .duration(50)
                    .style("visibility", "hidden")
            })
      }

      states = g.selectAll(".state")
        .data(topojson.feature(state.state_geojson, state.state_geojson.objects.states).features)
        .join("path")
          .attr("class", "state")
          .attr("d", path)
          .attr("stroke-width", "1.5px")
          .raise()
    
      //ADD LABLES FOR STATES  
      const stateLabels = g.selectAll(".stateLabel")
        .data(topojson.feature(state.state_geojson, state.state_geojson.objects.states).features)
        .join("text") 
        .attr("class", "stateLabel")
        .attr("transform", function(d) {
          const coords = path.centroid(d)
          if (d.properties.usps)
          {return `translate(${coords})`;}
          } 
        )
        .text(d => d.properties.usps)
        .raise() 

  svg.call(zoom);
}