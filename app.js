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

        // MAP
        React.createElement("div", { className: "map" },
          Object.keys(data).map(key =>
            React.createElement("button", {
              key: key,
              className: selected.includes(key) ? "active" : "",
              onClick: () => toggleCountry(key)
            }, data[key].name)
          )
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
