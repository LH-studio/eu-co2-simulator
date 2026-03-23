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
        console.error("DATA LOAD ERROR:", err);
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
      .scale(500)
      .translate([200, 150]);

    const path = d3.geoPath().projection(projection);

    svg.selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => {
        const value = co2Data[d.properties.name];
        if (!value) return "#eee";
        if (value > 9) return "#7f1d1d";
        if (value > 7) return "#b91c1c";
        if (value > 5) return "#f97316";
        if (value > 3) return "#facc15";
        return "#4ade80";
      })
      .attr("stroke", d =>
        selected.includes(d.properties.name) ? "#000" : "#666"
      )
      .attr("stroke-width", d =>
        selected.includes(d.properties.name) ? 2 : 1
      )
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
    React.createElement("h1", null, "EU CO₂ Explorer"),

    React.createElement(
      "div",
      { className: "layout" },

      React.createElement("svg", {
        id: "map",
        width: 400,
        height: 300
      }),

      React.createElement(
        "div",
        { className: "panel" },
        React.createElement("h2", null, "Selected"),

        selected.length === 0
          ? React.createElement("p", null, "None")
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

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
);
