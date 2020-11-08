const width = window.innerWidth,
height = window.innerHeight * 0.8,
margin = { top: 20, bottom: 50, left: 5, right: 5 }


let state = {
    geojson: null,
    results: null
}
let map;
let tooltip;
let dists;

Promise.all([
    d3.json("data/NYC_elec_dists_2016data_all.json"), 
    d3.csv("data/NYC_2016_results_aded.csv", d => ({
        aded: +d.aded,
        trump: +d.Trump,
        clinton: +d.Clinton,
        johnson: +d.Johnson,
        stein: +d.Stein,
        total: +d.Total
    }))
  ]).then(([geojson, results]) => {
    // + SET STATE WITH DATA
    state.geojson = geojson;
    state.results = results;
    console.log("state: ", state);
    init();
  });

  function init() {
    // create an svg element in our main `d3-container` element
    
    mapboxgl.accessToken = "pk.eyJ1IjoidmFsYmF1ZXIiLCJhIjoiY2tnaWhndHVlMWZneDJzcnJkemRqeGZzeiJ9.01wZ91f4C1ngeht7WUAdKQ"

    const basemap = new mapboxgl.Map({
        container: "d3-container",
        center: [-73.982364, 40.706839],
        zoom: 9.5,
        style: "mapbox://styles/mapbox/light-v10",
        scrollZoom: true
      });
      
    basemap.addControl(new mapboxgl.NavigationControl(), "top-right");

    const mapboxContainer = basemap.getCanvasContainer()
    
    map = d3.select(mapboxContainer)  
        .append("svg")
        .style("position", "absolute")
        .attr("width", "100%")
        .attr("height", "100%")


    //FROM http://bl.ocks.org/enjalot/0d87f32a1ccb9a720d29ba74142ba365
    function getD3() {
        var bbox = document.querySelector("#d3-container").getBoundingClientRect();
        var center = basemap.getCenter();
        var zoom = basemap.getZoom();
        // 512 is hardcoded tile size, might need to be 256 or changed to suit your map config
        var scale = (512) * 0.5 / Math.PI * Math.pow(2, zoom);
  
        let projection = d3.geoMercator()
          .center([center.lng, center.lat])
          .translate([bbox.width/2, bbox.height/2])
          .scale(scale);
  
        return projection;
      }
      // calculate the original d3 projection
    let projection = getD3();
    let path = d3.geoPath().projection(projection);
    
    const colorScale = d3.scaleThreshold()
        .domain([3, 5, 7, 10])
        .range(d3.schemeBuPu[5]);

    dists = map
      .selectAll(".dists")
      .data(state.geojson.features)
      //.data(topojson.feature(state.geojson, state.geojson.objects.NYC_elec_dists_2016data.geometries))//.features)
      .join("path")
      .attr("d", path)
      .attr("class", d => d.properties.winner)
      .attr("fill", function (d) {
          if (d.properties.total_first2016 > 10) {
          return colorScale(d.properties.pct_total_first2016_total_voted2016)
            } else return "#f6f6f4";
    })

    
    //svg.call(zoom);
    //FROM http://bl.ocks.org/enjalot/0d87f32a1ccb9a720d29ba74142ba365
    function render() {
        projection = getD3();
        path.projection(projection)
        
        dists
            .attr("d", path)
      }
      // re-render our visualization whenever the view changes
      basemap.on("viewreset", function() {
        render()
      })
      basemap.on("move", function() {
        render()
      })
      // render our initial visualization
    render();
    
    tooltip = d3
      .select("#d3-container")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")

    dists
        .on("mouseover", function (d) {
            const [mx,my] = d3.mouse(map.node())
            const aded = d.properties.elect_dist
            const results_aded = state.results.find(result => result.aded === aded)
            if (results_aded) {
                if (d.properties.total_first2016 > 10 && results_aded.trump > results_aded.clinton) {
                    tooltip
                        .html(
                    `
                    <big>${(d.properties.pct_total_first2016_total_voted2016) ? d.properties.pct_total_first2016_total_voted2016 : 0}% new voters
                    <br/></big>
                    ${(d.properties.total_first2016) ? d.properties.total_first2016 : 0} new voters of ${d.properties.total_voted2016}
                    <br/>(${(d.properties.DEM) ? d.properties.DEM : 0} Democrats,
                    ${(d.properties.REP) ? d.properties.REP : 0} Republicans, 
                    and ${((d.properties.total_first2016 - d.properties.DEM - d.properties.REP) > 0) ? d.properties.total_first2016 - d.properties.DEM - d.properties.REP : 0} Other)
                    <hr style="width:100%;text-align:left;margin-left:0">
                    <b><span style="color:rgb(189, 9, 9)">Trump won this district in ${d.properties.nta_name} by ${results_aded.trump - results_aded.clinton} votes.</span></b>`
                    )
                        //.style("background-color", "rgb(189, 9, 9)")
                } 
                else if (d.properties.total_first2016 > 10 && results_aded.trump < results_aded.clinton) 
                {
                    tooltip
                        .html(
                    `
                    <big>${(d.properties.pct_total_first2016_total_voted2016) ? d.properties.pct_total_first2016_total_voted2016 : 0}% new voters
                    <br/></big>
                    ${(d.properties.total_first2016) ? d.properties.total_first2016 : 0} new voters of ${d.properties.total_voted2016}
                    <br/>(${(d.properties.DEM) ? d.properties.DEM : 0} Democrats,
                    ${(d.properties.REP) ? d.properties.REP : 0} Republicans,
                    and ${((d.properties.total_first2016 - d.properties.DEM - d.properties.REP) > 0) ? d.properties.total_first2016 - d.properties.DEM - d.properties.REP : 0} Other)
                    <hr style="width:100%;text-align:left;margin-left:0">
                    <b><span style="color:darkblue">Clinton won this district in ${d.properties.nta_name} by ${results_aded.clinton - results_aded.trump} votes.</span></b>`
                    )
                        //.style("background-color", "darkblue")
                }           
                else { 
                    tooltip.html(
                    `This district had fewer than 10 new voters.`
                    )}
            } 
            else {
                if (d.properties.total_first2016 > 10) {
                    tooltip
                        .html(
                    `
                    <big>${(d.properties.pct_total_first2016_total_voted2016) ? d.properties.pct_total_first2016_total_voted2016 : 0}% new voters
                    <br/></big>
                    ${(d.properties.total_first2016) ? d.properties.total_first2016 : 0} new voters of ${d.properties.total_voted2016} 
                    <br/>(${(d.properties.DEM) ? d.properties.DEM : 0} Democrats
                    <br/>${(d.properties.REP) ? d.properties.REP : 0} Republicans
                    <br/>${((d.properties.total_first2016 - d.properties.DEM - d.properties.REP) > 0) ? d.properties.total_first2016 - d.properties.DEM - d.properties.REP : 0} Other)
                    <hr style="width:100%;text-align:left;margin-left:0">
                    Election results not available for this district in ${d.properties.nta_name}.`
                    )} 
                else { 
                    tooltip.html(
                    `This district had fewer than 10 new voters.`
                    )}
            }

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

    const legendColors = Array.from([...colorScale.range()])
    const legendText = ["Below 3%", "3-5%", "5-7%", "7-10%", "Over 10%"]
    const legendArray = [];

    legendColors.forEach(function(color, i){
      let obj = {};
      obj.color = color;
      obj.value = legendText[i];
      legendArray.push(obj) 
    })

    //For vertical legend
    const legend = d3.select("#legend")
      .append("svg")
      .attr("class", "legend")
      .attr("width", width/10)
      .attr("height", "100%")
    
   /* //For horizontal legend
    const legend = d3.select("#legend")
      .append("svg")
      .attr("class", "legend")
      .attr("width", "100%")
      .attr("height", "20")
       */


    legendArray.forEach(function (d,i) {
      const g = legend.append("g")

        //For vertical legend - change css text-align and padding
        g.append("rect")
          .attr("class", "legendRects")
          //.attr("width", (width - margin.right - margin.left)/5)
          .attr("width", width/10)
          //.attr("height", "100%")
          .attr("height", height/20)
          //.attr("x", i * width/5)
          .attr("y", i * height/20)
          .style("fill", function() {
            return d.color;
          })

        g.append("text")
          .attr("class", "legendText")
          //.attr("x", i * width/5 + (width/10))
          .attr("x", "50%")
          //.attr("y", "75%")
          .attr("y", i * height/20 + (height/40) + 5)
          .text(function () {
            return d.value})
          .style("fill", function() {
              if (d.value !== "Below 3%" && d.value !== "3-5%") {
                return  "whitesmoke"}
            else return "dimgray";
          })
        
       /*  // For horizontal legend
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
          }) */
    })     
  };

    