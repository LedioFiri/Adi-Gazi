// ============================================
//   MOBILERI ADI GAZI — Main JS
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // ---- Navbar scroll effect ----
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  // ---- Hamburger menu ----
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      }
    });
  }

  // ---- Active nav link ----
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-menu a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ---- Scroll Reveal ----
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, entry.target.dataset.delay || 0);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el, i) => {
      el.dataset.delay = (i % 4) * 80;
      observer.observe(el);
    });
  }

  // ---- Product Filter (products.html) ----
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card[data-category]');
  if (filterBtns.length && productCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        productCards.forEach(card => {
          const show = cat === 'all' || card.dataset.category === cat;
          card.style.display = show ? '' : 'none';
          if (show) {
            card.classList.remove('visible');
            setTimeout(() => card.classList.add('visible'), 50);
          }
        });
      });
    });
  }

  // ---- Sort (products.html) ----
  const sortSelect = document.querySelector('.sort-select');
  const productsGrid = document.querySelector('.products-grid');
  if (sortSelect && productsGrid) {
    sortSelect.addEventListener('change', () => {
      const cards = [...productsGrid.querySelectorAll('.product-card')];
      const val = sortSelect.value;
      cards.sort((a, b) => {
        const priceA = parseFloat(a.dataset.price || 0);
        const priceB = parseFloat(b.dataset.price || 0);
        if (val === 'price-asc') return priceA - priceB;
        if (val === 'price-desc') return priceB - priceA;
        return 0;
      });
      cards.forEach(c => productsGrid.appendChild(c));
    });
  }

  // ---- Gallery Lightbox ----
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (galleryItems.length) {
    // Create lightbox
    const lb = document.createElement('div');
    lb.style.cssText = `
      position:fixed;inset:0;background:rgba(26,26,46,0.9);z-index:9999;
      display:flex;align-items:center;justify-content:center;padding:20px;
      opacity:0;transition:opacity 0.3s;pointer-events:none;
    `;
    lb.innerHTML = `
      <div style="background:#fff;border:3px solid #1A1A2E;border-radius:20px;padding:20px;
        max-width:90vw;text-align:center;box-shadow:8px 8px 0 #1A1A2E;position:relative">
        <div id="lb-img" style="font-size:8rem;margin-bottom:12px"></div>
        <h3 id="lb-title" style="font-family:'Fraunces',serif;margin-bottom:4px"></h3>
        <p id="lb-cat" style="color:#3D405B;font-size:0.9rem"></p>
        <button id="lb-close" style="position:absolute;top:12px;right:16px;font-size:1.5rem;
          cursor:pointer;border:none;background:none;font-weight:900">✕</button>
      </div>`;
    document.body.appendChild(lb);

    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        const emoji = item.querySelector('.gi-emoji')?.textContent || item.textContent.trim().slice(0,2);
        const title = item.querySelector('h4')?.textContent || '';
        const cat   = item.querySelector('span')?.textContent || '';
        lb.querySelector('#lb-img').textContent = emoji;
        lb.querySelector('#lb-title').textContent = title;
        lb.querySelector('#lb-cat').textContent = cat;
        lb.style.pointerEvents = 'all';
        lb.style.opacity = '1';
      });
    });
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.id === 'lb-close') {
        lb.style.opacity = '0';
        lb.style.pointerEvents = 'none';
      }
    });
  }

  // ---- Contact form fake submit ----
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type=submit]');
      btn.textContent = '✓ Mesazhi u dërgua!';
      btn.style.background = '#6BCB77';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Dërgo Mesazhin';
        btn.style.background = '';
        btn.disabled = false;
        contactForm.reset();
      }, 3500);
    });
  }

});