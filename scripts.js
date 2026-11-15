// Mirror numbers: 0<->5, 1<->6, 2<->7, 3<->8, 4<->9
function mirrorNumber(num) {
    const n = parseInt(num, 10);
    if (isNaN(n)) return '';
    return String((n + 5) % 10);
}

// Fills the right grid with the mirror of every left-grid value
function generateMirrorNumbers() {
    const inputs = Array.from(document.querySelectorAll('#inputGrid .numberInput'));
    const mirrorInputs = Array.from(document.querySelectorAll('#mirrorGrid .numberInput'));

    mirrorInputs.forEach((box, index) => {
        box.value = mirrorNumber(inputs[index].value);
    });
}

// Returns the list of digits entered in the left grid, in reading order
function getInputDigits() {
    return Array.from(document.querySelectorAll('#inputGrid .numberInput'))
        .map(input => input.value)
        .filter(value => value !== '');
}

// Builds the most common combinations from the entered digits
function generateCombinations(length) {
    const digits = getInputDigits().map(d => parseInt(d, 10));
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

// Shows the mirrored version of each generated combination
function mirrorCombinations(results) {
    return results.map(line =>
        line.split(' ').map(d => mirrorNumber(d)).join(' ')
    );
}

function updateResults(results, mirrored, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const title = document.createElement('h3');
    title.textContent = 'Generated Numbers';
    container.appendChild(title);

    results.forEach((line, i) => {
        const p = document.createElement('p');
        p.textContent = `${line}   |   Mirror: ${mirrored[i]}`;
        container.appendChild(p);
    });
}

function generatePickThree() {
    generateMirrorNumbers();
    const results = generateCombinations(3);
    updateResults(results, mirrorCombinations(results), 'pickThreeResults');
}

function generatePickFour() {
    generateMirrorNumbers();
    const results = generateCombinations(4);
    updateResults(results, mirrorCombinations(results), 'pickFourResults');
}

// Keep the mirror grid updated as soon as a left-grid value changes
document.querySelectorAll('#inputGrid .numberInput').forEach(input => {
    input.addEventListener('input', generateMirrorNumbers);
});
