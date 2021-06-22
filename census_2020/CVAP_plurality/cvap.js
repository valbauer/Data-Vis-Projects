const width = window.innerWidth,
height = window.innerHeight * 0.8,
margin = { top: 20, bottom: 50, left: 5, right: 5 }

let map;
let tooltip;

function init() {

    mapboxgl.accessToken = "pk.eyJ1IjoidmFsYmF1ZXIiLCJhIjoiY2tnaWhndHVlMWZneDJzcnJkemRqeGZzeiJ9.01wZ91f4C1ngeht7WUAdKQ"

    const basemap = new mapboxgl.Map({
        container: "map",
        center: [-73.982364, 40.706839],
        zoom: 9.5,
        style: "mapbox://styles/valbauer/ckn96u8hb0v9h17o5c0lh73k3",
        scrollZoom: true
      });
      
    basemap.addControl(new mapboxgl.NavigationControl(), "top-right");

    const mapboxContainer = basemap.getCanvasContainer()
    
    map = d3.select(mapboxContainer)  
        .append("svg")
        .attr("class", "map")
        .attr("width", "100%")
        .attr("height", "100%")

}