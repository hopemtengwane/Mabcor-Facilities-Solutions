(async () => {
  if (window.MABCOR_READY) await window.MABCOR_READY;
const DATA=window.MABCOR_DATA||{};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
// GitHub Pages project sites live under /repository-name/. Resolve bundled assets against
// the current document directory rather than the github.io domain root.
const SITE_BASE_URL=new URL('./',document.baseURI);
function resolveMediaUrl(src=''){
 const value=String(src||'').trim();
 if(!value)return '';
 if(/^(?:https?:|data:|blob:)/i.test(value))return value;
 const local=value.replace(/^\.\//,'').replace(/^\/+/, '');
 return new URL(local,SITE_BASE_URL).href;
}

const menuToggle=$('#menuToggle'),nav=$('#siteNav');
menuToggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':''});
$$('a',nav||document).forEach(a=>a.addEventListener('click',()=>{nav?.classList.remove('open');menuToggle?.setAttribute('aria-expanded','false');document.body.style.overflow=''}));

const progressBar=$('#progressBar');function updateProgress(){const h=document.documentElement,max=h.scrollHeight-h.clientHeight,pct=max>0?(h.scrollTop/max)*100:0;if(progressBar)progressBar.style.width=`${pct}%`}document.addEventListener('scroll',updateProgress,{passive:true});updateProgress();

function buildHero(){
 const wrap=$('#heroSlides'), hero=DATA.hero||[]; if(!wrap||!hero.length)return;
 wrap.innerHTML=''; hero.forEach((src,i)=>{const d=document.createElement('div');d.className='hero-slide'+(i===0?' active':'');d.dataset.src=resolveMediaUrl(src);if(i<2)d.style.backgroundImage=`url('${resolveMediaUrl(src)}')`;wrap.appendChild(d)});
 const total=$('#heroTotal');if(total)total.textContent=`/ ${String(hero.length).padStart(2,'0')}`;
}
buildHero();
const slides=$$('.hero-slide'),current=$('#heroCurrent');let slideIndex=0,heroTimer;
function ensureHeroLoaded(i){const s=slides[i];if(s&&!s.style.backgroundImage)s.style.backgroundImage=`url('${s.dataset.src}')`}
function showSlide(i){if(!slides.length)return;slideIndex=(i+slides.length)%slides.length;ensureHeroLoaded(slideIndex);ensureHeroLoaded((slideIndex+1)%slides.length);slides.forEach((s,n)=>s.classList.toggle('active',n===slideIndex));if(current)current.textContent=String(slideIndex+1).padStart(2,'0')}
function autoHero(){clearInterval(heroTimer);heroTimer=setInterval(()=>showSlide(slideIndex+1),5200)}
$('#heroNext')?.addEventListener('click',()=>{showSlide(slideIndex+1);autoHero()});$('#heroPrev')?.addEventListener('click',()=>{showSlide(slideIndex-1);autoHero()});autoHero();

// Capabilities thumbnails
$$('[data-cap-image]').forEach(img=>{const src=DATA.capabilities?.[img.dataset.capImage];if(src)img.src=resolveMediaUrl(src)});

// Generic five-image site slideshows
const siteSliders=[];
$$('.media-slideshow').forEach((el,si)=>{
 const items=DATA.slots?.[el.dataset.slot]||[]; if(!items.length)return;
 el.innerHTML='';items.forEach((src,i)=>{const im=document.createElement('img');im.src=resolveMediaUrl(src);im.alt='';im.loading=i?'lazy':'eager';im.className=i===0?'active':'';el.appendChild(im)});
 const dots=document.createElement('div');dots.className='media-dots';items.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.className=i===0?'active':'';b.setAttribute('aria-label',`Show image ${i+1}`);dots.appendChild(b)});el.appendChild(dots);
 const state={el,images:$$('img',el),dots:$$('button',dots),i:0};state.dots.forEach((b,i)=>b.addEventListener('click',()=>setMedia(state,i)));siteSliders.push(state);
});
function setMedia(st,i){st.i=(i+st.images.length)%st.images.length;st.images.forEach((im,n)=>im.classList.toggle('active',n===st.i));st.dots.forEach((d,n)=>d.classList.toggle('active',n===st.i))}
// Manual controls for the five-image electrical thumbnail slideshow.
const electricalThumbState=siteSliders.find(st=>st.el.dataset.slot==='electrical-feature-thumb');
$('.electrical-thumb-prev')?.addEventListener('click',()=>{if(electricalThumbState)setMedia(electricalThumbState,electricalThumbState.i-1)});
$('.electrical-thumb-next')?.addEventListener('click',()=>{if(electricalThumbState)setMedia(electricalThumbState,electricalThumbState.i+1)});
setInterval(()=>siteSliders.forEach((st,n)=>setMedia(st,st.i+1)),5600);

// Fixed/parallax windows also rotate through curated five-image groups
$$('[data-bg-slot]').forEach((el,n)=>{const list=DATA.slots?.[el.dataset.bgSlot]||[];if(!list.length)return;let i=0;el.style.backgroundImage=`url('${resolveMediaUrl(list[0])}')`;setInterval(()=>{i=(i+1)%list.length;el.style.backgroundImage=`url('${resolveMediaUrl(list[i])}')`},7200+n*450)});

// Static editable Start a Project background image
const contactSection=$('[data-contact-background]');
if(contactSection){const src=DATA.slots?.['contact-image']?.[0]||window.MABCOR_DEFAULT_DATA?.slots?.['contact-image']?.[0];if(src)contactSection.style.backgroundImage=`url('${resolveMediaUrl(src)}')`;}

// News / community section
const newsGrid=$('#newsGrid');if(newsGrid){newsGrid.innerHTML=(DATA.news||[]).map((n,i)=>`<article class="news-card"><figure><img src="${resolveMediaUrl(n.image||'')}" alt="${n.title||'Mabcor news'}"></figure><div class="news-copy"><span>${n.category||'NEWS'}</span><h3>${n.title||'Mabcor update'}</h3><p>${n.text||''}</p></div></article>`).join('')}

// Contact information from editable data
const C=DATA.contact||{};
$$('a[href^="tel:"]').forEach(a=>{a.href=`tel:${C.phoneHref||'+27783504926'}`;if(a.closest('.contact-meta')||a.closest('footer'))a.textContent=C.phone||'+27 78 350 4926'});
$$('a[href^="mailto:"]').forEach(a=>{a.href=`mailto:${C.email||'info@mabombacorp.co.za'}`;a.textContent=C.email||'info@mabombacorp.co.za'});
const footerLoc=$('.footer-grid>div:nth-child(2) p');if(footerLoc&&C.location)footerLoc.textContent=C.location;

const revealTargets=$$('.company-grid,.section-head,.cap-grid,.logistics-copy,.project-gallery,.plant-intro,.plant-gallery,.delivery-grid,.electrical-showcase-thumb,.electrical-showcase-copy,.credential-grid,.news-grid,.contact-copy,.project-form');revealTargets.forEach(el=>el.classList.add('reveal-ready'));const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');observer.unobserve(e.target)}}),{threshold:.08});revealTargets.forEach(el=>observer.observe(el));

const form=$('#projectForm'),status=$('#formStatus');form?.addEventListener('submit',e=>{e.preventDefault();const oversized=[...($('#attachments')?.files||[])].filter(f=>f.size>20*1024*1024);if(oversized.length){if(status)status.textContent='Please remove files larger than 20 MB before sending.';return}if(status)status.textContent='Your enquiry and attachments are ready. The live mail/storage endpoint will be connected at deployment.'});
const year=$('#year');if(year)year.textContent=new Date().getFullYear();

const attachmentInput=$('#attachments'),fileDropZone=$('#fileDropZone'),selectedFiles=$('#selectedFiles'),MAX_FILE_SIZE=20*1024*1024;
function renderSelectedFiles(){if(!attachmentInput||!selectedFiles)return;selectedFiles.innerHTML='';[...attachmentInput.files].forEach(file=>{const tag=document.createElement('span'),tooLarge=file.size>MAX_FILE_SIZE;tag.className=tooLarge?'file-error':'';tag.textContent=`${tooLarge?'Too large — ':''}${file.name} · ${(file.size/1024/1024).toFixed(1)} MB`;selectedFiles.appendChild(tag)})}
attachmentInput?.addEventListener('change',renderSelectedFiles);['dragenter','dragover'].forEach(evt=>fileDropZone?.addEventListener(evt,e=>{e.preventDefault();fileDropZone.classList.add('dragging')}));['dragleave','drop'].forEach(evt=>fileDropZone?.addEventListener(evt,e=>{e.preventDefault();fileDropZone.classList.remove('dragging')}));fileDropZone?.addEventListener('drop',e=>{if(!attachmentInput||!e.dataTransfer?.files?.length)return;const dt=new DataTransfer();[...e.dataTransfer.files].forEach(f=>dt.items.add(f));attachmentInput.files=dt.files;renderSelectedFiles()});

const whatsappFab=$('#whatsappFab'),waModal=$('#waModal'),waBackdrop=$('#waBackdrop'),waClose=$('#waClose'),waContinue=$('#waContinue');
function setWa(open){if(!waModal||!waBackdrop)return;waModal.hidden=!open;waBackdrop.hidden=!open;document.body.style.overflow=open?'hidden':'';if(open)setTimeout(()=>$('#waName')?.focus(),50)}
whatsappFab?.addEventListener('click',()=>setWa(true));waClose?.addEventListener('click',()=>setWa(false));waBackdrop?.addEventListener('click',()=>setWa(false));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&waModal&&!waModal.hidden)setWa(false)});
waContinue?.addEventListener('click',()=>{const name=$('#waName')?.value.trim()||'there',phone=$('#waPhone')?.value.trim()||'Not provided',topic=$('#waTopic')?.value||'General enquiry',message=`Hello Mabcor, my name is ${name}. I would like to make a ${topic.toLowerCase()}. My contact number is ${phone}.`;window.open(`https://wa.me/${C.whatsapp||'27783504926'}?text=${encodeURIComponent(message)}`,'_blank','noopener');setWa(false)});

})();
