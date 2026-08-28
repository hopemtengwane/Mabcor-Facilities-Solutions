(() => {
  const config = window.MABCOR_SUPABASE;
  const configured = config &&
    /^https:\/\/.+\.supabase\.co$/i.test(config.url || '') &&
    config.publishableKey &&
    !String(config.publishableKey).startsWith('PASTE_') &&
    window.supabase?.createClient;

  window.MABCOR_SUPABASE_CONFIGURED = Boolean(configured);
  if (!configured) {
    console.info('Mabcor Supabase is not configured yet; bundled website content will be used.');
    return;
  }

  window.mabcorSupabase = window.supabase.createClient(
    config.url,
    config.publishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();
