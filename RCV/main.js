const width = window.innerWidth,
height = window.innerHeight * 0.8,
margin = { top: 20, bottom: 50, left: 60, right: 30 }

let state = {
    ballots_geojson: null,
    ed_geojson: null,
    ad_geojson: null,
    round: "First Choice",
    active: null,
    results: null
}
let svg;
let g;
let ballots;
let resultsMap;
let tooltip;
let legend;

Promise.all([
    d3.json("./data/RCV_test_4326.geojson"),
    d3.json("./data/nyed21clipped_4326.geojson"),
    d3.json("./data/nyad21clipped_4326.geojson"),
    d3.csv("./data/results.csv", d => ({
        round: d.Rounds,
        //Split the candidates and create and array
        active: d.Active.trim().split(",")
    })),
  ]).then(([ballots_geojson, ed_geojson, ad_geojson, results]) => {
    state.ballots_geojson = ballots_geojson;
    state.ed_geojson = ed_geojson;
    state.ad_geojson = ad_geojson;
    state.results = results
    console.log("state: ", state);
    init();
  }); 

//This feeds state the round number as well as the array of active candidates which facilitates the 
//changing colors per round and the graying out of candidates in the legend. 
let selectRound = d3.selectAll("input").on("change", function() {
    state.round = this.value
    state.active = resultsMap.get(this.value)
    console.log(this.value);
    console.log(state.active)
    draw();
})

const candidates = ["PaperboyPrince","Chang","Donovan","Morales","McGuire","Stringer","Wiley","Garcia","Adams","Yang"]

//This color scale comes from https://github.com/d3/d3-scale-chromatic and uses colors from colorbrewer2.org
const colorScale = d3.scaleOrdinal()
                    .domain([candidates])
                    .range(d3.schemeCategory10)

//Zooms the map
const zoom = d3.zoom()
    .scaleExtent([1, 12])
    .on("zoom", zoomed);
                  
function zoomed() {
    const {transform} = d3.event;
    g.attr("transform", transform);
    g.attr("stroke-width", 2 / transform.k);
    }


function init () {

    resultsMap = new Map(state.results.map(d => [d.round, d.active]))

    //Projection can be changed to fit with mapbox
    const projection = d3.geoAlbersUsa()
        .fitSize([width, height], state.ballots_geojson);
    
    const path = d3.geoPath()
        .projection(projection)

    svg = d3
        .select("#d3-container")
        .append("svg")
        .attr("class", "viewBox")
        .attr("viewBox",[0,0,width,height]);

    //Create legend
    legend = d3.select("#legend")
        .append("svg")
        .attr("class", "legend")
        .attr("width", width)
        .attr("height", height/10)

    //Populate legend with candidates and colors
    candidates.forEach(function (d,i) {
        const g = legend
            .append("g")
            .attr("id", function () {return d})
            
        g.append("circle")
            .attr("class", "legendCircle")
            .attr("r", 10)
            .attr("cx", i * width/10+65)
            .attr("cy", "50%")
            .attr("fill", function () {return colorScale(d)})
            
        g.append("text")
            .attr("class", "legendText")
            .attr("x", i * width/10+65)
            .attr("y", "80%")
            .text(function () {return d})
        })

    g = svg.append("g")
        .attr("class", "map")
        
    tooltip = d3
        .select("#d3-container")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
    
    //Draw the election districts
    const ed = g
        .selectAll(".ed")
        .data(state.ed_geojson.features)
        .attr("class", "ed")
        .join("path")
        .attr("d", path)
        .attr("fill", "white")
        .attr("stroke", "gray")

    //Draw the dots
    ballots = g
        .selectAll(".ballots")
        .data(state.ballots_geojson.features, d => d)
        .attr("class", d => d.properties.cvr_no)
        .join("circle")
        .attr("r", 1)
        .attr("fill", d => colorScale(d.properties.mayor1))
        .attr("transform", function(d) {
            const coords = projection([d.geometry.coordinates[0][0], d.geometry.coordinates[0][1]])
            return `translate(${coords[0]}, ${coords[1]})`;
        })

    //Tootip actions for the dots    
    ballots.on("mouseover", function(d) {
        const [mx,my] = d3.mouse(ballots.node())
        tooltip
            .html(
                `Mayor 1: ${d.properties.mayor1}
                <br/>
                Mayor 2: ${d.properties.mayor2}
                <br/>
                Mayor 3: ${d.properties.mayor3}
                <br/>
                Mayor 4: ${d.properties.mayor4}
                <br/>
                Mayor 5: ${d.properties.mayor5}`
            )
        tooltip.transition()
                .duration(50)
                .style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 15) + "px")
                .style("visibility", "visible")
    })
        .on("mouseout", () => {
            tooltip
                .transition()
                .duration(150)
                .style("visibility", "hidden")
        }) 

    draw();
}

function draw() {
    //Allows for toggling between rounds
    d3.selectAll("input")
        .property("checked", function() {
            //console.log(state.active)
            //console.log(state.round)
            return this.value === state.round;
        });

    //Change the fill of the dots based on which candidates are still active.
    //Will probably have to update to include a provision for "overvote" results on the ballots.
    ballots
        .attr("fill", function(d) {
            state.active = resultsMap.get(state.round)
            //console.log(state.active)
            if (state.active.includes(d.properties.mayor1)) {
                return colorScale(d.properties.mayor1)
            }
            else if (state.active.includes(d.properties.mayor2)) {
                return colorScale(d.properties.mayor2)
            }
            else if (state.active.includes(d.properties.mayor3)) {
                return colorScale(d.properties.mayor3)
            }
            else if (state.active.includes(d.properties.mayor4)) {
                return colorScale(d.properties.mayor4)
            }
            else if (state.active.includes(d.properties.mayor5)) {
                return colorScale(d.properties.mayor5)
            }
            else return "lightgray";
        })



    //Gray out the candidates that are no longer active
    legend.selectAll("g")
        .attr("opacity", function (d) {
            const elemID = d3.select(this).attr('id');
            if (state.active.includes(elemID))
                {return "1"}
            else {return ".25"}  
        })
    
    svg.call(zoom);

}