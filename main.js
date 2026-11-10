/* ==================== CONFIGURATION & CONTENU ==================== */
(() => {
  const STORAGE_KEY = 'vos-reves-site-content-v1';
  const PAGE_KEYS = ['index', 'programme', 'galerie'];
  const LIST_KEYS = ['kpis', 'workshops', 'gallery'];
  const DEFAULT_CONTENT = {
    fields: {},
    kpis: [],
    workshops: [],
    gallery: [],
    blocks: {},
    poster: { src: '' },
  };

  /** Clone un objet JSON sans conserver de référence partagée. */
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /** Fusionne la sauvegarde locale avec le contenu livré par défaut. */
  function loadContent() {
    const content = clone(window.SITE_DEFAULT_CONTENT || DEFAULT_CONTENT);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return content;

      const override = JSON.parse(saved);
      if (override.fields) {
        content.fields = { ...content.fields, ...override.fields };
      }
      LIST_KEYS.forEach((key) => {
        if (Array.isArray(override[key])) content[key] = override[key];
      });
      if (override.poster && typeof override.poster.src === 'string') {
        content.poster = override.poster;
      }
      if (override.blocks) {
        content.blocks = { ...content.blocks, ...override.blocks };
      }
    } catch (_) {
      // Le contenu par défaut reste disponible si la sauvegarde est invalide.
    }

    return content;
  }

  const content = loadContent();
  const currentPage = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
  const pageKey = currentPage === 'programme.html'
    ? 'programme'
    : currentPage === 'galerie.html' ? 'galerie' : 'index';

  /** Insère une valeur texte sans interpréter de HTML. */
  function setText(element, value) {
    if (element && typeof value === 'string') element.textContent = value;
  }

  /** Accepte seulement les protocoles d’image prévus par le site. */
  function safeImage(value) {
    try {
      const url = new URL(value, location.href);
      const webProtocol = ['http:', 'https:'].includes(url.protocol);
      const imageData = url.protocol === 'data:'
        && /^data:image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml);/i.test(value);
      return webProtocol || imageData ? value : '';
    } catch (_) {
      return '';
    }
  }

  /* ==================== CONTENU DE PAGE ==================== */
  function renderTextFields() {
    document.querySelectorAll('[data-content]').forEach((element) => {
      setText(element, content.fields[element.dataset.content]);
    });
  }

  /** Construit un repère statistique avec les API DOM sûres. */
  function createKpiCard(item) {
    const card = document.createElement('article');
    card.className = 'kpi-card';

    const label = document.createElement('span');
    label.className = 'kpi-label';
    setText(label, item.label);

    const value = document.createElement('strong');
    setText(value, item.value);

    const caption = document.createElement('span');
    caption.className = 'kpi-caption';
    setText(caption, item.caption);
    card.append(label, value, caption);
    return card;
  }

  /** Construit une carte d’atelier. */
  function createWorkshopCard(workshop, index) {
    const article = document.createElement('article');
    article.className = 'program-card';

    const top = document.createElement('div');
    top.className = 'program-top';
    const number = document.createElement('span');
    number.className = 'program-number';
    setText(number, String(index + 1).padStart(2, '0'));
    const pill = document.createElement('span');
    pill.className = 'status-pill';
    setText(pill, workshop.kind);
    top.append(number, pill);

    const title = document.createElement('h3');
    setText(title, workshop.title);
    const summary = document.createElement('p');
    summary.className = 'program-summary';
    setText(summary, workshop.summary);

    const detail = document.createElement('div');
    detail.className = 'program-detail';
    const detailLabel = document.createElement('span');
    detailLabel.className = 'overline';
    setText(detailLabel, workshop.detailLabel);
    const detailText = document.createElement('p');
    setText(detailText, workshop.detail);
    detail.append(detailLabel, detailText);

    const skills = document.createElement('div');
    skills.className = 'skill-tags';
    (Array.isArray(workshop.skills) ? workshop.skills : []).forEach((skill) => {
      const tag = document.createElement('span');
      setText(tag, skill);
      skills.append(tag);
    });

    article.append(top, title, summary, detail, skills);
    return article;
  }

  /** Remplace le contenu par défaut des hôtes dynamiques. */
  function renderPageContent() {
    const kpiHost = document.querySelector('[data-kpi-grid]');
    if (kpiHost) {
      kpiHost.replaceChildren(...content.kpis.map(createKpiCard));
    }

    const workshopHost = document.querySelector('[data-workshop-grid]');
    if (workshopHost) {
      workshopHost.replaceChildren(...content.workshops.map(createWorkshopCard));
    }

    renderCustomBlocks();
  }

  /** Ajoute les blocs éditables propres à la page. */
  function renderCustomBlocks() {
    const blocks = content.blocks && Array.isArray(content.blocks[pageKey])
      ? content.blocks[pageKey]
      : [];
    const main = document.querySelector('main');
    if (!main || !blocks.length) return;

    blocks.forEach((block) => {
      const section = document.createElement('section');
      section.className = 'section wrap custom-info-block';
      const card = document.createElement('div');
      card.className = 'company-card';
      const heading = document.createElement('h2');
      setText(heading, block.title);
      const paragraph = document.createElement('p');
      setText(paragraph, block.text);
      card.append(heading, paragraph);
      section.append(card);
      main.append(section);
    });
  }

  /* ==================== NAVIGATION MOBILE ==================== */
  function initializeNavigation() {
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
      navigation.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
      });
    }

    document.querySelectorAll('.navigation a[data-page]').forEach((link) => {
      if (link.dataset.page === currentPage) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ==================== GALERIE & FILTRES ==================== */
  function createGalleryCard(item, index, total) {
    const article = document.createElement('article');
    article.className = 'gallery-card';
    article.dataset.galleryCard = '';
    article.dataset.tag = typeof item.tag === 'string' ? item.tag : '';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'gallery-trigger';
    trigger.dataset.lightboxTrigger = '';
    trigger.setAttribute('aria-label', `Agrandir : ${item.title || 'image'}`);
    if (item.tag === 'Affiche souvenir') trigger.classList.add('poster-trigger');

    const image = document.createElement('img');
    image.src = safeImage(item.src);
    image.alt = typeof item.alt === 'string' ? item.alt : '';
    image.loading = 'lazy';
    trigger.append(image);

    const badge = document.createElement('span');
    badge.className = 'image-index';
    badge.textContent = String(index + 1).padStart(2, '0');
    const totalLabel = document.createElement('i');
    totalLabel.textContent = ` / ${String(total).padStart(2, '0')}`;
    badge.append(totalLabel);
    trigger.append(badge);

    if (item.tag === 'Affiche souvenir') {
      const overlay = document.createElement('span');
      overlay.className = 'poster-overlay';
      const label = document.createElement('b');
      label.textContent = 'VOS RÊVES · SÉMINAIRE';
      const title = document.createElement('strong');
      title.textContent = item.title || '';
      const year = document.createElement('small');
      year.textContent = 'VALENCE · 2026';
      overlay.append(label, title, year);
      trigger.append(overlay);
    }

    const body = document.createElement('div');
    body.className = 'gallery-card-body';
    const meta = document.createElement('div');
    meta.className = 'gallery-meta';
    const tag = document.createElement('span');
    tag.className = 'tag-label';
    setText(tag, item.tag);
    const imageNote = document.createElement('span');
    imageNote.className = 'image-no';
    imageNote.textContent = 'VALENCE · IMAGE D’ILLUSTRATION';
    meta.append(tag, imageNote);

    const title = document.createElement('h2');
    setText(title, item.title);
    const caption = document.createElement('p');
    setText(caption, item.caption);
    body.append(meta, title, caption);
    article.append(trigger, body);
    return article;
  }

  /** Construit les filtres, images et visuel d’affiche personnalisable. */
  function renderGallery() {
    const grid = document.querySelector('[data-gallery-grid]');
    if (!grid) return;

    const tags = ['Tous', ...new Set(content.gallery.map((item) => item.tag).filter(Boolean))];
    const filterBar = document.querySelector('.filter-bar');
    if (filterBar) {
      filterBar.replaceChildren();
      tags.forEach((tag, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.filter = tag;
        button.setAttribute('aria-pressed', String(index === 0));
        button.append(document.createTextNode(tag));
        if (index === 0) {
          const count = document.createElement('span');
          count.dataset.filterCount = '';
          count.textContent = String(content.gallery.length).padStart(2, '0');
          button.append(' ', count);
        }
        filterBar.append(button);
      });
    }

    grid.replaceChildren(...content.gallery.map((item, index) => (
      createGalleryCard(item, index, content.gallery.length)
    )));

    const artwork = document.querySelector('[data-poster-art]');
    const posterSource = safeImage(content.poster && content.poster.src || '');
    if (artwork && posterSource) {
      artwork.style.backgroundImage = `url("${posterSource.replaceAll('"', '%22')}")`;
    }
  }

  function initializeFilters() {
    const buttons = [...document.querySelectorAll('[data-filter]')];
    const cards = [...document.querySelectorAll('[data-gallery-card]')];
    const status = document.querySelector('[data-gallery-status]');

    function applyFilter(filter) {
      buttons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
      });
      const count = cards.reduce((visibleCount, card) => {
        const matches = filter === 'Tous' || card.dataset.tag === filter;
        card.hidden = !matches;
        return visibleCount + Number(matches);
      }, 0);
      if (status) {
        status.textContent = `${count} ${count === 1 ? 'image affichée' : 'images affichées'}`;
      }
    }

    buttons.forEach((button) => {
      button.addEventListener('click', () => applyFilter(button.dataset.filter));
    });
  }

  /* ==================== VISIONNEUSE ACCESSIBLE ==================== */
  function initializeLightbox() {
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

    function getVisibleItems() {
      return [...document.querySelectorAll('[data-gallery-card]:not([hidden])')].map((card) => ({
        trigger: card.querySelector('[data-lightbox-trigger]'),
        image: card.querySelector('img'),
        title: card.querySelector('h2')?.textContent.trim() || '',
        caption: card.querySelector('.gallery-card-body p')?.textContent.trim() || '',
      }));
    }

    function showItem(requestedIndex) {
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
    }

    function openLightbox(trigger) {
      const index = getVisibleItems().findIndex((item) => item.trigger === trigger);
      if (index < 0) return;
      returnFocus = trigger;
      showItem(index);
      dialog.hidden = false;
      document.body.classList.add('modal-open');
      closeButton.focus();
    }

    function closeLightbox() {
      if (dialog.hidden) return;
      dialog.hidden = true;
      document.body.classList.remove('modal-open');
      if (returnFocus?.isConnected) returnFocus.focus();
    }

    /** Conserve le focus dans la boîte de dialogue pendant la navigation clavier. */
    function trapDialogFocus(event) {
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
    }

    image.addEventListener('error', () => image.classList.add('image-failed'));
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => openLightbox(trigger));
    });
    closeButton.addEventListener('click', closeLightbox);
    previousButton.addEventListener('click', () => showItem(currentIndex - 1));
    nextButton.addEventListener('click', () => showItem(currentIndex + 1));
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeLightbox();
    });
    document.addEventListener('keydown', trapDialogFocus);
  }

  /* ==================== INITIALISATION ==================== */
  renderTextFields();
  renderPageContent();
  initializeNavigation();
  renderGallery();
  initializeFilters();
  initializeLightbox();
})();
