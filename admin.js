const db = window.mabcorSupabase;
const cfg = window.MABCOR_SUPABASE || {};
const bucket = cfg.mediaBucket || 'website-media';
const rowId = cfg.contentRowId || 'main';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clone = value => JSON.parse(JSON.stringify(value));
// Resolve bundled website assets relative to the page directory (important for GitHub Pages project sites).
// Supabase/data/blob URLs are already absolute and are left untouched.
const SITE_BASE_URL = new URL('./', document.baseURI);
function resolveMediaUrl(src=''){
  const value=String(src||'').trim();
  if(!value)return '';
  if(/^(?:https?:|data:|blob:)/i.test(value))return value;
  // Older saved content may contain /assets/... which incorrectly targets the github.io domain root.
  const local=value.replace(/^\.\//,'').replace(/^\/+/, '');
  return new URL(local,SITE_BASE_URL).href;
}
let data = clone(window.MABCOR_DEFAULT_DATA || {});
let media = [...(window.MABCOR_MEDIA || [])];
let currentTarget = 'cap:civil';
let dirty = false;

const targetDefs=[
  ['cap:civil','Capability — Civil & Infrastructure thumbnail',1],['cap:building','Capability — Building & Construction thumbnail',1],['cap:electrical','Capability — Electrical & Technical thumbnail',1],['cap:mechanical','Capability — Mechanical & HVAC thumbnail',1],['cap:water','Capability — Water Infrastructure thumbnail',1],['cap:facilities','Capability — Facilities Management thumbnail',1],['cap:logistics','Capability — Mining & Bulk Logistics thumbnail',1],['cap:plant','Capability — Plant & Equipment thumbnail',1],
  ['slot:logistics-main','Logistics feature slideshow',5],['slot:project-civil','Projects — Civil slideshow',5],['slot:project-site','Projects — Active site slideshow',5],['slot:project-electrical','Projects — Electrical slideshow',5],['slot:project-logistics','Projects — Logistics slideshow',5],['slot:plant-main','Plant — Main slideshow',5],['slot:plant-support','Plant — Support slideshow',5],['slot:plant-fleet','Plant — Fleet slideshow',5],['slot:parallax-civil','Parallax — Infrastructure',5],['slot:parallax-logistics','Parallax — Logistics',5],['slot:contact-image','Start a Project — Background image',1]
];

function setStatus(message, kind='') { const el=$('#adminStatus'); if(!el)return; el.textContent=message; el.className=`status ${kind}`.trim(); }
function markDirty(){ dirty=true; setStatus('Unsaved changes. Click Save Changes when you are ready.'); }
function esc(value=''){return String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}
function configured(){return Boolean(window.MABCOR_SUPABASE_CONFIGURED && db)}

function migrateNewsOnce(){
  data.news ||= [];
  if((data.newsSchemaVersion||0)<2){
    const confirmed=[
      {category:'COMMUNITY · RUGBY',title:'Mabcor supports Excelsior Rugby Club in Middelburg',text:'Mabcor Facilities Solutions donated playing kits to Excelsior Rugby Club in Middelburg as part of its support for local sport and community development.',image:'assets/media/media-110.webp'},
      {category:'COMMUNITY · FOOTBALL',title:'Mabcor supports Dickson Pirates FC in Noupoort',text:'Mabcor Facilities Solutions donated football kits to Dickson Pirates FC in Noupoort, supporting grassroots sport and youth participation in the local community.',image:'assets/media/media-131.webp'}
    ];
    confirmed.forEach((item,i)=>{const old=data.news[i]||{};data.news[i]={...item,image:old.image||item.image};});
    data.newsSchemaVersion=2;
  }
}

function uniqueMedia(list){const seen=new Set();return list.filter(item=>item?.src&&!seen.has(item.src)&&seen.add(item.src))}

async function verifiedSession(){
  if(!configured()) return null;
  const {data:sessionData,error:sessionError}=await db.auth.getSession();
  if(sessionError) throw sessionError;
  const session=sessionData?.session||null;
  if(!session) return null;
  // Verify the cached session with Supabase before exposing Admin.
  const {data:userData,error:userError}=await db.auth.getUser();
  if(userError || !userData?.user){
    try{await db.auth.signOut({scope:'local'})}catch(_){}
    if(userError) console.warn('Stored session could not be verified.',userError);
    return null;
  }
  return {...session,user:userData.user};
}

function lockAdmin(message=''){
  document.body.classList.remove('authenticated');
  document.body.classList.add('auth-locked');
  $('#adminPanel').hidden=true;
  $('#loginPanel').hidden=false;
  if(message) $('#loginError').textContent=message;
}

async function unlockAdmin(session){
  if(!session?.user){lockAdmin();return}
  // Keep the page locked until the identity has been verified and content load begins.
  $('#userChip').textContent=session.user.email||'Signed in';
  $('#loginPanel').hidden=true;
  $('#adminPanel').hidden=false;
  document.body.classList.remove('auth-locked');
  document.body.classList.add('authenticated');
  document.body.style.overflow='';
  setStatus('Loading shared website content…');
  try{
    await Promise.all([loadContent(),loadUploadedMedia()]);
    renderAll();
    setStatus('Connected to Supabase. Website content is shared and ready to edit.','good');
  }catch(error){
    console.error(error);
    renderAll();
    setStatus(`Supabase connected, but content could not be loaded: ${error.message}`,'bad');
  }
}

async function initialise(){
  lockAdmin();
  $('#loginError').textContent='Checking sign-in status…';
  if(!configured()){
    $('#loginError').textContent='';
    $('#configNote').hidden=false;
    return;
  }
  try{
    const session=await verifiedSession();
    $('#loginError').textContent='';
    if(session) await unlockAdmin(session);
  }catch(error){
    console.error('Could not verify Supabase session.',error);
    lockAdmin('Could not verify the login session. Check your internet connection and try again.');
  }
}

$('#loginBtn').addEventListener('click',async()=>{
  $('#loginError').textContent='';
  if(!configured()){ $('#configNote').hidden=false; return; }
  const email=$('#loginEmail').value.trim(), password=$('#loginPassword').value;
  if(!email||!password){$('#loginError').textContent='Enter your admin email address and password.';return}
  const btn=$('#loginBtn');btn.disabled=true;btn.textContent='Signing in…';
  try{
    const {data:authData,error}=await db.auth.signInWithPassword({email,password});
    if(error) throw error;
    if(!authData?.session) throw new Error('Supabase did not return an authenticated session.');
    const session=await verifiedSession();
    if(!session) throw new Error('The login succeeded but the session could not be verified.');
    $('#loginPassword').value='';
    await unlockAdmin(session);
  }catch(error){
    lockAdmin(error?.message||'Sign in failed.');
  }finally{
    btn.disabled=false;btn.textContent='Sign in';
  }
});
['#loginEmail','#loginPassword'].forEach(sel=>$(sel).addEventListener('keydown',e=>{if(e.key==='Enter')$('#loginBtn').click()}));
$('#logoutBtn').addEventListener('click',async()=>{
  lockAdmin();
  $('#loginError').textContent='Signing out…';
  try{await db.auth.signOut()}catch(error){console.warn(error)}
  $('#loginError').textContent='';
  $('#loginEmail').focus();
});

async function loadContent(){
  const {data:row,error}=await db.from('website_content').select('data,updated_at').eq('id',rowId).maybeSingle();
  if(error)throw error;
  if(row?.data) data=clone(row.data); else data=clone(window.MABCOR_DEFAULT_DATA||{});
  migrateNewsOnce();
  data.slots ||= {};
  if(!Array.isArray(data.slots['contact-image']) || !data.slots['contact-image'].length){
    data.slots['contact-image']=[...(window.MABCOR_DEFAULT_DATA?.slots?.['contact-image']||['assets/media/media-084.webp'])];
  }
  dirty=false;
}

async function loadUploadedMedia(){
  try{
    const {data:files,error}=await db.storage.from(bucket).list('uploads',{limit:1000,sortBy:{column:'created_at',order:'desc'}});
    if(error)throw error;
    const uploaded=(files||[]).filter(f=>f.name&&!f.name.endsWith('/')).map(f=>{const path=`uploads/${f.name}`;const {data:url}=db.storage.from(bucket).getPublicUrl(path);return {id:`supabase-${f.id||f.name}`,src:url.publicUrl,original:f.name,remote:true}});
    const hidden=new Set(data.hiddenMedia||[]);
    media=uniqueMedia([...(window.MABCOR_MEDIA||[]),...uploaded]).filter(m=>!hidden.has(m.src));
  }catch(error){console.warn('Could not list uploaded media.',error);const hidden=new Set(data.hiddenMedia||[]);media=uniqueMedia([...(window.MABCOR_MEDIA||[])]).filter(m=>!hidden.has(m.src));}
}

async function uploadImage(file){
  if(!file)throw new Error('Choose an image first.');
  if(!file.type.startsWith('image/'))throw new Error('Please choose a JPG, PNG or WebP image.');
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
  const clean=(file.name.replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,45)||'mabcor-image').toLowerCase();
  const stamp=Date.now();
  const nonce=Math.random().toString(36).slice(2,8);
  const path=`uploads/${stamp}-${nonce}-${clean}.${ext}`;
  const {error}=await db.storage.from(bucket).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
  if(error)throw error;
  const {data:url}=db.storage.from(bucket).getPublicUrl(path);
  const item={id:`supabase-${stamp}-${nonce}`,src:url.publicUrl,original:file.name,remote:true};
  media=uniqueMedia([...media,item]);
  return item;
}

