(() => {
  const fallback = () => JSON.parse(JSON.stringify(window.MABCOR_DEFAULT_DATA || window.MABCOR_DATA || {}));
  const CACHE_KEY = 'mabcor-site-content-v1';
  const db = window.mabcorSupabase;
  const rowId = window.MABCOR_SUPABASE?.contentRowId || 'main';
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


  function migrateNews(content) {
    if (!content || typeof content !== 'object') return content;
    content.news ||= [];
    // One-time migration for projects created before the club names were confirmed.
    // Once saved by Admin, newsSchemaVersion prevents future custom edits being overwritten.
    if ((content.newsSchemaVersion || 0) < 2) {
      const confirmed = [
        {category:'COMMUNITY · RUGBY',title:'Mabcor supports Excelsior Rugby Club in Middelburg',text:'Mabcor Facilities Solutions donated playing kits to Excelsior Rugby Club in Middelburg as part of its support for local sport and community development.',image:'assets/media/media-110.webp'},
        {category:'COMMUNITY · FOOTBALL',title:'Mabcor supports Dickson Pirates FC in Noupoort',text:'Mabcor Facilities Solutions donated football kits to Dickson Pirates FC in Noupoort, supporting grassroots sport and youth participation in the local community.',image:'assets/media/media-131.webp'}
      ];
      confirmed.forEach((item,i)=>{const old=content.news[i]||{};content.news[i]={...item,image:old.image||item.image};});
      content.newsSchemaVersion=2;
    }
    return content;
  }

  function normaliseStructure(content) {
    if (!content || typeof content !== 'object') return content;
    content.slots ||= {};
    const fallbackData = window.MABCOR_DEFAULT_DATA || {};
    if (!Array.isArray(content.slots['contact-image']) || !content.slots['contact-image'].length) {
      content.slots['contact-image'] = [...(fallbackData.slots?.['contact-image'] || ['assets/media/media-084.webp'])];
    }
    ['electrical-feature-thumb','electrical-feature-bg'].forEach(key=>{
      if(!Array.isArray(content.slots[key]) || !content.slots[key].length){
        content.slots[key]=[...(fallbackData.slots?.[key]||[])];
      }
    });
    // V3.0.14: expand the electrical thumbnail from a single image into a five-image slideshow.
    if ((content.slots['electrical-feature-thumb']||[]).length < 5) {
      const current=[...(content.slots['electrical-feature-thumb']||[])];
      const extras=[...(fallbackData.slots?.['electrical-feature-thumb']||[])];
      content.slots['electrical-feature-thumb']=[...new Set([...current,...extras])].slice(0,5);
    }
    return content;
  }

  function validContent(value) {
    return Boolean(value && typeof value === 'object' && Array.isArray(value.hero) && value.contact && value.slots);
  }

  function readCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return validContent(parsed?.data) ? parsed.data : null;
    } catch (_) {
      return null;
    }
  }

  function writeCache(data, updatedAt) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, updatedAt, cachedAt: new Date().toISOString() })); } catch (_) {}
  }

  async function fetchOnce() {
    const { data, error } = await db
      .from('website_content')
      .select('data,updated_at')
      .eq('id', rowId)
      .maybeSingle();
    if (error) throw error;
    if (!data || !validContent(data.data)) return null;
    return data;
  }

  window.MABCOR_READY = (async () => {
    if (!db || !window.MABCOR_SUPABASE_CONFIGURED) {
      window.MABCOR_DATA = migrateNews(normaliseStructure(fallback()));
      return window.MABCOR_DATA;
    }

    // A temporary network delay should never immediately force visitors back to defaults.
    // Retry four times, then prefer the most recently cached Supabase content, and only
    // use the bundled content as the final safety net.
    const waits = [0, 900, 1900, 3600];
    let lastError = null;
    for (const wait of waits) {
      if (wait) await sleep(wait);
      try {
        const result = await fetchOnce();
        if (result) {
          window.MABCOR_DATA = migrateNews(normaliseStructure(result.data));
          writeCache(window.MABCOR_DATA, result.updated_at);
          return window.MABCOR_DATA;
        }
        // The request succeeded but the row does not exist yet: setup/seed has not run.
        break;
      } catch (error) {
        lastError = error;
        console.warn('Mabcor content load attempt failed; retrying.', error);
      }
    }

    const cached = readCache();
    if (cached) {
      console.warn('Using cached Mabcor website content because Supabase is temporarily unavailable.', lastError);
      window.MABCOR_DATA = migrateNews(normaliseStructure(cached));
      return window.MABCOR_DATA;
    }

    console.warn('Using bundled Mabcor website content as a final fallback.', lastError);
    window.MABCOR_DATA = migrateNews(normaliseStructure(fallback()));
    return window.MABCOR_DATA;
  })();
})();
