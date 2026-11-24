/* App do aluno — rotas por hash, sem dependências. */
(function () {
  const S = window.Store;
  const esc = S.esc;
  const CFG = window.APP_CONFIG || {};
  const $app = document.getElementById('app');

  const LS_PROF = 'treino_prof';
  const LS_ATIVO = 'treino_ativo';
  const LS_ACESSO = 'treino_acesso';
  const LOGO = CFG.logo || 'assets/logo.svg';

  let DADOS = null;
  let timers = [];
  let descansoTimer = null;

  /* ---------- Ícones ---------- */
  const I = {
    voltar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    halter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 7v10M3.5 9.5v5M18 7v10M20.5 9.5v5M6 12h12"/></svg>',
    casa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/></svg>',
    lista: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 9h8M8 12h8M8 15h5"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.8v14.4a1 1 0 0 0 1.5.86l12-7.2a1 1 0 0 0 0-1.72l-12-7.2A1 1 0 0 0 7 4.8z"/></svg>',
    grafico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 20V11M12 20V5M19 20v-6"/></svg>',
    pessoas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.6-4.8-4-5.6"/></svg>',
    estrela: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    relogio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    abaixo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    circuito: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>',
    corrida: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="15" cy="4.5" r="2"/><path d="M5 20l4-5 3 2 2-5 3 3h3M9.5 9.5L13 8l2 3"/></svg>',
    olho: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    troca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h12l-3-3M17 17H5l3 3"/></svg>'
  };

  /* ---------- Utilidades ---------- */
  function toast(msg) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function limparTimers() { timers.forEach(clearInterval); timers = []; }
  function go(h) { location.hash = h; }

  function profAtual() {
    const id = S.ls.get(LS_PROF, null);
    return DADOS.professores.find(p => p.id === id) || null;
  }
  function iniciais(nome) { return String(nome || '?').trim().slice(0, 1).toUpperCase(); }
  function saudacao() {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }
  function statusRotina(r) {
    const hoje = S.hojeISO();
    if (r.inicio && hoje < r.inicio) return { txt: 'Começa em ' + S.fmtData(r.inicio), cls: 'cinza', ord: 1 };
    if (r.fim && hoje > r.fim) return { txt: 'Encerrada', cls: 'cinza', ord: 2 };
    return { txt: 'Em andamento', cls: 'verde', ord: 0 };
  }
  function contarExercicios(t) { return (t.blocos || []).reduce((n, b) => n + (b.exercicios || []).length, 0); }
  function encontrarTreino(prof, tid) {
    for (const r of prof.rotinas || []) for (const t of r.treinos || []) if (t.id === tid) return { treino: t, rotina: r, tipo: 'rotina' };
    for (const t of prof.aerobico || []) if (t.id === tid) return { treino: t, rotina: null, tipo: 'aerobico' };
    for (const t of prof.extras || []) if (t.id === tid) return { treino: t, rotina: null, tipo: 'extra' };
    return null;
  }
  function execucoes(tid) { return S.historico().filter(h => h.treinoId === tid); }
  function rotinaPrincipal(prof) {
    const rs = (prof.rotinas || []).slice();
    return rs.find(r => statusRotina(r).ord === 0) || rs[0] || null;
  }
  function proximoTreino(prof) {
    const r = rotinaPrincipal(prof);
    if (!r || !(r.treinos || []).length) return null;
    const hist = S.historico();
    let melhor = null, melhorData = null;
    for (const t of r.treinos) {
      const ex = hist.filter(h => h.treinoId === t.id);
      const ult = ex.length ? ex[ex.length - 1].fim : '';
      if (!ult) return { treino: t, rotina: r };
      if (melhorData === null || ult < melhorData) { melhor = t; melhorData = ult; }
    }
    return { treino: melhor, rotina: r };
  }
  function segParaTexto(s) {
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  function duracaoCurta(s) {
    const m = Math.round(s / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
  }
  function intervaloSeg(txt) {
    if (!txt) return 0;
    const t = String(txt).toLowerCase();
    const mmss = t.match(/(\d+)\s*[:;]\s*(\d{1,2})/);
    if (mmss) return (+mmss[1]) * 60 + (+mmss[2]);
    const n = parseFloat(t.replace(',', '.'));
    if (isNaN(n)) return 0;
    return /min/.test(t) ? Math.round(n * 60) : Math.round(n);
  }
  function inicioSemana(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dia = (x.getDay() + 6) % 7; // segunda = 0
    x.setDate(x.getDate() - dia);
    return x;
  }
  function isoLocal(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

  /* ---------- Pedaços de interface ---------- */
  function nav(atual) {
    const item = (h, ic, txt, key) => `<a href="#/${h}" ${atual === key ? 'aria-current="page"' : ''}>${ic}<span>${txt}</span></a>`;
    return `<nav class="nav" aria-label="Navegação principal"><div class="nav-inner">
      ${item('inicio', I.casa, 'Início', 'inicio')}
      ${item('treinos', I.lista, 'Treinos', 'treinos')}
      ${item('progresso', I.grafico, 'Progresso', 'progresso')}
      ${item('programas', I.pessoas, 'Programas', 'programas')}
    </div></nav>`;
  }
  function areaLogo(extra) {
    return `<div class="logo-area ${extra || ''}"><img src="${esc(LOGO)}" alt="Logotipo"></div>`;
  }

  /* ---------- Senha de acesso ---------- */
  function chaveAcesso() { try { return btoa(unescape(encodeURIComponent('v1:' + (CFG.senha || '')))); } catch (e) { return 'v1'; } }
  function liberado() { return !CFG.senha || S.ls.get(LS_ACESSO, null) === chaveAcesso(); }
  function telaSenha(erro) {
    $app.innerHTML = `
      <main class="bloqueio">
        ${areaLogo('grande')}
        <form id="f-senha" class="bloqueio-form" autocomplete="off">
          <label for="senha">Digite a senha para acessar</label>
          <div class="senha-campo">
            <input id="senha" type="password" inputmode="text" autocomplete="current-password" required ${erro ? 'aria-invalid="true" aria-describedby="senha-erro"' : ''}>
            <button type="button" class="ver-senha" aria-label="Mostrar senha" aria-pressed="false">${I.olho}</button>
          </div>
          ${erro ? `<p class="senha-erro" id="senha-erro" role="alert">Senha incorreta. Confira e tente de novo.</p>` : ''}
          <button class="btn laranja bloco" type="submit">Entrar</button>
        </form>
      </main>`;
    const inp = document.getElementById('senha');
    inp.focus();
    $app.querySelector('.ver-senha').addEventListener('click', e => {
      const b = e.currentTarget, mostrar = inp.type === 'password';
      inp.type = mostrar ? 'text' : 'password';
      b.setAttribute('aria-pressed', String(mostrar));
      b.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
    });
    document.getElementById('f-senha').addEventListener('submit', ev => {
      ev.preventDefault();
      if (inp.value === CFG.senha) {
        S.ls.set(LS_ACESSO, chaveAcesso());
        if (location.hash === '#/programas') render(); else location.hash = '#/programas';
      } else {
        telaSenha(true);
      }
    });
  }
  function topo({ titulo, sub = '', voltar = '', extra = '', meta = '' }) {
    return `<header class="topo">
      <div class="topo-barra">
        ${voltar ? `<a class="btn-voltar" href="${voltar}" aria-label="Voltar">${I.voltar}</a>` : '<span></span>'}
        ${extra}
      </div>
      <h1>${esc(titulo)}</h1>
      ${sub ? `<p class="sub">${sub}</p>` : ''}
      ${meta ? `<div class="meta">${meta}</div>` : ''}
    </header>`;
  }
  function vazio(ic, titulo, texto) {
    return `<div class="vazio"><div class="ic">${ic}</div><strong>${esc(titulo)}</strong>${esc(texto)}</div>`;
  }

  /* ---------- Telas ---------- */
  function telaProgramas() {
    const atual = S.ls.get(LS_PROF, null);
    $app.innerHTML = `
      <main class="selecao">
        ${areaLogo()}
        <h1>Vamos resolver seu problema de qual forma?</h1>
        <div class="lista-prof">
          ${DADOS.professores.map(p => {
            const nr = (p.rotinas || []).length;
            return `<button class="prof" data-prof="${esc(p.id)}" ${p.id === atual ? 'aria-current="true"' : ''}>
              <span class="avatar">${esc(iniciais(p.nome))}</span>
              <span><strong>${esc(p.nome)}</strong><span>${nr} ${nr === 1 ? 'rotina de treino' : 'rotinas de treino'}</span></span>
              ${I.seta}
            </button>`;
          }).join('')}
        </div>
      </main>`;
    $app.classList.add('sem-nav');
    $app.querySelectorAll('[data-prof]').forEach(b => b.addEventListener('click', () => {
      S.ls.set(LS_PROF, b.dataset.prof);
      go('#/inicio');
    }));
  }

  function telaInicio(prof) {
    const hist = S.historico().filter(h => h.profId === prof.id);
    const semana = inicioSemana(new Date());
    const hoje = S.hojeISO();
    const letras = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
    const nomesDias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    let feitosSemana = 0;
    const dias = letras.map((l, i) => {
      const d = new Date(semana); d.setDate(d.getDate() + i);
      const iso = isoLocal(d);
      const feito = hist.some(h => (h.dia || '').slice(0, 10) === iso);
      if (feito) feitosSemana++;
      return `<div class="dia ${feito ? 'feito' : ''} ${iso === hoje ? 'hoje' : ''}" aria-label="${nomesDias[i]}${feito ? ', treinou' : ''}">${l}<i></i></div>`;
    }).join('');

    const ativo = S.ls.get(LS_ATIVO, null);
    const ativoInfo = ativo && ativo.profId === prof.id ? encontrarTreino(prof, ativo.treinoId) : null;
    const andamento = ativoInfo ? `<a class="andamento" href="#/treino/${esc(ativoInfo.treino.id)}">
        <span class="ic">${I.play}</span>
        <span><small>Treino em andamento</small><strong>${esc(ativoInfo.treino.nome)}</strong></span>
        ${I.seta}</a>` : '';
    const nRot = (prof.rotinas || []).length;
    const nTreinos = (prof.rotinas || []).reduce((n, r) => n + (r.treinos || []).length, 0);

    $app.innerHTML = `
      <header class="topo">
        <div class="saudacao">
          <span class="avatar">${esc(iniciais(DADOS.aluno || CFG.nomeAluno))}</span>
          <div><small>${esc(prof.nome)}</small><strong>${saudacao()}, ${esc(DADOS.aluno || CFG.nomeAluno || '')}!</strong></div>
          <button class="troca" data-ir="#/programas">${I.troca} Trocar</button>
        </div>
        <div class="frequencia">
          <div class="frequencia-topo"><strong>Frequência de Treinos</strong><span>${feitosSemana} nesta semana</span></div>
          <div class="semana">${dias}</div>
        </div>
      </header>
      <main class="conteudo">
        ${andamento}
        <h2 class="secao-titulo">Seu espaço</h2>
        <div class="atalhos">
          <a class="atalho grande laranja" href="#/treinos">
            <span class="ic">${I.halter}</span>
            <span class="txt"><strong>Treinos</strong><span>${nTreinos} ${nTreinos === 1 ? 'treino' : 'treinos'}${nRot > 1 ? ` · ${nRot} rotinas` : ''}</span></span>
            <span class="ir">${I.seta}</span>
          </a>
          <a class="atalho grande escuro" href="#/progresso">
            <span class="ic">${I.grafico}</span>
            <span class="txt"><strong>Meu Progresso</strong><span>${hist.length} ${hist.length === 1 ? 'treino feito' : 'treinos feitos'}</span></span>
            <span class="ir">${I.seta}</span>
          </a>
        </div>
      </main>
      ${nav('inicio')}`;
    $app.querySelector('[data-ir]').addEventListener('click', e => go(e.currentTarget.dataset.ir));
  }

  function telaTreinos(prof, aba) {
    const aero = aba === 'aerobico';
    const rotinas = (prof.rotinas || []).slice().sort((a, b) => statusRotina(a).ord - statusRotina(b).ord);
    let corpo;
    if (!aero) {
      corpo = rotinas.length ? `<div class="lista">${rotinas.map(r => {
        const st = statusRotina(r);
        return `<a class="rotina ${st.ord === 0 ? 'ativa' : ''}" href="#/rotina/${esc(r.id)}">
          <div class="rotina-topo"><h3>${esc(r.nome)}</h3><span class="chip ${st.cls}">${esc(st.txt)}</span></div>
          <div class="datas">${I.cal} ${S.fmtData(r.inicio)} – ${S.fmtData(r.fim)}</div>
          <div class="rodape"><span class="chip claro">${esc(r.categoria || 'Treino')} | ${esc(r.nivel || '')}</span><span class="chip claro">${(r.treinos || []).length} treinos</span></div>
        </a>`;
      }).join('')}</div>` : vazio(I.halter, 'Você ainda não tem rotinas de treino', 'Quando seu professor adicionar uma rotina, ela aparecerá aqui.');
    } else {
      const lista = prof.aerobico || [];
      corpo = lista.length ? `<div class="lista">${lista.map(t => cardTreino(t)).join('')}</div>`
        : vazio(I.corrida, 'Você ainda não tem um treino aeróbico', 'Quando seu professor adicionar um treino aeróbico, ele aparecerá aqui.');
    }
    $app.innerHTML = `
      <header class="topo">
        <div class="topo-barra"><a class="btn-voltar" href="#/inicio" aria-label="Voltar">${I.voltar}</a><span class="chip">${esc(prof.nome)}</span></div>
        <h1>Treinos</h1>
        <div class="abas" role="tablist">
          <button class="aba" role="tab" aria-selected="${!aero}" data-ir="#/treinos">Rotinas de Treinos</button>
          <button class="aba" role="tab" aria-selected="${aero}" data-ir="#/treinos/aerobico">Aeróbico</button>
        </div>
      </header>
      <main class="conteudo">${corpo}</main>
      ${nav('treinos')}`;
    $app.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => go(b.dataset.ir)));
  }

  function cardTreino(t) {
    const ex = execucoes(t.id);
    const ult = ex.length ? ex[ex.length - 1] : null;
    const status = ex.length
      ? `Executado ${ex.length} ${ex.length === 1 ? 'vez' : 'vezes'}, última execução em ${S.fmtData(ult.dia)}`
      : 'Você ainda não realizou esse treino';
    return `<article class="treino-item">
      <div>
        ${t.rotulo ? `<div class="rotulo">${esc(t.rotulo)}</div>` : ''}
        <h3>${esc(t.nome)}</h3>
      </div>
      <div class="status">${ex.length ? I.check : I.relogio} ${esc(status)}</div>
      <div class="resumo"><span class="chip cinza">${contarExercicios(t)} exercícios</span>${(t.blocos || []).some(b => b.tipo === 'combinado') ? `<span class="chip cinza">${(t.blocos || []).filter(b => b.tipo === 'combinado').length} ${(t.blocos || []).filter(b => b.tipo === 'combinado').length === 1 ? 'bloco combinado' : 'blocos combinados'}</span>` : ''}</div>
      <a class="btn laranja bloco" href="#/treino/${esc(t.id)}">Ver treino</a>
    </article>`;
  }

  function telaRotina(prof, rid) {
    const r = (prof.rotinas || []).find(x => x.id === rid);
    if (!r) return go('#/treinos');
    const st = statusRotina(r);
    const outras = (prof.rotinas || []).slice().sort((a, b) => statusRotina(a).ord - statusRotina(b).ord);
    const seletor = outras.length > 1 ? `<div class="rotinas-troca" role="navigation" aria-label="Rotinas de treino">
        ${outras.map(o => `<a href="#/rotina/${esc(o.id)}" class="${o.id === r.id ? 'atual' : ''}" ${o.id === r.id ? 'aria-current="page"' : ''}>${esc(o.nome)}</a>`).join('')}
      </div>` : '';
    $app.innerHTML = `
      ${topo({
        titulo: r.nome, voltar: '#/inicio',
        sub: `${S.fmtData(r.inicio)} – ${S.fmtData(r.fim)}`,
        meta: `<span class="chip ${st.cls === 'verde' ? 'laranja' : ''}">${esc(st.txt)}</span><span class="chip">${esc(r.categoria || '')} | ${esc(r.nivel || '')}</span>`
      })}
      <main class="conteudo">
        ${seletor}
        ${r.orientacoes ? `<details class="orientacoes"><summary>Orientações gerais ${I.abaixo}</summary><div>${esc(r.orientacoes)}</div></details>` : ''}
        <div class="lista">${(r.treinos || []).map(t => cardTreino(t)).join('') || vazio(I.halter, 'Sem treinos nesta rotina', 'Os treinos aparecerão aqui quando forem adicionados.')}</div>
      </main>
      ${nav('treinos')}`;
  }

  function telaExtras(prof) {
    const lista = prof.extras || [];
    $app.innerHTML = `
      ${topo({ titulo: 'Treinos Extra', voltar: '#/inicio' })}
      <main class="conteudo">
        ${lista.length ? `<div class="lista">${lista.map(t => cardTreino(t)).join('')}</div>`
          : vazio(I.estrela, 'Nenhum treino extra por aqui', 'Seu professor ainda não adicionou nenhum treino extra!')}
      </main>
      ${nav('inicio')}`;
  }

  function htmlExercicio(ex, letra, ativo, feitos) {
    const v = S.normalizarVideo(ex.video);
    const feito = feitos.includes(ex.id);
    const dl = [
      ['Séries', ex.series], ['Carga', ex.carga], ['Intervalo', ex.intervalo]
    ].filter(x => x[1]).map(([k, val]) => `<div><dt>${k}:</dt><dd>${esc(val)}</dd></div>`).join('');
    const desc = intervaloSeg(ex.intervalo);
    return `<div class="ex ${feito ? 'feito' : ''}" data-ex="${esc(ex.id)}">
      ${letra ? `<span class="letra" aria-hidden="true">${letra}</span>` : ''}
      <div>
        <h4>${esc(ex.nome)}</h4>
        <dl>${dl}</dl>
        ${ex.instrucoes ? `<details class="instr"><summary>Instruções</summary><p>${esc(ex.instrucoes)}</p></details>` : ''}
        ${ativo ? `<div class="acoes">
          <button class="check" data-check="${esc(ex.id)}" aria-pressed="${feito}"><i>${I.check}</i>${feito ? 'Feito' : 'Marcar feito'}</button>
          ${desc ? `<button class="descanso-btn" data-descanso="${desc}">${I.relogio} Descanso ${esc(ex.intervalo)}</button>` : ''}
        </div>` : ''}
      </div>
      ${v ? `<button class="thumb" data-video="${esc(ex.id)}" aria-label="Ver vídeo: ${esc(ex.nome)}">
          ${v.thumb ? `<img src="${esc(v.thumb)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
          <span class="play">${I.play}</span></button>`
        : `<div class="thumb sem-video">Sem vídeo</div>`}
    </div>`;
  }

  function telaTreino(prof, tid) {
    const info = encontrarTreino(prof, tid);
    if (!info) return go('#/treinos');
    const { treino, rotina } = info;
    let ativo = S.ls.get(LS_ATIVO, null);
    const esteAtivo = ativo && ativo.treinoId === tid;
    const feitos = esteAtivo ? ativo.feitos : [];
    const total = contarExercicios(treino);
    const voltar = rotina ? `#/rotina/${rotina.id}` : (info.tipo === 'extra' ? '#/extras' : '#/treinos/aerobico');
    const letras = 'ABCDEFGHIJKLMNOP';

    const blocos = (treino.blocos || []).map(b => {
      if (b.tipo === 'combinado') {
        return `<section class="bloco bloco-combinado">
          <header><span class="ic">${I.circuito}</span><div><strong>${esc(b.titulo || 'Exercícios combinados')}</strong><span>${esc(b.subtitulo || 'Alterne esses exercícios')}</span></div></header>
          <div class="trilho">${(b.exercicios || []).map((ex, i) => htmlExercicio(ex, letras[i], esteAtivo, feitos)).join('')}</div>
        </section>`;
      }
      return `<section class="bloco bloco-simples">${(b.exercicios || []).map(ex => htmlExercicio(ex, '', esteAtivo, feitos)).join('')}</section>`;
    }).join('');

    const outroAtivo = ativo && !esteAtivo ? encontrarTreino(prof, ativo.treinoId) : null;

    $app.innerHTML = `
      ${esteAtivo ? `<div class="ativo-barra" role="timer">
          <div><small>Tempo de treino · ${feitos.length}/${total} feitos</small><span class="tempo" id="cronometro">00:00</span></div>
          <button class="btn" id="finalizar">Finalizar treino</button>
        </div>` : ''}
      ${topo({
        titulo: treino.nome, voltar,
        sub: esc([treino.rotulo, rotina && rotina.nome].filter(Boolean).join(' · ')),
        meta: `<span class="chip">${total} exercícios</span>`
      })}
      <main class="conteudo">
        ${!esteAtivo ? `<button class="btn laranja bloco" id="iniciar" style="margin-bottom:18px">${I.play} Iniciar treino</button>
          ${outroAtivo ? `<p style="margin:-6px 4px 16px;color:var(--texto-2);font-size:14px">Você tem outro treino em andamento: <a href="#/treino/${esc(outroAtivo.treino.id)}">${esc(outroAtivo.treino.nome)}</a>. Ao iniciar este, o outro é descartado.</p>` : ''}` : ''}
        ${blocos || vazio(I.halter, 'Sem exercícios', 'Este treino ainda não tem exercícios.')}
        ${esteAtivo ? `<button class="btn verde bloco" id="finalizar2" style="margin-top:8px">${I.check} Finalizar treino</button>` : ''}
      </main>
      ${nav('treinos')}`;

    // vídeos
    const mapa = {};
    (treino.blocos || []).forEach(b => (b.exercicios || []).forEach(ex => { mapa[ex.id] = ex; }));
    $app.querySelectorAll('[data-video]').forEach(b => b.addEventListener('click', () => abrirVideo(mapa[b.dataset.video])));

    const btnIniciar = document.getElementById('iniciar');
    if (btnIniciar) btnIniciar.addEventListener('click', () => {
      S.ls.set(LS_ATIVO, { treinoId: tid, profId: prof.id, inicio: Date.now(), feitos: [] });
      toast('Treino iniciado');
      render();
    });

    if (esteAtivo) {
      const cron = document.getElementById('cronometro');
      const tick = () => { cron.textContent = segParaTexto((Date.now() - ativo.inicio) / 1000); };
      tick(); timers.push(setInterval(tick, 1000));

      $app.querySelectorAll('[data-check]').forEach(b => b.addEventListener('click', () => {
        ativo = S.ls.get(LS_ATIVO, ativo);
        const id = b.dataset.check;
        const i = ativo.feitos.indexOf(id);
        if (i >= 0) ativo.feitos.splice(i, 1); else ativo.feitos.push(id);
        S.ls.set(LS_ATIVO, ativo);
        const feito = i < 0;
        b.setAttribute('aria-pressed', String(feito));
        b.lastChild.textContent = feito ? 'Feito' : 'Marcar feito';
        b.closest('.ex').classList.toggle('feito', feito);
        document.querySelector('.ativo-barra small').textContent = `Tempo de treino · ${ativo.feitos.length}/${total} feitos`;
      }));
      $app.querySelectorAll('[data-descanso]').forEach(b => b.addEventListener('click', () => iniciarDescanso(+b.dataset.descanso)));

      const finalizar = () => {
        const a = S.ls.get(LS_ATIVO, ativo);
        if (a.feitos.length < total && !confirm(`Você marcou ${a.feitos.length} de ${total} exercícios. Finalizar mesmo assim?`)) return;
        const fim = new Date();
        S.registrarExecucao({
          id: S.novoId('h'), profId: prof.id, rotinaId: rotina ? rotina.id : null, treinoId: tid,
          treinoNome: treino.nome, rotulo: treino.rotulo || '', rotinaNome: rotina ? rotina.nome : (info.tipo === 'extra' ? 'Treino extra' : 'Aeróbico'),
          dia: isoLocal(fim), fim: fim.toISOString(), duracao: Math.round((fim - a.inicio) / 1000),
          feitos: a.feitos.length, total
        });
        S.ls.del(LS_ATIVO);
        pararDescanso();
        toast('Treino finalizado');
        go('#/progresso');
      };
      document.getElementById('finalizar').addEventListener('click', finalizar);
      document.getElementById('finalizar2').addEventListener('click', finalizar);
    }
  }

  function iniciarDescanso(seg) {
    pararDescanso();
    const fimEm = Date.now() + seg * 1000;
    const el = document.createElement('div');
    el.className = 'descanso'; el.setAttribute('role', 'timer'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = `<svg class="anel" viewBox="0 0 54 54"><circle cx="27" cy="27" r="23" fill="none" stroke="#3A3A44" stroke-width="6"/><circle id="anel" cx="27" cy="27" r="23" fill="none" stroke="#FF5A1F" stroke-width="6" stroke-linecap="round" stroke-dasharray="144.5" transform="rotate(-90 27 27)"/></svg>
      <div><small>Descanso</small><strong id="desc-t">${segParaTexto(seg)}</strong></div>
      <button class="btn">Pular</button>`;
    document.body.appendChild(el);
    el.querySelector('button').addEventListener('click', pararDescanso);
    const anel = el.querySelector('#anel'), txt = el.querySelector('#desc-t');
    const tick = () => {
      const rest = Math.max(0, (fimEm - Date.now()) / 1000);
      txt.textContent = segParaTexto(Math.ceil(rest));
      anel.setAttribute('stroke-dashoffset', String(144.5 * (1 - rest / seg)));
      if (rest <= 0) {
        try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) { /* */ }
        txt.textContent = 'Bora!';
        clearInterval(descansoTimer); descansoTimer = null;
        setTimeout(pararDescanso, 2500);
      }
    };
    tick(); descansoTimer = setInterval(tick, 250);
  }
  function pararDescanso() {
    if (descansoTimer) clearInterval(descansoTimer);
    descansoTimer = null;
    document.querySelectorAll('.descanso').forEach(e => e.remove());
  }

  function abrirVideo(ex) {
    const v = S.normalizarVideo(ex && ex.video);
    if (!v) return;
    let dlg = document.getElementById('dlg-video');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'dlg-video'; dlg.className = 'video';
      document.body.appendChild(dlg);
      dlg.addEventListener('close', () => { dlg.innerHTML = ''; });
      dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    }
    const player = v.tipo === 'youtube'
      ? S.youtubePlayer(v.url, ex.nome, true)
      : `<video src="${esc(v.url)}" ${v.thumb ? `poster="${esc(v.thumb)}"` : ''} controls autoplay loop playsinline></video>`;
    const dl = [['Séries', ex.series], ['Carga', ex.carga], ['Intervalo', ex.intervalo]].filter(x => x[1])
      .map(([k, val]) => `<dt>${k}</dt><dd>${esc(val)}</dd>`).join('');
    dlg.innerHTML = `<div class="video-wrap">
      <div class="video-topo"><strong>${esc(ex.nome)}</strong><button class="btn-icone" aria-label="Fechar vídeo">${I.fechar}</button></div>
      <div class="video-corpo">${player}</div>
      <div class="video-rodape"><dl>${dl}</dl>${v.tipo === 'youtube' ? `<p style="margin:10px 0 0"><a href="${esc(v.url)}" target="_blank" rel="noopener" style="color:#FF8A5C;font-weight:700">Abrir no YouTube</a></p>` : ''}${ex.instrucoes ? `<p style="white-space:pre-line;margin:10px 0 0">${esc(ex.instrucoes)}</p>` : ''}</div>
    </div>`;
    dlg.querySelector('.btn-icone').addEventListener('click', () => dlg.close());
    const vid = dlg.querySelector('video');
    if (vid) vid.addEventListener('error', () => {
      dlg.querySelector('.video-corpo').innerHTML = '<p style="padding:24px;text-align:center">Não foi possível carregar este vídeo. Verifique sua conexão ou peça para trocar o vídeo na área admin.</p>';
    });
    dlg.showModal();
  }

  function telaProgresso(prof) {
    const hist = S.historico().filter(h => h.profId === prof.id);
    const totalSeg = hist.reduce((s, h) => s + (h.duracao || 0), 0);
    // sequência de semanas seguidas com treino
    const semanaKey = d => isoLocal(inicioSemana(d));
    const semanasCom = new Set(hist.map(h => semanaKey(new Date(h.fim))));
    let seq = 0; const cursor = inicioSemana(new Date());
    if (!semanasCom.has(isoLocal(cursor))) cursor.setDate(cursor.getDate() - 7);
    while (semanasCom.has(isoLocal(cursor))) { seq++; cursor.setDate(cursor.getDate() - 7); }

    const semanas = [];
    const base = inicioSemana(new Date());
    for (let i = 7; i >= 0; i--) {
      const d = new Date(base); d.setDate(d.getDate() - i * 7);
      const k = isoLocal(d);
      semanas.push({ k, rot: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, n: hist.filter(h => semanaKey(new Date(h.fim)) === k).length, atual: i === 0 });
    }
    const max = Math.max(3, ...semanas.map(s => s.n));
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    $app.innerHTML = `
      <header class="topo">
        <div class="topo-barra"><a class="btn-voltar" href="#/inicio" aria-label="Voltar">${I.voltar}</a><span class="chip">${esc(prof.nome)}</span></div>
        <h1>Meu Progresso</h1>
        <div class="numeros">
          <div class="numero"><strong>${hist.length}</strong><span>treinos feitos</span></div>
          <div class="numero"><strong>${totalSeg ? duracaoCurta(totalSeg) : '0 min'}</strong><span>tempo total</span></div>
          <div class="numero"><strong>${seq}</strong><span>${seq === 1 ? 'semana seguida' : 'semanas seguidas'}</span></div>
        </div>
      </header>
      <main class="conteudo">
        <h2 class="secao-titulo">Treinos por semana</h2>
        <div class="cartao">
          <div class="grafico" role="img" aria-label="Treinos por semana nas últimas 8 semanas">
            ${semanas.map(s => `<div class="barra ${s.atual ? 'atual' : ''}"><div class="col">${s.n ? `<b>${s.n}</b><i style="height:${(s.n / max) * 100}%"></i>` : ''}</div><small>${s.rot}</small></div>`).join('')}
          </div>
        </div>
        <h2 class="secao-titulo">Histórico</h2>
        ${hist.length ? `<div class="cartao" style="padding:4px 16px">${hist.slice().reverse().map(h => {
          const d = new Date(h.fim);
          return `<div class="hist-item">
            <div class="data"><div><strong>${d.getDate()}</strong><br><small>${meses[d.getMonth()]}</small></div></div>
            <div><h4>${esc(h.treinoNome)}</h4><p>${esc([h.rotulo, h.rotinaNome].filter(Boolean).join(' · '))} · ${h.feitos}/${h.total} exercícios</p></div>
            <span class="dur">${duracaoCurta(h.duracao || 0)}</span>
          </div>`;
        }).join('')}</div>`
        : vazio(I.grafico, 'Nenhum treino registrado ainda', 'Abra um treino, toque em "Iniciar treino" e finalize no fim para ele aparecer aqui.')}
        <p style="color:var(--texto-2);font-size:13px;margin:18px 4px 0">O histórico fica salvo neste aparelho.</p>
      </main>
      ${nav('progresso')}`;
  }

  /* ---------- Roteador ---------- */
  function render() {
    limparTimers();
    pararDescanso();
    const dlg = document.getElementById('dlg-video');
    if (dlg && dlg.open) dlg.close();

    $app.classList.remove('sem-nav');
    if (!liberado()) return telaSenha(false);

    const partes = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean);
    const rota = partes[0] || '';
    const prof = profAtual();

    window.scrollTo(0, 0);
    if (!rota || rota === 'programas' || !prof) {
      if (rota !== 'programas') { history.replaceState(null, '', '#/programas'); }
      return telaProgramas();
    }
    switch (rota) {
      case 'treinos': {
        if (partes[1] === 'aerobico') return telaTreinos(prof, 'aerobico');
        const r = rotinaPrincipal(prof);
        if (r) { history.replaceState(null, '', '#/rotina/' + r.id); return telaRotina(prof, r.id); }
        return telaTreinos(prof);
      }
      case 'rotina': return telaRotina(prof, partes[1]);
      case 'treino': return telaTreino(prof, partes[1]);
      case 'extras': return telaExtras(prof);
      case 'progresso': return telaProgresso(prof);
      case 'hoje': {
        const a = S.ls.get(LS_ATIVO, null);
        if (a && a.profId === prof.id && encontrarTreino(prof, a.treinoId)) return go('#/treino/' + a.treinoId);
        const p = proximoTreino(prof);
        return go(p ? '#/treino/' + p.treino.id : '#/treinos');
      }
      case 'inicio': return telaInicio(prof);
      default: return go('#/programas');
    }
  }

  async function iniciar() {
    const { dados } = await S.carregarDados();
    DADOS = dados;
    window.addEventListener('hashchange', render);
    render();
  }
  iniciar();
})();