async function uploadImages(files,onProgress){
  const selected=[...files];
  if(!selected.length)throw new Error('Choose one or more images first.');
  const uploaded=[];
  for(let i=0;i<selected.length;i++){
    if(onProgress)onProgress(i+1,selected.length,selected[i]);
    uploaded.push(await uploadImage(selected[i]));
  }
  return uploaded;
}

function mediaUsage(src){
  const uses=[];
  if((data.hero||[]).includes(src)) uses.push('Hero slideshow');
  Object.entries(data.capabilities||{}).forEach(([key,value])=>{if(value===src)uses.push(`Capability — ${key}`)});
  Object.entries(data.slots||{}).forEach(([key,list])=>{if((list||[]).includes(src)){const label=targetDefs.find(d=>d[0]===`slot:${key}`)?.[1]||`Website section — ${key}`;uses.push(label)}});
  (data.news||[]).forEach((item,i)=>{if(item?.image===src)uses.push(`News article ${i+1}${item.title?` — ${item.title}`:''}`)});
  return uses;
}
function storagePathFromMedia(m){
  if(!m?.remote)return '';
  try{
    const url=new URL(m.src);
    const marker=`/storage/v1/object/public/${bucket}/`;
    const at=url.pathname.indexOf(marker);
    if(at>=0)return decodeURIComponent(url.pathname.slice(at+marker.length));
  }catch(_){}
  return '';
}
async function deleteMediaItem(m){
  const uses=mediaUsage(m.src);
  if(uses.length){
    alert(`This image is still being used in:\n\n• ${uses.join('\n• ')}\n\nReplace or remove it from those locations first, then delete it from the media library.`);
    return;
  }
  const action=m.remote?'permanently delete this uploaded image from Supabase Storage':'remove this bundled image from the Admin media library';
  if(!confirm(`Are you sure you want to ${action}?\n\n${m.original||m.src}`))return;
  try{
    if(m.remote){
      const path=storagePathFromMedia(m);
      if(!path)throw new Error('Could not determine this image’s Supabase Storage path.');
      const {error}=await db.storage.from(bucket).remove([path]);
      if(error)throw error;
      media=media.filter(x=>x.src!==m.src);
      setStatus(`${m.original||'Image'} was permanently deleted from Supabase Storage.`,'good');
    }else{
      data.hiddenMedia ||= [];
      if(!data.hiddenMedia.includes(m.src))data.hiddenMedia.push(m.src);
      media=media.filter(x=>x.src!==m.src);
      markDirty();
      setStatus(`${m.original||'Image'} was removed from the Admin media library. Click Save Changes to keep it hidden. The original file remains in GitHub.`,'good');
    }
    renderHero();renderTarget();
  }catch(error){setStatus(`Could not delete image: ${error.message}`,'bad')}
}
function mediaItem(m,fn){
  const d=document.createElement('div');d.className='media';
  d.innerHTML=`<img loading="lazy" src="${esc(resolveMediaUrl(m.src))}" alt=""><span title="${esc(m.original||m.src)}">${esc(m.original||m.src)}</span><button class="media-delete" type="button" title="${m.remote?'Delete from Supabase Storage':'Remove from media library'}" aria-label="Delete ${esc(m.original||m.src)}">×</button>`;
  d.addEventListener('click',()=>fn(m));
  d.querySelector('.media-delete').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();deleteMediaItem(m)});
  return d
}
function renderLibrary(box,q,fn){box.innerHTML='';const query=(q||'').toLowerCase();media.filter(m=>(m.original||m.src).toLowerCase().includes(query)).forEach(m=>box.appendChild(mediaItem(m,fn)))}
function move(array,index,delta){const next=index+delta;if(next<0||next>=array.length)return;[array[index],array[next]]=[array[next],array[index]];markDirty()}

