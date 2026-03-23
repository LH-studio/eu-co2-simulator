const { useState } = React;

function App() {
  const data = {
    germany: { name: "Germany", co2: 8.1 },
    france: { name: "France", co2: 4.5 },
    italy: { name: "Italy", co2: 5.8 }
  };

  const [selected, setSelected] = useState([]);

  const toggleCountry = (country) => {
    if (selected.includes(country)) {
      setSelected(selected.filter(c => c !== country));
    } else {
      setSelected([...selected, country]);
    }
  };

  const total = selected.reduce((sum, c) => sum + data[c].co2, 0);

  return (
    React.createElement("div", { className: "container" },
      React.createElement("h1", null, "EU CO₂ Explorer"),

      React.createElement("div", { className: "layout" },

        // 🗺️ MAP
        React.createElement("svg", {
          viewBox: "0 0 300 200",
          className: "map-svg"
        },

          // GERMANY
          React.createElement("rect", {
            x: 130, y: 60, width: 40, height: 40,
            className: selected.includes("germany") ? "country active" : "country",
            onClick: () => toggleCountry("germany")
          }),

          // FRANCE
          React.createElement("rect", {
            x: 80, y: 80, width: 40, height: 40,
            className: selected.includes("france") ? "country active" : "country",
            onClick: () => toggleCountry("france")
          }),

          // ITALY
          React.createElement("rect", {
            x: 160, y: 110, width: 30, height: 50,
            className: selected.includes("italy") ? "country active" : "country",
            onClick: () => toggleCountry("italy")
          })
        ),

        // PANEL
        React.createElement("div", { className: "panel" },
          React.createElement("h2", null, "Selected Countries"),

          selected.length === 0
            ? React.createElement("p", null, "No country selected")
            : selected.map(c =>
                React.createElement("div", { key: c },
                  data[c].name + ": " + data[c].co2 + " t"
                )
              ),

          React.createElement("h3", null, "Total: " + total.toFixed(2))
        )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
