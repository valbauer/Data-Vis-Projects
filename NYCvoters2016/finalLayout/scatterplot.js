const width = window.innerWidth,
height = window.innerHeight * 0.8,
margin = { top: 20, bottom: 50, left: 70, right: 10 }

let state = {
    data: [],
    selectedParty: "All Parties",
    selectedGender: "All Genders",
    selectedWinner: "All Districts",
    selectedDecade: "After"
}
let toolip;
let circles;
let lines;

const xScale = d3.scaleBand()
        .domain(["Manhattan","Bronx","Brooklyn","Queens","Staten Island"])
        .range([margin.left, width - margin.right])
        .padding(.05)

const yScale = d3.scaleLinear()
        .domain([26, 100])
        .range([height - margin.bottom, margin.top])
        
const svg = d3.select("#scatterplot")
        .append("svg")
        .attr("class", "scatterplot")
        .attr("width", width)
        .attr("height", height);

d3.csv('../data/NYC_reg10102008_first2016.csv', d3.autoType)
    .then(data => {
        // + SET STATE WITH DATA
        state.data = data;
        //console.log("state: ", state);
        init();
      });

function init() {
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
       
    tooltip = d3
        .select("#scatterplot")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")

    svg.append("g")
        .attr("class", "yAxis")
        .call(yAxis)
       
    svg.append("g")
        .attr("class", "xAxis")
        .call(xAxis);
    
    svg.append("g")
        .call(grid);

    draw ();
};

function draw() {
    console.log("drawing")
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
        /* svg.selectAll(`circle.${currentBoro}`)
            .data(group, d => d.key)
            .join(enter => enter.append("circle")
                .attr("class", d => d.boro.replace(" ", "_")),
                update => update,
                exit => exit.remove())
                .attr("cy", d => yScale(d.age_2016)) 
                .attr("cx", d => bandScale(d3.randomInt(groupLength)()) + xScale(d.boro))
                .attr("r", 1.5)
                .attr("opacity", .35)
                .attr("fill", d => {
                    if (d.age_2016 === median) return "none";
                    else if (d.party_gen === "Democrat") return "#0571b0";
                    else if (d.party_gen === "Republican") return "#ca0020";
                    else return "DarkMagenta";
                })
                .call(selection => 
                    selection.transition()
                    .delay(function (d,i) {
                        return i * .5
                    })
                    .duration(250))
            .on("mouseover", function (d) {
                const [mx,my] = [d3.event.pageX, d3.event.pageY]
                tooltip.html(
                    `
                    This ${d.gender} registered ${d.party_gen} in ${d.nta} has been registered since ${d.regdate}.`
                )
                .transition()
                .duration(150)
                .style("left", mx + "px")
                .style("top", my + "px")
                .style("visibility", "visible")
            })
            .on("mouseout", () => {
                tooltip
                    .transition()
                    .duration(250)
                    .style("visibility", "hidden")
            })  */

        circles = svg.selectAll(`circle.${currentBoro}`)
            .data(group, d => d.key)
            .join(enter => enter.append("circle")
                .attr("class", d => d.boro.replace(" ", "_"))
                .attr("cy", margin.top) 
                .attr("cx", d => bandScale(d3.randomInt(groupLength)()) + xScale(d.boro))
                .attr("r", 1.5)
                .attr("opacity", .35)
                .attr("fill", d => {
                    //if (d.age_2016 === median) return "none";
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
                
                /* .call(selection => 
                    selection.transition()
                    .delay(function (d,i) {
                        return i * .5
                    })
                    .duration(250)) */
            .on("mouseover", function (d) {
                const [mx,my] = [d3.event.pageX, d3.event.pageY]
                tooltip.html(
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
                tooltip
                    .transition()
                    .duration(350)
                    .style("visibility", "hidden")
            }) 
        
        lines = svg.selectAll(`line.${currentBoro}`)
            .data(group)
            .join(enter => enter.append("line")
                .attr("class", d => d.boro.replace(" ", "_"))
                .join("text")
                    .attr("y", yScale(median)-2)
                    .attr("x", xScale(currentBoro.replace("_", " ")) + xScale.bandwidth()/2)
                    .text(median),
                update => update,
                exit => exit.remove())
                .attr("y1", yScale(median)) 
                .attr("y2", yScale(median)) 
                .attr("x1", xScale(currentBoro.replace("_", " ")))
                .attr("x2", xScale(currentBoro.replace("_", " ")) + xScale.bandwidth())
                .style("stroke", "#4dac26")
                .style("stroke-width", "4")
                .style("z-index", "2")
            .call(selection => 
                selection.transition()
                .duration(250))
            
            lines.call(enter => enter.append("text")
                )
                
            lines.on("mouseover", function (d) {
                const [mx,my] = [d3.event.pageX, d3.event.pageY]
                tooltip.html(
                    `
                    Median age of group is ${median}.`
                )
                .transition()
                .duration(150)
                .style("left", mx + "px")
                .style("top", my + "px")
                .style("visibility", "visible")
            })
            .on("mouseout", () => {
                tooltip
                    .transition()
                    .duration(250)
                    .style("visibility", "hidden")
            })   
        });
};