function renderHero(){
  const box=$('#heroList');box.innerHTML='';(data.hero||[]).forEach((src,i)=>{const d=document.createElement('div');d.className='item';d.innerHTML=`<img src="${esc(resolveMediaUrl(src))}" alt=""><div class="meta">${String(i+1).padStart(2,'0')}</div><div class="item-buttons"><button data-a="up" title="Move left">←</button><button data-a="down" title="Move right">→</button><button data-a="remove" title="Remove">×</button></div>`;d.querySelector('[data-a="remove"]').onclick=()=>{data.hero.splice(i,1);markDirty();renderHero()};d.querySelector('[data-a="up"]').onclick=()=>{move(data.hero,i,-1);renderHero()};d.querySelector('[data-a="down"]').onclick=()=>{move(data.hero,i,1);renderHero()};box.appendChild(d)});
  $('#heroCounter').textContent=`${data.hero?.length||0} images`;
  renderLibrary($('#heroLibrary'),$('#heroSearch').value,m=>{data.hero ||= [];if(!data.hero.includes(m.src)){data.hero.push(m.src);markDirty();renderHero()}})
}

function getTarget(){
  const [type,key]=currentTarget.split(':');
  const max=targetDefs.find(d=>d[0]===currentTarget)?.[2]||5;
  if(type==='cap')return {type,key,max:1,list:[data.capabilities?.[key]].filter(Boolean)};
  if(type==='news')return {type,key,max:1,list:[data.news?.[Number(key)]?.image].filter(Boolean)};
  return {type,key,max,list:[...(data.slots?.[key]||[])]};
}
function setTarget(list){
  const [type,key]=currentTarget.split(':');
  if(type==='cap'){
    data.capabilities ||= {};
    data.capabilities[key]=list[0]||'';
  }else if(type==='news'){
    data.news ||= [];
    const index=Number(key);
    data.news[index] ||= {category:'COMMUNITY',title:'News item',text:'',image:''};
    data.news[index].image=list[0]||'';
  }else{
    data.slots ||= {};
    data.slots[key]=list;
  }
  markDirty();
}
function renderTarget(){
  const t=getTarget(),box=$('#assignedList');box.innerHTML='';
  if(!t.list.length)box.innerHTML='<div class="empty">No image assigned yet.</div>';
  t.list.forEach((src,i)=>{const d=document.createElement('div');d.className='item';d.innerHTML=`<img src="${esc(resolveMediaUrl(src))}" alt=""><div class="meta">${i+1} of ${t.max}</div><div class="item-buttons"><button data-a="up" title="Move left">←</button><button data-a="down" title="Move right">→</button><button data-a="remove" title="Remove">×</button></div>`;d.querySelector('[data-a="remove"]').onclick=()=>{const list=getTarget().list;list.splice(i,1);setTarget(list);renderTarget()};d.querySelector('[data-a="up"]').onclick=()=>{const list=getTarget().list;move(list,i,-1);setTarget(list);renderTarget()};d.querySelector('[data-a="down"]').onclick=()=>{const list=getTarget().list;move(list,i,1);setTarget(list);renderTarget()};box.appendChild(d)});
  $('#targetHint').textContent=t.max===1?'Choose an existing image or upload a new one to replace this image.':`Up to ${t.max} images. Choose existing media or upload brand-new images directly to this slideshow.`;
  renderLibrary($('#imageLibrary'),$('#imageSearch').value,m=>{let list=getTarget().list;if(t.max===1)list=[m.src];else if(!list.includes(m.src)){if(list.length>=t.max){setStatus(`This slideshow already has ${t.max} images. Remove one before adding another.`,'bad');return}list.push(m.src)}setTarget(list);renderTarget()})
}


