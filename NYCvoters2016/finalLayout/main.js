const width = window.innerWidth,
height = window.innerHeight * 0.8,
margin = { top: 20, bottom: 50, left: 70, right: 20 }

let state = {
    data: [],
    selectedParty: "All Parties",
    selectedGender: "All Genders",
    selectedWinner: "All Districts",
    selectedDecade: "After",
    mapView: "pct_total_first2016_total_voted2016",
    geojson: null,
    results: null
    }
let map;
let mapTooltip;
let dists;
let scatterplotTooltip;
let circles;
let lines;
let layoutGrid;
let mapboxContainer;
let basemap;
let medianText;
let medianTextCircle
let totalText;

const numFormat = d3.format(",")

const xScale = d3.scaleBand()
        .domain(["Manhattan","Bronx","Brooklyn","Queens","Staten Island"])
        .range([margin.left, parseInt(d3.select("#scatterplot").style("width"), 10)])
        .padding(.05)

const yScale = d3.scaleLinear()
        .domain([26, 100])
        .range([height - margin.bottom, margin.top])
        
const svgScatterplot = d3.select("#scatterplot")
        .append("svg")
        .attr("class", "scatterplot")
        .attr("width", "100%")
        .attr("height", "100%");

Promise.all([
    d3.csv('../data/NYC_reg10102008_first2016.csv', d3.autoType),
    d3.json("../data/NYC_elec_dists_2016data_all.json"), 
    d3.csv("../data/NYC_2016_results_aded.csv", d => ({
        aded: +d.aded,
        trump: +d.trump,
        clinton: +d.clinton,
        johnson: +d.johnson,
        stein: +d.stein,
        total: +d.total
    }))
    ]).then(([data, geojson, results]) => {
    // + SET STATE WITH DATA
    state.data = data;
    state.geojson = geojson;
    state.results = results;
    console.log("state: ", state);
    init();
    });

