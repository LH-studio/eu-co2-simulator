# EU CO₂ Explorer

Interaktive Web-App zum Vergleich der CO₂-Emissionen europäischer Länder mit Szenario-Simulation.

## Features

- **Interaktive Europakarte** — echte Länderkonturen (Natural Earth 50m), Mehrfachauswahl per Klick
- **Ländervergleich** — Balkendiagramm, Detailtabelle, Aggregationswerte (Ø, gewichteter Ø, Bevölkerung)
- **Szenario-Explorer** — 5 kombinierbare Maßnahmen (Erneuerbare, E-Mobilität, Ernährung, Gebäude, Industrie) mit multiplikativen Reduktionsfaktoren
- **PWA** — installierbar, offline-fähig via Service Worker

## Tech Stack

- Vanilla HTML / CSS / JS (kein Framework)
- [d3-geo](https://github.com/d3/d3-geo) für Kartenprojektion
- [Natural Earth TopoJSON](https://github.com/topojson/world-atlas) via CDN
- Service Worker für Offline-Cache

## Setup

Kein Build-Step nötig. Einfach einen lokalen Server starten:

```bash
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node
npx serve .
```

Dann öffne `http://localhost:8000`.

## GitHub Pages Deploy

1. Repository erstellen
2. Alle Dateien pushen
3. Settings → Pages → Source: `main` branch, `/root`
4. Fertig — erreichbar unter `https://<username>.github.io/<repo>/`

## Projektstruktur

```
co2-explorer/
├── index.html          # Haupt-HTML
├── manifest.json       # PWA Manifest
├── sw.js               # Service Worker
├── .nojekyll           # GitHub Pages Config
├── css/
│   └── styles.css      # Alle Styles
├── js/
│   ├── app.js          # App-Logik, State, UI-Updates
│   └── map.js          # Kartenrendering, TopoJSON-Decoder, d3
├── data/
│   └── co2-data.json   # CO₂-Daten, Szenarien, Presets
└── icons/
    ├── favicon.svg
    ├── icon-192.png
    └── icon-512.png
```

## Datenquelle

CO₂-Emissionen pro Kopf (Tonnen, 2022) aus [Our World in Data](https://ourworldindata.org/co2-emissions).

---

Studio.LUC