function renderNews(){
  migrateNewsOnce();
  const box=$('#newsEditors'); if(!box)return; box.innerHTML='';
  (data.news||[]).forEach((item,i)=>{
    const card=document.createElement('div');card.className='news-editor';
    card.innerHTML=`<img class="news-preview" src="${esc(resolveMediaUrl(item.image||''))}" alt=""><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><h3>Article ${i+1}</h3><button class="btn ghost news-delete" type="button">Delete</button></div><label><span>Category</span><input data-k="category" value="${esc(item.category||'NEWS')}"></label><label><span>Headline</span><input data-k="title" value="${esc(item.title||'')}"></label><label><span>Article text</span><textarea data-k="text">${esc(item.text||'')}</textarea></label><div class="upload" style="margin:2px 0 0;padding:14px"><input class="news-image-input" type="file" accept="image/jpeg,image/png,image/webp"><button class="btn ghost news-image-upload" type="button">Upload / replace image</button></div>`;
    card.querySelectorAll('[data-k]').forEach(el=>el.addEventListener('input',()=>{data.news[i][el.dataset.k]=el.value;markDirty()}));
    card.querySelector('.news-delete').onclick=()=>{if(!confirm('Delete this news article?'))return;data.news.splice(i,1);markDirty();renderNews()};
    card.querySelector('.news-image-upload').onclick=async()=>{
      const input=card.querySelector('.news-image-input'),files=[...input.files];if(!files.length){setStatus('Choose one or more images for this article first.','bad');return}
      const btn=card.querySelector('.news-image-upload');btn.disabled=true;btn.textContent='Uploading…';
      try{
        const uploaded=await uploadImages(files,(n,total)=>{btn.textContent=`Uploading ${n}/${total}…`});
        data.news[i].image=uploaded[0].src;
        input.value='';markDirty();renderNews();renderHero();renderTarget();
        setStatus(`${uploaded.length} image${uploaded.length===1?'':'s'} uploaded. ${uploaded[0].original} is assigned to Article ${i+1}; all selected images are now in the shared media library. Click Save Changes to publish.`,'good');
      }catch(error){setStatus(error.message,'bad')}finally{btn.disabled=false;btn.textContent='Upload / replace image'}
    };
    box.appendChild(card);
  });
  if(!(data.news||[]).length)box.innerHTML='<div class="empty">No news articles yet. Click “Add News Article” to create the first one.</div>';
}


