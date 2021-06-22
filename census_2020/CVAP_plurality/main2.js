const width = window.innerWidth,
height = window.innerHeight * 0.8,
margin = { top: 20, bottom: 50, left: 60, right: 30 }


let state = {
    geojson: null
}
let svg;
let dists;

Promise.all([
    d3.json("data/NYC_elec_dists_2016data_all.json")
  ]).then(([geojson]) => {
    // + SET STATE WITH DATA
    state.geojson = geojson;
    console.log("state: ", state);
    init();
  });

const zoom = d3.zoom()
  .scaleExtent([1, 12])
  .on("zoom", zoomed);

function zoomed() {
    const {transform} = d3.event;
    dists.attr("transform", transform);
    dists.attr("stroke-width", 2 / transform.k);
  }

function init() {
    svg = d3.select("#d3-container")  
    .append("svg")
    .style("position", "absolute")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.bottom)
    .style("pointer-event", "none");

    let projection = d3.geoMercator().fitSize([width, height], state.geojson);
    //let projection = null;

    let path = d3.geoPath().projection(projection);
    
    const colorScale = d3.scaleThreshold()
        .domain([3, 5, 7, 10])
        .range(d3.schemeBuPu[5]);

    //console.log(colorScale)
    
    const legendColors = Array.from([...colorScale.range()])
    const legendText = ["Below 3%", "3-5%", "5-7%", "7-10%", "Over 10%"]
    const legendArray = [];

    legendColors.forEach(function(color, i){
      let obj = {};
      obj.color = color;
      obj.value = legendText[i];
      legendArray.push(obj) 
    })

    const legend = d3.select("#legend")
      .append("svg")
      .attr("class", "legend")
      .attr("width", "100%")
      .attr("height", "20")

    legendArray.forEach(function (d,i) {
        const g = legend.append("g")
        g.append("rect")
          .attr("class", "legendRects")
          .attr("width", (width - margin.right - margin.left)/5)
          .attr("height", "100%")
          .attr("x", i * width/5)
          //.attr("y", i * height/20)
          .style("fill", function() {
            return d.color;
          })

        g.append("text")
          .attr("class", "legendText")
          .attr("x", i * width/5 + (width/10))
          .attr("y", "75%")
          .text(function () {
            return d.value})
          .style("fill", function() {
              if (d.value !== "Below 3%" && d.value !== "3-5%") {
                return  "whitesmoke"}
            else return "dimgray";
          }) 
        })

    dists = svg.append("g")

    dists
      .selectAll(".dists")
      .data(state.geojson.features)
      //.data(topojson.feature(state.geojson, state.geojson.objects.NYC_elec_dists_2016data.geometries))//.features)
      .join("path")
      .attr("d", path)
      .attr("class", "dists")
      .attr("fill", d => colorScale(d.properties.pct_total_first2016_total_voted2016))

    
    svg.call(zoom);
  }