/* ══════════════════════════════════════
   Luminos · products.js
   Product catalog + rendering
══════════════════════════════════════ */

const PRODUCTS = [
  {
    id: 'p001',
    name: 'Obsidian Desk Mat',
    price: 2999,
    category: 'Desk',
    badge: 'Best Seller',
    image: 'src/assets/Obsidian-Desk-Mat.png',
    description: 'Ultra-smooth XXL desk mat in deep obsidian leather. Non-slip base, stitched edges, built for long sessions.',
    rating: 4.9,
    reviews: 312,
  },
  {
    id: 'p002',
    name: 'Aether Wireless Charger',
    price: 2099,
    category: 'Charging',
    badge: 'New',
    image: 'src/assets/Aether-Wireless-Charger.jpg',
    description: '15W MagSafe-compatible wireless charger. Whisper-quiet, 8mm thin, charges through most cases.',
    rating: 4.7,
    reviews: 189,
  },
  {
    id: 'p003',
    name: 'Noir Cable Organiser',
    price: 1199,
    category: 'Organisation',
    badge: null,
    image: 'src/assets/Noir-Cable-Organiser.jpeg',
    description: 'Magnetic silicone cable clips that actually stay put. Set of 6 in matte black.',
    rating: 4.6,
    reviews: 94,
  },
  {
    id: 'p004',
    name: 'Lumen Monitor Light',
    price: 3599,
    category: 'Lighting',
    badge: 'Popular',
    image: 'src/assets/Lumen-Monitor-Light.jpg',
    description: 'Screen-mounted LED bar with auto-brightness. Zero screen glare, USB-C powered, touch dimmer wheel.',
    rating: 4.8,
    reviews: 427,
  },
  {
    id: 'p005',
    name: 'Slate Laptop Stand',
    price: 2699,
    category: 'Desk',
    badge: null,
    image: 'src/assets/Slate-Laptop-Stand.jpeg',
    description: 'Machined aluminium stand. 6 height presets, folds flat in seconds, compatible with 10–17\" laptops.',
    rating: 4.7,
    reviews: 215,
  },
  {
    id: 'p006',
    name: 'Hush Noise-Cancelling Pods',
    price: 5399,
    category: 'Audio',
    badge: "Editor's Pick",
    image: 'src/assets/Hush-Noise-Cancelling-Pods.jpg',
    description: 'Hybrid ANC earbuds with 32hr battery. Spatial audio, transparency mode, IPX5 waterproof.',
    rating: 4.9,
    reviews: 561,
  },
  {
    id: 'p007',
    name: 'Phantom Wrist Rest',
    price: 1499,
    category: 'Desk',
    badge: null,
    image: 'src/assets/Phantom-Wrist-Rest.jpg',
    description: 'Memory foam wrist rest with premium velvet cover. Reduces strain during long typing sessions.',
    rating: 4.5,
    reviews: 143,
  },
  {
    id: 'p008',
    name: 'Arc USB-C Hub',
    price: 3899,
    category: 'Connectivity',
    badge: 'New',
    image: 'src/assets/Arc-USB-C-Hub.webp',
    description: '9-in-1 hub: 4K HDMI, 100W PD, SD/microSD, 3x USB-A, USB-C, 3.5mm. Aluminium shell.',
    rating: 4.8,
    reviews: 308,
  },
];

const CATEGORIES = ['All', ...new Set(PRODUCTS.map(p => p.category))];

let activeCategory = 'All';

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) html += '<i class="fa-solid fa-star"></i>';
    else if (i === full && half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    else html += '<i class="fa-regular fa-star"></i>';
  }
  return html;
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (products.length === 0) {
    grid.innerHTML = '<p class="no-products">No products found in this category.</p>';
    return;
  }
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      <div class="product-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span class="rating-count">${p.rating} (${p.reviews})</span>
        </div>
        <div class="product-footer">
          <span class="product-price">&#8369;${p.price.toLocaleString()}</span>
          <button class="btn-add-cart" onclick="handleAddToCart('${p.id}')">
            <i class="fa-solid fa-bag-shopping"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function handleAddToCart(productId) {
  window.location.href = 'src/login.html';
}

function filterProducts(category) {
  activeCategory = category;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  const filtered = category === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === category);
  renderProducts(filtered);
}

function initProductFilters() {
  const filterBar = document.getElementById('filter-bar');
  if (!filterBar) return;
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === 'All' ? ' active' : '');
    btn.dataset.category = cat;
    btn.textContent = cat;
    btn.onclick = () => filterProducts(cat);
    filterBar.appendChild(btn);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProductFilters();
  renderProducts(PRODUCTS);
});
