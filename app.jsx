import { useState } from "react";

const data = {
  germany: { name: "Germany", co2: 8.1 },
  france: { name: "France", co2: 4.5 },
  italy: { name: "Italy", co2: 5.8 }
};

export default function App() {
  const [selected, setSelected] = useState([]);

  const toggleCountry = (country) => {
    setSelected((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    );
  };

  const total = selected.reduce((sum, c) => sum + data[c].co2, 0);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>EU CO₂ Explorer</h1>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* MAP */}
        <div>
          <button onClick={() => toggleCountry("germany")}>
            Germany
          </button>
          <button onClick={() => toggleCountry("france")}>
            France
          </button>
          <button onClick={() => toggleCountry("italy")}>
            Italy
          </button>
        </div>

        {/* PANEL */}
        <div>
          <h2>Selected</h2>
          {selected.map((c) => (
            <div key={c}>
              {data[c].name}: {data[c].co2}
            </div>
          ))}

          <h3>Total: {total.toFixed(2)}</h3>
        </div>
      </div>
    </div>
  );
}
