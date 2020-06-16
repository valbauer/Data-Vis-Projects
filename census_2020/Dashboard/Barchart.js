class Barchart {
    constructor(state, setGlobalState) {
        this.width = window.innerWidth * 0.6;
        this.height = window.innerHeight * 0.77;
        this.margins = { top: 20, bottom: 10, left: 1, right: 1 };
        this.duration = 1000;
        this.format = d3.format(",." + d3.precisionFixed(1) + "f");


        this.svg = d3
            .select("#Barchart")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
    }

    draw(state, setGlobalState) {

        const filteredData = state.filteredData.find(d => state.selectedCounty === d.county_name);
    
        const metrics = ["t_pct_whitealoneorcombo","c_pct_whitealoneorcombo",
                         "t_pct_blackaloneorcombo", "c_pct_blackaloneorcombo",
                         "t_pct_amerindaloneorcombo", "c_pct_amerindaloneorcombo",
                         "t_pct_asianaloneorcombo", "c_pct_asianaloneorcombo",
                         "t_pct_hispanic", "c_pct_hispanic",
                         "t_pct_totpopbornoutus", "c_pct_totpopbornoutus", 
                         "t_pct_poverty_less100", "c_pct_poverty_less100"]
        const metricData = metrics.map(metric => {
            return {
                county: state.selectedCounty,
                metric: metric,
                value: filteredData ? filteredData[metric] : 0,
                //selectedMetric: null
            };
        });

        const yScale = d3
            .scaleLinear()
            .domain([0, 100])
            .range([this.height - this.margins.top, this.margins.bottom]);

        const xScale = d3
            .scaleBand()
            .domain(metrics)
            .range([this.margins.left, this.width - this.margins.right])
            .paddingInner(.075);
       
        //This legend took an embarassing amount of time...there must be a better way.
        const size = 25
        const legend = this.svg
            .selectAll("g.legend")
            .data([["#b5d3e7","Tract Demographics"], ["#385d75","County Demographics"]])
            .join(
                enter =>
                    enter
                    .append("g")
                    .attr("class", "legend")
                    .call(enter => enter.append("rect"))
                    .call(enter => enter.append("text"))
            )

        legend.select("rect")
                .attr("x", this.width - 195)
                .attr("y", function (d,i) {return  i*(size+5) + (size/2) - 10})
                .attr("width", "25")
                .attr("height", "25")
                .attr("fill", d => d[0])
                
        legend.select("text")
                .attr("x", this.width - 165)
                .attr("y", function (d,i) { return 7 + i*(size+5) + (size/2)})
                .text(d => d[1])
      
        const bars = this.svg
            .selectAll("g.bar")
            .data(metricData)
            .join(
                enter =>
                    enter
                        .append("g")
                        .attr("class", "bar")
                        .call(enter => enter.append("rect"))
                        .call(enter => enter.append("text")),
                update => update,
                exit => exit.remove()
            )/* .on("click", d => {
                setGlobalState({ selectedMetric: d.metric });
            }) */

        bars
            .select("rect")
            .transition()
            .duration(this.duration)
            .attr("width", xScale.bandwidth()/1.25)
            .attr("y", d => yScale(d.value))
            //This seems a bit hacky. But it works.
            .attr("x", function(d, i) { 
                return i % 2 !== 0 ? xScale(d.metric) : xScale(d.metric) + 8;
            })
            .attr("height", d => this.height - yScale(d.value))
            .style("fill", function(d) {
                if (d.metric.startsWith("c_")) {
                    return "#385d75"
                }
                else {return "#b5d3e7"}
            })

        bars
            .select("text")
            .transition()
            .duration(this.duration)
            .text(d => `${(d.value)}%`)
            .attr("y", d => yScale(d.value) - 5)
            .attr("x", function(d, i) { 
                return i % 2 !== 0 ? xScale(d.metric) : xScale(d.metric) + 8;
            })

        const barLabelList = ["White", "Black", "American Indian", "Asian", "Hispanic", "Foreign Born", "In Poverty"]
        
        const xScaleLabels = d3
            .scaleBand()
            .domain(barLabelList)
            .range([this.margins.left, this.width - this.margins.right])
            .paddingInner(.075);

        console.log(xScaleLabels("White"))

        const barLabels = this.svg
            .selectAll("g.labels")  
            .data(barLabelList)
            .join(
                enter =>
                    enter
                    .append("g")
                    //.attr("class", "labels")
                    .call(enter => enter.append("text")))
                

        barLabels
            .selectAll("text")
            .attr("y", this.height)
            .attr("x", d => xScaleLabels(d) + 5)
            .text(d => d)
        

    }
}

export { Barchart };