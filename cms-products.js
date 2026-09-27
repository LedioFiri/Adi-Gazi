(() => {
  'use strict';

  const API_BASE = 'https://mobileri-gazi-cms.mobilerigaziadi900.workers.dev/api';
  const listingGrid = document.getElementById('productListingGrid');
  const listingStatus = document.getElementById('cmsProductsStatus');
  const listingHeading = listingGrid?.parentElement?.querySelector('h2');
  const categoryNavigation = document.getElementById('cmsCategoryNavigation');
  const categoryShortcuts = document.getElementById('cmsCategoryShortcuts');
  const categoryGrid = document.getElementById('cmsCategoryGrid');
  const staticCards = listingGrid ? Array.from(listingGrid.children).filter((card) => card.matches('a.product-card')) : [];
  const originalListingHeading = listingHeading?.textContent.trim() || '';
  const requestedCategory = new URLSearchParams(window.location.search).get('category')?.trim().toLowerCase() || '';
  const categoryPage = getCategoryPageContext();
  const categoryStatus = categoryPage ? createCategoryStatus(categoryPage) : null;

  if (!listingGrid && !categoryGrid && !categoryPage) return;

  function parseStructured(value) {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed || !['[', '{', '"'].includes(trimmed[0])) return value;
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  function responseList(payload, key) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  }

  async function requestJson(path) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`CMS request failed with status ${response.status}.`);
    const payload = await response.json();
    if (payload?.success === false) throw new Error('CMS request was not successful.');
    return payload;
  }

  function normalizeSlug(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function getCategoryPageContext() {
    const categorySlugs = new Set(['dyer', 'dollape', 'kende', 'krevate', 'kuzhina', 'minibare', 'shkalle']);
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';
    const directoryName = lastPart.toLowerCase() === 'index.html'
      ? pathParts[pathParts.length - 2]
      : lastPart;
    const slug = normalizeSlug(directoryName);
    if (!categorySlugs.has(slug)) return null;

    const grid = document.querySelector('section.section .products-grid');
    return grid ? { slug, grid } : null;
  }

  function createCategoryStatus(category) {
    const status = document.createElement('p');
    status.className = 'cms-category-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Po ngarkohen produktet…';
    category.grid.after(status);
    return status;
  }

  function categoryMap(categories) {
    return new Map(categories.filter((category) => category && category.id != null)
      .map((category) => [String(category.id), category]));
  }

  function productCategory(product, categoriesById) {
    const knownCategory = product.category_id == null ? null : categoriesById.get(String(product.category_id));
    const name = String(knownCategory?.name || product.category_name || '').trim();
    const slug = String(knownCategory?.slug || product.category_slug || normalizeSlug(name)).trim().toLowerCase();
    return { name, slug };
  }

  function imageUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value.trim(), window.location.href);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch {
      return '';
    }
  }

  function firstProductImage(value) {
    const parsed = parseStructured(value);
    const images = Array.isArray(parsed) ? parsed : parsed == null ? [] : [parsed];
    for (const image of images) {
      const url = typeof image === 'string' ? imageUrl(image)
        : image && typeof image === 'object' ? imageUrl(image.url || image.image_url || image.src) : '';
      if (url) return url;
    }
    return '';
  }

  function pageLink(file, parameter, value) {
    const url = new URL(file, window.location.href);
    url.searchParams.set(parameter, value);
    return `${url.pathname.split('/').pop()}${url.search}`;
  }

  function appendProductImage(parent, source, alt, fallbackClass) {
    if (source) {
      const image = document.createElement('img');
      image.src = source;
      image.alt = alt;
      image.loading = 'lazy';
      image.decoding = 'async';
      parent.append(image);
      return;
    }

    const fallback = document.createElement('div');
    fallback.className = fallbackClass;
    fallback.textContent = 'Fotoja nuk është e disponueshme';
    parent.append(fallback);
  }

  function createProductCard(product, categoriesById) {
    const name = String(product.name || '').trim();
    const slug = String(product.slug || '').trim();
    if (!name || !slug) return null;

    const category = productCategory(product, categoriesById);
    const card = document.createElement('a');
    card.className = 'product-card cms-product-card';
    card.href = pageLink('product.html', 'slug', slug);

    const imageWrap = document.createElement('div');
    imageWrap.className = 'product-img';
    appendProductImage(imageWrap, firstProductImage(product.images), name, 'cms-product-image-fallback');

    const body = document.createElement('div');
    body.className = 'product-body';
    const title = document.createElement('h3');
    title.className = 'product-name';
    title.textContent = name;
    const categoryLabel = document.createElement('p');
    categoryLabel.className = 'product-desc';
    categoryLabel.textContent = category.name || 'Kategori e papërcaktuar';

    body.append(title, categoryLabel);
    card.append(imageWrap, body);
    return card;
  }

  function createCategoryProductCard(product, categoriesById) {
    const name = typeof product.name === 'string' ? product.name.trim() : '';
    const slug = typeof product.slug === 'string' ? product.slug.trim() : '';
    if (!name || !slug) return null;

    const category = productCategory(product, categoriesById);
    const card = document.createElement('a');
    card.className = 'product-card cms-category-product';
    card.setAttribute('href', `../product.html?slug=${encodeURIComponent(slug)}`);
    card.setAttribute('aria-label', name);

    const imageWrap = document.createElement('div');
    imageWrap.className = 'product-img';
    appendProductImage(imageWrap, firstProductImage(product.images), name, 'cms-category-product-image-fallback');

    const body = document.createElement('div');
    body.className = 'product-body';
    const title = document.createElement('h3');
    title.className = 'product-name';
    title.textContent = name;
    const description = document.createElement('p');
    description.className = 'product-desc';
    description.textContent = (typeof product.description === 'string' ? product.description.trim() : '') || category.name;

    body.append(title, description);
    card.append(imageWrap, body);
    return card;
  }

  function createCategoryCard(category, products) {
    const name = String(category.name || '').trim();
    const slug = String(category.slug || normalizeSlug(name)).trim().toLowerCase();
    if (!name || !slug) return null;

    const firstImage = products.map((product) => firstProductImage(product.images)).find(Boolean) || '';
    const card = document.createElement('a');
    card.className = 'product-card cms-category-link';
    card.href = pageLink('produktet.html', 'category', slug);

    const imageWrap = document.createElement('div');
    imageWrap.className = 'product-img';
    appendProductImage(imageWrap, firstImage, name, 'cms-category-image-fallback');

    const body = document.createElement('div');
    body.className = 'product-body';
    const title = document.createElement('h3');
    title.className = 'product-name';
    title.textContent = name;
    const description = document.createElement('p');
    description.className = 'product-desc';
    description.textContent = products.length === 1
      ? '1 produkt në CMS'
      : `${products.length} produkte në CMS`;
    body.append(title, description);
    card.append(imageWrap, body);
    return card;
  }

  function renderCategoryShortcuts(categories, products, categoriesById) {
    if (!categoryGrid || !categoryShortcuts) return;
    categoryGrid.replaceChildren();

    categories.forEach((category) => {
      const categoryId = String(category.id ?? '');
      const categoryProducts = products.filter((product) => {
        const productCategoryValue = productCategory(product, categoriesById);
        return categoryId
          ? String(product.category_id ?? '') === categoryId || productCategoryValue.slug === String(category.slug || '').toLowerCase()
          : productCategoryValue.slug === String(category.slug || normalizeSlug(category.name)).toLowerCase();
      });
      if (!categoryProducts.length) return;
      const card = createCategoryCard(category, categoryProducts);
      if (card) categoryGrid.append(card);
    });

    categoryShortcuts.hidden = categoryGrid.children.length === 0;
  }

  function renderProductListing(products, categoriesById) {
    if (!listingGrid) return;
    const selectedCategory = requestedCategory
      ? Array.from(categoriesById.values()).find((category) => String(category.slug || '').toLowerCase() === requestedCategory)
      : null;
    const matchingProducts = requestedCategory
      ? products.filter((product) => productCategory(product, categoriesById).slug === requestedCategory)
      : products;

    listingGrid.querySelectorAll('[data-cms-product="true"]').forEach((card) => card.remove());
    const cards = matchingProducts.map((product) => createProductCard(product, categoriesById)).filter(Boolean);
    cards.forEach((card) => {
      card.dataset.cmsProduct = 'true';
      listingGrid.append(card);
    });

    if (requestedCategory && cards.length) {
      staticCards.forEach((card) => {
        card.hidden = true;
        card.classList.add('cms-filtered-static');
      });
      const categoryName = selectedCategory?.name || productCategory(matchingProducts[0], categoriesById).name;
      if (listingHeading) listingHeading.textContent = categoryName ? `Produktet — ${categoryName}` : originalListingHeading;
      if (categoryNavigation) categoryNavigation.hidden = false;
      if (listingStatus) listingStatus.hidden = true;
      return;
    }

    if (listingHeading) listingHeading.textContent = originalListingHeading;
    if (categoryNavigation) categoryNavigation.hidden = true;
    staticCards.forEach((card) => {
      card.hidden = false;
      card.classList.remove('cms-filtered-static');
    });

    if (!requestedCategory) {
      if (listingStatus) listingStatus.hidden = true;
    } else if (listingStatus) {
      listingStatus.textContent = 'Nuk ka produkte CMS në këtë kategori. Katalogu ekzistues vazhdon të jetë i disponueshëm.';
      listingStatus.hidden = false;
    }
  }

  function showListingError() {
    if (listingStatus) {
      listingStatus.textContent = 'Produktet e reja nuk mund të ngarkoheshin tani. Katalogu ekzistues mbetet i disponueshëm.';
      listingStatus.hidden = false;
    }
    if (categoryNavigation && requestedCategory) categoryNavigation.hidden = false;
  }

  function renderCategoryProducts(products, categoriesById) {
    if (!categoryPage || !categoryStatus) return;

    const seenSlugs = new Set();
    const cards = products
      .filter((product) => productCategory(product, categoriesById).slug === categoryPage.slug)
      .map((product) => {
        const slug = typeof product.slug === 'string' ? product.slug.trim().toLowerCase() : '';
        if (!slug || seenSlugs.has(slug)) return null;
        seenSlugs.add(slug);
        return createCategoryProductCard(product, categoriesById);
      })
      .filter(Boolean);

    if (!cards.length) {
      categoryStatus.hidden = true;
      return;
    }

    categoryPage.grid.append(...cards);
    categoryStatus.hidden = true;
  }

  function showCategoryProductsError() {
    if (!categoryStatus) return;
    categoryStatus.textContent = 'Produktet online nuk mund të ngarkoheshin tani.';
  }

  async function loadCmsProducts() {
    if (listingStatus) listingStatus.hidden = false;

    try {
      const categoriesRequest = requestJson('/categories').then((payload) => responseList(payload, 'categories')).catch(() => []);
      const productsPayload = await requestJson('/products');
      const seenProductSlugs = new Set();
      const products = responseList(productsPayload, 'products').filter((product) => {
        if (!product || typeof product !== 'object' || Array.isArray(product) || product.published !== 1) return false;
        const slug = typeof product.slug === 'string' ? product.slug.trim().toLowerCase() : '';
        if (!slug || seenProductSlugs.has(slug)) return false;
        seenProductSlugs.add(slug);
        return true;
      });
      const categories = await categoriesRequest;
      const categoriesById = categoryMap(categories);

      renderProductListing(products, categoriesById);
      renderCategoryShortcuts(categories, products, categoriesById);
      renderCategoryProducts(products, categoriesById);
    } catch {
      showListingError();
      showCategoryProductsError();
    }
  }

  loadCmsProducts();
})();
