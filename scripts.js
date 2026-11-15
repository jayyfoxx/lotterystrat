// Mirror pairs: 0<->5, 1<->6, 2<->7, 3<->8, 4<->9
function mirrorDigit(value) {
    const n = parseInt(value, 10);
    if (isNaN(n)) return '';
    return String((n + 5) % 10);
}

function getSize() {
    const selected = document.querySelector('input[name="gameType"]:checked');
    return parseInt(selected.value, 10);
}

// Builds a fresh input grid and matching mirror grid for the chosen mode
function buildGrids() {
    const size = getSize();
    const inputGrid = document.getElementById('inputGrid');
    const mirrorGrid = document.getElementById('mirrorGrid');

    inputGrid.innerHTML = '';
    mirrorGrid.innerHTML = '';
    inputGrid.style.gridTemplateColumns = `repeat(${size}, 56px)`;
    mirrorGrid.style.gridTemplateColumns = `repeat(${size}, 56px)`;

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
    }

    document.getElementById('results').innerHTML = '';
}

// Keeps only a single digit 0-9 and updates the mirror box in the same position
function onInputChange(event) {
    const box = event.target;
    box.value = box.value.replace(/[^0-9]/g, '').slice(0, 1);

    const index = box.dataset.index;
    const mirrorBox = document.querySelector(`#mirrorGrid .cell[data-index="${index}"]`);
    mirrorBox.value = mirrorDigit(box.value);
}

function getEnteredDigits() {
    return Array.from(document.querySelectorAll('#inputGrid .cell'))
        .map(input => input.value)
        .filter(value => value !== '')
        .map(value => parseInt(value, 10));
}

// Ranks entered digits by how often they appear, then builds combinations
function buildCombinations(length) {
    const digits = getEnteredDigits();
    const counts = {};
    digits.forEach(d => counts[d] = (counts[d] || 0) + 1);

    const ranked = Object.keys(counts)
        .map(Number)
        .sort((a, b) => counts[b] - counts[a] || a - b);

    const combos = [];
    for (let i = 0; i < 20 && ranked.length > 0; i++) {
        const combo = [];
        for (let j = 0; j < length; j++) {
            combo.push(ranked[(i + j) % ranked.length]);
        }
        combos.push(combo);
    }
    return combos;
}

function showResults(length) {
    const results = document.getElementById('results');
    const label = length === 3 ? 'Pick Three' : 'Pick Four';

    if (getEnteredDigits().length === 0) {
        results.innerHTML = '<p class="message">Enter some numbers in the grid first.</p>';
        return;
    }

    const combos = buildCombinations(length);
    let html = `<h3>${label} Combinations</h3>`;
    combos.forEach(combo => {
        const line = combo.join(' ');
        const mirrored = combo.map(d => mirrorDigit(d)).join(' ');
        html += `<p>${line}   |   <span class="mirror-text">Mirror: ${mirrored}</span></p>`;
    });
    results.innerHTML = html;
}

document.getElementById('generateBtn').addEventListener('click', () => {
    showResults(getSize());
});

document.querySelectorAll('input[name="gameType"]').forEach(radio => {
    radio.addEventListener('change', buildGrids);
});

buildGrids();

// Service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.error('Service Worker failed:', err));
    });
}
