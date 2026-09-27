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
  const similarSection = document.getElementById('similarProducts');
  const similarGrid = document.getElementById('similarProductsGrid');
  const lightbox = document.getElementById('productLightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrevious = document.getElementById('lightboxPrevious');
  const lightboxNext = document.getElementById('lightboxNext');

  const requestedSlug = new URLSearchParams(window.location.search).get('slug')?.trim() || '';
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

  function unwrapProduct(payload) {
    const candidates = [payload?.product, payload?.data?.product, payload?.data, payload];
    return candidates.find((candidate) => candidate && typeof candidate === 'object' &&
      !Array.isArray(candidate) && (candidate.name || candidate.slug)) || null;
  }

  function unwrapProductList(payload) {
    const candidates = [payload?.products, payload?.data?.products, payload?.data, payload?.results, payload];
    return candidates.find(Array.isArray) || [];
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
    const element = document.querySelector(selector);
    if (element) element.setAttribute('content', contentValue);
  }

  function productPageUrl(slug) {
    const url = new URL('product.html', window.location.href);
    url.searchParams.set('slug', slug);
    return url;
  }

  function updateSeo(product, productImages, slug) {
    const productName = String(product.name).trim();
    const productDescription = plainText(product.description);
    const pageTitle = `${productName} | Mobileri Gazi Adi`;
    document.title = pageTitle;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.setAttribute('content', productDescription);
    setMeta('meta[property="og:title"]', pageTitle);
    setMeta('meta[property="og:description"]', productDescription);
    setMeta('meta[property="og:image"]', productImages[0] || '');

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      const canonical = productPageUrl(slug).href;
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.append(canonicalLink);
      }
      canonicalLink.href = canonical;
      setMeta('meta[property="og:url"]', canonical);
    }
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

  function renderProduct(product, slug) {
    const productName = String(product.name).trim();
    const productImages = imageUrls(product.images);
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
    loadSimilarProducts(product).catch(() => {
      similarGrid.replaceChildren();
      similarSection.hidden = true;
    });
  }

  function isSameCategory(currentProduct, candidate) {
    if (currentProduct.category_id != null && candidate.category_id != null) {
      return String(currentProduct.category_id) === String(candidate.category_id);
    }
    const currentName = String(currentProduct.category_name || '').trim().toLocaleLowerCase();
    const candidateName = String(candidate.category_name || '').trim().toLocaleLowerCase();
    return Boolean(currentName && candidateName && currentName === candidateName);
  }

  function makeSimilarCard(product) {
    const slug = String(product.slug || '').trim();
    const name = String(product.name || '').trim();
    if (!slug || !name) return null;

    const card = document.createElement('a');
    card.className = 'similar-product';
    card.href = `product.html?slug=${encodeURIComponent(slug)}`;

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

  async function loadSimilarProducts(currentProduct) {
    const response = await fetch(`${API_BASE}/products`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Similar products could not be loaded.');

    const candidates = unwrapProductList(await response.json()).filter((product) =>
      product && typeof product === 'object' && !Array.isArray(product)
    );
    const currentId = currentProduct.id == null ? '' : String(currentProduct.id);
    const currentSlug = String(currentProduct.slug || requestedSlug).trim();
    const unique = new Map();

    candidates.forEach((product) => {
      const slug = String(product.slug || '').trim();
      if (!slug || slug === currentSlug || (currentId && String(product.id) === currentId)) return;
      if (!unique.has(slug)) unique.set(slug, product);
    });

    const available = Array.from(unique.values());
    const preferred = available.filter((product) => isSameCategory(currentProduct, product));
    const ordered = [...preferred, ...available.filter((product) => !preferred.includes(product))].slice(0, 3);
    similarGrid.replaceChildren();
    ordered.map(makeSimilarCard).filter(Boolean).forEach((card) => similarGrid.append(card));
    similarSection.hidden = similarGrid.children.length === 0;
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
      const product = unwrapProduct(await response.json());
      if (!product || !String(product.name || '').trim()) throw new Error('The product response was incomplete.');
      return { product };
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
      renderProduct(result.product, requestedSlug);
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
