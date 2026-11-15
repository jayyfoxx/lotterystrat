// Mirror numbers: 0<->5, 1<->6, 2<->7, 3<->8, 4<->9
function mirrorNumber(num) {
    const n = parseInt(num, 10);
    if (isNaN(n)) return '';
    return String((n + 5) % 10);
}

function generateMirrorNumbers(inputSize) {
    const inputs = Array.from(document.querySelectorAll(`#inputGrid .numberInput`));
    const mirrorInputs = Array.from(document.querySelectorAll(`#mirrorGrid .numberInput`));

    mirrorInputs.forEach((box, index) => {
        box.value = mirrorNumber(inputs[index].value);
    });
}

function getInputDigits(size) {
    const inputs = Array.from(document.querySelectorAll(`#inputGrid .numberInput`));
    return inputs.slice(0, size * size).map(input => input.value).filter(value => value !== '');
}

function generateCombinations(length) {
    const digits = getInputDigits(length).map(d => parseInt(d, 10));
    const counts = {};
    digits.forEach(d => counts[d] = (counts[d] || 0) + 1);

    const ranked = Object.keys(counts)
        .map(Number)
        .sort((a, b) => counts[b] - counts[a] || a - b);

    const results = [];
    for (let i = 0; i < 20 && ranked.length > 0; i++) {
        const combo = [];
        for (let j = 0; j < length; j++) {
            combo.push(ranked[(i + j) % ranked.length]);
        }
        results.push(combo.join(' '));
    }
    return results;
}

function mirrorCombinations(results) {
    return results.map(line =>
        line.split(' ').map(d => mirrorNumber(d)).join(' ')
    );
}

function updateResults(results, mirrored, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<h3>Generated Numbers</h3>';
    results.forEach((line, i) => {
        const p = document.createElement('p');
        p.textContent = `${line}   |   Mirror: ${mirrored[i]}`;
        container.appendChild(p);
    });
}

function generateNumbers() {
    const gameType = document.querySelector('input[name="gameType"]:checked').value;
    const size = gameType === 'pick3' ? 3 : 4;

    generateMirrorNumbers(size * size);
    const results = generateCombinations(size);
    updateResults(results, mirrorCombinations(results), 'generatedResults');
}

function toggleGrids() {
    const gameType = document.querySelector('input[name="gameType"]:checked').value;
    const size = gameType === 'pick3' ? 3 : 4;
    const inputContainer = document.getElementById('inputNumbers');
    const mirrorContainer = document.getElementById('mirrorNumbers');

    inputContainer.innerHTML = '';
    mirrorContainer.innerHTML = '';

    for (let i = 0; i < size * size; i++) {
        inputContainer.insertAdjacentHTML('beforeend', '<input type="number" min="0" max="9" class="numberInput" style="width: 50px;" />');
    }
    for (let i = 0; i < size * size; i++) {
        mirrorContainer.insertAdjacentHTML('beforeend', '<input type="text" readonly class="numberInput" style="width: 50px;" />');
    }

    document.querySelectorAll('#inputGrid .numberInput').forEach(input => {
        input.addEventListener('input', () => generateMirrorNumbers(size * size));
    });
}

// Initialize grids
toggleGrids();

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
        }).catch(error => {
            console.error('Service Worker registration failed:', error);
        });
    });
}
