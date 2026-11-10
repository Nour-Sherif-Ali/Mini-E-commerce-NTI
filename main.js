const PRODUCTS_URL = 'https://fakestoreapi.com/products';
let products = [];

const pageSize = 6;
const cart = new Map();
let currentPage = 1;
let activeFilters = { search: '', category: 'electronics', min: null, max: null };
let selectedProduct = null;

const byId = (id) => document.getElementById(id);
const money = (value) => `$${Number(value).toFixed(2)}`;
const cardPrice = (value) => `$${Number(value).toString()}`;

function filteredProducts() {
  const result = products.filter((product) => {
    if (activeFilters.category !== 'all' && product.category !== activeFilters.category) return false;
    if (!product.title.toLowerCase().includes(activeFilters.search)) return false;
    if (activeFilters.min !== null && product.price < activeFilters.min) return false;
    if (activeFilters.max !== null && product.price > activeFilters.max) return false;
    return true;
  });

  const sort = byId('sort').value;
  if (sort === 'asc') result.sort((a, b) => a.price - b.price);
  if (sort === 'desc') result.sort((a, b) => b.price - a.price);
  return result;
}

function makeButton(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function renderProducts() {
  const visible = filteredProducts();
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  currentPage = Math.min(currentPage, pageCount);
  const grid = byId('products');
  grid.replaceChildren();

  if (!visible.length) {
    const message = document.createElement('p');
    message.className = 'no-results';
    message.textContent = 'No products found.';
    grid.append(message);
  }

  visible.slice((currentPage - 1) * pageSize, currentPage * pageSize).forEach((product) => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.title;
    image.loading = 'lazy';

    const title = document.createElement('h3');
    title.textContent = product.title;
    const price = document.createElement('p');
    price.className = 'product-price';
    price.textContent = cardPrice(product.price);

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    actions.append(
      makeButton('Add to Cart', 'blue-button', () => addToCart(product)),
      makeButton('Details', 'blue-button', () => showDetails(product))
    );
    card.append(image, title, price, actions);
    grid.append(card);
  });

  const pages = byId('page-numbers');
  pages.replaceChildren();
  for (let page = 1; page <= pageCount; page += 1) {
    const button = makeButton(String(page), '', () => {
      currentPage = page;
      renderProducts();
    });
    if (page === currentPage) button.setAttribute('aria-current', 'page');
    pages.append(button);
  }
  byId('previous').disabled = currentPage === 1;
  byId('next').disabled = currentPage === pageCount;
  byId('page-info').textContent = `Page ${currentPage} of ${pageCount}`;
}

function addToCart(product) {
  cart.set(product.id, (cart.get(product.id) || 0) + 1);
  renderCart();
}

function renderCart() {
  const container = byId('cart-items');
  container.replaceChildren();
  let quantity = 0;
  let total = 0;

  if (cart.size === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-cart';
    empty.textContent = 'Your cart is empty.';
    container.append(empty);
  } else {
    const list = document.createElement('ul');
    list.className = 'cart-list';
    for (const [id, count] of cart) {
      const product = products.find((item) => item.id === id);
      quantity += count;
      total += product.price * count;
      const item = document.createElement('li');
      item.append(document.createTextNode(`${product.title} - ${money(product.price)} ${count} `));
      item.append(makeButton('Remove', '', () => {
        if (count === 1) cart.delete(id);
        else cart.set(id, count - 1);
        renderCart();
      }));
      list.append(item);
    }
    container.append(list);
  }

  byId('total-quantity').textContent = quantity;
  byId('total-price').textContent = money(total);
}

function showDetails(product) {
  selectedProduct = product;
  byId('details-image').src = product.image;
  byId('details-image').alt = product.title;
  byId('details-category').textContent = product.category;
  byId('details-title').textContent = product.title;
  byId('details-price').textContent = money(product.price);
  byId('details-description').textContent = product.description;
  byId('details-dialog').showModal();
}

byId('filters').addEventListener('submit', (event) => {
  event.preventDefault();
  const min = byId('min-price').value;
  const max = byId('max-price').value;
  activeFilters = {
    search: byId('search').value.trim().toLowerCase(),
    category: byId('category').value,
    min: min === '' ? null : Number(min),
    max: max === '' ? null : Number(max)
  };
  currentPage = 1;
  renderProducts();
});
byId('sort').addEventListener('change', () => { currentPage = 1; renderProducts(); });
byId('previous').addEventListener('click', () => { currentPage -= 1; renderProducts(); });
byId('next').addEventListener('click', () => { currentPage += 1; renderProducts(); });
byId('close-details').addEventListener('click', () => byId('details-dialog').close());
byId('details-add').addEventListener('click', () => { if (selectedProduct) addToCart(selectedProduct); });
byId('details-dialog').addEventListener('click', (event) => {
  if (event.target === byId('details-dialog')) byId('details-dialog').close();
});

async function loadProducts() {
  const grid = byId('products');
  grid.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'no-results';
  loading.textContent = 'Loading products...';
  grid.append(loading);

  try {
    const response = await fetch(PRODUCTS_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid product data');
    products = data;
    renderProducts();
  } catch (error) {
    grid.replaceChildren();
    const message = document.createElement('p');
    message.className = 'no-results';
    message.textContent = 'Could not load products. Please try again.';
    const retry = makeButton('Retry', 'blue-button', loadProducts);
    message.append(document.createElement('br'), retry);
    grid.append(message);
    console.error('Failed to load products:', error);
  }
}

renderCart();
loadProducts();
