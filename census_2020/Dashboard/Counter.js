class Counter {
    constructor(state, setGlobalState) {
        this.width = window.innerWidth * 0.6;
        this.margins = { top: 20, bottom: 20, left: 20, right: 20 };
        this.container = d3.select("#Counter")
        this.duration = 1000
    }

    draw(state, setGlobalState) {
        let metricData; 
        const filteredData = state.filteredData.find(d => state.selectedCounty === d.county_name);
        const t_metrics = ["t_whitealoneorcombo",
                            "t_blackaloneorcombo", 
                            "t_amerindaloneorcombo", 
                            "t_asianaloneorcombo", 
                            "t_hispanic", 
                            "t_totpopbornoutus",  
                            "t_poverty_less100"]
        
        const c_metrics = ["c_whitealoneorcombo",
                            "c_blackaloneorcombo",
                            "c_amerindaloneorcombo",
                            "c_asianaloneorcombo",
                            "c_hispanic",
                            "c_totpopbornoutus", 
                            "c_poverty_less100"]

        const labels = ["White", "Black", "American Indian", "Asian", "Hispanic", "Foreign Born", "In poverty"]
    
        if (state.selectedMetric !== null && state.selectedMetric.startsWith("t_")) {

            metricData = t_metrics.map(metric => {
            return {
                county: state.selectedCounty,
                metric: metric,
                value: filteredData ? filteredData[metric] : 0,
                }
            })
        }

        else {
            metricData = c_metrics.map(metric => {
                return {
                    county: state.selectedCounty,
                    metric: metric,
                    value: filteredData ? filteredData[metric] : 0,
                    }
                })
        }

        const metric = this.container
            .selectAll("div.metric")
            .data(metricData, d => d.county)
            .join(
                enter =>
                enter
                    .append("div")
                    .attr("class", "metric")
                    .call(enter => enter.append("div").attr("class", "title"))
                    .call(enter => enter.append("div").attr("class", "number")),
                update => update,
                exit => exit.remove()
            )

        //I couldn't figure ut how to get the text for the counter to correspond to the bars above them...
        /* const xScale = d3
            .scaleBand()
            .domain(labels)
            .range([this.margins.left, this.width - this.margins.right])
            .paddingInner(.5); */

        metric.select("div.title")
            .data(labels)
            .text(d => d)
            //This didn't change anything 
            /* .attr("transform", d => {
                `translate ${xScale(d.label)}, 0`}) */

        //console.log(xScale("White"))

        const format = d3.format(",." + d3.precisionFixed(1) + "f")
        
        metric.select("div.number")
            .transition()
            .duration(this.duration)
            .style("color", "gray")
            .textTween(function(d) {
                const i = d3.interpolate(0, d.value);
                return function(t) { return format(i(t)); };
            })
    }
}

export { Counter };