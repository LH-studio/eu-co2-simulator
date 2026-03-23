/* ═══════════════════════════════════════════════════════════════
   EU CO₂ Explorer — Vanilla JS (1:1 match of React JSX version)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Data ── */
  const CO2 = {
    "578":{c:"NO",name:"Norwegen",co2:7.5,pop:5.4,flag:"🇳🇴"},
    "752":{c:"SE",name:"Schweden",co2:3.5,pop:10.4,flag:"🇸🇪"},
    "246":{c:"FI",name:"Finnland",co2:7.1,pop:5.5,flag:"🇫🇮"},
    "208":{c:"DK",name:"Dänemark",co2:5.1,pop:5.8,flag:"🇩🇰"},
    "233":{c:"EE",name:"Estland",co2:8.4,pop:1.3,flag:"🇪🇪"},
    "428":{c:"LV",name:"Lettland",co2:3.5,pop:1.9,flag:"🇱🇻"},
    "440":{c:"LT",name:"Litauen",co2:4.1,pop:2.8,flag:"🇱🇹"},
    "826":{c:"GB",name:"Großbritannien",co2:5.2,pop:67.3,flag:"🇬🇧"},
    "372":{c:"IE",name:"Irland",co2:7.7,pop:5.0,flag:"🇮🇪"},
    "528":{c:"NL",name:"Niederlande",co2:8.8,pop:17.5,flag:"🇳🇱"},
    "056":{c:"BE",name:"Belgien",co2:8.2,pop:11.6,flag:"🇧🇪"},
    "276":{c:"DE",name:"Deutschland",co2:8.1,pop:83.2,flag:"🇩🇪"},
    "616":{c:"PL",name:"Polen",co2:8.3,pop:37.7,flag:"🇵🇱"},
    "203":{c:"CZ",name:"Tschechien",co2:9.3,pop:10.7,flag:"🇨🇿"},
    "703":{c:"SK",name:"Slowakei",co2:5.7,pop:5.5,flag:"🇸🇰"},
    "040":{c:"AT",name:"Österreich",co2:6.9,pop:9.0,flag:"🇦🇹"},
    "756":{c:"CH",name:"Schweiz",co2:4.0,pop:8.7,flag:"🇨🇭"},
    "250":{c:"FR",name:"Frankreich",co2:4.5,pop:67.4,flag:"🇫🇷"},
    "724":{c:"ES",name:"Spanien",co2:5.2,pop:47.4,flag:"🇪🇸"},
    "620":{c:"PT",name:"Portugal",co2:4.3,pop:10.3,flag:"🇵🇹"},
    "380":{c:"IT",name:"Italien",co2:5.8,pop:59.6,flag:"🇮🇹"},
    "705":{c:"SI",name:"Slowenien",co2:6.1,pop:2.1,flag:"🇸🇮"},
    "191":{c:"HR",name:"Kroatien",co2:3.9,pop:3.9,flag:"🇭🇷"},
    "348":{c:"HU",name:"Ungarn",co2:4.4,pop:9.7,flag:"🇭🇺"},
    "642":{c:"RO",name:"Rumänien",co2:3.7,pop:19.2,flag:"🇷🇴"},
    "100":{c:"BG",name:"Bulgarien",co2:5.5,pop:6.9,flag:"🇧🇬"},
    "300":{c:"GR",name:"Griechenland",co2:5.8,pop:10.7,flag:"🇬🇷"},
    "688":{c:"RS",name:"Serbien",co2:5.8,pop:6.8,flag:"🇷🇸"},
    "442":{c:"LU",name:"Luxemburg",co2:11.3,pop:0.6,flag:"🇱🇺"},
  };

  const EU_IDS = new Set(Object.keys(CO2));
  const NEIGHBOR_IDS = new Set([
    "804","112","498","070","499","008","807","792","643",
    "012","788","434","504","732","180","404","800","728",
  ]);
  const EUR_BOUNDS = { w: -12, e: 35, s: 34, n: 72 };

  const SCENARIOS = {
    renewables: { label: "100% Erneuerbare", factor: 0.4, icon: "⚡", desc: "Wind, Solar & Wasserkraft" },
    transport:  { label: "E-Mobilität",      factor: 0.75, icon: "🚃", desc: "Elektrifizierung des Verkehrs" },
    diet:       { label: "Pflanzenbasiert",   factor: 0.9,  icon: "🌱", desc: "Weniger tierische Produkte" },
    buildings:  { label: "Sanierung",         factor: 0.85, icon: "🏠", desc: "Energetische Gebäudesanierung" },
    industry:   { label: "Grüne Industrie",   factor: 0.7,  icon: "🏭", desc: "Dekarbonisierung" },
  };

  const PRESETS = {
    all: Object.keys(CO2),
    none: [],
    top6: ["276","250","380","724","616","528"],
    scandinavia: ["578","752","246","208"],
    dach: ["276","040","756"],
    benelux: ["528","056","442"],
  };

  const maxCO2 = Math.max(...Object.values(CO2).map(d => d.co2));

  /* ── State ── */
  let selected = new Set(["276", "250", "616"]);
  let hovered = null;
  let activeScenarios = new Set();
  let currentView = "compare";

  /* ── TopoJSON decoder ── */
  function decodeTopo(topo) {
    const tf = topo.transform;
    return topo.arcs.map(arc => {
      let x = 0, y = 0;
      return arc.map(([dx, dy]) => {
        x += dx; y += dy;
        return [x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]];
      });
    });
  }
  function stitchRing(arcs, indices) {
    let pts = [];
    for (const i of indices) {
      const a = i >= 0 ? arcs[i].slice() : arcs[~i].slice().reverse();
      if (pts.length) a.shift();
      pts = pts.concat(a);
    }
    return pts;
  }
  function toGeoJSON(topo, key) {
    const arcs = decodeTopo(topo);
    return topo.objects[key].geometries.map(g => {
      let coords;
      if (g.type === "Polygon") coords = g.arcs.map(r => stitchRing(arcs, r));
      else if (g.type === "MultiPolygon") coords = g.arcs.map(p => p.map(r => stitchRing(arcs, r)));
      else coords = [];
      return { type: "Feature", id: g.id, properties: g.properties || {}, geometry: { type: g.type, coordinates: coords } };
    });
  }

  /* ── Helpers ── */
  const $ = s => document.querySelector(s);
  const h = (tag, cls, html) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html !== undefined) el.innerHTML = html;
    return el;
  };
  const ns = (tag) => document.createElementNS('http://www.w3.org/2000/svg', tag);

  function getCombinedFactor() {
    if (!activeScenarios.size) return 1;
    let f = 1;
    activeScenarios.forEach(k => f *= SCENARIOS[k].factor);
    return f;
  }
  function getSorted() {
    return [...selected].filter(id => CO2[id]).map(id => ({ id, ...CO2[id] })).sort((a, b) => b.co2 - a.co2);
  }
  function getStats() {
    const ids = [...selected].filter(id => CO2[id]);
    if (!ids.length) return null;
    const cs = ids.map(id => CO2[id]);
    const tot = cs.reduce((s, c) => s + c.co2, 0);
    const pop = cs.reduce((s, c) => s + c.pop, 0);
    const wa = cs.reduce((s, c) => s + c.co2 * c.pop, 0) / pop;
    const f = getCombinedFactor();
    return { avg: tot / cs.length, weightedAvg: wa, totalPop: pop, scenAvg: (tot / cs.length) * f, reduction: (1 - f) * 100 };
  }

  /* ── Map state ── */
  let mapFeatures = null;
  let projection = null;
  let pathGen = null;
  const W = 620, H = 640;

  /* ══════════════════════════════════════════
     BUILD ENTIRE DOM
     ══════════════════════════════════════════ */
  function buildApp(app) {
    app.innerHTML = '';
    app.appendChild(buildLoading());
  }

  function buildLoading() {
    const d = h('div', 'loading');
    d.id = 'loading';
    d.innerHTML = '<div class="loading__inner"><div class="loading__icon">🌍</div><div class="loading__text">Lade Kartendaten…</div></div>';
    return d;
  }

  function buildShell() {
    const shell = h('div', 'app');

    /* ── Header ── */
    const header = h('header', 'header');
    header.innerHTML = `
      <div class="hdrL">
        <div class="logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <h1 class="title">EU CO₂ Explorer</h1>
          <p class="sub">Tonnen CO₂ pro Kopf · 2022 · Our World in Data</p>
        </div>
      </div>
      <div class="tabs">
        <button class="tab tab--on" data-v="compare"><span style="font-size:13px">📊</span> Vergleich</button>
        <button class="tab" data-v="scenario"><span style="font-size:13px">🔮</span> Szenarien</button>
      </div>`;
    shell.appendChild(header);

    /* ── Body ── */
    const body = h('div', 'body');

    /* Map column */
    const mapCol = h('div', 'mapCol');
    const mapCard = h('div', 'mapCard');
    mapCard.innerHTML = `
      <div class="mapHead">
        <span class="mapT">Europa</span>
        <span class="badge" id="badge">3 Länder</span>
      </div>`;

    const mapWrap = h('div', 'mapWrap');
    mapWrap.id = 'mapWrap';
    mapCard.appendChild(mapWrap);

    const qRow = h('div', 'qRow');
    [
      { l: "Alle", p: "all" }, { l: "Keine", p: "none" },
      { l: "EU Top 6", p: "top6" }, { l: "Skandinavien", p: "scandinavia" },
      { l: "DACH", p: "dach" }, { l: "Benelux", p: "benelux" },
    ].forEach(b => {
      const btn = h('button', 'qBtn', b.l);
      btn.addEventListener('click', () => { selected = new Set(PRESETS[b.p]); render(); });
      qRow.appendChild(btn);
    });
    mapCard.appendChild(qRow);
    mapCol.appendChild(mapCard);
    body.appendChild(mapCol);

    /* Panel */
    const panel = h('div', 'panel');
    panel.id = 'panel';
    panel.innerHTML = `
      <div class="viewSection viewSection--active" id="view-compare"></div>
      <div class="viewSection" id="view-scenario"></div>`;
    body.appendChild(panel);
    shell.appendChild(body);

    /* Footer */
    const footer = h('div', 'footer');
    footer.innerHTML = '<span>Quelle: Our World in Data · CO₂/Kopf 2022</span><span class="footerBrand">Studio.LUC</span>';
    shell.appendChild(footer);

    return shell;
  }

  /* ══════════════════════════════════════════
     RENDER MAP SVG
     ══════════════════════════════════════════ */
  function renderMap(container) {
    container.innerHTML = '';

    const svg = ns('svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.classList.add('mapSvg');
    svg.id = 'mapSvg';

    const bg = ns('rect');
    bg.setAttribute('width', W); bg.setAttribute('height', H);
    bg.setAttribute('fill', '#ffffff'); bg.setAttribute('rx', '10');
    svg.appendChild(bg);

    mapFeatures.forEach((f, i) => {
      const d = pathGen(f.geometry);
      if (!d) return;
      const path = ns('path');
      path.setAttribute('d', d);
      path.setAttribute('stroke-linejoin', 'round');
      path.dataset.id = f.id;

      const hasData = !!CO2[f.id];
      if (!hasData) {
        path.setAttribute('fill', '#f0f2f0');
        path.setAttribute('stroke', '#dde3dd');
        path.setAttribute('stroke-width', '0.4');
        path.style.cursor = 'default';
      } else {
        applyCountryStyle(path, false, false);
        path.style.cursor = 'pointer';
        path.addEventListener('click', () => {
          selected.has(f.id) ? selected.delete(f.id) : selected.add(f.id);
          render();
        });
        path.addEventListener('mouseenter', () => {
          hovered = f.id;
          updateHover();
        });
        path.addEventListener('mouseleave', () => {
          hovered = null;
          updateHover();
        });
      }
      svg.appendChild(path);
    });

    container.appendChild(svg);

    // Tooltip
    const tt = h('div', 'tooltip');
    tt.id = 'tooltip';
    tt.innerHTML = '<span class="ttFlag" id="ttFlag"></span><div><div class="ttN" id="ttN"></div><div class="ttV" id="ttV"></div></div><span class="ttCheck" id="ttCheck">✓</span>';
    container.appendChild(tt);
  }

  function applyCountryStyle(path, isSel, isHov) {
    if (isSel) {
      path.setAttribute('fill', 'rgba(5, 150, 105, 0.22)');
      path.setAttribute('stroke', '#059669');
      path.setAttribute('stroke-width', '1.6');
    } else if (isHov) {
      path.setAttribute('fill', 'rgba(16, 185, 129, 0.12)');
      path.setAttribute('stroke', '#34d399');
      path.setAttribute('stroke-width', '1.2');
    } else {
      path.setAttribute('fill', 'rgba(16, 185, 129, 0.06)');
      path.setAttribute('stroke', 'rgba(16, 185, 129, 0.35)');
      path.setAttribute('stroke-width', '0.6');
    }
  }

  function updateMapPaths() {
    const svg = $('#mapSvg');
    if (!svg) return;
    svg.querySelectorAll('path[data-id]').forEach(p => {
      if (!CO2[p.dataset.id]) return;
      applyCountryStyle(p, selected.has(p.dataset.id), hovered === p.dataset.id);
    });
  }

  function updateHover() {
    updateMapPaths();
    const tt = $('#tooltip');
    if (hovered && CO2[hovered]) {
      const d = CO2[hovered];
      $('#ttFlag').textContent = d.flag;
      $('#ttN').textContent = d.name;
      $('#ttV').textContent = d.co2 + ' t CO₂/Kopf';
      $('#ttCheck').style.display = selected.has(hovered) ? 'inline' : 'none';
      tt.classList.add('tooltip--show');
    } else {
      tt.classList.remove('tooltip--show');
    }
  }

  /* ══════════════════════════════════════════
     RENDER PANELS
     ══════════════════════════════════════════ */
  function render() {
    const f = getCombinedFactor();
    const stats = getStats();
    const sorted = getSorted();
    const hasScen = activeScenarios.size > 0;

    // Badge
    const badge = $('#badge');
    if (badge) badge.textContent = `${selected.size} ${selected.size === 1 ? 'Land' : 'Länder'}`;

    // Map
    updateMapPaths();

    // Tab visual
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('tab--on', t.dataset.v === currentView);
    });
    document.querySelectorAll('.viewSection').forEach(v => {
      v.classList.toggle('viewSection--active', v.id === 'view-' + currentView);
    });

    /* ── Compare ── */
    const cmp = $('#view-compare');
    if (cmp) {
      let html = '';

      // Stats
      if (stats) {
        html += `<div class="sGrid">
          <div class="stCard" style="background:#ecfdf5"><div class="stL">Ø CO₂/Kopf</div><div class="stV"><span style="color:#059669">${stats.avg.toFixed(1)}</span><span class="stU">t</span></div></div>
          <div class="stCard" style="background:#e0f2fe"><div class="stL">Ø gewichtet</div><div class="stV"><span style="color:#0284c7">${stats.weightedAvg.toFixed(1)}</span><span class="stU">t</span></div></div>
          <div class="stCard" style="background:#f3e8ff"><div class="stL">Bevölkerung</div><div class="stV"><span style="color:#7c3aed">${stats.totalPop.toFixed(0)}</span><span class="stU">Mio</span></div></div>
        </div>`;
      }

      // Bar chart card
      html += '<div class="card"><h3 class="cTitle"><span style="color:#059669;margin-right:6px">▎</span>CO₂ pro Kopf (t/Jahr)</h3>';
      if (!sorted.length) {
        html += '<div class="empty"><div style="font-size:38px;margin-bottom:8px">🗺️</div><div style="font-weight:600">Keine Auswahl</div><div style="color:#7a9a8b;font-size:13px;margin-top:4px">Klicke auf Länder in der Karte</div></div>';
      } else {
        html += '<div class="bars">';
        sorted.forEach((c, i) => {
          const pct = (c.co2 / maxCO2) * 100;
          const sPct = (c.co2 * f / maxCO2) * 100;
          const lo = c.co2 < 5, mid = c.co2 >= 5 && c.co2 < 7;
          const bg = lo ? 'linear-gradient(90deg,#10b981,#34d399)' : mid ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)';
          const valColor = lo ? '#059669' : mid ? '#d97706' : '#dc2626';
          const val = hasScen ? (c.co2 * f).toFixed(1) : String(c.co2);
          const ghost = hasScen ? `<div class="barGh" style="width:${pct}%"></div>` : '';
          html += `<div class="barRow" style="animation:fadeUp 0.3s ease ${i*35}ms both">
            <div class="barLab"><span class="barFlag">${c.flag}</span><span class="barNm">${c.name}</span></div>
            <div class="barTr">${ghost}<div class="barFl" style="width:${hasScen?sPct:pct}%;background:${bg};animation:barGrow 0.45s ease ${i*35}ms both;transform-origin:left"></div></div>
            <span class="barV" style="color:${valColor}">${val}</span>
          </div>`;
        });
        html += '</div>';
      }
      html += '</div>';

      // Table
      if (sorted.length) {
        html += '<div class="card"><h3 class="cTitle"><span style="color:#0284c7;margin-right:6px">▎</span>Detailtabelle</h3><div class="tWrap"><table class="dt"><thead><tr><th>Land</th><th class="r">CO₂/Kopf</th><th class="r">Bev. (Mio)</th><th class="r">Gesamt Mt</th></tr></thead><tbody>';
        sorted.forEach((c, i) => {
          html += `<tr style="background:${i%2===0?'#fafcfa':'#fff'}"><td>${c.flag} ${c.name}</td><td class="r m">${(c.co2*f).toFixed(1)}</td><td class="r m">${c.pop}</td><td class="r m">${(c.co2*f*c.pop).toFixed(0)}</td></tr>`;
        });
        html += '</tbody></table></div></div>';
      }

      cmp.innerHTML = html;
    }

    /* ── Scenario ── */
    const scn = $('#view-scenario');
    if (scn) {
      let html = '';

      html += '<div style="margin-bottom:16px"><h3 class="cTitle" style="font-size:16px"><span style="color:#059669;margin-right:6px">▎</span>Was wäre wenn?</h3><p style="font-size:13px;color:#5a7d6a;margin-top:4px;line-height:1.5">Kombiniere Maßnahmen — die Faktoren multiplizieren sich.</p></div>';

      html += '<div class="scGrid">';
      Object.entries(SCENARIOS).forEach(([k, s]) => {
        const on = activeScenarios.has(k);
        html += `<button class="scCard${on?' scCard--on':''}" data-sc="${k}">
          <div class="scIcon">${s.icon}</div>
          <div class="scLabel">${s.label}</div>
          <div class="scImpact">−${((1-s.factor)*100).toFixed(0)}%</div>
          <div class="scDesc">${s.desc}</div>
          <div class="scCheck">✓</div>
        </button>`;
      });
      html += '</div>';

      // Result
      if (stats && hasScen) {
        html += `<div class="resCard">
          <div class="resHead"><div class="resIcon">📉</div><span class="resTitle">Ergebnis</span></div>
          <div class="rGrid">
            <div class="rItem"><div class="rLab">Reduktion</div><div class="rVal rVal--accent">−${stats.reduction.toFixed(0)}%</div></div>
            <div class="rItem"><div class="rLab">Ø vorher</div><div class="rVal">${stats.avg.toFixed(1)} t</div></div>
            <div class="rItem"><div class="rLab">Ø nachher</div><div class="rVal rVal--accent">${stats.scenAvg.toFixed(1)} t</div></div>
          </div>
          <div class="resBars">`;
        sorted.forEach((c, i) => {
          html += `<div class="resBar" style="animation:fadeUp 0.3s ease ${i*25}ms both">
            <span class="resBarFlag">${c.flag}</span>
            <div class="resBarTr">
              <div class="resBarOld" style="width:${(c.co2/maxCO2)*100}%"></div>
              <div class="resBarNew" style="width:${(c.co2*f/maxCO2)*100}%"></div>
            </div>
            <span class="resBarVal">${(c.co2*f).toFixed(1)} t</span>
          </div>`;
        });
        html += '</div></div>';
      }

      if (!hasScen) {
        html += '<div class="empty" style="margin-top:20px"><div style="font-size:38px;margin-bottom:8px">🔮</div><div style="font-weight:600">Keine Maßnahme aktiv</div><div style="color:#7a9a8b;font-size:13px;margin-top:4px">Klicke auf eine oder mehrere Karten</div></div>';
      }

      scn.innerHTML = html;

      // Wire scenario card clicks
      scn.querySelectorAll('.scCard').forEach(btn => {
        btn.addEventListener('click', () => {
          const k = btn.dataset.sc;
          activeScenarios.has(k) ? activeScenarios.delete(k) : activeScenarios.add(k);
          render();
        });
      });
    }
  }

  /* ══════════════════════════════════════════
     INIT
     ══════════════════════════════════════════ */
  async function init() {
    const app = $('#app');
    buildApp(app);

    try {
      const resp = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json');
      if (!resp.ok) throw new Error(resp.status);
      const topo = await resp.json();

      const all = toGeoJSON(topo, 'countries');
      mapFeatures = all.filter(f => {
        if (EU_IDS.has(f.id) || NEIGHBOR_IDS.has(f.id)) return true;
        const c = d3.geoCentroid(f.geometry);
        return c[0] >= EUR_BOUNDS.w - 5 && c[0] <= EUR_BOUNDS.e + 10
            && c[1] >= EUR_BOUNDS.s - 2 && c[1] <= EUR_BOUNDS.n + 2;
      });

      projection = d3.geoMercator().center([15, 54]).scale(620).translate([W / 2, H / 2]);
      pathGen = d3.geoPath().projection(projection);

      // Replace loading with app shell
      app.innerHTML = '';
      const shell = buildShell();
      app.appendChild(shell);

      // Render map
      renderMap($('#mapWrap'));

      // Wire tabs
      document.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => {
          currentView = t.dataset.v;
          render();
        });
      });

      // Initial render
      render();

    } catch (err) {
      app.innerHTML = `<div class="loading"><div style="text-align:center;color:#b44"><div style="font-size:32px;margin-bottom:8px">⚠️</div>Fehler beim Laden: ${err.message}</div></div>`;
    }
  }

  init();
})();
