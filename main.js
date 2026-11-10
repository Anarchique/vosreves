/* ==================== CONTENU & NAVIGATION ==================== */
(() => {
  const clone = value => JSON.parse(JSON.stringify(value));
  let content = clone(window.SITE_DEFAULT_CONTENT || {fields:{},kpis:[],workshops:[],gallery:[],blocks:{},poster:{src:''}});
  try {
    const saved = localStorage.getItem('vos-reves-site-content-v1');
    if (saved) {
      const override = JSON.parse(saved);
      if (override.fields) content.fields = {...content.fields,...override.fields};
      ['kpis','workshops','gallery'].forEach(key => { if (Array.isArray(override[key])) content[key] = override[key]; });
      if (override.poster && typeof override.poster.src === 'string') content.poster = override.poster;
      if (override.blocks) content.blocks = {...content.blocks,...override.blocks};
    }
  } catch (_) { /* Les valeurs par défaut restent disponibles si le stockage est invalide. */ }
  const text = (element,value) => { if (element && typeof value === 'string') element.textContent = value; };
  const safeImage = value => { try { const url = new URL(value, location.href); return ['http:','https:'].includes(url.protocol) || (url.protocol === 'data:' && /^data:image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml);/i.test(value)) ? value : ''; } catch (_) { return ''; } };
  document.querySelectorAll('[data-content]').forEach(element => text(element, content.fields[element.dataset.content]));

  /* ==================== NAVIGATION MOBILE ==================== */
  const menuButton = document.querySelector('.menu-toggle'); const navigation = document.querySelector('.navigation');
  if (menuButton && navigation) {
    const closeMenu = () => { menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Ouvrir le menu'); navigation.classList.remove('open'); };
    menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') === 'true'; menuButton.setAttribute('aria-expanded',String(!open)); menuButton.setAttribute('aria-label',open?'Ouvrir le menu':'Fermer le menu'); navigation.classList.toggle('open',!open); });
    navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  }
  const currentPage = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
  document.querySelectorAll('.navigation a[data-page]').forEach(link => { if(link.dataset.page===currentPage) link.setAttribute('aria-current','page'); });

  /* ==================== REPÈRES ET ATELIERS ==================== */
  const kpiHost=document.querySelector('[data-kpi-grid]');
  if(kpiHost){kpiHost.replaceChildren();content.kpis.forEach(item=>{const card=document.createElement('article');card.className='kpi-card';const label=document.createElement('span');label.className='kpi-label';text(label,item.label);const value=document.createElement('strong');text(value,item.value);const caption=document.createElement('span');caption.className='kpi-caption';text(caption,item.caption);card.append(label,value,caption);kpiHost.append(card);});}
  const workshopHost=document.querySelector('[data-workshop-grid]');
  if(workshopHost){workshopHost.replaceChildren();content.workshops.forEach((workshop,index)=>{const article=document.createElement('article');article.className='program-card';const top=document.createElement('div');top.className='program-top';const number=document.createElement('span');number.className='program-number';text(number,String(index+1).padStart(2,'0'));const pill=document.createElement('span');pill.className='status-pill';text(pill,workshop.kind);top.append(number,pill);const title=document.createElement('h3');text(title,workshop.title);const summary=document.createElement('p');summary.className='program-summary';text(summary,workshop.summary);const detail=document.createElement('div');detail.className='program-detail';const overline=document.createElement('span');overline.className='overline';text(overline,workshop.detailLabel);const detailText=document.createElement('p');text(detailText,workshop.detail);detail.append(overline,detailText);const skills=document.createElement('div');skills.className='skill-tags';(Array.isArray(workshop.skills)?workshop.skills:[]).forEach(skill=>{const tag=document.createElement('span');text(tag,skill);skills.append(tag);});article.append(top,title,summary,detail,skills);workshopHost.append(article);});}

  /* ==================== BLOCS LIBRES ==================== */
  const pageKey = currentPage==='programme.html'?'programme':currentPage==='galerie.html'?'galerie':'index';
  const blocks=content.blocks && Array.isArray(content.blocks[pageKey])?content.blocks[pageKey]:[];
  if(blocks.length){const main=document.querySelector('main');blocks.forEach(block=>{const section=document.createElement('section');section.className='section wrap custom-info-block';const card=document.createElement('div');card.className='company-card';const heading=document.createElement('h2');text(heading,block.title);const paragraph=document.createElement('p');text(paragraph,block.text);card.append(heading,paragraph);section.append(card);main.append(section);});}

  /* ==================== GALERIE DYNAMIQUE ==================== */
  const grid=document.querySelector('[data-gallery-grid]');
  if(grid){
    const tags=['Tous',...new Set(content.gallery.map(item=>item.tag).filter(Boolean))];const filterBar=document.querySelector('.filter-bar');
    filterBar.replaceChildren();tags.forEach((tag,index)=>{const button=document.createElement('button');button.type='button';button.dataset.filter=tag;button.setAttribute('aria-pressed',String(index===0));button.append(document.createTextNode(tag));if(index===0){const count=document.createElement('span');count.dataset.filterCount='';count.textContent=String(content.gallery.length).padStart(2,'0');button.append(' ',count);}filterBar.append(button);});
    grid.replaceChildren();content.gallery.forEach((item,index)=>{
      const article=document.createElement('article');article.className='gallery-card';article.dataset.galleryCard='';article.dataset.tag=typeof item.tag==='string'?item.tag:'';
      const trigger=document.createElement('button');trigger.type='button';trigger.className='gallery-trigger';trigger.dataset.lightboxTrigger='';trigger.setAttribute('aria-label',`Agrandir : ${item.title||'image'}`);
      if(item.tag==='Affiche souvenir')trigger.classList.add('poster-trigger');const image=document.createElement('img');image.src=safeImage(item.src);image.alt=typeof item.alt==='string'?item.alt:'';image.loading='lazy';trigger.append(image);const badge=document.createElement('span');badge.className='image-index';badge.textContent=String(index+1).padStart(2,'0');const total=document.createElement('i');total.textContent=` / ${String(content.gallery.length).padStart(2,'0')}`;badge.append(total);trigger.append(badge);
      if(item.tag==='Affiche souvenir'){const overlay=document.createElement('span');overlay.className='poster-overlay';const label=document.createElement('b');label.textContent='VOS RÊVES · SÉMINAIRE';const strong=document.createElement('strong');strong.textContent=item.title||'';const year=document.createElement('small');year.textContent='VALENCE · 2026';overlay.append(label,strong,year);trigger.append(overlay);}
      const body=document.createElement('div');body.className='gallery-card-body';const meta=document.createElement('div');meta.className='gallery-meta';const tag=document.createElement('span');tag.className='tag-label';text(tag,item.tag);const imageNo=document.createElement('span');imageNo.className='image-no';imageNo.textContent='VALENCE · IMAGE D’ILLUSTRATION';meta.append(tag,imageNo);const heading=document.createElement('h2');text(heading,item.title);const caption=document.createElement('p');text(caption,item.caption);body.append(meta,heading,caption);article.append(trigger,body);grid.append(article);
    });
    const art=document.querySelector('[data-poster-art]');const posterSource=safeImage(content.poster&&content.poster.src||'');if(art&&posterSource)art.style.backgroundImage=`url("${posterSource.replaceAll('\"','%22')}")`;
  }

  /* ==================== FILTRES DE LA GALERIE ==================== */
  const filterButtons=[...document.querySelectorAll('[data-filter]')];const galleryCards=[...document.querySelectorAll('[data-gallery-card]')];const galleryStatus=document.querySelector('[data-gallery-status]');
  const visibleCards=()=>galleryCards.filter(card=>!card.hidden);
  const applyFilter=filter=>{filterButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));const count=galleryCards.reduce((sum,card)=>{const matches=filter==='Tous'||card.dataset.tag===filter;card.hidden=!matches;return sum+Number(matches);},0);if(galleryStatus)galleryStatus.textContent=`${count} ${count===1?'image affichée':'images affichées'}`;};
  filterButtons.forEach(button=>button.addEventListener('click',()=>applyFilter(button.dataset.filter)));

  /* ==================== VISIONNEUSE ACCESSIBLE ==================== */
  const dialog=document.querySelector('[data-lightbox]');const triggers=[...document.querySelectorAll('[data-lightbox-trigger]')];
  if(!dialog||!triggers.length)return;
  const image=dialog.querySelector('[data-lightbox-image]');const title=dialog.querySelector('[data-lightbox-title]');const caption=dialog.querySelector('[data-lightbox-caption]');const countLabel=dialog.querySelector('[data-lightbox-count]');const closeButton=dialog.querySelector('[data-lightbox-close]');const previousButton=dialog.querySelector('[data-lightbox-prev]');const nextButton=dialog.querySelector('[data-lightbox-next]');let currentIndex=0;let returnFocus=null;
  const getVisibleItems=()=>visibleCards().map(card=>({trigger:card.querySelector('[data-lightbox-trigger]'),image:card.querySelector('img'),title:card.querySelector('h2')?.textContent.trim()||'',caption:card.querySelector('.gallery-card-body p')?.textContent.trim()||''}));
  const showItem=requested=>{const items=getVisibleItems();if(!items.length)return;currentIndex=Math.max(0,Math.min(requested,items.length-1));const item=items[currentIndex];image.classList.remove('image-failed');image.src=item.image.currentSrc||item.image.src;image.alt=item.image.alt;title.textContent=item.title;caption.textContent=item.caption;countLabel.textContent=`${String(currentIndex+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;previousButton.hidden=items.length<2||currentIndex===0;nextButton.hidden=items.length<2||currentIndex===items.length-1;};
  const open=trigger=>{const index=getVisibleItems().findIndex(item=>item.trigger===trigger);if(index<0)return;returnFocus=trigger;showItem(index);dialog.hidden=false;document.body.classList.add('modal-open');closeButton.focus();};
  const close=()=>{if(dialog.hidden)return;dialog.hidden=true;document.body.classList.remove('modal-open');if(returnFocus?.isConnected)returnFocus.focus();};
  image.addEventListener('error',()=>image.classList.add('image-failed'));triggers.forEach(trigger=>trigger.addEventListener('click',()=>open(trigger)));closeButton.addEventListener('click',close);previousButton.addEventListener('click',()=>showItem(currentIndex-1));nextButton.addEventListener('click',()=>showItem(currentIndex+1));dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
  document.addEventListener('keydown',event=>{if(dialog.hidden)return;if(event.key==='Escape'){event.preventDefault();close();}else if(event.key==='ArrowLeft'){event.preventDefault();showItem(currentIndex-1);}else if(event.key==='ArrowRight'){event.preventDefault();showItem(currentIndex+1);}else if(event.key==='Tab'){const focusable=[...dialog.querySelectorAll('button:not([hidden])')];const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
})();
