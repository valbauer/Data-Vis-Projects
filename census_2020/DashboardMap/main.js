// IMPORT
import { Table } from "./Table.js"
import { Barchart } from "./Barchart.js"
import { Counter } from "./Counter.js"
import { map } from "./map.js"

// GLOBAL CONSTANTS
let table, barchart, counter

// STATE
let state = {
  data: [],
  filteredData: [],
  selectedWeek: "Week 1",
  selectedCounty: "Los Angeles",
  selectedMetric: "c_pct_whitealoneorcombo",
};

// DATA LOAD - can us Promise.all if more than one source
d3.csv("../data/bottom20Tracts_byCounty.csv", d3.autoType).then(data => {
    console.log("Dashboard data", data);
    state.data = data;
    init();
  }); 

  function init() {

    map();

    const selectWeek = d3.select("#dropdownWeek").on("change", function() {
      // `this` === the selectElement
      // 'this.value' holds the dropdown value a user just selected
      state.selectedWeek = this.value
      state.selectedCounty = "Los Angeles";
      state.selectedMetric = "c_pct_whitealoneorcombo";
      console.log("new week is", this.value);
      draw();
    });

    selectWeek
      .selectAll("option")
      .data(["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8", "Week 9"])
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    selectWeek.property("value", "Week 1");

    state.filteredData = state.data.filter(d => d.week === state.selectedWeek);

    
      table = new Table(state, setGlobalState);
      barchart = new Barchart(state, setGlobalState);
      counter = new Counter(state, setGlobalState);
      
      draw();
  }


  function draw() {

    state.filteredData = state.data.filter(d => d.week === state.selectedWeek);

    d3.select("#rate").html(`${state.filteredData[0].tractBottom20Rate}%`)

      table.draw(state, setGlobalState);
      barchart.draw(state, setGlobalState);
      counter.draw(state, setGlobalState);

  }

  function setGlobalState (nextState) {
    state = { ...state, ...nextState };
  console.log("new state:", state);
  draw();

  }