function renderContact(){const c=data.contact||{};$('#phone').value=c.phone||'';$('#phoneHref').value=c.phoneHref||'';$('#email').value=c.email||'';$('#location').value=c.location||'';$('#whatsapp').value=c.whatsapp||''}
function bindContact(){['phone','phoneHref','email','location','whatsapp'].forEach(key=>$('#'+key).addEventListener('input',()=>{data.contact ||= {};data.contact[key]=$('#'+key).value;markDirty()}))}
function renderAll(){renderHero();renderTarget();renderContact();renderNews()}

targetDefs.forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;$('#targetSelect').appendChild(o)});$('#targetSelect').value=currentTarget;$('#targetSelect').addEventListener('change',e=>{currentTarget=e.target.value;renderTarget()});
$$('.tab').forEach(btn=>btn.addEventListener('click',()=>{$$('.tab,.panel').forEach(e=>e.classList.remove('active'));btn.classList.add('active');$(`#panel-${btn.dataset.tab}`).classList.add('active')}));
$('#heroSearch').addEventListener('input',renderHero);$('#imageSearch').addEventListener('input',renderTarget);bindContact();
$('#addNewsBtn')?.addEventListener('click',()=>{data.news ||= [];data.news.push({category:'NEWS & COMMUNITY',title:'New Mabcor story',text:'Add the article text here.',image:''});markDirty();renderNews();setTimeout(()=>$('#newsEditors .news-editor:last-child input[data-k="title"]')?.focus(),0)});

