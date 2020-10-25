const width = window.innerWidth,
height = window.innerHeight * 0.8,
margin = { top: 20, bottom: 50, left: 60, right: 30 }


let state = {
    geojson: null,
    results: null
}
let svg;
let tooltip;
let dists;

Promise.all([
    d3.json("data/NYC_elec_dists_2016data_simplified.json"), 
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

const zoom = d3.zoom()
  .scaleExtent([1, 12])
  .on("zoom", zoomed);

function zoomed() {
    const {transform} = d3.event;
    g.attr("transform", transform);
    g.attr("stroke-width", 2 / transform.k);
  }

  function init() {
    // create an svg element in our main `d3-container` element
    
    mapboxgl.accessToken = "pk.eyJ1IjoidmFsYmF1ZXIiLCJhIjoiY2tnaWhndHVlMWZneDJzcnJkemRqeGZzeiJ9.01wZ91f4C1ngeht7WUAdKQ"

    //d3.select("#d3-container").attr("height", height).attr("width",width)

    const basemap = new mapboxgl.Map({
        container: "d3-container",
        center: [-73.982364, 40.706839],
        zoom: 9.5,
        style: "mapbox://styles/mapbox/light-v10",
        scrollZoom: true
      });
      
    basemap.addControl(new mapboxgl.NavigationControl(), "top-right");

    const mapboxContainer = basemap.getCanvasContainer()
    
    //svg = d3.select("#d3-container")  
    svg = d3.select(mapboxContainer)  
        .append("svg")
        .style("position", "absolute")
        .attr("width", "100%")
        .attr("height", "100%")
      //.style("pointer-event", "none");

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
    //let projection = null;
    //let projection = d3.geoMercator()
    let path = d3.geoPath().projection(projection);
    
    const colorScale = d3.scaleThreshold()
        .domain([3, 5, 7, 10])
        .range(d3.schemeBuPu[5]);

    dists = svg
      .selectAll(".dists")
      .data(state.geojson.features)
      //.data(topojson.feature(state.geojson, state.geojson.objects.NYC_elec_dists_2016data.geometries))//.features)
      .join("path")
      .attr("d", path)
      .attr("class", "dists")
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

    dists
        .on("mouseover", (d) => {
            const [mx,my] = d3.mouse(svg.node())
            const aded = d.properties.elect_dist
            const results_aded = state.results.find(result => result.aded === aded)
            if (results_aded) {
            if (d.properties.total_first2016 > 10 && results_aded.trump > results_aded.clinton) {
                tooltip
                    .html(
                `
                <big>${(d.properties.pct_total_first2016_total_voted2016) ? d.properties.pct_total_first2016_total_voted2016 : 0}% new voters
                <br/></big>
                (${(d.properties.total_first2016) ? d.properties.total_first2016 : 0} new voters of ${d.properties.total_voted2016}) 
                <br/>(${(d.properties.DEM) ? d.properties.DEM : 0} Democrats
                <br/>${(d.properties.REP) ? d.properties.REP : 0} Republicans
                <br/>${((d.properties.total_first2016 - d.properties.DEM - d.properties.REP) > 0) ? d.properties.total_first2016 - d.properties.DEM - d.properties.REP : 0} Other)
                <br/>Trump won this district by ${results_aded.trump - results_aded.clinton} votes.`
                )} 
            else if (d.properties.total_first2016 > 10 && results_aded.trump < results_aded.clinton) 
            {
                tooltip
                    .html(
                `
                <big>${(d.properties.pct_total_first2016_total_voted2016) ? d.properties.pct_total_first2016_total_voted2016 : 0}% new voters
                <br/></big>
                (${(d.properties.total_first2016) ? d.properties.total_first2016 : 0} new voters of ${d.properties.total_voted2016}) 
                <br/>(${(d.properties.DEM) ? d.properties.DEM : 0} Democrats
                <br/>${(d.properties.REP) ? d.properties.REP : 0} Republicans
                <br/>${((d.properties.total_first2016 - d.properties.DEM - d.properties.REP) > 0) ? d.properties.total_first2016 - d.properties.DEM - d.properties.REP : 0} Other)
                <br/>Clinton won this district by ${results_aded.clinton - results_aded.trump} votes.`
                )}
            
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
                    <br/>Election results not available for this district.`
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
       
    };

    