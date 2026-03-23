/* ═══════════════════════════════════════════
   app.js — EU CO₂ Explorer
   ═══════════════════════════════════════════ */

(async function () {
  'use strict';

  /* ── State ── */
  let co2Data = {};
  let scenarios = {};
  let presets = {};
  let maxCO2 = 0;

  let selected = new Set(['276', '250', '616']); // DE, FR, PL
  let activeScenarios = new Set();
  let currentView = 'compare';

  /* ── DOM refs ── */
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  /* ── Load data ── */
  async function init() {
    try {
      const [dataResp] = await Promise.all([
        fetch('data/co2-data.json').then(r => r.json()),
        EuroMap.load(),
      ]);

      co2Data = dataResp.countries;
      scenarios = dataResp.scenarios;
      presets = dataResp.presets;
      maxCO2 = Math.max(...Object.values(co2Data).map(c => c.co2));

      // Render map
      const mapContainer = $('.map-card__body');
      EuroMap.render(mapContainer, co2Data);

      // Wire map events
      EuroMap.onClick = id => toggleCountry(id);
      EuroMap.onHover = id => EuroMap.showHover(id, co2Data[id], selected.has(id));
      EuroMap.onLeave = id => EuroMap.hideHover(id, selected.has(id));

      // Wire UI
      wireUI();
      update();

      // Hide loading, show app
      $('#loading').style.display = 'none';
      $('#app-content').style.display = 'flex';

    } catch (err) {
      $('#loading').innerHTML = `
        <div style="color:#b44;text-align:center">
          <div style="font-size:32px;margin-bottom:8px">⚠️</div>
          Fehler beim Laden: ${err.message}
        </div>`;
    }
  }

  /* ── Toggle country selection ── */
  function toggleCountry(id) {
    if (!co2Data[id]) return;
    selected.has(id) ? selected.delete(id) : selected.add(id);
    update();
  }

  /* ── Combined scenario factor ── */
  function getCombinedFactor() {
    if (activeScenarios.size === 0) return 1;
    let f = 1;
    activeScenarios.forEach(k => { f *= scenarios[k].factor; });
    return f;
  }

  /* ── Compute stats ── */
  function getStats() {
    const ids = [...selected];
    if (!ids.length) return null;
    const cs = ids.map(id => co2Data[id]);
    const tot = cs.reduce((s, c) => s + c.co2, 0);
    const pop = cs.reduce((s, c) => s + c.pop, 0);
    const wa = cs.reduce((s, c) => s + c.co2 * c.pop, 0) / pop;
    const f = getCombinedFactor();
    return {
      avg: tot / cs.length,
      weightedAvg: wa,
      totalPop: pop,
      scenAvg: (tot / cs.length) * f,
      reduction: (1 - f) * 100,
    };
  }

  /* ── Sorted selected countries ── */
  function getSorted() {
    return [...selected]
      .map(id => ({ id, ...co2Data[id] }))
      .sort((a, b) => b.co2 - a.co2);
  }

  /* ── Full UI update ── */
  function update() {
    const f = getCombinedFactor();
    const stats = getStats();
    const sorted = getSorted();

    // Badge
    $('.badge').textContent = `${selected.size} ${selected.size === 1 ? 'Land' : 'Länder'}`;

    // Map
    EuroMap.updateSelection(selected);

    // ── Compare View ──
    updateStats(stats);
    updateBars(sorted, f);
    updateTable(sorted, f);

    // ── Scenario View ──
    updateScenarioCards();
    updateResult(stats, sorted, f);
  }

  /* ── Stats cards ── */
  function updateStats(stats) {
    const el = $('#stats-grid');
    if (!stats) { el.style.display = 'none'; return; }
    el.style.display = 'grid';
    $('#stat-avg').textContent = stats.avg.toFixed(1);
    $('#stat-wavg').textContent = stats.weightedAvg.toFixed(1);
    $('#stat-pop').textContent = stats.totalPop.toFixed(0);
  }

  /* ── Bar chart ── */
  function updateBars(sorted, factor) {
    const container = $('#bars');
    const empty = $('#bars-empty');
    const hasScen = activeScenarios.size > 0;

    if (!sorted.length) {
      container.style.display = 'none';
      empty.style.display = 'flex';
      return;
    }
    container.style.display = 'flex';
    empty.style.display = 'none';

    container.innerHTML = sorted.map((c, i) => {
      const pct = (c.co2 / maxCO2) * 100;
      const sPct = (c.co2 * factor / maxCO2) * 100;
      const lo = c.co2 < 5, mid = c.co2 >= 5 && c.co2 < 7;
      const bg = lo ? 'linear-gradient(90deg,#10b981,#34d399)'
        : mid ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
        : 'linear-gradient(90deg,#ef4444,#f87171)';
      const valClass = lo ? 'low' : mid ? 'mid' : 'high';
      const val = hasScen ? (c.co2 * factor).toFixed(1) : c.co2.toString();
      const ghostHtml = hasScen
        ? `<div class="bar-row__ghost" style="width:${pct}%"></div>` : '';

      return `
        <div class="bar-row" style="animation:fadeUp 0.3s ease ${i * 35}ms both">
          <div class="bar-row__label">
            <span class="bar-row__flag">${c.flag}</span>
            <span class="bar-row__name">${c.name}</span>
          </div>
          <div class="bar-row__track">
            ${ghostHtml}
            <div class="bar-row__fill" style="width:${hasScen ? sPct : pct}%;background:${bg};animation:barGrow 0.45s ease ${i * 35}ms both"></div>
          </div>
          <span class="bar-row__value bar-row__value--${valClass}">${val}</span>
        </div>`;
    }).join('');
  }

  /* ── Data table ── */
  function updateTable(sorted, factor) {
    const wrap = $('#table-card');
    if (!sorted.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';

    const tbody = $('#table-body');
    tbody.innerHTML = sorted.map((c, i) => `
      <tr${i % 2 === 0 ? ' style="background:#fafcfa"' : ''}>
        <td>${c.flag} ${c.name}</td>
        <td class="right mono">${(c.co2 * factor).toFixed(1)}</td>
        <td class="right mono">${c.pop}</td>
        <td class="right mono">${(c.co2 * factor * c.pop).toFixed(0)}</td>
      </tr>
    `).join('');
  }

  /* ── Scenario cards ── */
  function updateScenarioCards() {
    $$('.scenario-card').forEach(card => {
      const k = card.dataset.key;
      card.classList.toggle('scenario-card--active', activeScenarios.has(k));
    });
  }

  /* ── Scenario result ── */
  function updateResult(stats, sorted, factor) {
    const card = $('#result-card');
    const empty = $('#scenario-empty');
    const hasScen = activeScenarios.size > 0;

    if (!hasScen || !stats) {
      card.style.display = 'none';
      empty.style.display = hasScen ? 'none' : 'flex';
      return;
    }
    card.style.display = 'block';
    empty.style.display = 'none';

    $('#res-reduction').textContent = `−${stats.reduction.toFixed(0)}%`;
    $('#res-before').textContent = `${stats.avg.toFixed(1)} t`;
    $('#res-after').textContent = `${stats.scenAvg.toFixed(1)} t`;

    const barsEl = $('#result-bars');
    barsEl.innerHTML = sorted.map((c, i) => `
      <div class="result-bar" style="animation:fadeUp 0.3s ease ${i * 25}ms both">
        <span class="result-bar__flag">${c.flag}</span>
        <div class="result-bar__track">
          <div class="result-bar__old" style="width:${(c.co2 / maxCO2) * 100}%"></div>
          <div class="result-bar__new" style="width:${(c.co2 * factor / maxCO2) * 100}%"></div>
        </div>
        <span class="result-bar__val">${(c.co2 * factor).toFixed(1)} t</span>
      </div>
    `).join('');
  }

  /* ── Wire UI events ── */
  function wireUI() {
    // Tabs
    $$('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentView = tab.dataset.view;
        $$('.tab').forEach(t => t.classList.toggle('tab--active', t === tab));
        $$('.view-section').forEach(v => v.classList.toggle('view-section--active', v.dataset.view === currentView));
      });
    });

    // Quick-select
    $$('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.preset;
        if (key === 'none') {
          selected = new Set();
        } else if (presets[key]) {
          selected = new Set(presets[key]);
        }
        update();
      });
    });

    // Build scenario cards
    const grid = $('#scenario-grid');
    Object.entries(scenarios).forEach(([k, s]) => {
      const card = document.createElement('button');
      card.className = 'scenario-card';
      card.dataset.key = k;
      card.innerHTML = `
        <div class="scenario-card__icon">${s.icon}</div>
        <div class="scenario-card__label">${s.label}</div>
        <div class="scenario-card__impact">−${((1 - s.factor) * 100).toFixed(0)}%</div>
        <div class="scenario-card__desc">${s.desc}</div>
        <div class="scenario-card__check">✓</div>
      `;
      card.addEventListener('click', () => {
        activeScenarios.has(k) ? activeScenarios.delete(k) : activeScenarios.add(k);
        update();
      });
      grid.appendChild(card);
    });
  }

  /* ── Start ── */
  init();

})();
