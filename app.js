const { useState, useEffect } = React;

function App() {
  const [geoData, setGeoData] = useState(null);
  const [co2Data, setCo2Data] = useState({});
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [year, setYear] = useState(2021);
  const [hoveredCountry, setHoveredCountry] = useState(null);

  useEffect(() => {
  Promise.all([
    d3.json("https://raw.githubusercontent.com/leakyMirror/map-of-europe/master/GeoJSON/europe.geojson"),
    d3.csv("https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv")
  ])
  .then(([geo, csv]) => {

    console.log("GEO:", geo);
    console.log("CSV sample:", csv.slice(0, 5));

    const formatted = {};

    const euCountries = [
      "Germany","France","Italy","Spain","Poland","Netherlands","Belgium",
      "Sweden","Austria","Czechia","Denmark","Finland","Portugal","Greece",
      "Hungary","Ireland","Romania","Bulgaria","Slovakia","Slovenia",
      "Croatia","Estonia","Latvia","Lithuania","Luxembourg","Malta","Cyprus"
    ];

    csv.forEach(d => {
      const country = d.country;
      const y = d.year;
      const value = parseFloat(d.co2_per_capita);

      if (!country || !y || !value) return;
      if (!euCountries.includes(country)) return;

      if (!formatted[country]) formatted[country] = {};
      formatted[country][y] = value;
    });

    console.log("FORMATTED:", formatted);

    setGeoData(geo);
    setCo2Data(formatted);
  })
  .catch(err => {
    console.error("FEHLER BEIM LADEN:", err);
  });
}, []);

if (!euCountries.includes(country)) return;
      csv.forEach(d => {
  const country = d.country;
  const y = d.year;
  const value = parseFloat(d.co2_per_capita);

  if (!country || !y || !value) return;

  if (!formatted[country]) formatted[country] = {};
  formatted[country][y] = value;
});

      setGeoData(geo);
      setCo2Data(formatted);
    });
  }, []);

  function toggleCountry(name) {
    setSelectedCountries(prev =>
      prev.includes(name)
        ? prev.filter(c => c !== name)
        : [...prev, name]
    );
  }

  function getValue(name) {
    return co2Data[name]?.[year] || null;
  }

  function getColor(name) {
    const selected = selectedCountries.includes(name);

    if (selected) return "rgba(0,100,0,0.7)";
    return "rgba(144,238,144,0.4)";
  }

  function selectAll() {
    const all = geoData.features.map(f => f.properties.NAME);
    setSelectedCountries(all);
  }

  function clearAll() {
    setSelectedCountries([]);
  }

  function selectDACH() {
    setSelectedCountries(["Germany", "Austria", "Switzerland"]);
  }

  function selectScandinavia() {
    setSelectedCountries(["Sweden", "Norway", "Denmark"]);
  }

  if (!geoData) return React.createElement("div", null, "Loading...");

  const total = selectedCountries.reduce((sum, c) => {
    const val = getValue(c);
    return sum + (val || 0);
  }, 0);

  return React.createElement("div", { className: "app" },

    // SIDEBAR
    React.createElement("div", { className: "sidebar" },

      React.createElement("h1", null, "EU CO₂ Simulator"),

      React.createElement("h2", { className: "subtitle" },
        "Tonnen CO₂ pro Kopf · " + year + " · Our World in Data"
      ),

      React.createElement("div", { className: "card" },
        React.createElement("h3", null, "Ausgewählt"),
        React.createElement("p", null, selectedCountries.length + " Länder")
      ),

      React.createElement("div", { className: "card" },
        React.createElement("h3", null, "Summe (approx.)"),
        React.createElement("p", null, total.toFixed(1))
      ),

      React.createElement("div", { className: "buttons" },
        React.createElement("button", { onClick: selectAll }, "Alle"),
        React.createElement("button", { onClick: clearAll }, "Keine"),
        React.createElement("button", { onClick: selectDACH }, "DACH"),
        React.createElement("button", { onClick: selectScandinavia }, "Skandinavien")
      ),

      // SLIDER
      React.createElement("div", { className: "slider" },
        React.createElement("input", {
          type: "range",
          min: 1990,
          max: 2023,
          value: year,
          onChange: e => setYear(Number(e.target.value))
        }),
        React.createElement("p", null, "Jahr: " + year)
      )
    ),

    // MAP
    React.createElement("div", { className: "map-container" },
      React.createElement("svg", { width: "100%", height: "100%" },

        geoData.features.map((feature, i) => {
  const name = feature.properties.NAME;
  const value = getValue(name);
  const selected = selectedCountries.includes(name);

  return React.createElement("path", {
    key: i,
    d: d3.geoPath().projection(
      d3.geoMercator().fitSize([800, 600], geoData)
    )(feature),

    // 👉 NEU: CSS STEUERT STYLING
    className: "country " + (selected ? "selected" : ""),

    strokeWidth: 1,

    onClick: () => toggleCountry(name),

    onMouseEnter: (e) => {
      setHoveredCountry({
        name,
        value,
        x: e.clientX,
        y: e.clientY
      });
    },

    onMouseMove: (e) => {
      setHoveredCountry(prev =>
        prev ? { ...prev, x: e.clientX, y: e.clientY } : null
      );
    },

    onMouseLeave: () => setHoveredCountry(null)
  });
})
      ),

      // TOOLTIP
      hoveredCountry &&
      React.createElement("div", { className: "tooltip" },
        hoveredCountry.name + ": " +
        (hoveredCountry.value ? hoveredCountry.value.toFixed(1) : "n/a") +
        " t"
      )
    )
  );
}

ReactDOM.render(
  React.createElement(App),
  document.getElementById("root")
);
