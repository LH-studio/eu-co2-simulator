const { useState, useEffect } = React;

function App() {
  const [geoData, setGeoData] = useState(null);
  const [co2Data, setCo2Data] = useState({});
  const [selected, setSelected] = useState([]);
  const [tooltip, setTooltip] = useState(null);

  // Gruppen
  const groups = {
    DACH: ["Germany", "Austria", "Switzerland"],
    Skandinavien: ["Sweden", "Norway", "Denmark"]
  };

  // Daten laden
  useEffect(() => {
    Promise.all([
      fetch("./data/europe.geo.json").then(res => res.json()),
      fetch("./data/co2.json").then(res => res.json())
    ])
      .then(([geo, co2]) => {
        setGeoData(geo);
        setCo2Data(co2);
      })
      .catch(err => console.error(err));
  }, []);

  // Auswahl toggeln
  const toggleCountry = (name) => {
    if (selected.includes(name)) {
      setSelected(selected.filter(c => c !== name));
    } else {
      setSelected([...selected, name]);
    }
  };

  // Quick Actions
  const selectAll = () => {
    const all = geoData.features.map(f => f.properties.name);
    setSelected(all);
  };

  const clearAll = () => setSelected([]);

  const selectGroup = (group) => {
    setSelected(groups[group] || []);
  };

  // Tooltip
  const showTooltip = (event, d) => {
    const name = d.properties.name;
    const value = co2Data[name];

    setTooltip({
      x: event.pageX,
      y: event.pageY,
      name,
      value
    });
  };

  const hideTooltip = () => setTooltip(null);

  // Karte zeichnen
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

      // Farben
      .attr("fill", d => {
        const name = d.properties.name;
        if (selected.includes(name)) {
          return "rgba(34, 197, 94, 0.6)";
        }
        return "rgba(134, 239, 172, 0.25)";
      })

      // Rand
      .attr("stroke", d =>
        selected.includes(d.properties.name) ? "#166534" : "#86efac"
      )
      .attr("stroke-width", d =>
        selected.includes(d.properties.name) ? 2 : 1
      )

      // Hover
      .on("mouseover", function (event, d) {
        const name = d.properties.name;

        if (!selected.includes(name)) {
          d3.select(this)
            .attr("fill", "rgba(134, 239, 172, 0.5)");
        }

        showTooltip(event, d);
      })

      .on("mouseout", function (event, d) {
        const name = d.properties.name;

        if (!selected.includes(name)) {
          d3.select(this)
            .attr("fill", "rgba(134, 239, 172, 0.25)");
        }

        hideTooltip();
      })

      // Klick
      .on("click", (event, d) => {
        toggleCountry(d.properties.name);
      });

  }, [geoData, selected, co2Data]);

  // Berechnung
  const total = selected.reduce(
    (sum, c) => sum + (co2Data[c] || 0),
    0
  );

  const avg = total / (selected.length || 1);

  // UI
  return React.createElement(
    "div",
    { className: "container" },

    React.createElement("h1", null, "EU CO₂ Explorer"),

    React.createElement(
      "div",
      { className: "layout" },

      // MAP + BUTTONS
      React.createElement(
        "div",
        { className: "map-container" },

        // Buttons
        React.createElement(
          "div",
          { style: { marginBottom: "10px" } },

          React.createElement("button", { onClick: selectAll }, "Alle"),
          React.createElement("button", { onClick: clearAll }, "Keine"),
          React.createElement("button", { onClick: () => selectGroup("DACH") }, "DACH"),
          React.createElement("button", { onClick: () => selectGroup("Skandinavien") }, "Skandinavien")
        ),

        React.createElement("svg", {
          id: "map"
        })
      ),

      // SIDEBAR
      React.createElement(
        "div",
        { className: "panel" },

        React.createElement("h2", null, "Dashboard"),

        React.createElement(
          "div",
          {
            style: {
              background: "#dcfce7",
              padding: "5px 10px",
              borderRadius: "20px",
              display: "inline-block",
              marginBottom: "10px"
            }
          },
          selected.length + " Länder"
        ),

        React.createElement("div", null, "Ø CO₂: " + avg.toFixed(1)),
        React.createElement("div", null, "Gesamt: " + total.toFixed(1))
      )
    ),

    // TOOLTIP
    tooltip &&
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          left: tooltip.x + 10,
          top: tooltip.y + 10,
          background: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          pointerEvents: "none"
        }
      },
      React.createElement("strong", null, tooltip.name),
      React.createElement(
        "div",
        null,
        (tooltip.value || "–") + " t CO₂ / Kopf"
      )
    )
  );
}

ReactDOM.render(
  React.createElement(App),
  document.getElementById("root")
);
