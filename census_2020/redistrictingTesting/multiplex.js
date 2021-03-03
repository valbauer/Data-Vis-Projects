//From https://observablehq.com/@d3/u-s-map-with-puerto-rico

function multiplex(streams) {
    const n = streams.length;
    return {
      point(x, y) { for (const s of streams) s.point(x, y); },
      sphere() { for (const s of streams) s.sphere(); },
      lineStart() { for (const s of streams) s.lineStart(); },
      lineEnd() { for (const s of streams) s.lineEnd(); },
      polygonStart() { for (const s of streams) s.polygonStart(); },
      polygonEnd() { for (const s of streams) s.polygonEnd(); }
    };
  }

  export { multiplex };