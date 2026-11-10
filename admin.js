/* ==================== CONFIGURATION ==================== */
(() => {
  const ADMIN_PASSWORD = 'admin'; // Contrôle local uniquement, sans protection serveur.
  const STORAGE_KEY = 'vos-reves-site-content-v1';
  const SESSION_KEY = 'vos-reves-admin-session';
  const PAGE_KEYS = ['index', 'programme', 'galerie'];
  const LIST_KEYS = ['kpis', 'workshops', 'gallery'];
  const defaults = window.SITE_DEFAULT_CONTENT;
  const $ = (selector) => document.querySelector(selector);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const safeText = (value, fallback = '') => (typeof value === 'string' ? value : fallback);

  let content = clone(defaults);
  let activePage = 'index';
  const login = $('[data-login]');
  const dashboard = $('[data-dashboard]');
  const fieldsHost = $('[data-fields]');
  const status = $('[data-status]');

  /* ==================== SESSION & DONNÉES ==================== */
  function mergeDefaults(incoming) {
    if (!incoming || typeof incoming !== 'object') {
      throw new Error('JSON invalide');
    }

    const merged = clone(defaults);
    if (incoming.fields && typeof incoming.fields === 'object') {
      merged.fields = { ...merged.fields, ...incoming.fields };
    }
    LIST_KEYS.forEach((key) => {
      if (Array.isArray(incoming[key])) merged[key] = incoming[key];
    });
    if (incoming.poster && typeof incoming.poster.src === 'string') {
      merged.poster.src = incoming.poster.src;
    }
    if (incoming.blocks && typeof incoming.blocks === 'object') {
      PAGE_KEYS.forEach((page) => {
        if (Array.isArray(incoming.blocks[page])) merged.blocks[page] = incoming.blocks[page];
      });
    }
    return merged;
  }

  /** Ouvre l’éditeur et charge la sauvegarde locale si elle existe. */
  function unlock() {
    login.hidden = true;
    dashboard.hidden = false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) content = mergeDefaults(JSON.parse(saved));
    } catch (_) {
      status.textContent = 'La sauvegarde locale est illisible ; les valeurs par défaut sont chargées.';
    }
    renderAll();
  }

  try {
    if (sessionStorage.getItem(SESSION_KEY) === '1') unlock();
  } catch (_) {
    // La connexion par formulaire reste disponible si le stockage de session est bloqué.
  }

  $('[data-login-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    if ($('#admin-password').value === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch (_) {
        // La session ne persiste pas, mais l’accès courant reste fonctionnel.
      }
      unlock();
    } else {
      $('[data-login-error]').textContent = 'Mot de passe incorrect.';
    }
  });

  /* ==================== CHAMPS DE PAGE ==================== */
  const labels = {
    index: {
      title: 'Titre principal',
      lead: 'Texte d’introduction',
      companyTitle: 'Titre — présentation',
      companyLead: 'Phrase d’accroche — entreprise',
      companyText: 'Présentation de l’entreprise',
      objectivesTitle: 'Titre — objectifs',
      objectivesIntro: 'Introduction — objectifs',
      objective1Title: 'Objectif 1 — titre',
      objective1Text: 'Objectif 1 — texte',
      objective2Title: 'Objectif 2 — titre',
      objective2Text: 'Objectif 2 — texte',
      objective3Title: 'Objectif 3 — titre',
      objective3Text: 'Objectif 3 — texte',
      objective4Title: 'Objectif 4 — titre',
      objective4Text: 'Objectif 4 — texte',
      timelineTitle: 'Titre — déroulé',
      timeline1Title: 'Déroulé matin — titre',
      timeline1Text: 'Déroulé matin — texte',
      timeline2Title: 'Déroulé après-midi — titre',
      timeline2Text: 'Déroulé après-midi — texte',
      timeline3Title: 'Déroulé clôture — titre',
      timeline3Text: 'Déroulé clôture — texte',
      quote: 'Citation',
      outdoorTitle: 'Titre — après-midi',
      outdoorText: 'Texte — après-midi',
    },
    programme: {
      title: 'Titre principal',
      lead: 'Texte d’introduction',
      workshopIntro: 'Titre — ateliers',
      takeawayTitle: 'Titre — synthèse',
    },
    galerie: {
      title: 'Titre principal',
      lead: 'Texte d’introduction',
      posterTitle: 'Titre de l’affiche',
      posterText: 'Texte de présentation de l’affiche',
    },
  };

  /** Crée un champ de texte administrable avec liaison à l’objet contenu. */
  function createPageField(key, label) {
    const fullKey = `${activePage}.${key}`;
    const wrapper = document.createElement('label');
    wrapper.className = 'admin-field';
    const title = document.createElement('span');
    title.textContent = label;

    const isSingleLine = key === 'title' || key.endsWith('Title') || key.endsWith('Lead');
    const input = document.createElement(isSingleLine ? 'input' : 'textarea');
    input.value = safeText(content.fields[fullKey]);
    input.dataset.field = fullKey;
    input.addEventListener('input', () => {
      content.fields[fullKey] = input.value;
      markDirty();
    });

    wrapper.append(title, input);
    return wrapper;
  }

  function renderFields() {
    fieldsHost.replaceChildren();
    Object.entries(labels[activePage]).forEach(([key, label]) => {
      fieldsHost.append(createPageField(key, label));
    });
  }

  document.querySelectorAll('[data-page-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      activePage = button.dataset.pageTab;
      document.querySelectorAll('[data-page-tab]').forEach((tab) => {
        tab.setAttribute('aria-selected', String(tab === button));
      });
      renderFields();
      renderBlocks();
    });
  });

  /* ==================== ÉLÉMENTS D’INTERFACE ==================== */
  /** Crée un champ de formulaire lié à une valeur de contenu. */
  function inputField(label, value, callback, type = 'text') {
    const wrapper = document.createElement('label');
    wrapper.className = 'admin-field';
    const title = document.createElement('span');
    title.textContent = label;

    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') input.type = type;
    input.value = safeText(value);
    input.addEventListener('input', () => {
      callback(input.value);
      markDirty();
    });
    wrapper.append(title, input);
    return wrapper;
  }

  function actionButton(label, callback, subtle = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `admin-button small${subtle ? ' secondary' : ''}`;
    button.textContent = label;
    button.addEventListener('click', callback);
    return button;
  }

  /** Construit un panneau de liste pour les chiffres, ateliers, photos ou blocs. */
  function renderRecord(host, title, fields, move, remove) {
    const record = document.createElement('article');
    record.className = 'admin-record';
    const header = document.createElement('div');
    header.className = 'admin-record-head';
    const heading = document.createElement('strong');
    heading.textContent = title;
    header.append(heading);

    const actions = document.createElement('div');
    actions.className = 'admin-record-actions';
    if (move) {
      actions.append(
        actionButton('↑', move.up, true),
        actionButton('↓', move.down, true),
      );
    }
    actions.append(actionButton('Supprimer', remove, true));
    header.append(actions);

    const grid = document.createElement('div');
    grid.className = 'admin-record-fields';
    fields.forEach((field) => grid.append(field));
    record.append(header, grid);
    host.append(record);
    return record;
  }

  function markDirty() {
    status.textContent = 'Modifications en cours — pensez à enregistrer et à exporter pour publier.';
  }

  /** Convertit une image locale en dataURL afin qu’elle soit exportable. */
  async function fileData(file) {
    if (!file) return '';
    if (!file.type.startsWith('image/')) {
      throw new Error('Sélectionnez un fichier image.');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
      reader.readAsDataURL(file);
    });
  }

  /* ==================== ÉDITEURS DE LISTES ==================== */
  function renderKpis() {
    const host = $('[data-kpis]');
    host.replaceChildren();
    content.kpis.forEach((kpi, index) => {
      renderRecord(host, `Chiffre ${index + 1}`, [
        inputField('Libellé', kpi.label, (value) => { kpi.label = value; }),
        inputField('Valeur', kpi.value, (value) => { kpi.value = value; }),
        inputField('Légende', kpi.caption, (value) => { kpi.caption = value; }),
      ], null, () => {
        content.kpis.splice(index, 1);
        renderKpis();
        markDirty();
      });
    });
  }

  /** Déplace un élément et actualise les listes dépendantes. */
  function reorder(list, index, delta) {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    renderAll();
    markDirty();
  }

  function renderWorkshops() {
    const host = $('[data-workshops]');
    host.replaceChildren();
    content.workshops.forEach((workshop, index) => {
      const fields = [
        inputField('Titre', workshop.title, (value) => { workshop.title = value; }),
        inputField('Type', workshop.kind, (value) => { workshop.kind = value; }),
        inputField('Résumé', workshop.summary, (value) => { workshop.summary = value; }, 'textarea'),
        inputField('Intitulé du détail', workshop.detailLabel, (value) => { workshop.detailLabel = value; }),
        inputField('Détail', workshop.detail, (value) => { workshop.detail = value; }, 'textarea'),
        inputField(
          'Compétences (séparées par des virgules)',
          (workshop.skills || []).join(', '),
          (value) => {
            workshop.skills = value.split(',').map((skill) => skill.trim()).filter(Boolean);
          },
        ),
      ];
      renderRecord(host, `Atelier ${String(index + 1).padStart(2, '0')}`, fields, {
        up: () => reorder(content.workshops, index, -1),
        down: () => reorder(content.workshops, index, 1),
      }, () => {
        content.workshops.splice(index, 1);
        renderWorkshops();
        markDirty();
      });
    });
  }

  /** Prépare les champs et la prévisualisation d’une image de galerie. */
  function createGalleryFields(photo, index) {
    const fields = [
      inputField('Titre', photo.title, (value) => { photo.title = value; }),
      inputField('Légende', photo.caption, (value) => { photo.caption = value; }, 'textarea'),
      inputField('Catégorie / filtre', photo.tag, (value) => { photo.tag = value; }),
      inputField('Texte alternatif', photo.alt, (value) => { photo.alt = value; }),
      inputField('URL de l’image', photo.src, (value) => {
        photo.src = value;
        renderGallery();
        markDirty();
      }, 'url'),
    ];

    const upload = document.createElement('label');
    upload.className = 'admin-button secondary import-button';
    upload.textContent = 'Choisir un fichier image';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.hidden = true;
    file.addEventListener('change', async () => {
      try {
        photo.src = await fileData(file.files[0]);
        renderGallery();
        markDirty();
      } catch (error) {
        alert(error.message);
      }
    });
    upload.append(file);
    fields.push(upload);

    const preview = document.createElement('img');
    preview.className = 'admin-thumb';
    preview.src = photo.src;
    preview.alt = '';
    preview.onerror = () => { preview.hidden = true; };
    fields.push(preview);
    return fields;
  }

  function renderGallery() {
    const host = $('[data-gallery]');
    host.replaceChildren();
    content.gallery.forEach((photo, index) => {
      renderRecord(
        host,
        `Visuel ${String(index + 1).padStart(2, '0')}`,
        createGalleryFields(photo, index),
        {
          up: () => reorder(content.gallery, index, -1),
          down: () => reorder(content.gallery, index, 1),
        },
        () => {
          content.gallery.splice(index, 1);
          renderGallery();
          markDirty();
        },
      );
    });
  }

  function renderBlocks() {
    const host = $('[data-blocks]');
    host.replaceChildren();
    (content.blocks[activePage] || []).forEach((block, index) => {
      renderRecord(host, `Bloc ${index + 1} · ${activePage}`, [
        inputField('Titre', block.title, (value) => { block.title = value; }),
        inputField('Texte', block.text, (value) => { block.text = value; }, 'textarea'),
      ], null, () => {
        content.blocks[activePage].splice(index, 1);
        renderBlocks();
        markDirty();
      });
    });
  }

  /* ==================== AFFICHETTE & INITIALISATION ==================== */
  function renderPoster() {
    const url = $('[data-poster-url]');
    const preview = $('[data-poster-preview]');
    url.value = safeText(content.poster.src);
    preview.src = url.value;
    preview.hidden = !url.value;
    preview.onerror = () => { preview.hidden = true; };
  }

  function renderAll() {
    renderFields();
    renderKpis();
    renderWorkshops();
    renderGallery();
    renderBlocks();
    renderPoster();
  }

  $('[data-poster-url]').addEventListener('input', (event) => {
    content.poster.src = event.target.value;
    renderPoster();
    markDirty();
  });
  $('[data-poster-file]').addEventListener('change', async (event) => {
    try {
      content.poster.src = await fileData(event.target.files[0]);
      renderPoster();
      markDirty();
    } catch (error) {
      alert(error.message);
    }
  });

  /* ==================== ENREGISTREMENT & TRANSFERT ==================== */
  $('[data-save]').addEventListener('click', () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      status.textContent = 'Enregistré dans le stockage local de ce navigateur.';
    } catch (_) {
      status.textContent = 'Enregistrement impossible (stockage plein ?). Exportez le JSON et réduisez la taille des images.';
    }
  });

  $('[data-reset]').addEventListener('click', () => {
    if (!confirm('Réinitialiser toutes les données à leur valeur par défaut ?')) return;
    content = clone(defaults);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // Les données chargées en mémoire sont tout de même réinitialisées.
    }
    renderAll();
    status.textContent = 'Valeurs par défaut rétablies. Enregistrez pour mettre à jour ce navigateur.';
  });

  $('[data-export]').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vos-reves-content.json';
    link.click();
    URL.revokeObjectURL(url);
    status.textContent = 'Fichier JSON exporté. Intégrez son objet dans content.js pour publier.';
  });

  $('[data-import]').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      content = mergeDefaults(JSON.parse(await file.text()));
      renderAll();
      markDirty();
      status.textContent = 'JSON importé. Enregistrez pour conserver les données dans ce navigateur.';
    } catch (_) {
      status.textContent = 'Import refusé : fichier JSON invalide ou incompatible.';
    }
    event.target.value = '';
  });

  $('[data-add-kpi]').addEventListener('click', () => {
    content.kpis.push({ label: 'NOUVEAU REPÈRE', value: '00', caption: 'Description' });
    renderKpis();
    markDirty();
  });
  $('[data-add-workshop]').addEventListener('click', () => {
    content.workshops.push({
      title: 'Nouvel atelier',
      kind: 'ATELIER',
      summary: '',
      detailLabel: 'À TRAVAILLER',
      detail: '',
      skills: [],
    });
    renderWorkshops();
    markDirty();
  });
  $('[data-add-photo]').addEventListener('click', () => {
    content.gallery.push({ title: 'Nouvelle photo', caption: '', tag: 'Nouvelle catégorie', src: '', alt: '' });
    renderGallery();
    markDirty();
  });
  $('[data-add-block]').addEventListener('click', () => {
    content.blocks[activePage].push({ title: 'Nouvelle information', text: '' });
    renderBlocks();
    markDirty();
  });
})();
