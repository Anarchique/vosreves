/* ==================== NAVIGATION ==================== */
(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.navigation');

  if (menuButton && navigation) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Ouvrir le menu');
      navigation.classList.remove('open');
    };

    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Ouvrir le menu' : 'Fermer le menu');
      navigation.classList.toggle('open', !isOpen);
    });
    navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  /* ==================== PAGE ACTIVE ==================== */
  const navigationLinks = [...document.querySelectorAll('.navigation a[data-page]')];
  const currentPage = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
  navigationLinks.forEach(link => {
    if (link.dataset.page === currentPage) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  /* ==================== FILTRES DE LA GALERIE ==================== */
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const galleryCards = [...document.querySelectorAll('[data-gallery-card]')];
  const galleryStatus = document.querySelector('[data-gallery-status]');
  const visibleCards = () => galleryCards.filter(card => !card.hidden);

  const applyFilter = filter => {
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    const count = galleryCards.reduce((visible, card) => {
      const matches = filter === 'Tous' || card.dataset.tag === filter;
      card.hidden = !matches;
      return visible + Number(matches);
    }, 0);
    if (galleryStatus) galleryStatus.textContent = `${count} ${count === 1 ? 'image affichée' : 'images affichées'}`;
  };
  filterButtons.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.filter)));

  /* ==================== VISIONNEUSE ACCESSIBLE ==================== */
  const dialog = document.querySelector('[data-lightbox]');
  const triggers = [...document.querySelectorAll('[data-lightbox-trigger]')];
  if (!dialog || !triggers.length) return;

  const image = dialog.querySelector('[data-lightbox-image]');
  const title = dialog.querySelector('[data-lightbox-title]');
  const caption = dialog.querySelector('[data-lightbox-caption]');
  const countLabel = dialog.querySelector('[data-lightbox-count]');
  const closeButton = dialog.querySelector('[data-lightbox-close]');
  const previousButton = dialog.querySelector('[data-lightbox-prev]');
  const nextButton = dialog.querySelector('[data-lightbox-next]');
  let currentIndex = 0;
  let returnFocus = null;

  const getVisibleItems = () => visibleCards().map(card => ({
    trigger: card.querySelector('[data-lightbox-trigger]'),
    image: card.querySelector('img'),
    title: card.querySelector('h2')?.textContent.trim() || '',
    caption: card.querySelector('.gallery-card-body p')?.textContent.trim() || ''
  }));

  const showItem = requestedIndex => {
    const items = getVisibleItems();
    if (!items.length) return;
    currentIndex = Math.max(0, Math.min(requestedIndex, items.length - 1));
    const item = items[currentIndex];
    image.classList.remove('image-failed');
    image.src = item.image.currentSrc || item.image.src;
    image.alt = item.image.alt;
    title.textContent = item.title;
    caption.textContent = item.caption;
    countLabel.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    previousButton.hidden = items.length < 2 || currentIndex === 0;
    nextButton.hidden = items.length < 2 || currentIndex === items.length - 1;
  };

  const openLightbox = trigger => {
    const index = getVisibleItems().findIndex(item => item.trigger === trigger);
    if (index < 0) return;
    returnFocus = trigger;
    showItem(index);
    dialog.hidden = false;
    document.body.classList.add('modal-open');
    closeButton.focus();
  };

  const closeLightbox = () => {
    if (dialog.hidden) return;
    dialog.hidden = true;
    document.body.classList.remove('modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  };

  image.addEventListener('error', () => image.classList.add('image-failed'));
  triggers.forEach(trigger => trigger.addEventListener('click', () => openLightbox(trigger)));
  closeButton.addEventListener('click', closeLightbox);
  previousButton.addEventListener('click', () => showItem(currentIndex - 1));
  nextButton.addEventListener('click', () => showItem(currentIndex + 1));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeLightbox();
  });

  document.addEventListener('keydown', event => {
    if (dialog.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showItem(currentIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showItem(currentIndex + 1);
    } else if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('button:not([hidden])')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
})();
