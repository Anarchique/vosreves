/* ==================== CONFIGURATION ==================== */
(() => {
  const ADMIN_PASSWORD = 'admin'; // Changez cette valeur avant publication, mais ce contrôle reste uniquement côté navigateur.
  const STORAGE_KEY = 'vos-reves-site-content-v1';
  const defaults = window.SITE_DEFAULT_CONTENT;
  const clone = value => JSON.parse(JSON.stringify(value));
  const $ = selector => document.querySelector(selector);
  const safeText = (value, fallback = '') => typeof value === 'string' ? value : fallback;
  let content = clone(defaults);
  let activePage = 'index';
  const fieldsHost = $('[data-fields]');
  const status = $('[data-status]');
  const esc = value => safeText(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  /* ==================== CONNEXION LOCALE ==================== */
  const login = $('[data-login]');
  const dashboard = $('[data-dashboard]');
  try { if (sessionStorage.getItem('vos-reves-admin-session') === '1') unlock(); } catch (_) {}
  $('[data-login-form]').addEventListener('submit', event => {
    event.preventDefault();
    if ($('#admin-password').value === ADMIN_PASSWORD) {
      try { sessionStorage.setItem('vos-reves-admin-session', '1'); } catch (_) {}
      unlock();
    } else $('[data-login-error]').textContent = 'Mot de passe incorrect.';
  });
  function unlock() {
    login.hidden = true; dashboard.hidden = false;
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) content = mergeDefaults(JSON.parse(saved)); } catch (_) { status.textContent = 'La sauvegarde locale est illisible ; les valeurs par défaut sont chargées.'; }
    renderAll();
  }
  function mergeDefaults(incoming) {
    if (!incoming || typeof incoming !== 'object') throw new Error('JSON invalide');
    const merged = clone(defaults);
    if (incoming.fields && typeof incoming.fields === 'object') merged.fields = {...merged.fields, ...incoming.fields};
    for (const key of ['kpis','workshops','gallery']) if (Array.isArray(incoming[key])) merged[key] = incoming[key];
    if (incoming.poster && typeof incoming.poster.src === 'string') merged.poster.src = incoming.poster.src;
    if (incoming.blocks && typeof incoming.blocks === 'object') for (const page of ['index','programme','galerie']) if (Array.isArray(incoming.blocks[page])) merged.blocks[page] = incoming.blocks[page];
    return merged;
  }

  /* ==================== CHAMPS DE PAGE ==================== */
  const labels = {index:{title:'Titre principal',lead:'Texte d’introduction',companyTitle:'Titre — présentation',companyLead:'Phrase d’accroche — entreprise',companyText:'Présentation de l’entreprise',objectivesTitle:'Titre — objectifs',objectivesIntro:'Introduction — objectifs',objective1Title:'Objectif 1 — titre',objective1Text:'Objectif 1 — texte',objective2Title:'Objectif 2 — titre',objective2Text:'Objectif 2 — texte',objective3Title:'Objectif 3 — titre',objective3Text:'Objectif 3 — texte',objective4Title:'Objectif 4 — titre',objective4Text:'Objectif 4 — texte',timelineTitle:'Titre — déroulé',timeline1Title:'Déroulé matin — titre',timeline1Text:'Déroulé matin — texte',timeline2Title:'Déroulé après-midi — titre',timeline2Text:'Déroulé après-midi — texte',timeline3Title:'Déroulé clôture — titre',timeline3Text:'Déroulé clôture — texte',quote:'Citation',outdoorTitle:'Titre — après-midi',outdoorText:'Texte — après-midi'},programme:{title:'Titre principal',lead:'Texte d’introduction',workshopIntro:'Titre — ateliers',takeawayTitle:'Titre — synthèse'},galerie:{title:'Titre principal',lead:'Texte d’introduction',posterTitle:'Titre de l’affiche',posterText:'Texte de présentation de l’affiche'}};
  function renderFields() {
    fieldsHost.replaceChildren();
    Object.entries(labels[activePage]).forEach(([key,label]) => {
      const fullKey = `${activePage}.${key}`; const wrap = document.createElement('label'); wrap.className = 'admin-field';
      const title = document.createElement('span'); title.textContent = label;
      const input = document.createElement(key === 'title' || key.endsWith('Title') || key.endsWith('Lead') ? 'input' : 'textarea');
      input.value = safeText(content.fields[fullKey]); input.dataset.field = fullKey;
      input.addEventListener('input', () => { content.fields[fullKey] = input.value; dirty(); });
      wrap.append(title,input); fieldsHost.append(wrap);
    });
  }
  document.querySelectorAll('[data-page-tab]').forEach(button => button.addEventListener('click', () => {
    activePage = button.dataset.pageTab;
    document.querySelectorAll('[data-page-tab]').forEach(tab => tab.setAttribute('aria-selected', String(tab === button)));
    renderFields(); renderBlocks();
  }));

  /* ==================== ÉDITEURS DE LISTES ==================== */
  function inputField(label,value,callback,type='text') {
    const wrap=document.createElement('label'); wrap.className='admin-field'; const span=document.createElement('span'); span.textContent=label;
    const input=document.createElement(type==='textarea'?'textarea':'input'); if(type!=='textarea') input.type=type; input.value=safeText(value); input.addEventListener('input',()=>{callback(input.value);dirty();}); wrap.append(span,input); return wrap;
  }
  function actionButton(label,callback,subtle=false) { const b=document.createElement('button'); b.type='button'; b.className='admin-button small'+(subtle?' secondary':''); b.textContent=label; b.addEventListener('click',callback); return b; }
  function card(host,title,fields,move,remove) {
    const box=document.createElement('article'); box.className='admin-record'; const head=document.createElement('div'); head.className='admin-record-head'; const h=document.createElement('strong'); h.textContent=title; head.append(h);
    const actions=document.createElement('div'); actions.className='admin-record-actions'; if(move){actions.append(actionButton('↑',move.up,true),actionButton('↓',move.down,true));} actions.append(actionButton('Supprimer',remove,true)); head.append(actions); box.append(head);
    const grid=document.createElement('div'); grid.className='admin-record-fields'; fields.forEach(field=>grid.append(field)); box.append(grid); host.append(box); return box;
  }
  function reorder(list,index,delta) { const target=index+delta; if(target<0||target>=list.length)return; [list[index],list[target]]=[list[target],list[index]]; renderAll(); dirty(); }
  function renderKpis(){const host=$('[data-kpis]');host.replaceChildren(); content.kpis.forEach((k,i)=>card(host,`Chiffre ${i+1}`,[inputField('Libellé',k.label,v=>k.label=v),inputField('Valeur',k.value,v=>k.value=v),inputField('Légende',k.caption,v=>k.caption=v)],null,()=>{content.kpis.splice(i,1);renderKpis();dirty();}));}
  function renderWorkshops(){const host=$('[data-workshops]');host.replaceChildren(); content.workshops.forEach((w,i)=>card(host,`Atelier ${String(i+1).padStart(2,'0')}`,[inputField('Titre',w.title,v=>w.title=v),inputField('Type',w.kind,v=>w.kind=v),inputField('Résumé',w.summary,v=>w.summary=v,'textarea'),inputField('Intitulé du détail',w.detailLabel,v=>w.detailLabel=v),inputField('Détail',w.detail,v=>w.detail=v,'textarea'),inputField('Compétences (séparées par des virgules)',(w.skills||[]).join(', '),v=>w.skills=v.split(',').map(x=>x.trim()).filter(Boolean))],{up:()=>reorder(content.workshops,i,-1),down:()=>reorder(content.workshops,i,1)},()=>{content.workshops.splice(i,1);renderWorkshops();dirty();}));}
  async function fileData(file){if(!file)return ''; if(!file.type.startsWith('image/'))throw new Error('Sélectionnez un fichier image.'); return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Lecture du fichier impossible.'));reader.readAsDataURL(file);});}
  function renderGallery(){const host=$('[data-gallery]');host.replaceChildren(); content.gallery.forEach((g,i)=>{
    const fields=[inputField('Titre',g.title,v=>g.title=v),inputField('Légende',g.caption,v=>g.caption=v,'textarea'),inputField('Catégorie / filtre',g.tag,v=>g.tag=v),inputField('Texte alternatif',g.alt,v=>g.alt=v),inputField('URL de l’image',g.src,v=>{g.src=v;renderGallery();dirty();},'url')];
    const upload=document.createElement('label');upload.className='admin-button secondary import-button';upload.textContent='Choisir un fichier image';const file=document.createElement('input');file.type='file';file.accept='image/*';file.hidden=true;file.addEventListener('change',async()=>{try{g.src=await fileData(file.files[0]);renderGallery();dirty();}catch(e){alert(e.message);}});upload.append(file);fields.push(upload);
    const preview=document.createElement('img');preview.className='admin-thumb';preview.src=g.src;preview.alt='';preview.onerror=()=>preview.hidden=true;fields.push(preview);
    card(host,`Visuel ${String(i+1).padStart(2,'0')}`,[...fields],{up:()=>reorder(content.gallery,i,-1),down:()=>reorder(content.gallery,i,1)},()=>{content.gallery.splice(i,1);renderGallery();dirty();});
  });}
  function renderBlocks(){const host=$('[data-blocks]');host.replaceChildren();(content.blocks[activePage]||[]).forEach((block,i)=>card(host,`Bloc ${i+1} · ${activePage}`,[inputField('Titre',block.title,v=>block.title=v),inputField('Texte',block.text,v=>block.text=v,'textarea')],null,()=>{content.blocks[activePage].splice(i,1);renderBlocks();dirty();}));}
  function renderPoster(){const url=$('[data-poster-url]'),preview=$('[data-poster-preview]');url.value=safeText(content.poster.src);preview.src=url.value;preview.hidden=!url.value;preview.onerror=()=>preview.hidden=true;}
  $('[data-poster-url]').addEventListener('input',e=>{content.poster.src=e.target.value;renderPoster();dirty();});
  $('[data-poster-file]').addEventListener('change',async e=>{try{content.poster.src=await fileData(e.target.files[0]);renderPoster();dirty();}catch(err){alert(err.message);}});
  function renderAll(){renderFields();renderKpis();renderWorkshops();renderGallery();renderBlocks();renderPoster();}
  function dirty(){status.textContent='Modifications en cours — pensez à enregistrer et à exporter pour publier.';}

  /* ==================== ACTIONS ==================== */
  $('[data-save]').addEventListener('click',()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(content));status.textContent='Enregistré dans le stockage local de ce navigateur.';}catch(e){status.textContent='Enregistrement impossible (stockage plein ?). Exportez le JSON et réduisez la taille des images.';}});
  $('[data-reset]').addEventListener('click',()=>{if(!confirm('Réinitialiser toutes les données à leur valeur par défaut ?'))return;content=clone(defaults);try{localStorage.removeItem(STORAGE_KEY);}catch(_){}renderAll();status.textContent='Valeurs par défaut rétablies. Enregistrez pour mettre à jour ce navigateur.';});
  $('[data-export]').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='vos-reves-content.json';a.click();URL.revokeObjectURL(url);status.textContent='Fichier JSON exporté. Intégrez son objet dans content.js pour publier.';});
  $('[data-import]').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{content=mergeDefaults(JSON.parse(await file.text()));renderAll();dirty();status.textContent='JSON importé. Enregistrez pour conserver les données dans ce navigateur.';}catch(_){status.textContent='Import refusé : fichier JSON invalide ou incompatible.';}e.target.value='';});
  $('[data-add-kpi]').addEventListener('click',()=>{content.kpis.push({label:'NOUVEAU REPÈRE',value:'00',caption:'Description'});renderKpis();dirty();});
  $('[data-add-workshop]').addEventListener('click',()=>{content.workshops.push({title:'Nouvel atelier',kind:'ATELIER',summary:'',detailLabel:'À TRAVAILLER',detail:'',skills:[]});renderWorkshops();dirty();});
  $('[data-add-photo]').addEventListener('click',()=>{content.gallery.push({title:'Nouvelle photo',caption:'',tag:'Nouvelle catégorie',src:'',alt:''});renderGallery();dirty();});
  $('[data-add-block]').addEventListener('click',()=>{content.blocks[activePage].push({title:'Nouvelle information',text:''});renderBlocks();dirty();});
})();
