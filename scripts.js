// Mirror pairs: 0<->5, 1<->6, 2<->7, 3<->8, 4<->9
function mirrorDigit(value) {
    const n = parseInt(value, 10);
    if (isNaN(n)) return '';
    return String((n + 5) % 10);
}

// Flip pairs: 0->3, 1->4, 2->5, 3->6, 4->7, 5->8, 6->9, 7->0, 8->1, 9->2
function flipDigit(value) {
    const n = parseInt(value, 10);
    if (isNaN(n)) return '';
    return String((n + 3) % 10);
}

function getSize() {
    const selected = document.querySelector('input[name="gameType"]:checked');
    return parseInt(selected.value, 10);
}

// Builds a fresh input, mirror, and flip grid for the chosen mode
function buildGrids() {
    const size = getSize();
    const inputGrid = document.getElementById('inputGrid');
    const mirrorGrid = document.getElementById('mirrorGrid');
    const flipGrid = document.getElementById('flipGrid');

    [inputGrid, mirrorGrid, flipGrid].forEach(grid => {
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${size}, 56px)`;
    });

    for (let i = 0; i < size * size; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.maxLength = 1;
        input.className = 'cell';
        input.dataset.index = i;
        input.addEventListener('input', onInputChange);
        inputGrid.appendChild(input);

        const mirror = document.createElement('input');
        mirror.type = 'text';
        mirror.readOnly = true;
        mirror.tabIndex = -1;
        mirror.className = 'cell mirror';
        mirror.dataset.index = i;
        mirrorGrid.appendChild(mirror);

        const flip = document.createElement('input');
        flip.type = 'text';
        flip.readOnly = true;
        flip.tabIndex = -1;
        flip.className = 'cell mirror';
        flip.dataset.index = i;
        flipGrid.appendChild(flip);
    }

    document.getElementById('results').innerHTML = '';
}

// Keeps only a single digit 0-9 and updates the mirror and flip boxes in the same position
function onInputChange(event) {
    const box = event.target;
    box.value = box.value.replace(/[^0-9]/g, '').slice(0, 1);

    const index = box.dataset.index;
    document.querySelector(`#mirrorGrid .cell[data-index="${index}"]`).value = mirrorDigit(box.value);
    document.querySelector(`#flipGrid .cell[data-index="${index}"]`).value = flipDigit(box.value);
}

// Reads the digits that are actually typed into one chart
function getChartDigits(gridId) {
    return Array.from(document.querySelectorAll(`#${gridId} .cell`))
        .map(cell => cell.value)
        .filter(value => value !== '')
        .map(value => parseInt(value, 10));
}

// Builds combinations using ONLY the digits in this chart.
// A digit can never be used more times than it appears in the chart.
// Results are ranked by how often their digits appear in the chart, and the top 40 are returned.
function buildCombinations(digits, length) {
    const counts = {};
    digits.forEach(d => counts[d] = (counts[d] || 0) + 1);

    const uniqueDigits = Object.keys(counts).map(Number).sort((a, b) => a - b);
    const remaining = { ...counts };
    const current = [];
    const all = [];

    function walk() {
        if (current.length === length) {
            const score = current.reduce((sum, d) => sum + counts[d], 0);
            all.push({ combo: current.slice(), score: score });
            return;
        }
        for (const d of uniqueDigits) {
            if (remaining[d] > 0) {
                remaining[d]--;
                current.push(d);
                walk();
                current.pop();
                remaining[d]++;
            }
        }
    }

    if (uniqueDigits.length > 0) {
        walk();
    }

    all.sort((a, b) =>
        b.score - a.score || a.combo.join('').localeCompare(b.combo.join(''))
    );

    return all.slice(0, 40).map(item => item.combo);
}

// Renders one chart's results as its own section
function renderChartSection(title, combos) {
    let html = `<h3>${title} (${combos.length})</h3>`;
    if (combos.length === 0) {
        html += '<p class="message">No numbers in this chart yet.</p>';
        return html;
    }
    combos.forEach(combo => {
        html += `<p>${combo.join(' ')}</p>`;
    });
    return html;
}

function showResults(length) {
    const results = document.getElementById('results');
    const gameLabel = length === 3 ? 'Pick Three' : 'Pick Four';

    const inputDigits = getChartDigits('inputGrid');
    const mirrorDigits = getChartDigits('mirrorGrid');
    const flipDigits = getChartDigits('flipGrid');

    if (inputDigits.length === 0 && mirrorDigits.length === 0 && flipDigits.length === 0) {
        results.innerHTML = '<p class="message">Enter some numbers in the grid first.</p>';
        return;
    }

    let html = `<h2>${gameLabel} Results</h2>`;
    html += renderChartSection('Your Numbers', buildCombinations(inputDigits, length));
    html += renderChartSection('Mirror Numbers', buildCombinations(mirrorDigits, length));
    html += renderChartSection('Flip Numbers', buildCombinations(flipDigits, length));
    results.innerHTML = html;
}

// Resets all grids to empty and clears the results
function clearAll() {
    document.querySelectorAll('#inputGrid .cell, #mirrorGrid .cell, #flipGrid .cell')
        .forEach(cell => cell.value = '');
    document.getElementById('results').innerHTML = '';
}

document.getElementById('generateBtn').addEventListener('click', () => {
    showResults(getSize());
});

document.getElementById('clearTopBtn').addEventListener('click', clearAll);
document.getElementById('clearBottomBtn').addEventListener('click', clearAll);

document.querySelectorAll('input[name="gameType"]').forEach(radio => {
    radio.addEventListener('change', buildGrids);
});

buildGrids();

// Service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}
