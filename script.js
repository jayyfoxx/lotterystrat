(() => {
  // ---------- Chart definitions ----------
  const mirrorDigit = n => (n + 5) % 10;   // 0<->5, 1<->6, 2<->7, 3<->8, 4<->9
  const flipDigit   = n => (n + 3) % 10;   // 0->3, 1->4 ... 7->0, 8->1, 9->2

  const CHARTS = [
    { key: 'your',   title: 'Your Numbers',   fn: n => n },
    { key: 'mirror', title: 'Mirror Numbers', fn: mirrorDigit },
    { key: 'flip',   title: 'Flip Numbers',   fn: flipDigit },
  ];
  const PER_CHART = 40;

  const GROUP_COLORS = [
    '#4CC9F0', '#F72585', '#80ED99', '#FF8C42', '#B388FF', '#2EC4B6',
    '#FF5D73', '#C6F432', '#5E9BFF', '#FFB4A2', '#E0AAFF', '#FFD60A'
  ];
  const colorFor = i => i < GROUP_COLORS.length
    ? GROUP_COLORS[i]
    : `hsl(${Math.round((i * 137.508) % 360)} 85% 66%)`;

  // ---------- State ----------
  let size = 3;
  let values = []; // strings '' or '0'..'9' for "Your Numbers"
  let lastResults = null;
  let selected = 0; // which "Your Numbers" box is active
  const isDiag = i => Math.floor(i / size) === i % size;

  const $ = id => document.getElementById(id);
  const yourGrid = $('yourGrid'), mirrorGrid = $('mirrorGrid'), flipGrid = $('flipGrid');

  // ---------- Persistence (optional convenience) ----------
  function save() {
    try { localStorage.setItem('pickgen', JSON.stringify({ size, values })); } catch (e) {}
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem('pickgen') || 'null');
      if (s && (s.size === 3 || s.size === 4) && Array.isArray(s.values)) {
        size = s.size; values = s.values.map(v => /^[0-9]$/.test(v) ? v : '');
        document.querySelector(`input[name="gameType"][value="${size}"]`).checked = true;
      }
    } catch (e) {}
  }

  // ---------- Grids ----------
  function buildGrids() {
    const total = size * size;
    values = Array.from({ length: total }, (_, i) => values[i] || '');

    [yourGrid, mirrorGrid, flipGrid].forEach(g => {
      g.innerHTML = '';
      g.style.gridTemplateColumns = `repeat(${size}, auto)`;
    });

    for (let i = 0; i < total; i++) {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.inputMode = 'numeric';
      inp.autocomplete = 'off';
      inp.maxLength = 1;
      inp.className = 'cell' + (isDiag(i) ? ' diag' : '');
      inp.dataset.index = i;
      inp.setAttribute('aria-label', `Your number, row ${Math.floor(i / size) + 1}, column ${i % size + 1}`);
      inp.value = values[i];
      yourGrid.appendChild(inp);

      [mirrorGrid, flipGrid].forEach(g => {
        const d = document.createElement('div');
        d.className = 'cell derived' + (isDiag(i) ? ' diag' : '');
        d.dataset.index = i;
        g.appendChild(d);
      });
    }
    if (selected >= total) selected = 0;
    markSelected();
    refreshDerived();
  }

  function markSelected() {
    [...yourGrid.children].forEach((c, i) => c.classList.toggle('selected', i === selected));
  }

  function setCell(i, d) {
    values[i] = d;
    yourGrid.children[i].value = d;
    refreshDerived();
  }

  function refreshDerived() {
    const yourCells = yourGrid.children, mCells = mirrorGrid.children, fCells = flipGrid.children;
    values.forEach((v, i) => {
      const filled = v !== '';
      yourCells[i].classList.toggle('filled', filled);
      mCells[i].textContent = filled ? mirrorDigit(+v) : '';
      fCells[i].textContent = filled ? flipDigit(+v) : '';
      mCells[i].classList.toggle('filled', filled);
      fCells[i].classList.toggle('filled', filled);
    });
    save();
  }

  function focusCell(i) {
    const c = yourGrid.children[i];
    if (c) { selected = i; markSelected(); c.focus(); c.select(); }
  }

  // Typing fills the box you clicked and stays there — no auto-jumping.
  yourGrid.addEventListener('input', e => {
    const box = e.target, i = +box.dataset.index;
    const d = box.value.replace(/[^0-9]/g, '').slice(-1);
    setCell(i, d);
    box.select();
  });

  yourGrid.addEventListener('keydown', e => {
    const box = e.target, i = +box.dataset.index;
    if (!box.classList.contains('cell')) return;
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      setCell(i, '');
    } else if (e.key === 'ArrowRight') { e.preventDefault(); focusCell(Math.min(i + 1, values.length - 1)); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); focusCell(Math.max(i - 1, 0)); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (i + size < values.length) focusCell(i + size); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (i - size >= 0) focusCell(i - size); }
    else if (e.key === 'Enter') { e.preventDefault(); generateAll(); }
  });

  yourGrid.addEventListener('focusin', e => {
    if (!e.target.classList.contains('cell')) return;
    selected = +e.target.dataset.index;
    markSelected();
    e.target.select();
  });

  // On-screen keypad: fills the selected box, selection stays put.
  const keypad = $('keypad');
  keypad.addEventListener('mousedown', e => e.preventDefault()); // keep focus on the box
  keypad.addEventListener('click', e => {
    const k = e.target.dataset && e.target.dataset.k;
    if (k === undefined) return;
    setCell(selected, k === 'del' ? '' : k);
    markSelected();
  });

  yourGrid.addEventListener('paste', e => {
    const box = e.target, start = +box.dataset.index;
    const text = (e.clipboardData || window.clipboardData).getData('text') || '';
    const digits = text.replace(/[^0-9]/g, '').split('');
    if (!digits.length) return;
    e.preventDefault();
    let i = start;
    for (const d of digits) {
      if (i >= values.length) break;
      values[i] = d;
      yourGrid.children[i].value = d;
      i++;
    }
    refreshDerived();
    focusCell(start);
  });

  // ---------- True randomness ----------
  // Unbiased integer in [0, n) using the browser's cryptographic RNG.
  const rngBuf = new Uint32Array(1);
  function randInt(n) {
    const limit = Math.floor(0x100000000 / n) * n;
    let x;
    do { crypto.getRandomValues(rngBuf); x = rngBuf[0]; } while (x >= limit);
    return x % n;
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Every distinct ordered number that can be built from this chart's digits
  // (each cell used at most once).
  function allPossible(pool, length) {
    const counts = {};
    pool.forEach(d => counts[d] = (counts[d] || 0) + 1);
    const digits = Object.keys(counts);
    const out = [];
    (function walk(prefix) {
      if (prefix.length === length) { out.push(prefix); return; }
      for (const d of digits) {
        if (counts[d] > 0) { counts[d]--; walk(prefix + d); counts[d]++; }
      }
    })('');
    return out;
  }

  // Draw numbers at random straight from the chart's cells (without replacement
  // within a number), so digits that appear more often in the chart come up more.
  function generateFromChart(pool, length, target) {
    if (pool.length < length) return { list: [], possible: 0 };
    const possibleList = allPossible(pool, length);
    const want = Math.min(target, possibleList.length);
    const seen = new Set();
    const list = [];
    let tries = 0;
    while (list.length < want && tries < 60000) {
      tries++;
      const p = pool.slice();
      let s = '';
      for (let k = 0; k < length; k++) {
        const j = randInt(p.length);
        s += p[j];
        p[j] = p[p.length - 1];
        p.pop();
      }
      if (!seen.has(s)) { seen.add(s); list.push(s); }
    }
    if (list.length < want) {
      for (const s of shuffle(possibleList.filter(s => !seen.has(s)))) {
        if (list.length >= want) break;
        list.push(s);
      }
    }
    return { list, possible: possibleList.length };
  }

  // ---------- Grouping ----------
  // Numbers with the same digits in any order (068, 680, 806) share a group.
  function groupNumbers(list) {
    const map = new Map();
    list.forEach(n => {
      const key = n.split('').sort().join('');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(n);
    });
    const groups = [], singles = [];
    for (const [key, members] of map) {
      if (members.length > 1) groups.push({ key, members: members.sort() });
      else singles.push(members[0]);
    }
    groups.sort((a, b) => b.members.length - a.members.length || a.key.localeCompare(b.key));
    singles.sort();
    return { groups, singles };
  }

  // ---------- Rendering ----------
  function renderColumn(chart, res, length) {
    let html = `<div class="panel col">
      <div class="col-head">
        <h3>${chart.title}<span class="count">${res.list.length}</span></h3>
        <button class="small" data-copy="${chart.key}">Copy</button>
      </div>`;

    if (!res.list.length) {
      html += `<div class="empty">Need at least ${length} numbers in this chart.</div></div>`;
      return html;
    }

    const { groups, singles } = groupNumbers(res.list);
    const groupedCount = groups.reduce((s, g) => s + g.members.length, 0);
    let stats = `${groups.length} color group${groups.length === 1 ? '' : 's'} (${groupedCount}) · ${singles.length} single${singles.length === 1 ? '' : 's'}`;
    if (res.possible < PER_CHART) stats += ` · only ${res.possible} possible`;
    html += `<div class="col-stats">${stats}</div>`;

    let delay = 0;
    const chip = n => `<span class="chip" style="animation-delay:${(delay++ * 12)}ms">${n}</span>`;

    groups.forEach((g, i) => {
      html += `<div class="grp" style="--g:${colorFor(i)}">
        <div class="grp-h"><span class="dot"></span><b>${g.key.split('').join(' ')}</b> × ${g.members.length}</div>
        <div class="chips">${g.members.map(chip).join('')}</div>
      </div>`;
    });

    if (singles.length) {
      html += `<div class="singles"><div class="lbl">Singles</div><div class="chips">${singles.map(chip).join('')}</div></div>`;
    }
    html += '</div>';
    return html;
  }

  function generateAll() {
    const length = size === 3 ? 3 : 4;
    const out = $('results');
    const yourDigits = values.filter(v => v !== '').map(Number);

    if (!yourDigits.length) {
      out.innerHTML = `<div class="panel placeholder">Enter some numbers in <strong>Your Numbers</strong> first.</div>`;
      return;
    }

    lastResults = {};
    let total = 0;
    let cols = '';
    CHARTS.forEach(chart => {
      const pool = yourDigits.map(chart.fn).map(String);
      const res = generateFromChart(pool, length, PER_CHART);
      lastResults[chart.key] = { title: chart.title, ...res };
      total += res.list.length;
      cols += renderColumn(chart, res, length);
    });

    const label = length === 3 ? 'Pick Three' : 'Pick Four';
    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    out.innerHTML = `
      <div class="results-head">
        <h2>${label} Results</h2>
        <span class="meta">${total} numbers · generated ${time}</span>
      </div>
      <div class="results">${cols}</div>`;
    $('generateBtn').textContent = 'Generate Again';
  }

  // ---------- Copy ----------
  function chartText(key) {
    const r = lastResults && lastResults[key];
    if (!r || !r.list.length) return '';
    const { groups, singles } = groupNumbers(r.list);
    const lines = [`${r.title} (${r.list.length})`];
    groups.forEach(g => lines.push(g.members.join('  ')));
    if (singles.length) lines.push(singles.join('  '));
    return lines.join('\n');
  }
  async function copyText(text, msg) {
    if (!text) { toast('Generate numbers first'); return; }
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch (e) { toast('Copy was blocked by the browser'); }
  }
  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  }

  $('results').addEventListener('click', e => {
    const key = e.target.dataset && e.target.dataset.copy;
    if (key) copyText(chartText(key), 'Copied');
  });
  $('copyAllBtn').addEventListener('click', () => {
    const text = CHARTS.map(c => chartText(c.key)).filter(Boolean).join('\n\n');
    copyText(text, 'All 3 lists copied');
  });

  // ---------- Controls ----------
  $('generateBtn').addEventListener('click', generateAll);
  $('clearBtn').addEventListener('click', () => {
    values = values.map(() => '');
    [...yourGrid.children].forEach(c => c.value = '');
    refreshDerived();
    lastResults = null;
    $('generateBtn').textContent = 'Generate 120 Numbers';
    $('results').innerHTML = `<div class="panel placeholder">Fill in <strong>Your Numbers</strong>, then hit <strong>Generate</strong>.</div>`;
    focusCell(0);
  });
  document.querySelectorAll('input[name="gameType"]').forEach(r => {
    r.addEventListener('change', () => {
      size = +document.querySelector('input[name="gameType"]:checked').value;
      buildGrids();
      if (lastResults) generateAll();
    });
  });

  load();
  buildGrids();
})();