$('#uploadBtn').addEventListener('click',async()=>{
  const files=[...$('#uploadInput').files];if(!files.length){setStatus('Choose one or more images before uploading.','bad');return}
  const btn=$('#uploadBtn');btn.disabled=true;btn.textContent='Uploading…';
  try{
    const uploaded=await uploadImages(files,(n,total)=>{btn.textContent=`Uploading ${n}/${total}…`});
    $('#uploadInput').value='';renderHero();renderTarget();
    setStatus(`${uploaded.length} image${uploaded.length===1?'':'s'} uploaded to Supabase Storage and added to the shared media library.`,'good');
  }catch(error){setStatus(error.message,'bad')}finally{btn.disabled=false;btn.textContent='Upload selected to library'}
});

$('#targetUploadBtn').addEventListener('click',async()=>{
  const files=[...$('#targetUploadInput').files];
  if(!files.length){setStatus('Choose one or more images before uploading.','bad');return}
  const t=getTarget();
  const btn=$('#targetUploadBtn');btn.disabled=true;btn.textContent='Uploading…';
  try{
    const uploaded=await uploadImages(files,(n,total)=>{btn.textContent=`Uploading ${n}/${total}…`});
    let list=getTarget().list;
    let assigned=0;
    if(t.max===1){
      list=[uploaded[0].src];
      assigned=1;
    }else{
      const room=Math.max(0,t.max-list.length);
      uploaded.slice(0,room).forEach(item=>{if(!list.includes(item.src)){list.push(item.src);assigned++}});
    }
    setTarget(list);
    $('#targetUploadInput').value='';
    renderHero();renderTarget();
    const label=targetDefs.find(d=>d[0]===currentTarget)?.[1]||'selected section';
    const libraryOnly=uploaded.length-assigned;
    const extra=libraryOnly>0?` ${libraryOnly} additional image${libraryOnly===1?' was':'s were'} added to the shared media library only because this target is full or accepts one image.`:'';
    setStatus(`${uploaded.length} image${uploaded.length===1?'':'s'} uploaded; ${assigned} assigned to ${label}.${extra} Click Save Changes to publish the assignment.`,'good');
  }catch(error){setStatus(error.message,'bad')}
  finally{btn.disabled=false;btn.textContent='Upload selected & add here'}
});

$('#saveBtn').addEventListener('click',async()=>{const btn=$('#saveBtn');btn.disabled=true;btn.textContent='Saving…';try{const {data:row,error}=await db.from('website_content').upsert({id:rowId,data},{onConflict:'id'}).select('updated_at').single();if(error)throw error;dirty=false;try{localStorage.setItem('mabcor-site-content-v1',JSON.stringify({data,updatedAt:row.updated_at,cachedAt:new Date().toISOString()}))}catch(_){}setStatus('Changes published successfully. Reload the public website to see them immediately.','good')}catch(error){setStatus(error.message,'bad')}finally{btn.disabled=false;btn.textContent='Save Changes'}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
if(configured()){
  db.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT') lockAdmin();
    // signInWithPassword handles SIGNED_IN directly; this catches restored/refreshed sessions.
    if((event==='TOKEN_REFRESHED' || event==='USER_UPDATED') && session?.user && document.body.classList.contains('auth-locked')){
      verifiedSession().then(s=>{if(s) unlockAdmin(s)}).catch(error=>console.warn(error));
    }
  });
}
initialise();
