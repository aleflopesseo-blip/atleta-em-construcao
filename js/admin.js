/* Área admin: editar programas, rotinas, treinos, exercícios e vídeos. */
(function () {
  const S = window.Store;
  const esc = S.esc;
  const $ = document.getElementById('adm');

  let D = null;          // cópia de trabalho dos dados
  let sujo = false;
  let origem = 'arquivo';
  const online = S.supabaseConfigurado();

  const I = {
    cima: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
    baixo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    lixo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    halter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 7v10M3.5 9.5v5M18 7v10M20.5 9.5v5M6 12h12"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    copiar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>'
  };
  const LETRAS = 'ABCDEFGHIJKLMNOP';
  const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado'];

  /* ---------- Utilidades ---------- */
  function toast(msg) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2800);
  }
  function marcarSujo() { sujo = true; atualizarBarra(); }
  function atualizarBarra() {
    let b = document.querySelector('.salvar-barra');
    if (!sujo) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('div'); b.className = 'salvar-barra';
      b.innerHTML = `<span>${online ? 'Alterações ainda não publicadas' : 'Alterações ainda não salvas neste navegador'}</span><button class="btn laranja" id="btn-salvar">Salvar alterações</button>`;
      document.body.appendChild(b);
      b.querySelector('#btn-salvar').addEventListener('click', salvar);
    }
  }
  async function salvar() {
    const btn = document.getElementById('btn-salvar');
    if (btn) { btn.disabled = true; btn.textContent = 'Salvando…'; }
    try {
      const onde = await S.salvarDados(D);
      sujo = false; atualizarBarra();
      origem = onde;
      toast(onde === 'supabase' ? 'Alterações salvas e publicadas no app' : 'Alterações salvas neste navegador');
      render();
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Salvar alterações'; }
      alert('Não foi possível salvar: ' + e.message + '\n\nConfira se você está logado e se o setup.sql foi executado no Supabase.');
    }
  }
  window.addEventListener('beforeunload', e => { if (sujo) { e.preventDefault(); e.returnValue = ''; } });

  function mover(arr, i, d) {
    const j = i + d; if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; marcarSujo(); render();
  }
  function remover(arr, i, nome) {
    if (!confirm(`Excluir "${nome}"? Isso vale depois que você salvar.`)) return false;
    arr.splice(i, 1); marcarSujo(); render(); return true;
  }
  function ctrl(arr, i, nome) {
    return `<div class="ctrl">
      <button class="ib" data-mv="${i}|-1" aria-label="Mover para cima" ${i === 0 ? 'disabled' : ''}>${I.cima}</button>
      <button class="ib" data-mv="${i}|1" aria-label="Mover para baixo" ${i === arr.length - 1 ? 'disabled' : ''}>${I.baixo}</button>
      <button class="ib perigo" data-rm="${i}" data-nome="${esc(nome)}" aria-label="Excluir">${I.lixo}</button>
    </div>`;
  }
  function ligarCtrl(root, arr) {
    root.querySelectorAll(':scope [data-mv]').forEach(b => {
      if (b.closest('[data-lista]') !== root) return;
      b.addEventListener('click', () => { const [i, d] = b.dataset.mv.split('|').map(Number); mover(arr, i, d); });
    });
    root.querySelectorAll(':scope [data-rm]').forEach(b => {
      if (b.closest('[data-lista]') !== root) return;
      b.addEventListener('click', () => remover(arr, +b.dataset.rm, b.dataset.nome));
    });
  }
  function ligarCampos(root, obj) {
    root.querySelectorAll('[data-campo]').forEach(el => {
      el.addEventListener('input', () => { obj[el.dataset.campo] = el.value; marcarSujo(); });
    });
  }
  function campo(rot, chave, valor, { tipo = 'text', cheio = false, ajuda = '', opcoes = null, ph = '' } = {}) {
    const id = 'c-' + chave;
    let input;
    if (tipo === 'textarea') input = `<textarea id="${id}" data-campo="${chave}" placeholder="${esc(ph)}">${esc(valor)}</textarea>`;
    else if (opcoes) input = `<select id="${id}" data-campo="${chave}">${opcoes.map(o => `<option ${o === valor ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    else input = `<input id="${id}" type="${tipo}" data-campo="${chave}" value="${esc(valor)}" placeholder="${esc(ph)}">`;
    return `<div class="campo ${cheio ? 'cheio' : ''}"><label for="${id}">${rot}</label>${input}${ajuda ? `<small>${ajuda}</small>` : ''}</div>`;
  }
  function contarEx(t) { return (t.blocos || []).reduce((n, b) => n + (b.exercicios || []).length, 0); }

  /* ---------- Busca por id ---------- */
  const prof = pid => D.professores.find(p => p.id === pid);
  function acharTreino(p, tid) {
    for (const r of p.rotinas || []) { const i = (r.treinos || []).findIndex(t => t.id === tid); if (i >= 0) return { t: r.treinos[i], lista: r.treinos, rotina: r, tipo: 'rotina' }; }
    for (const k of ['aerobico', 'extras']) { const i = (p[k] || []).findIndex(t => t.id === tid); if (i >= 0) return { t: p[k][i], lista: p[k], rotina: null, tipo: k }; }
    return null;
  }
  function acharEx(t, eid) {
    for (const b of t.blocos || []) { const i = (b.exercicios || []).findIndex(e => e.id === eid); if (i >= 0) return { e: b.exercicios[i], bloco: b }; }
    return null;
  }
  function novoExercicio() { return { id: S.novoId('e'), nome: 'Novo exercício', series: '3x 12', carga: '', intervalo: '', instrucoes: '', video: null }; }
  function novoTreino(rotulo) { return { id: S.novoId('t'), rotulo, nome: 'Novo treino', blocos: [] }; }

  /* ---------- Moldura ---------- */
  function moldura(titulo, migalhas, corpo) {
    const estado = online
      ? `<div class="estado on"><i></i>Conectado ao Supabase · o que você salvar aparece no app de todos os aparelhos</div>`
      : `<div class="estado local"><i></i>Modo local · as alterações ficam só neste navegador. Conecte o Supabase para publicar (veja o README).</div>`;
    $.innerHTML = `
      <header class="adm-topo">
        <div class="linha">
          <div class="marca"><span class="marca-icone">${I.halter}</span> Área admin</div>
          <div class="acoes-topo">
            <a class="btn claro pequeno" href="index.html" target="_blank" rel="noopener">Abrir app</a>
            <button class="btn claro pequeno" id="btn-exportar">Exportar JSON</button>
            <button class="btn claro pequeno" id="btn-importar">Importar JSON</button>
            ${online ? '<button class="btn claro pequeno" id="btn-sair">Sair</button>' : ''}
          </div>
        </div>
        ${estado}
        <nav class="migalhas" aria-label="Você está em">${migalhas.map((m, i) => i === migalhas.length - 1 ? `<strong>${esc(m[0])}</strong>` : `<a href="${m[1]}">${esc(m[0])}</a><span>/</span>`).join('')}</nav>
        <h1>${esc(titulo)}</h1>
      </header>
      <main class="adm-corpo">${corpo}</main>`;
    document.getElementById('btn-exportar').addEventListener('click', exportar);
    document.getElementById('btn-importar').addEventListener('click', importar);
    const sair = document.getElementById('btn-sair');
    if (sair) sair.addEventListener('click', async () => { await S.sb().auth.signOut(); location.reload(); });
    atualizarBarra();
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(D, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `treinos-${S.hojeISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function importar() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.addEventListener('change', async () => {
      try {
        const obj = JSON.parse(await inp.files[0].text());
        if (!obj.professores) throw new Error('arquivo sem a lista "professores"');
        if (!confirm('Substituir todos os dados atuais pelos do arquivo? Você ainda precisa clicar em Salvar alterações.')) return;
        D = obj; marcarSujo(); go('#/'); render();
      } catch (e) { alert('Arquivo inválido: ' + e.message); }
    });
    inp.click();
  }

  /* ---------- Telas ---------- */
  function telaInicio() {
    const corpo = `
      <section class="painel" data-lista>
        <div class="painel-topo"><h2>Programas</h2><button class="btn laranja pequeno" id="novo-prof">${I.mais} Novo programa</button></div>
        <p class="ajuda">Cada programa aparece no app como um "professor" na tela de seleção (ex.: Pubalgia, Personal).</p>
        <div class="itens">
          ${D.professores.map((p, i) => `<div class="item">
            <a class="abrir" href="#/p/${esc(p.id)}"><strong>${esc(p.nome)}</strong><span>${(p.rotinas || []).length} rotinas · ${(p.aerobico || []).length} aeróbicos · ${(p.extras || []).length} extras</span></a>
            ${ctrl(D.professores, i, p.nome)}
          </div>`).join('')}
        </div>
      </section>
      <section class="painel">
        <div class="painel-topo"><h2>Biblioteca de vídeos</h2><a class="btn pequeno" href="#/videos">Abrir</a></div>
        <p class="ajuda" style="margin:0">Envie vídeos e reutilize nos exercícios.</p>
      </section>
      <section class="painel">
        <h2>Dados do app</h2>
        <div class="campos" data-geral>${campo('Nome do aluno', 'aluno', D.aluno || '', { ajuda: 'Usado na saudação da tela inicial.' })}</div>
        ${!online ? `<div class="botoes"><button class="btn claro pequeno" id="restaurar">Restaurar dados originais</button></div>` : ''}
      </section>`;
    moldura('Painel', [['Painel', '#/']], corpo);
    ligarCtrl($.querySelector('[data-lista]'), D.professores);
    ligarCampos($.querySelector('[data-geral]'), D);
    document.getElementById('novo-prof').addEventListener('click', () => {
      const nome = prompt('Nome do novo programa (ex.: Corrida, Mobilidade):');
      if (!nome) return;
      const id = S.slug(nome) + '-' + Date.now().toString(36).slice(-4);
      D.professores.push({ id, nome: nome.trim(), rotinas: [], aerobico: [], extras: [] });
      marcarSujo(); go(`#/p/${id}`);
    });
    const rest = document.getElementById('restaurar');
    if (rest) rest.addEventListener('click', () => {
      if (!confirm('Apagar as alterações feitas neste navegador e voltar aos treinos originais?')) return;
      S.restaurarOriginais(); sujo = false; location.reload();
    });
  }

  function listaTreinos(lista, base, vazioTxt) {
    return lista.length ? `<div class="itens">${lista.map((t, i) => `<div class="item">
        <a class="abrir" href="${base}${esc(t.id)}"><strong>${esc((t.rotulo ? t.rotulo + ' · ' : '') + t.nome)}</strong><span>${contarEx(t)} exercícios</span></a>
        ${ctrl(lista, i, t.nome)}</div>`).join('')}</div>` : `<p class="ajuda" style="margin:0;color:var(--texto-2)">${vazioTxt}</p>`;
  }

  function telaProf(pid) {
    const p = prof(pid); if (!p) return go('#/');
    p.rotinas = p.rotinas || []; p.aerobico = p.aerobico || []; p.extras = p.extras || [];
    const corpo = `
      <section class="painel"><div class="campos" data-dados>${campo('Nome do programa', 'nome', p.nome, { cheio: true })}</div></section>
      <section class="painel" data-lista="rotinas">
        <div class="painel-topo"><h2>Rotinas de treino</h2><button class="btn laranja pequeno" id="nova-rotina">${I.mais} Nova rotina</button></div>
        ${p.rotinas.length ? `<div class="itens">${p.rotinas.map((r, i) => `<div class="item">
          <a class="abrir" href="#/p/${esc(pid)}/r/${esc(r.id)}"><strong>${esc(r.nome)}</strong><span>${S.fmtData(r.inicio)} – ${S.fmtData(r.fim)} · ${(r.treinos || []).length} treinos</span></a>
          ${ctrl(p.rotinas, i, r.nome)}</div>`).join('')}</div>` : '<p class="ajuda" style="margin:0">Nenhuma rotina ainda.</p>'}
      </section>
      <section class="painel" data-lista="aerobico">
        <div class="painel-topo"><h2>Aeróbico</h2><button class="btn pequeno" data-novo="aerobico">${I.mais} Novo aeróbico</button></div>
        ${listaTreinos(p.aerobico, `#/p/${esc(pid)}/t/`, 'Nenhum treino aeróbico.')}
      </section>
      <section class="painel" data-lista="extras">
        <div class="painel-topo"><h2>Treinos extras</h2><button class="btn pequeno" data-novo="extras">${I.mais} Novo extra</button></div>
        ${listaTreinos(p.extras, `#/p/${esc(pid)}/t/`, 'Nenhum treino extra.')}
      </section>
      <section class="painel"><button class="btn claro pequeno" id="excluir-prof">Excluir programa</button></section>`;
    moldura(p.nome, [['Painel', '#/'], [p.nome, '']], corpo);
    ligarCampos($.querySelector('[data-dados]'), p);
    ligarCtrl($.querySelector('[data-lista="rotinas"]'), p.rotinas);
    ligarCtrl($.querySelector('[data-lista="aerobico"]'), p.aerobico);
    ligarCtrl($.querySelector('[data-lista="extras"]'), p.extras);
    document.getElementById('nova-rotina').addEventListener('click', () => {
      const hoje = S.hojeISO(); const fim = new Date(); fim.setDate(fim.getDate() + 30);
      const r = { id: S.novoId('r'), nome: 'Nova rotina', inicio: hoje, fim: fim.toISOString().slice(0, 10), categoria: 'Condicionamento', nivel: 'Intermediário', orientacoes: '', treinos: [] };
      p.rotinas.unshift(r); marcarSujo(); go(`#/p/${pid}/r/${r.id}`);
    });
    $.querySelectorAll('[data-novo]').forEach(b => b.addEventListener('click', () => {
      const lista = p[b.dataset.novo]; const t = novoTreino(b.dataset.novo === 'aerobico' ? 'Aeróbico' : 'Extra');
      lista.push(t); marcarSujo(); go(`#/p/${pid}/t/${t.id}`);
    }));
    document.getElementById('excluir-prof').addEventListener('click', () => {
      const i = D.professores.indexOf(p);
      if (confirm(`Excluir o programa "${p.nome}" com todas as rotinas e treinos?`)) { D.professores.splice(i, 1); marcarSujo(); go('#/'); }
    });
  }

  function telaRotina(pid, rid) {
    const p = prof(pid); const r = p && (p.rotinas || []).find(x => x.id === rid);
    if (!r) return go('#/');
    r.treinos = r.treinos || [];
    const corpo = `
      <section class="painel"><div class="campos" data-dados>
        ${campo('Nome da rotina', 'nome', r.nome, { cheio: true })}
        ${campo('Início', 'inicio', r.inicio || '', { tipo: 'date' })}
        ${campo('Fim', 'fim', r.fim || '', { tipo: 'date' })}
        ${campo('Categoria', 'categoria', r.categoria || '', { ph: 'Condicionamento' })}
        ${campo('Nível', 'nivel', r.nivel || 'Intermediário', { opcoes: NIVEIS })}
        ${campo('Orientações gerais', 'orientacoes', r.orientacoes || '', { tipo: 'textarea', cheio: true, ajuda: 'Aparece no topo da rotina, no app.' })}
      </div></section>
      <section class="painel" data-lista>
        <div class="painel-topo"><h2>Treinos</h2><button class="btn laranja pequeno" id="novo-treino">${I.mais} Novo treino</button></div>
        ${listaTreinos(r.treinos, `#/p/${esc(pid)}/t/`, 'Nenhum treino nesta rotina.')}
      </section>`;
    moldura(r.nome, [['Painel', '#/'], [p.nome, `#/p/${pid}`], [r.nome, '']], corpo);
    ligarCampos($.querySelector('[data-dados]'), r);
    ligarCtrl($.querySelector('[data-lista]'), r.treinos);
    document.getElementById('novo-treino').addEventListener('click', () => {
      const t = novoTreino(`Treino ${r.treinos.length + 1}`);
      r.treinos.push(t); marcarSujo(); go(`#/p/${pid}/t/${t.id}`);
    });
  }

  function telaTreino(pid, tid) {
    const p = prof(pid); const info = p && acharTreino(p, tid);
    if (!info) return go('#/');
    const t = info.t; t.blocos = t.blocos || [];
    const base = `#/p/${pid}/t/${tid}/e/`;
    const linhaEx = (b, e, j) => `<div class="item">
      ${b.tipo === 'combinado' ? `<span class="letra">${LETRAS[j]}</span>` : ''}
      <a class="abrir" href="${base}${esc(e.id)}"><strong>${esc(e.nome)}</strong><span>${esc(e.series || '—')}${e.carga ? ' · ' + esc(e.carga) : ''}${e.video ? ' · com vídeo' : ' · sem vídeo'}</span></a>
      <div class="ctrl">
        ${b.tipo === 'combinado' ? `<button class="ib" data-exmv="${esc(b.id)}|${j}|-1" aria-label="Subir exercício" ${j === 0 ? 'disabled' : ''}>${I.cima}</button>
        <button class="ib" data-exmv="${esc(b.id)}|${j}|1" aria-label="Descer exercício" ${j === b.exercicios.length - 1 ? 'disabled' : ''}>${I.baixo}</button>` : ''}
        <button class="ib perigo" data-exrm="${esc(b.id)}|${j}" aria-label="Excluir exercício">${I.lixo}</button>
      </div></div>`;
    const blocos = t.blocos.map((b, i) => {
      const mvBtns = `<button class="ib" data-bmv="${i}|-1" aria-label="Subir bloco" ${i === 0 ? 'disabled' : ''}>${I.cima}</button><button class="ib" data-bmv="${i}|1" aria-label="Descer bloco" ${i === t.blocos.length - 1 ? 'disabled' : ''}>${I.baixo}</button>`;
      const mv = `<div class="ctrl">${mvBtns}</div>`;
      if (b.tipo === 'combinado') {
        return `<div class="grupo">
          <div class="grupo-topo"><strong>Exercícios combinados · ${b.exercicios.length}</strong>
            <div class="ctrl"><button class="ib" data-addex="${esc(b.id)}" aria-label="Adicionar exercício ao bloco">${I.mais}</button>${mvBtns}</div></div>
          ${b.exercicios.map((e, j) => linhaEx(b, e, j)).join('')}
        </div>`;
      }
      return `<div style="display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center">${b.exercicios.map((e, j) => linhaEx(b, e, j)).join('')}${mv}</div>`;
    }).join('');
    const corpo = `
      <section class="painel"><div class="campos" data-dados>
        ${campo('Rótulo', 'rotulo', t.rotulo || '', { ajuda: 'Ex.: Treino 1, Segunda' })}
        ${campo('Nome do treino', 'nome', t.nome)}
      </div></section>
      <section class="painel">
        <div class="painel-topo"><h2>Exercícios · ${contarEx(t)}</h2></div>
        <p class="ajuda">Exercícios combinados aparecem no app agrupados (A, B, C…) com a indicação "Alterne esses exercícios".</p>
        <div class="itens">${blocos || '<p class="ajuda" style="margin:0">Nenhum exercício ainda.</p>'}</div>
        <div class="botoes">
          <button class="btn laranja pequeno" id="add-simples">${I.mais} Exercício</button>
          <button class="btn pequeno" id="add-combinado">${I.mais} Bloco combinado</button>
        </div>
      </section>
      <section class="painel"><button class="btn claro pequeno" id="excluir-treino">Excluir treino</button></section>`;
    const mig = [['Painel', '#/'], [p.nome, `#/p/${pid}`]];
    if (info.rotina) mig.push([info.rotina.nome, `#/p/${pid}/r/${info.rotina.id}`]);
    else mig.push([info.tipo === 'aerobico' ? 'Aeróbico' : 'Treinos extras', `#/p/${pid}`]);
    mig.push([t.nome, '']);
    moldura(t.nome, mig, corpo);
    ligarCampos($.querySelector('[data-dados]'), t);

    const blocoPorId = id => t.blocos.find(b => b.id === id);
    $.querySelectorAll('[data-bmv]').forEach(b => b.addEventListener('click', () => { const [i, d] = b.dataset.bmv.split('|').map(Number); mover(t.blocos, i, d); }));
    $.querySelectorAll('[data-exmv]').forEach(b => b.addEventListener('click', () => {
      const [bid, j, d] = b.dataset.exmv.split('|'); mover(blocoPorId(bid).exercicios, +j, +d);
    }));
    $.querySelectorAll('[data-exrm]').forEach(b => b.addEventListener('click', () => {
      const [bid, j] = b.dataset.exrm.split('|'); const bl = blocoPorId(bid);
      if (!confirm(`Excluir "${bl.exercicios[+j].nome}"?`)) return;
      bl.exercicios.splice(+j, 1);
      if (!bl.exercicios.length) t.blocos.splice(t.blocos.indexOf(bl), 1);
      marcarSujo(); render();
    }));
    $.querySelectorAll('[data-addex]').forEach(b => b.addEventListener('click', () => {
      const e = novoExercicio(); blocoPorId(b.dataset.addex).exercicios.push(e); marcarSujo(); go(base + e.id);
    }));
    document.getElementById('add-simples').addEventListener('click', () => {
      const e = novoExercicio(); t.blocos.push({ id: S.novoId('b'), tipo: 'simples', exercicios: [e] }); marcarSujo(); go(base + e.id);
    });
    document.getElementById('add-combinado').addEventListener('click', () => {
      const e = novoExercicio();
      t.blocos.push({ id: S.novoId('b'), tipo: 'combinado', titulo: 'Exercícios combinados', subtitulo: 'Alterne esses exercícios', exercicios: [e] });
      marcarSujo(); go(base + e.id);
    });
    document.getElementById('excluir-treino').addEventListener('click', () => {
      if (!confirm(`Excluir o treino "${t.nome}"?`)) return;
      info.lista.splice(info.lista.indexOf(t), 1); marcarSujo();
      go(info.rotina ? `#/p/${pid}/r/${info.rotina.id}` : `#/p/${pid}`);
    });
  }

  function htmlPreview(v) {
    const n = S.normalizarVideo(v);
    if (!n) return 'Sem vídeo';
    if (n.tipo === 'youtube') return S.youtubePlayer(n.url, 'Prévia', false);
    return `<video src="${esc(n.url)}" ${n.thumb ? `poster="${esc(n.thumb)}"` : ''} controls muted playsinline preload="metadata"></video>`;
  }

  function telaExercicio(pid, tid, eid) {
    const p = prof(pid); const info = p && acharTreino(p, tid); const ex = info && acharEx(info.t, eid);
    if (!ex) return go('#/');
    const e = ex.e;
    const aba = sessionStorage.getItem('adm_aba_video') || (online ? 'arquivo' : 'link');
    const corpo = `
      <section class="painel"><div class="campos" data-dados>
        ${campo('Nome do exercício', 'nome', e.nome, { cheio: true })}
        ${campo('Séries', 'series', e.series || '', { ph: '3x 12' })}
        ${campo('Carga', 'carga', e.carga || '', { ph: '0kg' })}
        ${campo('Intervalo', 'intervalo', e.intervalo || '', { ph: '60s', ajuda: 'Use segundos (60s) ou minutos (1 min) para ativar o cronômetro de descanso.' })}
        ${campo('Instruções', 'instrucoes', e.instrucoes || '', { tipo: 'textarea', cheio: true })}
      </div></section>
      <section class="painel">
        <h2>Vídeo</h2>
        <p class="ajuda">Envie um arquivo, cole um link do YouTube/MP4 ou escolha um vídeo da biblioteca.</p>
        <div class="video-area">
          <div class="preview" id="preview">${htmlPreview(e.video)}</div>
          <div>
            <div class="abas-adm" role="tablist">
              <button role="tab" data-aba="arquivo" aria-selected="${aba === 'arquivo'}">Enviar arquivo</button>
              <button role="tab" data-aba="link" aria-selected="${aba === 'link'}">Link</button>
              <button role="tab" data-aba="biblioteca" aria-selected="${aba === 'biblioteca'}">Biblioteca</button>
            </div>
            <div id="aba-corpo"></div>
            ${e.video ? `<div class="botoes"><button class="btn claro pequeno" id="tirar-video">Remover vídeo</button></div>` : ''}
          </div>
        </div>
      </section>`;
    moldura(e.nome, [['Painel', '#/'], [p.nome, `#/p/${pid}`], [info.t.nome, `#/p/${pid}/t/${tid}`], [e.nome, '']], corpo);
    ligarCampos($.querySelector('[data-dados]'), e);

    const definirVideo = (v) => { e.video = S.normalizarVideo(v); marcarSujo(); render(); toast('Vídeo definido'); };
    const corpoAba = document.getElementById('aba-corpo');
    function mostrarAba(nome) {
      sessionStorage.setItem('adm_aba_video', nome);
      $.querySelectorAll('[data-aba]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.aba === nome)));
      if (nome === 'arquivo') {
        if (!online) { corpoAba.innerHTML = `<div class="aviso">Para enviar arquivos de vídeo, conecte o Supabase (passo a passo no README). Enquanto isso, use a aba Link com um vídeo do YouTube ou um endereço .mp4.</div>`; return; }
        corpoAba.innerHTML = `<div class="campo"><label for="arq">Arquivo de vídeo (MP4, MOV, WEBM · até 50 MB)</label><input id="arq" type="file" accept="video/*"></div><div id="up-status"></div>`;
        document.getElementById('arq').addEventListener('change', async ev => {
          const f = ev.target.files[0]; if (!f) return;
          const st = document.getElementById('up-status');
          if (f.size > 50 * 1024 * 1024) { st.innerHTML = `<div class="aviso erro" style="margin-top:10px">O arquivo tem ${(f.size / 1048576).toFixed(0)} MB. O plano gratuito do Supabase aceita até 50 MB por arquivo; comprima o vídeo e tente de novo.</div>`; return; }
          st.innerHTML = `<p style="margin:10px 0 0;font-weight:600">Enviando ${esc(f.name)}…</p><div class="progresso-up"><i></i></div>`;
          try {
            const url = await S.enviarArquivo(f, 'mp4', e.nome);
            let thumb = '';
            try { const img = await capturarCapa(f); if (img) thumb = await S.enviarArquivo(img, 'thumbs', e.nome); } catch (x) { console.warn('Sem capa', x); }
            definirVideo({ url, thumb });
          } catch (err) { st.innerHTML = `<div class="aviso erro" style="margin-top:10px">Falha no envio: ${esc(err.message)}</div>`; }
        });
      } else if (nome === 'link') {
        corpoAba.innerHTML = `<div class="campo"><label for="lnk">Link do YouTube ou de um arquivo .mp4</label><input id="lnk" type="url" placeholder="https://www.youtube.com/watch?v=…" value="${esc(e.video ? e.video.url : '')}"></div>
          <div class="botoes"><button class="btn laranja pequeno" id="usar-link">Usar este link</button></div>`;
        document.getElementById('usar-link').addEventListener('click', () => {
          const u = document.getElementById('lnk').value.trim();
          if (!/^https?:\/\//.test(u)) { alert('Cole um endereço que comece com https://'); return; }
          definirVideo({ url: u, thumb: e.video && e.video.url === u ? e.video.thumb : '' });
        });
      } else {
        corpoAba.innerHTML = online ? '<p>Carregando vídeos…</p>' : `<div class="aviso">A biblioteca usa o armazenamento do Supabase. Conecte o Supabase para usar esta aba.</div>`;
        if (online) S.listarVideos().then(vs => {
          corpoAba.innerHTML = vs.length ? `<div class="biblioteca">${vs.map((v, i) => `<div class="bib-item"><video src="${esc(v.url)}#t=0.5" muted preload="metadata" playsinline></video><div><span>${esc(v.nome)}</span><button class="btn laranja pequeno" data-usar="${i}">Usar</button></div></div>`).join('')}</div>` : '<p>Nenhum vídeo enviado ainda.</p>';
          corpoAba.querySelectorAll('[data-usar]').forEach(b => b.addEventListener('click', () => definirVideo({ url: vs[+b.dataset.usar].url })));
        }).catch(err => { corpoAba.innerHTML = `<div class="aviso erro">${esc(err.message)}</div>`; });
      }
    }
    $.querySelectorAll('[data-aba]').forEach(b => b.addEventListener('click', () => mostrarAba(b.dataset.aba)));
    mostrarAba(aba);
    const tirar = document.getElementById('tirar-video');
    if (tirar) tirar.addEventListener('click', () => { e.video = null; marcarSujo(); render(); });
  }

  function capturarCapa(file) {
    return new Promise((resolve) => {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      const url = URL.createObjectURL(file);
      const fim = (r) => { URL.revokeObjectURL(url); resolve(r); };
      v.addEventListener('loadeddata', () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); });
      v.addEventListener('seeked', () => {
        const w = 480, h = Math.round(w * (v.videoHeight / v.videoWidth || 1.33));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(v, 0, 0, w, h);
        c.toBlob(b => fim(b ? new File([b], 'capa.jpg', { type: 'image/jpeg' }) : null), 'image/jpeg', 0.82);
      });
      v.addEventListener('error', () => fim(null));
      setTimeout(() => fim(null), 15000);
      v.src = url;
    });
  }

  function telaVideos() {
    const corpo = online ? `
      <section class="painel">
        <h2>Enviar vídeo</h2>
        <p class="ajuda">Os vídeos enviados aqui ficam disponíveis na aba Biblioteca de cada exercício.</p>
        <div class="campo"><label for="arq-bib">Arquivo de vídeo (até 50 MB)</label><input id="arq-bib" type="file" accept="video/*" multiple></div>
        <div id="bib-status"></div>
      </section>
      <section class="painel"><h2>Vídeos enviados</h2><div id="bib-lista"><p>Carregando…</p></div></section>`
      : `<section class="painel"><div class="aviso">A biblioteca de vídeos usa o armazenamento do Supabase. Siga o passo a passo do README para conectar, depois volte aqui.</div></section>`;
    moldura('Biblioteca de vídeos', [['Painel', '#/'], ['Biblioteca de vídeos', '']], corpo);
    if (!online) return;
    const carregar = () => S.listarVideos().then(vs => {
      const el = document.getElementById('bib-lista');
      el.innerHTML = vs.length ? `<div class="biblioteca">${vs.map((v, i) => `<div class="bib-item"><video src="${esc(v.url)}#t=0.5" controls muted preload="metadata" playsinline></video><div><span>${esc(v.nome)}</span><button class="btn claro pequeno" data-copiar="${i}">${I.copiar} Copiar link</button></div></div>`).join('')}</div>` : '<p>Nenhum vídeo enviado ainda.</p>';
      el.querySelectorAll('[data-copiar]').forEach(b => b.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(vs[+b.dataset.copiar].url); toast('Link copiado'); } catch (e) { prompt('Copie o link:', vs[+b.dataset.copiar].url); }
      }));
    }).catch(err => { document.getElementById('bib-lista').innerHTML = `<div class="aviso erro">${esc(err.message)}</div>`; });
    carregar();
    document.getElementById('arq-bib').addEventListener('change', async ev => {
      const st = document.getElementById('bib-status');
      for (const f of ev.target.files) {
        if (f.size > 50 * 1024 * 1024) { st.innerHTML += `<div class="aviso erro" style="margin-top:10px">${esc(f.name)}: maior que 50 MB, não enviado.</div>`; continue; }
        st.innerHTML = `<p style="margin:10px 0 0;font-weight:600">Enviando ${esc(f.name)}…</p><div class="progresso-up"><i></i></div>`;
        try { await S.enviarArquivo(f, 'mp4', f.name.replace(/\.[^.]+$/, '')); st.innerHTML = `<p style="margin:10px 0 0;color:var(--verde);font-weight:700">${esc(f.name)} enviado.</p>`; }
        catch (err) { st.innerHTML = `<div class="aviso erro" style="margin-top:10px">${esc(f.name)}: ${esc(err.message)}</div>`; }
      }
      carregar();
    });
  }

  /* ---------- Login (somente com Supabase) ---------- */
  function telaLogin(msg) {
    $.innerHTML = `<main class="login">
      <div class="marca"><span class="marca-icone">${I.halter}</span> Área admin</div>
      <h1>Entrar</h1>
      <p>Use o e-mail e a senha do usuário admin criado no Supabase.</p>
      ${msg ? `<div class="aviso erro" style="margin-bottom:14px">${esc(msg)}</div>` : ''}
      <form id="f-login">
        <div class="campo"><label for="em">E-mail</label><input id="em" type="email" autocomplete="username" required></div>
        <div class="campo"><label for="pw">Senha</label><input id="pw" type="password" autocomplete="current-password" required></div>
        <button class="btn laranja bloco" type="submit">Entrar</button>
      </form>
      <p style="margin-top:18px"><a href="index.html">Voltar para o app</a></p>
    </main>`;
    document.getElementById('f-login').addEventListener('submit', async ev => {
      ev.preventDefault();
      const btn = ev.target.querySelector('button'); btn.disabled = true; btn.textContent = 'Entrando…';
      const { error } = await S.sb().auth.signInWithPassword({ email: document.getElementById('em').value.trim(), password: document.getElementById('pw').value });
      if (error) return telaLogin('E-mail ou senha incorretos. Confira o usuário em Authentication → Users no Supabase.');
      iniciarPainel();
    });
  }

  /* ---------- Roteador ---------- */
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  function render() {
    const p = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean);
    window.scrollTo(0, 0);
    if (p[0] === 'videos') return telaVideos();
    if (p[0] === 'p' && p[1]) {
      if (p[2] === 'r' && p[3]) return telaRotina(p[1], p[3]);
      if (p[2] === 't' && p[3] && p[4] === 'e' && p[5]) return telaExercicio(p[1], p[3], p[5]);
      if (p[2] === 't' && p[3]) return telaTreino(p[1], p[3]);
      return telaProf(p[1]);
    }
    return telaInicio();
  }

  async function iniciarPainel() {
    const r = await S.carregarDados();
    D = r.dados; origem = r.origem;
    if (online && origem !== 'supabase') {
      // Primeiro acesso: o banco ainda está vazio. Os dados do arquivo serão publicados no primeiro "Salvar".
      sujo = true;
    }
    window.addEventListener('hashchange', render);
    render();
    if (online && origem !== 'supabase') toast('Banco vazio: clique em Salvar alterações para publicar os treinos atuais');
  }

  (async function () {
    if (online) {
      const { data } = await S.sb().auth.getSession();
      if (!data.session) return telaLogin();
    }
    iniciarPainel();
  })();
})();
