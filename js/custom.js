const API_BASE_URL = 'http://localhost:8092/rest/api/v1/catalogues';

let slideIndex = 0;
let slideInterval;

document.addEventListener('DOMContentLoaded', () => {
  initSlideshow();
  loadCategories();
  loadAllProducts();
});

/**
 * Auto 5-second Slideshow Logic
 */
function initSlideshow() {
  showSlide(slideIndex);
  slideInterval = setInterval(() => {
    slideIndex++;
    showSlide(slideIndex);
  }, 5000); // 5 Seconds
}

function showSlide(index) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  if (slides.length === 0) return;

  if (index >= slides.length) slideIndex = 0;
  if (index < 0) slideIndex = slides.length - 1;

  slides.forEach(slide => slide.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));

  slides[slideIndex].classList.add('active');
  if (dots[slideIndex]) dots[slideIndex].classList.add('active');
}

function currentSlide(index) {
  clearInterval(slideInterval);
  slideIndex = index;
  showSlide(slideIndex);
  slideInterval = setInterval(() => {
    slideIndex++;
    showSlide(slideIndex);
  }, 5000);
}

/**
 * Load Categories and build Main Parent -> 5 Subcategory Dropdowns
 */
async function loadCategories() {
  const container = document.getElementById('categoryDropdowns');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to load categories');

    const categories = await response.json();

    const getParentId = (cat) => {
      if (cat.parentId !== undefined && cat.parentId !== null) return Number(cat.parentId);
      if (cat.parent_id !== undefined && cat.parent_id !== null) return Number(cat.parent_id);
      if (cat.parent && cat.parent.id !== undefined && cat.parent.id !== null) return Number(cat.parent.id);
      return 0;
    };

    const mainCategories = categories.filter(cat => getParentId(cat) === 0 || [1, 2, 3].includes(Number(cat.id)));
    container.innerHTML = '';

    mainCategories.forEach(parent => {
      const parentIdNum = Number(parent.id);
      const subcategories = categories.filter(c => getParentId(c) === parentIdNum && Number(c.id) !== parentIdNum);

      const navDropdown = document.createElement('div');
      navDropdown.className = 'nav-dropdown';

      const parentBtn = document.createElement('button');
      parentBtn.className = 'dropdown-btn';
      parentBtn.innerHTML = `${parent.name} <span class="arrow">▾</span>`;

      navDropdown.appendChild(parentBtn);

      if (subcategories.length > 0) {
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu';

        subcategories.forEach(sub => {
          const subItem = document.createElement('a');
          subItem.href = '#';
          subItem.textContent = sub.name;
          subItem.onclick = (e) => {
            e.preventDefault();
            filterByCategory(sub.id, sub.name);
          };
          dropdownMenu.appendChild(subItem);
        });

        navDropdown.appendChild(dropdownMenu);

        parentBtn.onclick = (e) => {
          e.stopPropagation();
          filterByCategory(parent.id, parent.name);
        };
      }

      container.appendChild(navDropdown);
    });

  } catch (err) {
    console.error('Error fetching categories:', err);
    container.innerHTML = '<span style="color:#dc3545; font-size:0.85rem;">Failed to load categories</span>';
  }
}

/**
 * Fetch All Products
 */
async function loadAllProducts() {
  const title = document.getElementById('sectionTitle');
  if (title) title.textContent = 'All Products';

  const grid = document.getElementById('productGrid');
  if (!grid) return;

  grid.innerHTML = '<p class="status-msg">Loading products...</p>';

  try {
    const response = await fetch(`${API_BASE_URL}/viewall`);
    if (!response.ok) throw new Error('Failed to fetch products');

    const products = await response.json();
    renderProducts(products);
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p class="status-msg error">Unable to connect to backend server on port 8092.</p>';
  }
}

/**
 * Filter Products by Selected Category / Subcategory
 */
async function filterByCategory(categoryId, categoryName) {
  const title = document.getElementById('sectionTitle');
  if (title) title.textContent = categoryName;

  const grid = document.getElementById('productGrid');
  if (!grid) return;

  grid.innerHTML = `<p class="status-msg">Loading ${categoryName}...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products`);
    if (!response.ok) throw new Error('Failed to load category products');

    const products = await response.json();
    renderProducts(products);
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p class="status-msg error">Failed to load products for this category.</p>';
  }
}

/**
 * Render Product Cards into HTML Grid
 */
function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  if (!products || products.length === 0) {
    grid.innerHTML = '<p class="status-msg">No products available in this category.</p>';
    return;
  }

  grid.innerHTML = products.map(product => {
    const rawImageUrl = product.imageUrl || product.image_url;
    const imageSrc = rawImageUrl || 'https://via.placeholder.com/400?text=No+Image';
    const displayPrice = (product.price !== null && product.price !== undefined) 
      ? `₹${Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
      : '₹499.00';

    return `
      <div class="product-card">
        <div>
          <div class="img-container">
            <img src="${imageSrc}" alt="${product.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/400?text=Image+Unavailable';" />
          </div>
          <span class="brand">${product.brand || 'Generic'}</span>
          <h4 title="${product.name}">${product.name}</h4>
          <p>${product.description || 'No description available.'}</p>
        </div>
        <div>
          <div class="price">${displayPrice}</div>
          <button class="btn-add">View Details</button>
        </div>
      </div>
    `;
  }).join('');
}