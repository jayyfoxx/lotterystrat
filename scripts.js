// Existing functions (mirrorDigit, flipDigit, getSize, buildGrids, onInputChange, getChartDigits, buildCombinations) remain unchanged

function buildColumn(title, combos) {
    // Colors for repeated groups
    const palette = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FFD700', '#FF8C00', '#8A2BE2', '#00CED1', '#FF4500', '#ADFF2F'];
    const groupCounts = {};
    const groupColorMap = {};
    let colorIndex = 0;

    // First pass: Count how often each group of digits appears
    combos.forEach(combo => {
        const groupKey = [...combo].sort((a, b) => a - b).join('');
        groupCounts[groupKey] = (groupCounts[groupKey] || 0) + 1;
    });

    let html = `<div class="result-column" style="padding: 10px; margin-bottom: 10px;"><h3>${title}</h3>`;
    const groupedSections = {};

    // Second pass: Build HTML for each group with assigned colors
    combos.forEach(combo => {
        const groupKey = [...combo].sort((a, b) => a - b).join('');
        
        if (groupCounts[groupKey] > 1) {
            // Assign a color if it's a repeat and doesn't have one yet
            if (!groupColorMap[groupKey]) {
                groupColorMap[groupKey] = palette[colorIndex % palette.length];
                colorIndex++;
            }
            const color = groupColorMap[groupKey];
            const groupHtml = `<div style="background-color: ${color}; padding: 5px; margin-bottom: 5px;">${combo.join(' ')}</div>`;

            if (!groupedSections[color]) {
                groupedSections[color] = [];
            }
            groupedSections[color].push(groupHtml);
        } else {
            groupedSections['white'] = groupedSections['white'] || [];
            groupedSections['white'].push(`<div>${combo.join(' ')}</div>`);
        }
    });

    // Render grouped sections
    for (const color in groupedSections) {
        if (groupedSections[color].length > 0) {
            html += `<div style="border-left: 5px solid ${color}; margin-bottom: 10px;">`;
            groupedSections[color].forEach(sectionHtml => {
                html += sectionHtml;
            });
            html += '</div>';
        }
    }
    html += '</div>';
    return html;
}

// Remaining functions (showResults, clearAll, event listeners) remain unchanged

// Initialize the application
buildGrids();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}
