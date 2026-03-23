const { useState, useEffect } = React;
const [co2Data, setCo2Data] = useState({});

function App() {
  const [geoData, setGeoData] = useState(null);
  const [co2Data, setCo2Data] = useState({});
  const [selected, setSelected] = useState([]);


 useEffect(() => {
  Promise.all([
    fetch("./data/europe.geo.json").then(res => res.json()),
    fetch("./data/co2.json").then(res => res.json())
  ]).then(([geo, co2]) => {
    setGeoData(geo);
    setCo2Data(co2);
  });
}, []);

  const toggleCountry = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(c => c !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  useEffect(() => {
  if (!geoData) return;

  geoData.features.forEach(d => {
    d.properties.id = d.properties.name.toLowerCase();
  });

  const svg = d3.select("#map");
  svg.selectAll("*").remove();

  const projection = d3.geoMercator()
    .center([10, 50])
    .scale(600)
    .translate([200, 150]);

  const path = d3.geoPath().projection(projection);

  svg.selectAll("path")
    .data(
      geoData.features.filter(d =>
        d.properties.continent === "Europe"
      )
    )
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
    .on("click", (event, d) => {
      toggleCountry(d.properties.name);
    });

}, [geoData, selected, co2Data]);
      .data(
  geoData.features.filter(d =>
    d.properties.continent === "Europe"
  )
)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", d =>
        selected.includes(d.properties.id)
          ? "country active"
          : "country"
      )
      .on("click", (event, d) => {
        toggleCountry(d.properties.id);
      });
  }, [geoData, selected]);

  const total = selected.reduce(
    (sum, c) => sum + (co2Data[c] || 0),
    0
  );

  return (
    React.createElement("div", { className: "container" },

      React.createElement("h1", null, "EU CO₂ Explorer"),

      React.createElement("div", { className: "layout" },

        React.createElement("svg", {
          id: "map",
          width: 400,
          height: 300
        }),

        React.createElement("div", { className: "panel" },
          React.createElement("h2", null, "Selected"),

          selected.length === 0
            ? React.createElement("p", null, "None")
            : selected.map(c =>
                React.createElement("div", { key: c },
                  c + ": " + (co2Data[c] || "n/a")
                )
              ),

          React.createElement("h3", null, "Total: " + total.toFixed(2))
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
);
