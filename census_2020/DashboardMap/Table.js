class Table {
    constructor(state, setGlobalState) {
        console.log("Filtered Dashboard:", state.filteredData)
        this.slimmedData = state.filteredData.map(d => ({
            "County": d.county_name,
            "State": d.st_usps,
            "Self-Response Rate": d.overallCountyRate,
            "# Bottom 20% Tracts": d.num_tracts,
            "Pop in Tracts": d.t_totpopacs18,
            "County Pop": d.c_totpopacs18
        }))
        this.format = d3.format(",." + d3.precisionFixed(1) + "f");

        this.columns = ["County", "State", "Self-Repsonse Rate", "# Bottom 20% Tracts", "Pop in Tracts", "County Pop"];
        this.table = d3.select("#Table").append("table");

        this.table
            .append("thead")
            .selectAll("th")
            .data(this.columns)
            .join("th")
            .text(d =>d);

        this.tableRows = this.table
            .append("tbody")
            .selectAll("tr")
            .data(this.slimmedData)
            .join("tr")
            .style("background-color", "#b5d3e7")
            
        this.tableRows
            .selectAll("td")
            .data(d => Object.values(d))
            .join("td")
            .text(d => typeof(d) === "string" ? d : this.format(d));

        this.tableRows.on("click", d => {
            setGlobalState({ selectedCounty: d.County });
        });
    }

    draw(state, setGlobalState) {
        
        this.slimmedData = state.filteredData.map(d => ({
            "County": d.county_name,
            "State": d.st_usps,
            "Self-Response Rate": d.overallCountyRate,
            "# Bottom 20% Tracts": d.num_tracts,
            "Pop in tracts": d.t_totpopacs18,
            "County Pop": d.c_totpopacs18
        }))
        console.log(state.selectedWeek)
       
        this.tableRows = this.table
            .selectAll("tr")
            .data(this.slimmedData)
            .join("tr")
            .style("background-color", "#b5d3e7")
            
        this.tableRows
            .selectAll("td")
            .data(d => Object.values(d))
            .join("td")
            .text(d => typeof(d) === "string" ? d : this.format(d));
            
            
        this.tableRows.on("click", d => {
            setGlobalState({ selectedCounty: d.County });
        });

        this.tableRows.style("background-color", d =>
            state.selectedCounty === d.County ? "gray" : "#b5d3e7"
            );
    }
}

export { Table };
