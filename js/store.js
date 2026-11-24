/* Camada de dados compartilhada entre o app e a área admin. */
(function () {
  const CFG = window.APP_CONFIG || {};
  const LS_LOCAL_DATA = 'treino_dados_local';
  const LS_HIST = 'treino_historico';

  const ls = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  let client = null;
  function supabaseConfigurado() {
    return !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase && window.supabase.createClient);
  }
  function sb() {
    if (!supabaseConfigurado()) return null;
    if (!client) client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
    return client;
  }

  const clone = (o) => JSON.parse(JSON.stringify(o));

  async function carregarDados() {
    const s = sb();
    if (s) {
      try {
        const { data, error } = await s.from('app_data').select('data').eq('id', 1).maybeSingle();
        if (!error && data && data.data && data.data.professores) return { dados: data.data, origem: 'supabase' };
      } catch (e) { console.warn('Supabase indisponível, usando dados locais.', e); }
    } else {
      const local = ls.get(LS_LOCAL_DATA, null);
      if (local && local.professores) return { dados: local, origem: 'local' };
    }
    return { dados: clone(window.SEED_DATA), origem: 'arquivo' };
  }

  async function salvarDados(dados) {
    dados.atualizadoEm = new Date().toISOString();
    const s = sb();
    if (s) {
      const { error } = await s.from('app_data').upsert({ id: 1, data: dados, updated_at: dados.atualizadoEm });
      if (error) throw new Error(error.message);
      return 'supabase';
    }
    ls.set(LS_LOCAL_DATA, dados);
    return 'local';
  }

  function restaurarOriginais() { ls.del(LS_LOCAL_DATA); }

  function slug(s) {
    return String(s || 'video').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'video';
  }

  async function enviarArquivo(file, pasta, nomeBase) {
    const s = sb();
    if (!s) throw new Error('Conecte o Supabase para enviar arquivos (veja o README).');
    const ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop().toLowerCase() : (file.type.split('/')[1] || 'bin');
    const path = `${pasta}/${Date.now()}-${slug(nomeBase || file.name)}.${ext}`;
    const { error } = await s.storage.from(CFG.bucket || 'videos').upload(path, file, {
      cacheControl: '31536000', upsert: false, contentType: file.type || undefined
    });
    if (error) throw new Error(error.message);
    return s.storage.from(CFG.bucket || 'videos').getPublicUrl(path).data.publicUrl;
  }

  async function listarVideos() {
    const s = sb();
    if (!s) return [];
    const { data, error } = await s.storage.from(CFG.bucket || 'videos').list('mp4', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) throw new Error(error.message);
    return (data || []).filter(f => f.name && !f.name.startsWith('.')).map(f => ({
      nome: f.name,
      url: s.storage.from(CFG.bucket || 'videos').getPublicUrl('mp4/' + f.name).data.publicUrl,
      tamanho: f.metadata && f.metadata.size
    }));
  }

  /* ---------- Histórico de treinos (fica no aparelho) ---------- */
  function historico() { return ls.get(LS_HIST, []); }
  function registrarExecucao(reg) {
    const h = historico(); h.push(reg); ls.set(LS_HIST, h); return h;
  }
  function limparHistorico() { ls.del(LS_HIST); }

  /* ---------- Vídeo ---------- */
  function youtubeId(url) {
    if (!url) return null;
    const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    return m ? m[1] : null;
  }
  function normalizarVideo(v) {
    if (!v || !v.url) return null;
    const id = youtubeId(v.url);
    if (id) return { tipo: 'youtube', url: `https://www.youtube.com/watch?v=${id}`, thumb: v.thumb || `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
    return { tipo: 'mp4', url: v.url, thumb: v.thumb || '' };
  }

  /* Player do YouTube. O YouTube exige o cabeçalho Referer (sem ele aparece o "Erro 153").
     Aberto direto do computador (file://) não existe Referer, então mostramos um botão para o YouTube. */
  function youtubePlayer(url, titulo, autoplay) {
    const id = youtubeId(url);
    if (!id) return '';
    const linkYT = `https://www.youtube.com/watch?v=${id}`;
    if (!/^https?:$/.test(location.protocol)) {
      return `<div style="display:grid;gap:14px;justify-items:center;padding:24px;text-align:center;color:#fff">
        <img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="" style="width:100%;max-width:420px;border-radius:14px">
        <a class="btn laranja" href="${linkYT}" target="_blank" rel="noopener">Assistir no YouTube</a>
        <small style="color:#B9B9C4">O player do YouTube só funciona com o site publicado (Netlify).</small></div>`;
    }
    const params = new URLSearchParams({ rel: '0', playsinline: '1', origin: location.origin });
    if (autoplay) params.set('autoplay', '1');
    return `<iframe src="https://www.youtube.com/embed/${id}?${params}" title="${esc(titulo || 'Vídeo')}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  }

  /* ---------- Utilidades ---------- */
  function fmtData(iso) {
    if (!iso) return '';
    const [y, m, d] = String(iso).slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  function hojeISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function novoId(prefixo) { return prefixo + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  window.Store = {
    ls, clone, sb, supabaseConfigurado, carregarDados, salvarDados, restaurarOriginais,
    enviarArquivo, listarVideos, historico, registrarExecucao, limparHistorico,
    youtubeId, youtubePlayer, normalizarVideo, fmtData, hojeISO, novoId, esc, slug
  };
})();
