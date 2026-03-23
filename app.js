const { useState, useEffect } = React;

function App() {
  const [geoData, setGeoData] = useState(null);
  const [co2Data, setCo2Data] = useState({});
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("./data/europe.geo.json").then(res => res.json()),
      fetch("./data/co2.json").then(res => res.json())
    ])
      .then(([geo, co2]) => {
        setGeoData(geo);
        setCo2Data(co2);
      })
      .catch(err => {
        console.error("Fehler beim Laden:", err);
      });
  }, []);

  const toggleCountry = (name) => {
    if (selected.includes(name)) {
      setSelected(selected.filter(c => c !== name));
    } else {
      setSelected([...selected, name]);
    }
  };

  useEffect(() => {
    if (!geoData) return;

    const svg = d3.select("#map");
    svg.selectAll("*").remove();

    const projection = d3.geoMercator()
      .center([10, 50])
      .scale(650)
      .translate([350, 300]);

    const path = d3.geoPath().projection(projection);

    svg.selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
  const name = d.properties.name;
  if (selected.includes(name)) return "rgba(21, 128, 61, 0.6)";
  return "rgba(255,255,255,1)";
})
.attr("stroke", d =>
  selected.includes(d.properties.name) ? "#14532d" : "#86efac"
)
.attr("stroke-width", d =>
  selected.includes(d.properties.name) ? 2 : 1
)
.on("mouseover", function (event, d) {
  const name = d.properties.name;
  if (!selected.includes(name)) {
    d3.select(this).attr("fill", "rgba(134, 239, 172, 0.6)");
  }
})
.on("mouseout", function (event, d) {
  const name = d.properties.name;
  if (!selected.includes(name)) {
    d3.select(this).attr("fill", "white");
  }
})
.on("click", (event, d) => {
  toggleCountry(d.properties.name);
});

  }, [geoData, selected, co2Data]);

  const total = selected.reduce(
    (sum, c) => sum + (co2Data[c] || 0),
    0
  );

  return React.createElement(
    "div",
    { className: "container" },
    React.createElement("h1", null, "EU CO₂ Simulator"),

    React.createElement(
      "div",
      { className: "layout" },

      React.createElement("div", { className: "map-container" },
  React.createElement("svg", {
    id: "map"
  })
),

      React.createElement(
        "div",
        { className: "panel" },

        React.createElement("h2", null, "Selected Countries"),

        selected.length === 0
          ? React.createElement("p", null, "None selected")
          : selected.map(c =>
              React.createElement("div", { key: c },
                c + ": " + (co2Data[c] || "no data")
              )
            ),

        React.createElement("h3", null, "Total: " + total.toFixed(2))
      )
    )
  );
}

ReactDOM.render(
  React.createElement(App),
  document.getElementById("root")
);
