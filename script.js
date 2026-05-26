console.log("SCRIPT LOADED");

document.addEventListener('DOMContentLoaded', () => {
  // ---- Cookie consent banner ----
  const cookieChoice = localStorage.getItem('cookieConsent');

  if (!cookieChoice) {
    const cookieBanner = document.createElement('div');
    cookieBanner.className = 'cookie-banner';
    cookieBanner.innerHTML = `
      <div class="cookie-banner-text">
        <strong>Cookies</strong>
        <span>
          Kjo faqe perdor cookies per te permiresuar eksperiencen tuaj.
        </span>
      </div>
      <div class="cookie-banner-actions">
        <button type="button" class="cookie-btn cookie-btn-privacy">Politika e Privatesia</button>
        <button type="button" class="cookie-btn cookie-btn-refuse">Refuzoj</button>
        <button type="button" class="cookie-btn cookie-btn-accept">Pranoj</button>
      </div>
    `;

    document.body.appendChild(cookieBanner);

    cookieBanner.querySelector('.cookie-btn-privacy').addEventListener('click', () => {
      const existingNotice = document.querySelector('.privacy-notice');
      if (existingNotice) {
        existingNotice.remove();
        return;
      }

      const privacyNotice = document.createElement('div');
      privacyNotice.className = 'privacy-notice';
      privacyNotice.innerHTML = `
        <button type="button" class="privacy-notice-close" aria-label="Mbyll politiken e privatesise">&times;</button>
        <h3>Politika e Privatesise</h3>
        <p>Mobileri Adi Gazi respekton privatesine tuaj. Kjo faqe shpjegon se si mund te mbledhim dhe perdorim informacionin kur vizitoni faqen tone.</p>
        <p>Ne perdorim Google Analytics per te kuptuar se si vizitoret perdorin faqen tone. Google Analytics mund te mbledhe informacione si faqet qe vizitoni, pajisja dhe Browser-i qe perdorni, vendndodhja e perafert (Shteti ose Qyteti) dhe koha e qendrimit ne faqe.</p>
        <p>Keto te dhena na ndihmojne te permiresojme faqen dhe sherbimet tona. Google mund t'i perpunojne keto te dhena sipas politikes se tij te privatesise.</p>
        <p>Ne gjithashtu mund te marrim informacion personal nese na kontaktoni me telefon, WhatsApp, Instagram ose Facebook, si emri, numri i telefonit dhe detajet e kerkeses suaj.</p>
        <p>Ne nuk shesim te dhenat tuaja personale.</p>
        <p>Per me shume informacion rreth menyres si Google perdor te dhenat, vizitoni:<br><a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">https://policies.google.com/technologies/partner-sites</a></p>
        <p>Mund te caktivizoni Google Analytics ketu:<br><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">https://tools.google.com/dlpage/gaoptout</a></p>
        <p>Per pyetje, na kontaktoni:<br>Mobileri Adi Gazi<br>Nikel, Fushe Kruje<br>Tel: 068 205 4255</p>
      `;

      document.body.appendChild(privacyNotice);

      privacyNotice.querySelector('.privacy-notice-close').addEventListener('click', () => {
        privacyNotice.remove();
      });
    });

    cookieBanner.querySelector('.cookie-btn-accept').addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'accepted');
      document.querySelector('.privacy-notice')?.remove();
      cookieBanner.remove();
    });

    cookieBanner.querySelector('.cookie-btn-refuse').addEventListener('click', () => {
      window.location.href = 'https://www.google.com';
    });
  }

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

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
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

});



(function () {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML = `
      <button class="lightbox-close">✕</button>
      <button class="lightbox-prev">←</button>
      <img src="" />
      <button class="lightbox-next">→</button>
    `;
  document.body.appendChild(overlay);

  const img = overlay.querySelector('img');
  const closeBtn = overlay.querySelector('.lightbox-close');
  const prevBtn = overlay.querySelector('.lightbox-prev');
  const nextBtn = overlay.querySelector('.lightbox-next');

  let images = [];
  let index = 0;

  function open(i) {
    index = i;
    img.src = images[index].src;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function next() {
    open((index + 1) % images.length);
  }

  function prev() {
    open((index - 1 + images.length) % images.length);
  }

  document.addEventListener('DOMContentLoaded', () => {
    images = document.querySelectorAll('.gallery-grid img');

    images.forEach((el, i) => {
      el.addEventListener('click', () => open(i));
    });
  });

  closeBtn.onclick = close;
  nextBtn.onclick = next;
  prevBtn.onclick = prev;

  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });
})();