function init() {
    mapboxgl.accessToken = "pk.eyJ1IjoidmFsYmF1ZXIiLCJhIjoiY2tnaWhndHVlMWZneDJzcnJkemRqeGZzeiJ9.01wZ91f4C1ngeht7WUAdKQ"

    basemap = new mapboxgl.Map({
        container: "map",
        center: [-73.982364, 40.706839],
        zoom: 9.5,
        style: "mapbox://styles/valbauer/ckhl63joo0aas19lmenmde122",
        scrollZoom: false
      });
      
    basemap.addControl(new mapboxgl.NavigationControl(), "top-right");
    
    mapboxContainer = basemap.getCanvasContainer()

    const mapIcon = d3.selectAll(".mapIcon")
        .on("click", function () {
            d3.select("#map")
                .style("visibility", "visible")
            d3.select("#toggleMap")
                .style("visibility", "visible")
            d3.select("h3.mapDesc")
                .style("visibility", "visible")
            d3.select("#scatterplot")
                .style("visibility", "hidden")
            d3.select("h3.distributionDesc")
                .style("visibility", "hidden") 
            d3.select(".selections")
                .style("visibility", "hidden")
            d3.select(".about")
                .style("visibility", "hidden")      
        })

    const distroIcon = d3.selectAll(".distroIcon")
        .on("click", function () {
            d3.select("#scatterplot")
                .style("visibility", "visible")
            d3.select("h3.distributionDesc")
                .style("visibility", "visible")
            d3.select(".selections")
                .style("visibility", "visible")
            d3.select("#map")
                .style("visibility", "hidden")
            d3.select("#toggleMap")
                .style("visibility", "hidden")
            d3.select("h3.mapDesc")
                .style("visibility", "hidden")
            d3.select(".about")
                .style("visibility", "hidden")
        })

    const aboutIcon = d3.selectAll(".aboutIcon")
        .on("click", function () {
            d3.select(".about")
                .style("visibility", "visible")
            d3.select("#map")
                .style("visibility", "hidden")
            d3.select("#toggleMap")
                .style("visibility", "hidden")
            d3.select("h3.mapDesc")
                .style("visibility", "hidden")
            d3.select("#scatterplot")
                .style("visibility", "hidden")
            d3.select(".selections")
                .style("visibility", "hidden")
            d3.select("h3.distributionDesc")
                .style("visibility", "hidden")       
        })

    //SELECTIONS FOR SCATTERPLOT
    const selectDecade = d3.select("#dropdownDecade").on("change", function() {
        // `this` === the selectElement
        // 'this.value' holds the dropdown value a user just selected
        state.selectedDecade = this.value
        console.log("new decade is", this.value);
        draw();
      });

    selectDecade
        .selectAll("option")
        .data(["After", "Before"])
        .join("option")
        .attr("value", d => d)
        .text(d => d);

    const selectParty = d3.select("#dropdownParty").on("change", function() {
        // `this` === the selectElement
        // 'this.value' holds the dropdown value a user just selected
        state.selectedParty = this.value
        console.log("new party is", this.value);
        draw();
      });

    selectParty
        .selectAll("option")
        .data(["All Parties","Democrat", "Republican","Other"])
        .join("option")
        .attr("value", d => d)
        .text(d => d);

    const selectGender = d3.select("#dropdownGender").on("change", function() {
        // `this` === the selectElement
        // 'this.value' holds the dropdown value a user just selected
        state.selectedGender = this.value
        console.log("new gender is", this.value);
        draw();
        });

    selectGender
        .selectAll("option")
        .data(["All Genders", "Female", "Male"])
        .join("option")
        .attr("value", d => d)
        .text(d => d);

    const selectWinner = d3.select("#dropdownWinner").on("change", function() {
        // `this` === the selectElement
        // 'this.value' holds the dropdown value a user just selected
        state.selectedWinner = this.value
        console.log("new winner is", this.value);
        draw();
        });

    selectWinner
        .selectAll("option")
        .data(["All Districts", "Clinton", "Trump"])
        .join("option")
        .attr("value", d => d)
        .text(d => d);

    let selectMap = d3.selectAll("input").on("change", function() {
        // `this` === the selectElement
        // 'this.value' holds the dropdown value a user just selected
        state.mapView = this.value
        console.log("new map view is", this.value);
        drawMap();
        });

    // AXES FOR SCATTERPLOT
    const yAxis = g => g
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("class", "yAxisText")
            .attr("x", margin.left-15)
            .attr("y", "-50%")
            .attr("fill", "currentColor")
            .text("Age in 2016"))

    const grid = g => g
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call(g => g.append("g")
            .selectAll("line")
            .data(yScale.ticks())
            .join("line")
            .attr("y1", d => 0.5 + yScale(d))
            .attr("y2", d => 0.5 + yScale(d))
            .attr("x1", margin.left)
            .attr("x2", width - margin.right));
     
    const xAxis = g => g
       .attr("transform", `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(xScale).tickSize(0).tickPadding([10]))
       .attr("fill", "currentColor")
       .attr("stroke-opacity", 0.1)
       
    scatterplotTooltip = d3
        .select("#scatterplot")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")

    svgScatterplot.append("g")
        .attr("class", "yAxis")
        .call(yAxis)
       
    svgScatterplot.append("g")
        .attr("class", "xAxis")
        .call(xAxis);
    
    svgScatterplot.append("g")
        .call(grid);

   
    draw ();
    drawMap();
};

function draw() {
    console.log("drawing")

    //FILTERING DATA FOR THE SCATTERPLOT
    let filteredData;
    let filteredGroupedData;

    if (state.selectedDecade && state.selectedParty === "All Parties" && state.selectedGender === "All Genders" && state.selectedWinner === "All Districts") {
        filteredData = state.data.filter(d => d.decade === state.selectedDecade);
        }
    else if (state.selectedParty !== "All Parties" && state.selectedGender !== "All Genders" && state.selectedWinner !== "All Districts") {
        filteredData = state.data.filter(d => d.party_gen === state.selectedParty && d.gender === state.selectedGender && d.winner === state.selectedWinner &&  d.decade === state.selectedDecade) 
        }
    else if (state.selectedParty !== "All Parties" && state.selectedGender === "All Genders" && state.selectedWinner === "All Districts") {
        filteredData = state.data.filter(d => d.party_gen === state.selectedParty &&  d.decade === state.selectedDecade) 
        }  
    else if (state.selectedParty === "All Parties" && state.selectedGender === "All Genders" && state.selectedWinner !== "All Districts") {
        filteredData = state.data.filter(d => d.winner === state.selectedWinner &&  d.decade === state.selectedDecade) 
    }
    else if (state.selectedParty === "All Parties" && state.selectedGender !== "All Genders" && state.selectedWinner === "All Districts") {
        filteredData = state.data.filter(d => d.gender === state.selectedGender &&  d.decade === state.selectedDecade) 
    } 
    else if (state.selectedParty === "All Parties" && state.selectedGender !== "All Genders" && state.selectedWinner !== "All Districts") {
        filteredData = state.data.filter(d => d.gender === state.selectedGender && d.winner === state.selectedWinner &&  d.decade === state.selectedDecade) 
        }
    else if (state.selectedParty !== "All Parties" && state.selectedGender !== "All Genders" && state.selectedWinner === "All Districts") {
        filteredData = state.data.filter(d => d.party_gen === state.selectedParty && d.gender === state.selectedGender &&  d.decade === state.selectedDecade) 
        }    
    else if (state.selectedParty !== "All Parties" && state.selectedGender === "All Genders" && state.selectedWinner !== "All Districts") {
        filteredData = state.data.filter(d => d.party_gen === state.selectedParty && d.winner === state.selectedWinner &&  d.decade === state.selectedDecade) 
    }
    filteredGroupedData = d3.group(filteredData, d => d.boro)
    
    console.log(filteredData)
    console.log(filteredGroupedData)
    
    filteredGroupedData.forEach(function(group) {

        let median = d3.median(group, d => d.age_2016)
        const bandScale = d3.scaleLinear()
            .domain([0, group.length])
            .range([0, xScale.bandwidth()])

        let groupLength = group.length   
        
        let currentBoro = group[0].boro.replace(" ", "_")
        console.log(currentBoro)

        circles = svgScatterplot.selectAll(`circle.${currentBoro}`)
            .data(group, d => d.key)
            .join(enter => enter.append("circle")
                .attr("class", d => d.boro.replace(" ", "_"))
                .attr("cy", margin.top) 
                .attr("cx", d => bandScale(d3.randomInt(groupLength)()) + xScale(d.boro))
                .attr("r", 1.5)
                .attr("opacity", .35)
                .attr("fill", d => {
                    if (d.party_gen === "Democrat") return "#0571b0";
                    else if (d.party_gen === "Republican") return "#ca0020";
                    else return "DarkMagenta";
                }).call(enter =>
                    enter
                        .transition()
                        .delay((d,i) => i/3)
                            .duration(300)
                            .attr("cy", d => yScale(d.age_2016))),
                update => update.call(update =>
            
                      update
                        .transition()
                        .duration(250)),
                exit => exit.call(exit =>
                    exit
                        .transition()
                        .delay((d) => d.age_2016*2)
                            .duration(250)
                            .attr("cy", height - margin.bottom)
                            .remove()))
            .on("mouseover", function (d) {
                const [mx,my] = d3.mouse(svgScatterplot.node())
                scatterplotTooltip.html(
                    `
                    This ${d.age_2016} year-old ${d.gender.toLowerCase()} registered ${d.party_gen} in ${d.nta} has been registered to vote since ${d.regdate}.`
                )
                .transition()
                .duration(150)
                .style("left", mx + "px")
                .style("top", my + "px")
                .style("visibility", "visible")
            })
            .on("mouseout", () => {
                scatterplotTooltip
                    .transition()
                    .duration(150)
                    .style("visibility", "hidden")
            }) 

            circles.lower()
        
        

        //Do the same thing with text for each median and for groupLength.
        
        medianTextCircle = svgScatterplot.selectAll(`circle.${currentBoro}.medianTextCircle`)
            .data([median])
            .join(enter => enter.append("circle")
                .attr("class", `${currentBoro} medianTextCircle`),
                update => update,
                exit => exit.remove())
                .attr("r", "1.15em")
                .attr("cy", yScale(median) - 20)
                .attr("cx", xScale(currentBoro.replace("_", " ")) + xScale.bandwidth()/2)
                

        medianText = svgScatterplot.selectAll(`text.${currentBoro}.medianText`)
            .data([median])
            .join(enter => enter.append("text")
                .attr("class", `${currentBoro} medianText`),
                update => update,
                exit => exit.remove())
                .attr("y", yScale(median)-10)
                .attr("x", xScale(currentBoro.replace("_", " ")) + xScale.bandwidth()/2)
                .attr("fill", "#333333")
                .text(median)

        totalText = svgScatterplot.selectAll(`text.${currentBoro}.totalText`)
                .data([groupLength])
                .join(enter => enter.append("text")
                    .attr("class", `${currentBoro} totalText`),
                    update => update,
                    exit => exit.remove())
                    .attr("y", height - margin.bottom + 45)
                    .attr("x", xScale(currentBoro.replace("_", " ")) + xScale.bandwidth()/2)
                    .style("text-anchor", "middle")
                    .attr("fill", "currentColor")
                    .text(function () {
                        if (groupLength > 6) return numFormat(groupLength);
                        else return "0";
                    })
            
        lines = svgScatterplot.selectAll(`line.${currentBoro}`)
            .data([median])
            .join(enter => enter.append("line")
                .attr("class", currentBoro),
                update => update,
                exit => exit.remove())
                .attr("y1", yScale(median)) 
                .attr("y2", yScale(median)) 
                .attr("x1", xScale(currentBoro.replace("_", " ")))
                .attr("x2", xScale(currentBoro.replace("_", " ")) + xScale.bandwidth())
                .style("stroke", "#333333")
                .style("stroke-width", "3")
            .call(selection => 
                selection.transition()
                .duration(250))    
        });
    };
 //MAP DRAWING  
function drawMap() {

 d3.selectAll("input")
    .property("checked", function() {
    console.log(this.value, state.mapView)

    return this.value === state.mapView;});
 
 map = d3.select(mapboxContainer)   
    .selectAll("svg.map")
    .data([null])
    .join("svg")
    .attr("class", "map")
    .attr("width", "100%")
    .attr("height", "100%")


 //FROM http://bl.ocks.org/enjalot/0d87f32a1ccb9a720d29ba74142ba365
 function getD3() {
     var bbox = document.querySelector("#map").getBoundingClientRect();
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
      
const colorScaleTrump = d3.scaleThreshold()
    .domain([.5, .7, .8])
    .range(["#fddbc7","#ef8a62","#b2182b"])
const colorScaleClinton = d3.scaleThreshold()
   .domain([.5, .7, .8])
   .range(["#d1e5f0", "#67a9cf", "#2166ac"])

 dists = map
   .selectAll(".dists")
   .data(state.geojson.features, d => d.properties.elect_dist)
   .join("path")
   .attr("d", path)
   .attr("class", d => `${d.properties.winner} dists`)
   .attr("fill", function (d) {
        if (d.properties.total_first2016 > 10 && state.mapView === "pct_total_first2016_total_voted2016") {
            return colorScale(d.properties.pct_total_first2016_total_voted2016)
         } 
        else if (state.mapView === "winner" && d.properties.winner === "trump") {
            return colorScaleTrump(d.properties.trump_votes/d.properties.total_votes);
        }
        else if (state.mapView === "winner" && d.properties.winner === "clinton") {
            return colorScaleClinton(d.properties.clinton_votes/d.properties.total_votes);
        }
        else if (state.mapView === "winner" && d.properties.winner === null) {
            return "#b5b5b5";
        }
        else if (state.mapView === "winner" && d.properties.total_first2016 < 10) {
            return "#b5b5b5";
        }
        else return "none";
 })
   .style("stroke", function (d) {
     if (d.properties.total_first2016 > 10) {
     return "black"
       } else return "none";
 })
 
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
 
 mapTooltip = d3
   .select("#map")
   .append("div")
   .attr("class", "tooltip")
   .style("position", "absolute")
   .style("visibility", "hidden")

 dists
     .on("mouseover", function (d) {
         const [mx,my] = d3.mouse(map.node())
         const aded = d.properties.elect_dist
         const results_aded = state.results.find(result => result.aded === aded)
        if (d.properties.winner === null) {
            mapTooltip
                     .html(
                `Election results not available for this district.`)
        }
        
        else if (results_aded) {
             if (d.properties.total_first2016 > 10 && results_aded.trump > results_aded.clinton) {
                 mapTooltip
                     .html(
                 `
                 <big>${(d.properties.pct_total_first2016_total_voted2016) ? d.properties.pct_total_first2016_total_voted2016 : 0}% new voters
                 <br/></big>
                 ${(d.properties.total_first2016) ? d.properties.total_first2016 : 0} new voters of ${d.properties.total_voted2016}
                 <br/>(${(d.properties.DEM) ? d.properties.DEM : 0} Democrats,
                 ${(d.properties.REP) ? d.properties.REP : 0} Republicans, 
                 and ${((d.properties.total_first2016 - d.properties.DEM - d.properties.REP) > 0) ? d.properties.total_first2016 - d.properties.DEM - d.properties.REP : 0} Other)
                 <hr style="width:100%;text-align:left;margin-left:0">
                 <b><span style="color:rgb(189, 9, 9)">Trump won this district in ${d.properties.nta_name} by ${results_aded.trump - results_aded.clinton} votes
                 with ${Math.round(d.properties.trump_votes/d.properties.total_votes*100)}% of the overall vote.</span></b>`
                 )
                             } 
             else if (d.properties.total_first2016 > 10 && results_aded.trump < results_aded.clinton) 
             {
                 mapTooltip
                     .html(
                 `
                 <big>${(d.properties.pct_total_first2016_total_voted2016) ? d.properties.pct_total_first2016_total_voted2016 : 0}% new voters
                 <br/></big>
                 ${(d.properties.total_first2016) ? d.properties.total_first2016 : 0} new voters of ${d.properties.total_voted2016}
                 <br/>(${(d.properties.DEM) ? d.properties.DEM : 0} Democrats,
                 ${(d.properties.REP) ? d.properties.REP : 0} Republicans,
                 and ${((d.properties.total_first2016 - d.properties.DEM - d.properties.REP) > 0) ? d.properties.total_first2016 - d.properties.DEM - d.properties.REP : 0} Other)
                 <hr style="width:100%;text-align:left;margin-left:0">
                 <b><span style="color:darkblue">Clinton won this district in ${d.properties.nta_name} by ${results_aded.clinton - results_aded.trump} votes
                 with ${Math.round(d.properties.clinton_votes/d.properties.total_votes*100)}% of the overall vote..</span></b>`
                 )
             }           
         } 
         else {
             if (d.properties.total_first2016 > 10) {
                 mapTooltip
                     .html(
                 `
                 <big>${(d.properties.pct_total_first2016_total_voted2016) ? d.properties.pct_total_first2016_total_voted2016 : 0}% new voters
                 <br/></big>
                 ${(d.properties.total_first2016) ? d.properties.total_first2016 : 0} new voters of ${d.properties.total_voted2016} 
                 <br/>(${(d.properties.DEM) ? d.properties.DEM : 0} Democrats, 
                 ${(d.properties.REP) ? d.properties.REP : 0} Republicans, and 
                 ${((d.properties.total_first2016 - d.properties.DEM - d.properties.REP) > 0) ? d.properties.total_first2016 - d.properties.DEM - d.properties.REP : 0} Other)
                 <hr style="width:100%;text-align:left;margin-left:0">
                 Election results not available for this district in ${d.properties.nta_name}.`
                 )} 
         }

         mapTooltip.transition()
             .duration(50)
             .style("left", mx + "px")
             .style("top", my + "px")
             .style("visibility", "visible")
         })
     
 dists.on("mouseout", () => {
     mapTooltip
         .transition()
         .duration(50)
         .style("visibility", "hidden")
 }) 

 if (state.mapView === "winner") {
    const legendColors = Array.from([...colorScaleClinton.range().reverse(), ...colorScaleTrump.range()])
    const legendText = ["Over 80%", "70%+", "50%+", "50%+", "70%+", "Over 80%"]
    const legendArray = [];
    console.log(legendColors)
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
    .attr("width", 85)
    .attr("height", height/4)

        legendArray.forEach(function (d,i) {
        const g = legend.append("g")
            g.append("rect")
            .attr("class", "legendRects")
            .attr("width", 85)
            .attr("height", height/24)
            .attr("y", i * height/24)
            .style("fill", function() {
                return d.color;
            })
            .style("stroke", "white")

            g.append("text")
            .attr("class", "legendText")
            .attr("x", "50%")
            .attr("y", i * height/24 + (height/48) + 5)
            .text(function () {
                return d.value})
            .style("fill", function() {
                if (d.value === "Over 80%" || d.value === "70%") {
                    return  "white"}
                else return "black";
            })
            })
    }
else if (state.mapView === "pct_total_first2016_total_voted2016") {
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
        .attr("width", 85)
        .attr("height", height/4)
    
            legendArray.forEach(function (d,i) {
            const g = legend.append("g")
                g.append("rect")
                .attr("class", "legendRects")
                .attr("width", 85)
                .attr("height", height/20)
                .attr("y", i * height/20)
                .style("fill", function() {
                    return d.color;
                })
                .style("stroke", "white")
    
                g.append("text")
                .attr("class", "legendText")
                .attr("x", "50%")
                .attr("y", i * height/20 + (height/40) + 5)
                .text(function () {
                    return d.value})
                .style("fill", function() {
                    if (d.value === "7-10%" || d.value === "Over 10%") {
                        return  "white"}
                    else return "black";
                })
                })
        }


};
