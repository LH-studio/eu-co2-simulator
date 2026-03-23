/* ═══════════════════════════════════════════════════════
   EU CO₂ Explorer — Vanilla JS (matches JSX artifact 1:1)
   ═══════════════════════════════════════════════════════ */
;(function () {
  'use strict';

  /* ──────────── DATA ──────────── */
  var CO2 = {
    '578':{c:'NO',name:'Norwegen',co2:7.5,pop:5.4,flag:'\u{1F1F3}\u{1F1F4}'},
    '752':{c:'SE',name:'Schweden',co2:3.5,pop:10.4,flag:'\u{1F1F8}\u{1F1EA}'},
    '246':{c:'FI',name:'Finnland',co2:7.1,pop:5.5,flag:'\u{1F1EB}\u{1F1EE}'},
    '208':{c:'DK',name:'Dänemark',co2:5.1,pop:5.8,flag:'\u{1F1E9}\u{1F1F0}'},
    '233':{c:'EE',name:'Estland',co2:8.4,pop:1.3,flag:'\u{1F1EA}\u{1F1EA}'},
    '428':{c:'LV',name:'Lettland',co2:3.5,pop:1.9,flag:'\u{1F1F1}\u{1F1FB}'},
    '440':{c:'LT',name:'Litauen',co2:4.1,pop:2.8,flag:'\u{1F1F1}\u{1F1F9}'},
    '826':{c:'GB',name:'Großbritannien',co2:5.2,pop:67.3,flag:'\u{1F1EC}\u{1F1E7}'},
    '372':{c:'IE',name:'Irland',co2:7.7,pop:5.0,flag:'\u{1F1EE}\u{1F1EA}'},
    '528':{c:'NL',name:'Niederlande',co2:8.8,pop:17.5,flag:'\u{1F1F3}\u{1F1F1}'},
    '056':{c:'BE',name:'Belgien',co2:8.2,pop:11.6,flag:'\u{1F1E7}\u{1F1EA}'},
    '276':{c:'DE',name:'Deutschland',co2:8.1,pop:83.2,flag:'\u{1F1E9}\u{1F1EA}'},
    '616':{c:'PL',name:'Polen',co2:8.3,pop:37.7,flag:'\u{1F1F5}\u{1F1F1}'},
    '203':{c:'CZ',name:'Tschechien',co2:9.3,pop:10.7,flag:'\u{1F1E8}\u{1F1FF}'},
    '703':{c:'SK',name:'Slowakei',co2:5.7,pop:5.5,flag:'\u{1F1F8}\u{1F1F0}'},
    '040':{c:'AT',name:'Österreich',co2:6.9,pop:9.0,flag:'\u{1F1E6}\u{1F1F9}'},
    '756':{c:'CH',name:'Schweiz',co2:4.0,pop:8.7,flag:'\u{1F1E8}\u{1F1ED}'},
    '250':{c:'FR',name:'Frankreich',co2:4.5,pop:67.4,flag:'\u{1F1EB}\u{1F1F7}'},
    '724':{c:'ES',name:'Spanien',co2:5.2,pop:47.4,flag:'\u{1F1EA}\u{1F1F8}'},
    '620':{c:'PT',name:'Portugal',co2:4.3,pop:10.3,flag:'\u{1F1F5}\u{1F1F9}'},
    '380':{c:'IT',name:'Italien',co2:5.8,pop:59.6,flag:'\u{1F1EE}\u{1F1F9}'},
    '705':{c:'SI',name:'Slowenien',co2:6.1,pop:2.1,flag:'\u{1F1F8}\u{1F1EE}'},
    '191':{c:'HR',name:'Kroatien',co2:3.9,pop:3.9,flag:'\u{1F1ED}\u{1F1F7}'},
    '348':{c:'HU',name:'Ungarn',co2:4.4,pop:9.7,flag:'\u{1F1ED}\u{1F1FA}'},
    '642':{c:'RO',name:'Rumänien',co2:3.7,pop:19.2,flag:'\u{1F1F7}\u{1F1F4}'},
    '100':{c:'BG',name:'Bulgarien',co2:5.5,pop:6.9,flag:'\u{1F1E7}\u{1F1EC}'},
    '300':{c:'GR',name:'Griechenland',co2:5.8,pop:10.7,flag:'\u{1F1EC}\u{1F1F7}'},
    '688':{c:'RS',name:'Serbien',co2:5.8,pop:6.8,flag:'\u{1F1F7}\u{1F1F8}'},
    '442':{c:'LU',name:'Luxemburg',co2:11.3,pop:0.6,flag:'\u{1F1F1}\u{1F1FA}'}
  };

  var EU_IDS = {};
  Object.keys(CO2).forEach(function(k){ EU_IDS[k] = true; });

  var NEIGHBOR_IDS = {'804':1,'112':1,'498':1,'070':1,'499':1,'008':1,'807':1,'792':1,'643':1};

  var SCENARIOS = {
    renewables: { label:'100% Erneuerbare', factor:0.4, icon:'\u26A1', desc:'Wind, Solar & Wasserkraft' },
    transport:  { label:'E-Mobilität',      factor:0.75,icon:'\u{1F683}', desc:'Elektrifizierung des Verkehrs' },
    diet:       { label:'Pflanzenbasiert',   factor:0.9, icon:'\u{1F331}', desc:'Weniger tierische Produkte' },
    buildings:  { label:'Sanierung',         factor:0.85,icon:'\u{1F3E0}', desc:'Energetische Gebäudesanierung' },
    industry:   { label:'Grüne Industrie',   factor:0.7, icon:'\u{1F3ED}', desc:'Dekarbonisierung' }
  };

  var PRESETS = {
    all:     Object.keys(CO2),
    none:    [],
    top6:    ['276','250','380','724','616','528'],
    scandinavia: ['578','752','246','208'],
    dach:    ['276','040','756'],
    benelux: ['528','056','442']
  };

  var maxCO2 = 0;
  Object.keys(CO2).forEach(function(k){ if (CO2[k].co2 > maxCO2) maxCO2 = CO2[k].co2; });

  /* ──────────── STATE ──────────── */
  var selected = { '276':1, '250':1, '616':1 };
  var hovered = null;
  var activeScen = {};
  var curView = 'compare';

  /* ──────────── TOPO DECODER ──────────── */
  function decodeTopo(topo) {
    var tf = topo.transform;
    return topo.arcs.map(function(arc) {
      var x = 0, y = 0;
      return arc.map(function(d) {
        x += d[0]; y += d[1];
        return [x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]];
      });
    });
  }

  function stitchRing(arcs, indices) {
    var pts = [];
    for (var j = 0; j < indices.length; j++) {
      var idx = indices[j];
      var a = idx >= 0 ? arcs[idx].slice() : arcs[~idx].slice().reverse();
      if (pts.length) a.shift();
      pts = pts.concat(a);
    }
    return pts;
  }

  function toGeoJSON(topo, key) {
    var arcs = decodeTopo(topo);
    return topo.objects[key].geometries.map(function(g) {
      var coords;
      if (g.type === 'Polygon') {
        coords = g.arcs.map(function(r){ return stitchRing(arcs, r); });
      } else if (g.type === 'MultiPolygon') {
        coords = g.arcs.map(function(p){ return p.map(function(r){ return stitchRing(arcs, r); }); });
      } else {
        coords = [];
      }
      return { type:'Feature', id:g.id, properties:g.properties||{}, geometry:{ type:g.type, coordinates:coords } };
    });
  }

  /* ──────────── HELPERS ──────────── */
  function selKeys() { return Object.keys(selected); }
  function selCount() { return selKeys().length; }
  function factor() {
    var keys = Object.keys(activeScen);
    if (!keys.length) return 1;
    var f = 1;
    keys.forEach(function(k){ f *= SCENARIOS[k].factor; });
    return f;
  }
  function sorted() {
    return selKeys().filter(function(id){ return CO2[id]; })
      .map(function(id){ return { id:id, c:CO2[id].c, name:CO2[id].name, co2:CO2[id].co2, pop:CO2[id].pop, flag:CO2[id].flag }; })
      .sort(function(a,b){ return b.co2 - a.co2; });
  }
  function stats() {
    var ids = selKeys().filter(function(id){ return CO2[id]; });
    if (!ids.length) return null;
    var tot=0, pop=0, wa=0;
    ids.forEach(function(id){ var c=CO2[id]; tot+=c.co2; pop+=c.pop; wa+=c.co2*c.pop; });
    var f = factor();
    return { avg:tot/ids.length, wAvg:wa/pop, pop:pop, sAvg:(tot/ids.length)*f, red:(1-f)*100 };
  }

  /* ──────────── SVG HELPER ──────────── */
  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) Object.keys(attrs).forEach(function(k){ el.setAttribute(k, attrs[k]); });
    return el;
  }

  /* ──────────── MAP GLOBALS ──────────── */
  var mapFeatures, projection, pathGen;
  var W = 620, H = 640;
  var svgNode, tooltipNode;

  function setPathStyle(p, isSel, isHov) {
    if (isSel) {
      p.setAttribute('fill', 'rgba(5,150,105,0.22)');
      p.setAttribute('stroke', '#059669');
      p.setAttribute('stroke-width', '1.6');
    } else if (isHov) {
      p.setAttribute('fill', 'rgba(16,185,129,0.12)');
      p.setAttribute('stroke', '#34d399');
      p.setAttribute('stroke-width', '1.2');
    } else {
      p.setAttribute('fill', 'rgba(16,185,129,0.06)');
      p.setAttribute('stroke', 'rgba(16,185,129,0.35)');
      p.setAttribute('stroke-width', '0.6');
    }
  }

  function refreshMapPaths() {
    if (!svgNode) return;
    var paths = svgNode.querySelectorAll('path[data-cid]');
    for (var i = 0; i < paths.length; i++) {
      var p = paths[i], id = p.getAttribute('data-cid');
      setPathStyle(p, !!selected[id], hovered === id);
    }
  }

  function showTooltip(id) {
    if (!tooltipNode || !CO2[id]) return;
    var d = CO2[id];
    tooltipNode.querySelector('.ttFlag').textContent = d.flag;
    tooltipNode.querySelector('.ttN').textContent = d.name;
    tooltipNode.querySelector('.ttV').textContent = d.co2 + ' t CO\u2082/Kopf';
    tooltipNode.querySelector('.ttCheck').style.display = selected[id] ? 'inline' : 'none';
    tooltipNode.className = 'tooltip tooltip--show';
  }

  function hideTooltip() {
    if (tooltipNode) tooltipNode.className = 'tooltip';
  }

  /* ──────────── BUILD MAP ──────────── */
  function buildMap(container) {
    var wrap = document.createElement('div');
    wrap.className = 'mapWrap';

    svgNode = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svgNode.setAttribute('class', 'mapSvg');

    svgNode.appendChild(svgEl('rect', { width:W, height:H, fill:'#ffffff', rx:'10' }));

    for (var i = 0; i < mapFeatures.length; i++) {
      var f = mapFeatures[i];
      var d = pathGen(f.geometry);
      if (!d) continue;

      var path = svgEl('path', { d:d, 'stroke-linejoin':'round' });
      var hasData = !!CO2[f.id];

      if (!hasData) {
        path.setAttribute('fill', '#f0f2f0');
        path.setAttribute('stroke', '#dde3dd');
        path.setAttribute('stroke-width', '0.4');
        path.style.cursor = 'default';
      } else {
        path.setAttribute('data-cid', f.id);
        path.style.cursor = 'pointer';
        setPathStyle(path, !!selected[f.id], false);

        ;(function(fid) {
          path.addEventListener('click', function() {
            if (selected[fid]) delete selected[fid]; else selected[fid] = 1;
            render();
          });
          path.addEventListener('mouseenter', function() {
            hovered = fid;
            refreshMapPaths();
            showTooltip(fid);
          });
          path.addEventListener('mouseleave', function() {
            hovered = null;
            refreshMapPaths();
            hideTooltip();
          });
        })(f.id);
      }
      svgNode.appendChild(path);
    }

    wrap.appendChild(svgNode);

    tooltipNode = document.createElement('div');
    tooltipNode.className = 'tooltip';
    tooltipNode.innerHTML = '<span class="ttFlag"></span><div><div class="ttN"></div><div class="ttV"></div></div><span class="ttCheck">\u2713</span>';
    wrap.appendChild(tooltipNode);

    container.appendChild(wrap);
  }

  /* ──────────── BUILD APP SHELL ──────────── */
  function buildShell() {
    var root = document.createElement('div');
    root.className = 'app';

    root.innerHTML =
      '<header class="header">' +
        '<div class="hdrL">' +
          '<div class="logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>' +
          '<div><h1 class="title">EU CO\u2082 Explorer</h1><p class="sub">Tonnen CO\u2082 pro Kopf \u00B7 2022 \u00B7 Our World in Data</p></div>' +
        '</div>' +
        '<div class="tabs">' +
          '<button class="tab tab--on" data-v="compare"><span style="font-size:13px">\u{1F4CA}</span> Vergleich</button>' +
          '<button class="tab" data-v="scenario"><span style="font-size:13px">\u{1F52E}</span> Szenarien</button>' +
        '</div>' +
      '</header>' +
      '<div class="body">' +
        '<div class="mapCol"><div class="mapCard">' +
          '<div class="mapHead"><span class="mapT">Europa</span><span class="badge" id="jBadge">3 L\u00E4nder</span></div>' +
          '<div id="jMapWrap"></div>' +
          '<div class="qRow" id="jQRow"></div>' +
        '</div></div>' +
        '<div class="panel">' +
          '<div class="viewSection viewSection--active" id="jCompare"></div>' +
          '<div class="viewSection" id="jScenario"></div>' +
        '</div>' +
      '</div>' +
      '<footer class="footer"><span>Quelle: Our World in Data \u00B7 CO\u2082/Kopf 2022</span><span style="color:#059669;font-weight:600">Studio.LUC</span></footer>';

    return root;
  }

  /* ──────────── RENDER ──────────── */
  function render() {
    var f = factor(), st = stats(), s = sorted(), hasSc = Object.keys(activeScen).length > 0;

    // Badge
    var badge = document.getElementById('jBadge');
    if (badge) badge.textContent = selCount() + ' ' + (selCount() === 1 ? 'Land' : 'L\u00E4nder');

    // Map paths
    refreshMapPaths();

    // Tab visuals
    var tabs = document.querySelectorAll('.tab');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].className = 'tab' + (tabs[t].getAttribute('data-v') === curView ? ' tab--on' : '');
    }
    var secs = document.querySelectorAll('.viewSection');
    for (var v = 0; v < secs.length; v++) {
      secs[v].className = 'viewSection' + (secs[v].id === 'j' + curView.charAt(0).toUpperCase() + curView.slice(1) ? ' viewSection--active' : '');
    }

    renderCompare(st, s, f, hasSc);
    renderScenario(st, s, f, hasSc);
  }

  function renderCompare(st, s, f, hasSc) {
    var el = document.getElementById('jCompare');
    if (!el) return;
    var h = '';

    if (st) {
      h += '<div class="sGrid">' +
        '<div class="stCard" style="background:#ecfdf5"><div class="stL">\u00D8 CO\u2082/Kopf</div><div class="stV"><span style="color:#059669">' + st.avg.toFixed(1) + '</span><span class="stU">t</span></div></div>' +
        '<div class="stCard" style="background:#e0f2fe"><div class="stL">\u00D8 gewichtet</div><div class="stV"><span style="color:#0284c7">' + st.wAvg.toFixed(1) + '</span><span class="stU">t</span></div></div>' +
        '<div class="stCard" style="background:#f3e8ff"><div class="stL">Bev\u00F6lkerung</div><div class="stV"><span style="color:#7c3aed">' + st.pop.toFixed(0) + '</span><span class="stU">Mio</span></div></div>' +
      '</div>';
    }

    h += '<div class="card"><h3 class="cTitle"><span style="color:#059669;margin-right:6px">\u258C</span>CO\u2082 pro Kopf (t/Jahr)</h3>';
    if (!s.length) {
      h += '<div class="empty"><div style="font-size:38px;margin-bottom:8px">\u{1F5FA}\uFE0F</div><div style="font-weight:600">Keine Auswahl</div><div style="color:#7a9a8b;font-size:13px;margin-top:4px">Klicke auf L\u00E4nder in der Karte</div></div>';
    } else {
      h += '<div class="bars">';
      for (var i = 0; i < s.length; i++) {
        var c = s[i];
        var pct = (c.co2 / maxCO2) * 100;
        var sPct = (c.co2 * f / maxCO2) * 100;
        var lo = c.co2 < 5, mid = c.co2 >= 5 && c.co2 < 7;
        var bg = lo ? 'linear-gradient(90deg,#10b981,#34d399)' : mid ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)';
        var vc = lo ? '#059669' : mid ? '#d97706' : '#dc2626';
        var val = hasSc ? (c.co2 * f).toFixed(1) : String(c.co2);
        var ghost = hasSc ? '<div class="barGh" style="width:' + pct + '%"></div>' : '';
        h += '<div class="barRow" style="animation:fadeUp 0.3s ease ' + (i*35) + 'ms both">' +
          '<div class="barLab"><span class="barFlag">' + c.flag + '</span><span class="barNm">' + c.name + '</span></div>' +
          '<div class="barTr">' + ghost + '<div class="barFl" style="width:' + (hasSc?sPct:pct) + '%;background:' + bg + ';animation:barGrow 0.45s ease ' + (i*35) + 'ms both;transform-origin:left"></div></div>' +
          '<span class="barV" style="color:' + vc + '">' + val + '</span></div>';
      }
      h += '</div>';
    }
    h += '</div>';

    if (s.length) {
      h += '<div class="card"><h3 class="cTitle"><span style="color:#0284c7;margin-right:6px">\u258C</span>Detailtabelle</h3><div class="tWrap"><table class="dt"><thead><tr><th>Land</th><th class="r">CO\u2082/Kopf</th><th class="r">Bev. (Mio)</th><th class="r">Gesamt Mt</th></tr></thead><tbody>';
      for (var j = 0; j < s.length; j++) {
        var c2 = s[j];
        h += '<tr><td>' + c2.flag + ' ' + c2.name + '</td><td class="r m">' + (c2.co2*f).toFixed(1) + '</td><td class="r m">' + c2.pop + '</td><td class="r m">' + (c2.co2*f*c2.pop).toFixed(0) + '</td></tr>';
      }
      h += '</tbody></table></div></div>';
    }

    el.innerHTML = h;
  }

  function renderScenario(st, s, f, hasSc) {
    var el = document.getElementById('jScenario');
    if (!el) return;
    var h = '';

    h += '<div style="margin-bottom:16px"><h3 class="cTitle" style="font-size:16px"><span style="color:#059669;margin-right:6px">\u258C</span>Was w\u00E4re wenn?</h3><p style="font-size:13px;color:#5a7d6a;margin-top:4px;line-height:1.5">Kombiniere Ma\u00DFnahmen \u2014 die Faktoren multiplizieren sich.</p></div>';

    h += '<div class="scGrid">';
    var skeys = Object.keys(SCENARIOS);
    for (var i = 0; i < skeys.length; i++) {
      var k = skeys[i], sc = SCENARIOS[k], on = !!activeScen[k];
      h += '<button class="scCard' + (on?' scCard--on':'') + '" data-sc="' + k + '">' +
        '<div class="scIcon">' + sc.icon + '</div>' +
        '<div class="scLabel">' + sc.label + '</div>' +
        '<div class="scImpact">\u2212' + ((1-sc.factor)*100).toFixed(0) + '%</div>' +
        '<div class="scDesc">' + sc.desc + '</div>' +
        '<div class="scCheck">\u2713</div></button>';
    }
    h += '</div>';

    if (st && hasSc) {
      h += '<div class="resCard"><div class="resHead"><div class="resIcon">\u{1F4C9}</div><span class="resTitle">Ergebnis</span></div>' +
        '<div class="rGrid">' +
          '<div class="rItem"><div class="rLab">Reduktion</div><div class="rVal rVal--g">\u2212' + st.red.toFixed(0) + '%</div></div>' +
          '<div class="rItem"><div class="rLab">\u00D8 vorher</div><div class="rVal">' + st.avg.toFixed(1) + ' t</div></div>' +
          '<div class="rItem"><div class="rLab">\u00D8 nachher</div><div class="rVal rVal--g">' + st.sAvg.toFixed(1) + ' t</div></div>' +
        '</div><div class="resBars">';
      for (var j = 0; j < s.length; j++) {
        var c = s[j];
        h += '<div class="resBar" style="animation:fadeUp 0.3s ease ' + (j*25) + 'ms both">' +
          '<span class="resBarFlag">' + c.flag + '</span>' +
          '<div class="resBarTr"><div class="resBarOld" style="width:' + (c.co2/maxCO2)*100 + '%"></div><div class="resBarNew" style="width:' + (c.co2*f/maxCO2)*100 + '%"></div></div>' +
          '<span class="resBarVal">' + (c.co2*f).toFixed(1) + ' t</span></div>';
      }
      h += '</div></div>';
    }

    if (!hasSc) {
      h += '<div class="empty" style="margin-top:20px"><div style="font-size:38px;margin-bottom:8px">\u{1F52E}</div><div style="font-weight:600">Keine Ma\u00DFnahme aktiv</div><div style="color:#7a9a8b;font-size:13px;margin-top:4px">Klicke auf eine oder mehrere Karten</div></div>';
    }

    el.innerHTML = h;

    // Wire scenario card clicks
    var cards = el.querySelectorAll('.scCard');
    for (var c2 = 0; c2 < cards.length; c2++) {
      ;(function(btn) {
        btn.addEventListener('click', function() {
          var key = btn.getAttribute('data-sc');
          if (activeScen[key]) delete activeScen[key]; else activeScen[key] = 1;
          render();
        });
      })(cards[c2]);
    }
  }

  /* ──────────── INIT ──────────── */
  function init() {
    var loadingEl = document.getElementById('loading');
    var appEl = document.getElementById('app');
    var errorEl = document.getElementById('error');

    // Check d3
    if (typeof d3 === 'undefined' || !d3.geoMercator) {
      loadingEl.style.display = 'none';
      errorEl.style.display = 'flex';
      document.getElementById('error-msg').textContent = 'd3-geo konnte nicht geladen werden. Bitte Seite neu laden.';
      return;
    }

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json')
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(topo) {
        var all = toGeoJSON(topo, 'countries');
        mapFeatures = all.filter(function(feat) {
          if (EU_IDS[feat.id] || NEIGHBOR_IDS[feat.id]) return true;
          var c = d3.geoCentroid(feat.geometry);
          return c[0] >= -17 && c[0] <= 45 && c[1] >= 32 && c[1] <= 74;
        });

        projection = d3.geoMercator().center([15, 54]).scale(620).translate([W / 2, H / 2]);
        pathGen = d3.geoPath().projection(projection);

        // Hide loading, build app
        loadingEl.style.display = 'none';
        var shell = buildShell();
        appEl.appendChild(shell);
        appEl.style.display = 'block';

        // Build map
        buildMap(document.getElementById('jMapWrap'));

        // Quick select buttons
        var qRow = document.getElementById('jQRow');
        var presetList = [
          { l:'Alle', p:'all' }, { l:'Keine', p:'none' },
          { l:'EU Top 6', p:'top6' }, { l:'Skandinavien', p:'scandinavia' },
          { l:'DACH', p:'dach' }, { l:'Benelux', p:'benelux' }
        ];
        for (var i = 0; i < presetList.length; i++) {
          ;(function(pr) {
            var btn = document.createElement('button');
            btn.className = 'qBtn';
            btn.textContent = pr.l;
            btn.addEventListener('click', function() {
              selected = {};
              PRESETS[pr.p].forEach(function(id){ selected[id] = 1; });
              render();
            });
            qRow.appendChild(btn);
          })(presetList[i]);
        }

        // Wire tabs
        var tabs = document.querySelectorAll('.tab');
        for (var t = 0; t < tabs.length; t++) {
          ;(function(tab) {
            tab.addEventListener('click', function() {
              curView = tab.getAttribute('data-v');
              render();
            });
          })(tabs[t]);
        }

        // Initial render
        render();
      })
      .catch(function(err) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'flex';
        document.getElementById('error-msg').textContent = 'Fehler: ' + err.message;
      });
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
