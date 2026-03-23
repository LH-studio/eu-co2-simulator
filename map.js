/* ═══════════════════════════════════════════
   map.js — Map rendering with d3 + TopoJSON
   ═══════════════════════════════════════════ */

const EuroMap = (() => {

  const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
  const W = 620, H = 640;

  let projection, pathGen, features;
  let svgEl, tooltipEl;
  let onCountryClick, onCountryHover, onCountryLeave;

  /* ── Minimal TopoJSON decoder ── */
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
      if (g.type === 'Polygon') {
        coords = g.arcs.map(r => stitchRing(arcs, r));
      } else if (g.type === 'MultiPolygon') {
        coords = g.arcs.map(p => p.map(r => stitchRing(arcs, r)));
      } else {
        coords = [];
      }
      return {
        type: 'Feature', id: g.id,
        properties: g.properties || {},
        geometry: { type: g.type, coordinates: coords }
      };
    });
  }

  /* ── Centroid (simplified) ── */
  function geoCentroid(geom) {
    let coords = [];
    if (geom.type === 'Polygon') {
      coords = geom.coordinates[0] || [];
    } else if (geom.type === 'MultiPolygon') {
      coords = geom.coordinates[0]?.[0] || [];
    }
    if (!coords.length) return [0, 0];
    let sx = 0, sy = 0;
    coords.forEach(c => { sx += c[0]; sy += c[1]; });
    return [sx / coords.length, sy / coords.length];
  }

  /* ── Load & parse ── */
  async function load() {
    const resp = await fetch(TOPO_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const topo = await resp.json();
    const all = toGeoJSON(topo, 'countries');

    const bounds = { w: -12, e: 35, s: 34, n: 72 };
    features = all.filter(f => {
      const c = geoCentroid(f.geometry);
      return c[0] >= bounds.w - 5 && c[0] <= bounds.e + 10
          && c[1] >= bounds.s - 2 && c[1] <= bounds.n + 2;
    });

    projection = d3.geoMercator().center([15, 54]).scale(620).translate([W / 2, H / 2]);
    pathGen = d3.geoPath().projection(projection);
  }

  /* ── Render SVG ── */
  function render(container, co2Data) {
    const wrap = document.createElement('div');
    wrap.className = 'map-wrap';

    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svgEl.classList.add('map-svg');

    // White background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', W);
    bg.setAttribute('height', H);
    bg.setAttribute('fill', '#ffffff');
    bg.setAttribute('rx', '10');
    svgEl.appendChild(bg);

    // Country paths
    features.forEach(f => {
      const d = pathGen(f.geometry);
      if (!d) return;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.dataset.id = f.id;
      path.dataset.hasData = co2Data[f.id] ? 'true' : 'false';

      // Default: neighbor (no data)
      if (!co2Data[f.id]) {
        path.setAttribute('fill', '#f0f2f0');
        path.setAttribute('stroke', '#dde3dd');
        path.setAttribute('stroke-width', '0.4');
        path.setAttribute('stroke-linejoin', 'round');
      } else {
        path.setAttribute('fill', 'rgba(16, 185, 129, 0.06)');
        path.setAttribute('stroke', 'rgba(16, 185, 129, 0.35)');
        path.setAttribute('stroke-width', '0.6');
        path.setAttribute('stroke-linejoin', 'round');

        path.addEventListener('click', () => onCountryClick?.(f.id));
        path.addEventListener('mouseenter', () => onCountryHover?.(f.id));
        path.addEventListener('mouseleave', () => onCountryLeave?.(f.id));
      }

      svgEl.appendChild(path);
    });

    wrap.appendChild(svgEl);

    // Tooltip
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    tooltipEl.innerHTML = `
      <span class="tooltip__flag"></span>
      <div>
        <div class="tooltip__name"></div>
        <div class="tooltip__val"></div>
      </div>
      <span class="tooltip__check">✓</span>
    `;
    wrap.appendChild(tooltipEl);

    container.appendChild(wrap);
  }

  /* ── Update selection visual ── */
  function updateSelection(selected) {
    if (!svgEl) return;
    svgEl.querySelectorAll('path[data-has-data="true"]').forEach(path => {
      const id = path.dataset.id;
      const isSel = selected.has(id);
      if (isSel) {
        path.setAttribute('fill', 'rgba(5, 150, 105, 0.22)');
        path.setAttribute('stroke', '#047857');
        path.setAttribute('stroke-width', '1.6');
      } else {
        path.setAttribute('fill', 'rgba(16, 185, 129, 0.06)');
        path.setAttribute('stroke', 'rgba(16, 185, 129, 0.35)');
        path.setAttribute('stroke-width', '0.6');
      }
    });
  }

  /* ── Hover visual ── */
  function showHover(id, data, isSelected) {
    if (!svgEl) return;
    const path = svgEl.querySelector(`path[data-id="${id}"]`);
    if (path && !isSelected) {
      path.setAttribute('fill', 'rgba(16, 185, 129, 0.12)');
      path.setAttribute('stroke', '#34d399');
      path.setAttribute('stroke-width', '1.2');
    }
    if (data && tooltipEl) {
      tooltipEl.querySelector('.tooltip__flag').textContent = data.flag;
      tooltipEl.querySelector('.tooltip__name').textContent = data.name;
      tooltipEl.querySelector('.tooltip__val').textContent = `${data.co2} t CO₂/Kopf`;
      tooltipEl.querySelector('.tooltip__check').style.display = isSelected ? 'inline' : 'none';
      tooltipEl.classList.add('tooltip--visible');
    }
  }

  function hideHover(id, isSelected) {
    if (!svgEl) return;
    const path = svgEl.querySelector(`path[data-id="${id}"]`);
    if (path && !isSelected) {
      path.setAttribute('fill', 'rgba(16, 185, 129, 0.06)');
      path.setAttribute('stroke', 'rgba(16, 185, 129, 0.35)');
      path.setAttribute('stroke-width', '0.6');
    }
    if (tooltipEl) tooltipEl.classList.remove('tooltip--visible');
  }

  /* ── Public API ── */
  return {
    load,
    render,
    updateSelection,
    showHover,
    hideHover,
    set onClick(fn) { onCountryClick = fn; },
    set onHover(fn) { onCountryHover = fn; },
    set onLeave(fn) { onCountryLeave = fn; },
  };

})();
