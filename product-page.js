(() => {
  'use strict';

  const API_BASE = 'https://mobileri-gazi-cms.mobilerigaziadi900.workers.dev/api';
  const WHATSAPP_NUMBER = '355682054255';

  const page = document.getElementById('productPage');
  const state = document.getElementById('productPageState');
  const stateTitle = document.getElementById('productPageStateTitle');
  const stateMessage = document.getElementById('productPageStateMessage');
  const retryButton = document.getElementById('productRetry');
  const content = document.getElementById('productContent');
  const title = document.getElementById('productTitle');
  const titleRepeat = document.getElementById('productTitleRepeat');
  const description = document.getElementById('productDescription');
  const gallery = document.getElementById('productGallery');
  const galleryEmpty = document.getElementById('productGalleryEmpty');
  const heroTrigger = document.getElementById('productHeroTrigger');
  const heroImage = document.getElementById('productHeroImage');
  const thumbnails = document.getElementById('productThumbnails');
  const videoBox = document.getElementById('productVideo');
  const specificationsCard = document.getElementById('productSpecificationsCard');
  const specifications = document.getElementById('productSpecifications');
  const whatsappLink = document.getElementById('productWhatsApp');
  const relatedSection = document.getElementById('similarProducts');
  const relatedGrid = document.getElementById('similarProductsGrid');
  const productBackButton = document.getElementById('productBackButton');
  const lightbox = document.getElementById('productLightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrevious = document.getElementById('lightboxPrevious');
  const lightboxNext = document.getElementById('lightboxNext');

  const requestedSlug = new URLSearchParams(window.location.search).get('slug')?.trim() || '';
  const categoryPaths = {
    dyer: '/Dyer/index.html',
    dollape: '/dollape/index.html',
    kende: '/kende/index.html',
    krevate: '/krevate/index.html',
    kuzhina: '/kuzhina/index.html',
    minibare: '/minibare/index.html',
    shkalle: '/shkalle/index.html'
  };
  let galleryImages = [];
  let activeImageIndex = 0;
  let previousFocus = null;
  let previousBodyOverflow = '';

  function parseStructuredValue(value) {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed || !['[', '{', '"'].includes(trimmed[0])) return value;

    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  function valueEntries(value) {
    const parsed = parseStructuredValue(value);
    if (parsed == null) return [];
    if (Array.isArray(parsed)) return parsed.flatMap(valueEntries);
    if (typeof parsed === 'string') {
      return parsed.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean);
    }
    if (typeof parsed === 'number' || typeof parsed === 'boolean') return [String(parsed)];
    if (typeof parsed === 'object') {
      return Object.entries(parsed).flatMap(([key, entry]) => {
        const entries = valueEntries(entry);
        return entries.map((text) => `${key}: ${text}`);
      });
    }
    return [];
  }

  function plainText(value) {
    return valueEntries(value).join('\n');
  }

  function normalizeSlug(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function updateCategoryBackLink(product) {
    if (!productBackButton) return;
    const productCategorySlug = normalizeSlug(product.category_slug || product.category_name);
    const categorySlug = productCategorySlug === 'dyert' ? 'dyer' : productCategorySlug;
    productBackButton.href = categoryPaths[categorySlug] || '/produktet.html';
  }

  function unwrapProduct(payload) {
    const candidates = [payload?.product, payload?.data?.product, payload?.data, payload];
    return candidates.find((candidate) => candidate && typeof candidate === 'object' &&
      !Array.isArray(candidate) && (candidate.name || candidate.slug)) || null;
  }

  function unwrapProductList(payload) {
    const candidates = [
      payload?.products,
      payload?.data?.products,
      payload?.static_products,
      payload?.data?.static_products,
      payload?.static_catalogue?.products,
      payload?.data?.static_catalogue?.products,
      payload?.static_catalogue,
      payload?.data?.static_catalogue,
      payload?.catalogue?.products,
      payload?.data?.catalogue?.products,
      payload?.catalogue,
      payload?.catalog?.products,
      payload?.data?.catalog?.products,
      payload?.items,
      payload?.data?.items,
      payload?.results,
      payload?.data,
      payload
    ];
    return candidates.filter(Array.isArray).flat();
  }

  function safeImageUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value.trim(), window.location.href);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch {
      return '';
    }
  }

  function imageUrls(value) {
    const parsed = parseStructuredValue(value);
    const entries = Array.isArray(parsed) ? parsed : parsed == null ? [] : [parsed];

    return entries.map((entry) => {
      if (typeof entry === 'string') return safeImageUrl(entry);
      if (entry && typeof entry === 'object') {
        return safeImageUrl(entry.url || entry.image_url || entry.src);
      }
      return '';
    }).filter(Boolean);
  }

  function youtubeEmbedUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    let input = value.trim();
    if (/^(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(input)) input = `https://${input}`;

    try {
      const url = new URL(input);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      const host = url.hostname.toLowerCase().replace(/^www\./, '');
      let videoId = '';

      if (host === 'youtu.be') {
        videoId = url.pathname.split('/').filter(Boolean)[0] || '';
      } else if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com') {
        if (url.pathname === '/watch') videoId = url.searchParams.get('v') || '';
        else videoId = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/)?.[1] || '';
      }

      if (!/^[A-Za-z0-9_-]{6,}$/.test(videoId)) return '';
      return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
    } catch {
      return '';
    }
  }

  function setMeta(selector, contentValue) {
    let element = document.querySelector(selector);
    if (!element) {
      const match = selector.match(/^meta\[(name|property)="([^"]+)"\]$/);
      if (!match) return;
      element = document.createElement('meta');
      element.setAttribute(match[1], match[2]);
      document.head.append(element);
    }
    element.setAttribute('content', contentValue);
  }

  function productPageUrl(slug) {
    const url = new URL('product.html', window.location.href);
    url.searchParams.set('slug', slug);
    return url;
  }

  function canonicalProductPageUrl(slug) {
    return `https://mobileri-gazi-adi.com/product.html?slug=${encodeURIComponent(slug)}`;
  }

  function updateProductStructuredData(product, productImages) {
    const productName = String(product.name || '').trim();
    if (!productName) return;

    const data = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName
    };
    const productDescription = plainText(product.description);
    if (productDescription) data.description = productDescription;
    if (productImages.length) data.image = productImages[0];

    let structuredData = document.getElementById('cmsProductJsonLd');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.id = 'cmsProductJsonLd';
      structuredData.type = 'application/ld+json';
      document.head.append(structuredData);
    }
    structuredData.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }

  function updateSeo(product, productImages, slug) {
    const productName = String(product.name).trim();
    const productDescription = plainText(product.description);
    const pageTitle = `${productName} | Mobileri Gazi Adi`;
    document.title = pageTitle;

    setMeta('meta[name="description"]', productDescription);
    setMeta('meta[property="og:title"]', pageTitle);
    setMeta('meta[property="og:description"]', productDescription);
    setMeta('meta[property="og:image"]', productImages[0] || '');
    setMeta('meta[name="twitter:title"]', pageTitle);
    setMeta('meta[name="twitter:description"]', productDescription);
    setMeta('meta[name="twitter:image"]', productImages[0] || '');

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      const canonical = canonicalProductPageUrl(slug);
      const canonicalLinks = Array.from(document.querySelectorAll('link[rel="canonical"]'));
      let canonicalLink = canonicalLinks.shift();
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.append(canonicalLink);
      }
      canonicalLinks.forEach((link) => link.remove());
      canonicalLink.href = canonical;
      setMeta('meta[property="og:url"]', canonical);
    }

    updateProductStructuredData(product, productImages);
  }

  function setPageState(heading, message, { error = false, retry = false } = {}) {
    page.setAttribute('aria-busy', String(!error));
    content.hidden = true;
    state.hidden = false;
    state.classList.toggle('is-error', error);
    stateTitle.textContent = heading;
    stateMessage.textContent = message;
    retryButton.hidden = !retry;
    document.title = `${heading} | Mobileri Gazi Adi`;
  }

  function appendTextEntries(parent, entries, className) {
    parent.replaceChildren();
    entries.forEach((entry) => {
      const paragraph = document.createElement('p');
      paragraph.className = className;
      paragraph.textContent = entry;
      parent.append(paragraph);
    });
  }

  function showGalleryImage(index) {
    if (!galleryImages.length) return;
    activeImageIndex = (index + galleryImages.length) % galleryImages.length;
    const image = galleryImages[activeImageIndex];
    const alt = `${title.textContent}, pamja ${activeImageIndex + 1}`;
    heroImage.src = image;
    heroImage.alt = alt;
    lightboxImage.src = image;
    lightboxImage.alt = alt;
    lightboxCounter.textContent = `${activeImageIndex + 1} / ${galleryImages.length}`;
    Array.from(thumbnails.children).forEach((button, buttonIndex) => {
      button.setAttribute('aria-pressed', String(buttonIndex === activeImageIndex));
    });
  }

  function openLightbox() {
    if (!galleryImages.length) return;
    previousFocus = document.activeElement;
    showGalleryImage(activeImageIndex);
    lightbox.classList.add('is-open', 'active');
    lightbox.setAttribute('aria-hidden', 'false');
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open', 'active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousBodyOverflow;
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  function renderGallery(product, productImages) {
    galleryImages = productImages;
    activeImageIndex = 0;
    thumbnails.replaceChildren();
    gallery.hidden = productImages.length === 0;
    galleryEmpty.hidden = productImages.length > 0;

    if (!productImages.length) return;

    const productName = String(product.name).trim();
    productImages.forEach((src, index) => {
      const button = document.createElement('button');
      button.className = 'product-thumbnail';
      button.type = 'button';
      button.setAttribute('aria-label', `Pamja ${index + 1}`);
      button.setAttribute('aria-pressed', String(index === 0));

      const image = document.createElement('img');
      image.src = src;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      button.append(image);
      button.addEventListener('click', () => {
        showGalleryImage(index);
        openLightbox();
      });
      thumbnails.append(button);
    });

    showGalleryImage(0);
    lightboxPrevious.hidden = productImages.length < 2;
    lightboxNext.hidden = productImages.length < 2;
  }

  function renderVideo(value, productName) {
    videoBox.replaceChildren();
    const src = youtubeEmbedUrl(value);
    videoBox.hidden = !src;
    if (!src) return;

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = productName;
    iframe.loading = 'lazy';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', '');
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    videoBox.append(iframe);
  }

  function renderSpecifications(value) {
    const entries = valueEntries(value);
    specifications.replaceChildren();
    entries.forEach((entry) => {
      const item = document.createElement('li');
      item.textContent = entry;
      specifications.append(item);
    });
    specificationsCard.hidden = entries.length === 0;
  }

  function renderProduct(product, slug, relatedProducts, relatedItems) {
    const productName = String(product.name).trim();
    const productImages = imageUrls(product.images);
    updateCategoryBackLink(product);
    title.textContent = productName;
    titleRepeat.textContent = productName;
    appendTextEntries(description, valueEntries(product.description), 'product-summary');
    renderGallery(product, productImages);
    renderVideo(product.youtube_url, productName);
    renderSpecifications(product.specifications);
    updateSeo(product, productImages, String(product.slug || slug).trim());

    const url = productPageUrl(String(product.slug || slug).trim());
    const message = `Përshëndetje, jam i interesuar për ${productName}. Linku: ${url.href}`;
    whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    state.hidden = true;
    content.hidden = false;
    page.setAttribute('aria-busy', 'false');
    loadRelatedProducts(relatedProducts, relatedItems).catch(() => {
      relatedGrid.replaceChildren();
      relatedSection.hidden = true;
    });
  }

  function makeRelatedCard(product) {
    const slug = String(product.slug || '').trim();
    const name = String(product.name || '').trim();
    if (!slug || !name) return null;

    const card = document.createElement('a');
    card.className = 'similar-product';
    card.href = `/product.html?slug=${encodeURIComponent(slug)}`;

    const image = imageUrls(product.images)[0];
    if (image) {
      const imageElement = document.createElement('img');
      imageElement.src = image;
      imageElement.alt = name;
      imageElement.loading = 'lazy';
      imageElement.decoding = 'async';
      card.append(imageElement);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'similar-product-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      card.append(placeholder);
    }

    const nameElement = document.createElement('p');
    nameElement.className = 'similar-product-name';
    nameElement.textContent = name;
    card.append(nameElement);

    if (product.category_name) {
      const label = document.createElement('p');
      label.className = 'similar-product-label';
      label.textContent = String(product.category_name);
      card.append(label);
    }

    return card;
  }

  function relatedSelections(responseRelatedProducts) {
    const responseProducts = parseStructuredValue(responseRelatedProducts);
    return Array.isArray(responseProducts) ? responseProducts : [];
  }

  function unwrapRelatedProducts(payload) {
    const candidates = [
      payload?.related_products,
      payload?.product?.related_products,
      payload?.data?.related_products,
      payload?.data?.product?.related_products
    ];

    for (const candidate of candidates) {
      if (candidate == null) continue;
      const parsed = parseStructuredValue(candidate);
      if (Array.isArray(parsed)) return parsed;
    }

    return [];
  }

  function unwrapRelatedItems(payload) {
    const candidates = [
      payload?.related_items,
      payload?.product?.related_items,
      payload?.data?.related_items,
      payload?.data?.product?.related_items
    ];

    for (const candidate of candidates) {
      if (candidate == null) continue;
      const parsed = parseStructuredValue(candidate);
      if (Array.isArray(parsed)) return parsed;
    }

    return null;
  }

  function isCompleteRelatedProduct(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value) && value.name && value.slug);
  }

  function resolveRelatedProduct(selection, productsById, productsBySlug) {
    if (isCompleteRelatedProduct(selection)) return selection;

    const reference = selection && typeof selection === 'object' && !Array.isArray(selection)
      ? selection
      : { id: selection, slug: selection };
    const slug = String(reference.slug || reference.product_slug || '').trim();
    const referenceId = reference.id ?? reference.product_id;
    const id = referenceId == null ? '' : String(referenceId);
    return (slug && productsBySlug.get(slug)) || (id && productsById.get(id)) || null;
  }

  function staticCatalogueKey(product) {
    const values = [
      product?.key,
      product?.product_key,
      product?.static_key,
      product?.static_path,
      product?.path,
      product?.relative_path,
      product?.relative_url,
      product?.html_path,
      product?.filename,
      product?.href,
      product?.url
    ];

    for (const value of values) {
      if (typeof value !== 'string' || !value.trim()) continue;
      return value.trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '').toLowerCase();
    }

    return '';
  }

  function staticProductName(key) {
    const filename = String(key || '').replace(/\\/g, '/').split('/').pop() || '';
    return filename.replace(/\.html?$/i, '').trim();
  }

  function staticProductCategory(product, key) {
    const category = product?.category_name || product?.categoryName || product?.category;
    if (typeof category === 'string' && category.trim()) return category.trim();
    if (category && typeof category === 'object') {
      const name = category.name || category.title;
      if (name) return String(name).trim();
    }

    const folder = String(key || '').replace(/\\/g, '/').split('/').filter(Boolean)[0] || '';
    return folder ? folder.charAt(0).toLocaleUpperCase() + folder.slice(1) : '';
  }

  function makeStaticRelatedCard(key, product) {
    const relativeKey = String(key || '').trim().replace(/\\/g, '/').replace(/^\/+/, '');
    if (!relativeKey) return null;

    const name = String(product?.name || staticProductName(relativeKey)).trim();
    if (!name) return null;

    const card = document.createElement('a');
    card.className = 'similar-product';
    card.href = String(product?.url || `/${relativeKey}`);

    const imageValue = product?.images ?? product?.image_url ?? product?.imageUrl ??
      product?.image ?? product?.thumbnail ?? product?.photo ?? product?.src;
    const image = imageUrls(imageValue)[0];
    if (image) {
      const imageElement = document.createElement('img');
      imageElement.src = image;
      imageElement.alt = name;
      imageElement.loading = 'lazy';
      imageElement.decoding = 'async';
      card.append(imageElement);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'similar-product-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      card.append(placeholder);
    }

    const nameElement = document.createElement('p');
    nameElement.className = 'similar-product-name';
    nameElement.textContent = name;
    card.append(nameElement);

    const category = staticProductCategory(product, relativeKey);
    if (category) {
      const label = document.createElement('p');
      label.className = 'similar-product-label';
      label.textContent = category;
      card.append(label);
    }

    return card;
  }

  async function loadRelatedProducts(responseRelatedProducts, responseRelatedItems) {
    relatedGrid.replaceChildren();
    const selections = Array.isArray(responseRelatedItems)
      ? responseRelatedItems
      : relatedSelections(responseRelatedProducts);
    if (!selections.length) {
      relatedSection.hidden = true;
      return;
    }

    const relatedProductsById = new Map(relatedSelections(responseRelatedProducts)
      .filter((product) => product && typeof product === 'object' && product.id != null)
      .map((product) => [String(product.id), product]));
    let candidates = [];
    const hasStaticItems = Array.isArray(responseRelatedItems) && selections.some((selection) => selection?.type === 'static');
    const needsCatalogue = hasStaticItems || selections.some((selection) => {
      if (Array.isArray(responseRelatedItems) && selection?.type === 'cms') {
        return !relatedProductsById.has(String(selection.id ?? ''));
      }
      return !isCompleteRelatedProduct(selection);
    });

    if (needsCatalogue) {
      try {
        const response = await fetch(`${API_BASE}/products`, { headers: { Accept: 'application/json' } });
        if (response.ok) {
          candidates = unwrapProductList(await response.json()).filter((candidate) =>
            candidate && typeof candidate === 'object' && !Array.isArray(candidate)
          );
        } else if (!hasStaticItems) {
          throw new Error('Related products could not be loaded.');
        }
      } catch (error) {
        if (!hasStaticItems) throw error;
      }
    }

    const productsById = new Map(candidates
      .filter((candidate) => candidate.id != null)
      .map((candidate) => [String(candidate.id), candidate]));
    const productsBySlug = new Map(candidates
      .filter((candidate) => candidate.slug)
      .map((candidate) => [String(candidate.slug), candidate]));
    const staticProductsByKey = new Map(candidates
      .map((candidate) => [staticCatalogueKey(candidate), candidate])
      .filter(([key]) => key));
    const cards = Array.isArray(responseRelatedItems)
      ? selections.map((selection) => {
        if (!selection || typeof selection !== 'object') return null;
        if (selection.type === 'cms') {
          const id = selection.id == null ? '' : String(selection.id);
          const product = relatedProductsById.get(id) || productsById.get(id);
          return product ? makeRelatedCard(product) : null;
        }
        if (selection.type === 'static') {
          const key = String(selection.key || '').trim();
          const normalizedKey = key.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '').toLowerCase();
          return makeStaticRelatedCard(key, { ...(staticProductsByKey.get(normalizedKey) || {}), ...selection });
        }
        return null;
      }).filter(Boolean)
      : selections
        .map((selection) => resolveRelatedProduct(selection, productsById, productsBySlug))
        .filter(Boolean)
        .map(makeRelatedCard)
        .filter(Boolean);

    relatedGrid.replaceChildren(...cards);
    relatedSection.hidden = cards.length === 0;
  }

  async function fetchProduct(slug) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (response.status === 404) return { notFound: true };
      if (!response.ok) throw new Error(`Product request failed with status ${response.status}.`);
      const payload = await response.json();
      const product = unwrapProduct(payload);
      if (!product || !String(product.name || '').trim()) throw new Error('The product response was incomplete.');
      return {
        product,
        relatedProducts: unwrapRelatedProducts(payload),
        relatedItems: unwrapRelatedItems(payload)
      };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function loadProduct() {
    if (!requestedSlug) {
      setPageState('Produkt nuk u gjet', 'Mungon parametri “slug” në adresën e faqes.', { error: true });
      return;
    }

    setPageState('Produkti po ngarkohet…', 'Ju lutemi prisni pak.');
    retryButton.disabled = true;

    try {
      const result = await fetchProduct(requestedSlug);
      if (result.notFound) {
        setPageState('Produkt nuk u gjet', 'Produkti i kërkuar nuk ekziston ose nuk është i disponueshëm.', { error: true });
        return;
      }
      renderProduct(result.product, requestedSlug, result.relatedProducts, result.relatedItems);
    } catch {
      setPageState('Produkti nuk u ngarkua', 'Nuk mund të merret informacioni tani. Kontrolloni lidhjen dhe provoni përsëri.', {
        error: true,
        retry: true
      });
    } finally {
      retryButton.disabled = false;
    }
  }

  retryButton.addEventListener('click', loadProduct);
  heroTrigger.addEventListener('click', openLightbox);
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrevious.addEventListener('click', () => showGalleryImage(activeImageIndex - 1));
  lightboxNext.addEventListener('click', () => showGalleryImage(activeImageIndex + 1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === 'ArrowLeft' && galleryImages.length > 1) {
      event.preventDefault();
      showGalleryImage(activeImageIndex - 1);
    } else if (event.key === 'ArrowRight' && galleryImages.length > 1) {
      event.preventDefault();
      showGalleryImage(activeImageIndex + 1);
    } else if (event.key === 'Tab') {
      const controls = Array.from(lightbox.querySelectorAll('button:not([hidden])'));
      const currentIndex = controls.indexOf(document.activeElement);
      if (event.shiftKey && currentIndex <= 0) {
        event.preventDefault();
        controls[controls.length - 1]?.focus();
      } else if (!event.shiftKey && currentIndex === controls.length - 1) {
        event.preventDefault();
        controls[0]?.focus();
      }
    }
  });

  loadProduct();
})();
