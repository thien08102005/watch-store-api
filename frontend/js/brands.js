const brands = [
    { name: 'Movado', slug: 'Movado' },
    { name: 'Bering', slug: 'Bering' },
    { name: 'Omega', slug: 'Omega' },
    { name: 'Tissot', slug: 'Tissot' },
    { name: 'Citizen', slug: 'Citizen' },
    { name: 'Longines', slug: 'Longines' },
    { name: 'Enicar', slug: 'Enicar' },
    { name: 'Gucci', slug: 'Gucci' },
    { name: 'Mido', slug: 'Mido' },
    { name: 'Alfex', slug: 'Alfex' },
    { name: 'Grovana', slug: 'Grovana' },
    { name: 'Rado', slug: 'Rado' },
    { name: 'Tommy Hilfiger', slug: 'Tommy%20Hilfiger' },
    { name: 'Lacoste', slug: 'Lacoste' },
    { name: 'Bulova', slug: 'Bulova' },
    { name: 'Caravelle', slug: 'Caravelle' },
    { name: 'Calvin Klein', slug: 'Calvin%20Klein' },
    { name: 'Seiko', slug: 'Seiko' },
    { name: 'Casio', slug: 'Casio' },
    { name: 'Scuderia Ferrari', slug: 'Scuderia%20Ferrari' },
    { name: 'Raymond Weil', slug: 'Raymond%20Weil' },
    { name: 'Coach', slug: 'Coach' }
];

window.brands = brands;

function createTextLogo(name) {
    const escapedText = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="240" height="60"><style>text{font-family:Arial,sans-serif;font-size:20px;font-weight:700;fill:#111;}</style><rect width="100%" height="100%" fill="transparent"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">${escapedText}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderBrands() {
    const container = document.getElementById('brand-list');
    if (!container) return;

    container.innerHTML = brands.map(b => `
        <a class="brand-card" href="products.html?brand=${b.slug}">
            <div class="brand-logo"><img src="${createTextLogo(b.name)}" alt="${b.name}"></div>
        </a>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderBrands();
});
