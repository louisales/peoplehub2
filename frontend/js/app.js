// ─── APP CONTROLLER ───────────────────────────────────────────────────────────
let _currentUser = null;
window._currentPage = 'dashboard';

async function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('token')) {
    document.getElementById('app-loading').style.display = 'none';
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    document.getElementById('card-login').style.display = 'none';
    document.getElementById('card-forgot').style.display = 'none';
    document.getElementById('card-reset').style.display = 'block';
    return;
  }

  const user = await api.get('/auth/me');
  if (user && user.id) {
    _currentUser = user;
    showApp(user);
    navigate('dashboard');
  } else if (params.get('emergencial') === '1') {
    // Acesso emergencial (break-glass): URL não é linkada em nenhum lugar da UI.
    // Mantém o formulário local de e-mail/senha disponível caso o Hub esteja fora do ar.
    showLoginPage();
    const ssoBtn = document.getElementById('sso-login-btn');
    const ssoDivider = document.getElementById('sso-divider');
    if (ssoBtn) ssoBtn.style.display = 'none';
    if (ssoDivider) ssoDivider.style.display = 'none';
  } else {
    // Login local desativado por padrão: usuários sempre são enviados para o
    // login único do Valore Hub. Acesso de emergência: /?emergencial=1
    window.location.href = 'https://portal.valore.com.br/portais/portal-rh/acessar/';
    return;
  }
  document.getElementById('app-loading').style.display = 'none';
}

// ─── ROLE HELPERS ─────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  admin: 'Administrador',
  lideranca: 'Liderança',
  colaborador: 'Colaborador',
};

// Páginas visíveis para Colaborador: Aprendizado, Férias, Política de
// Empresa, e as seções inteiras de Cultura e Comunicação. Documentos
// Admissionais foi tirado daqui a pedido — não aparece mais pra Colaborador.
// 'dashboard' é sempre permitido para todo mundo, não precisa estar na lista.
const PAGINAS_COLABORADOR = [
  'dev-aprendizado',
  'rh-ferias', 'rh-politicas',
  'cultura-referencia', 'cultura-experiencia', 'cultura-aniversarios', 'cultura-aniversario-empresa', 'cultura-eventos', 'cultura-reconhecimentos',
  'comm-feed', 'comm-noticias', 'comm-organograma', 'comm-biblioteca', 'comm-documentos', 'comm-beneficios',
  'ops-formularios',
];
// Liderança tem tudo que Colaborador tem, mais PDI, DISC, Avaliações de
// Desempenho e Documentos Admissionais.
const PAGINAS_LIDERANCA_EXTRA = ['dev-avaliacao', 'dev-pdv', 'dev-pdi360', 'dev-disc-perfis', 'rh-admissional'];

// Retorna a lista de páginas permitidas para o papel, ou null se não houver
// restrição (Administrador vê tudo).
function paginasPermitidas(role) {
  if (role === 'admin') return null;
  if (role === 'lideranca') return [...PAGINAS_COLABORADOR, ...PAGINAS_LIDERANCA_EXTRA];
  return PAGINAS_COLABORADOR;
}

function paginaPermitida(page) {
  if (page === 'dashboard') return true;
  const role = _currentUser?.role || 'colaborador';
  const permitidas = paginasPermitidas(role);
  return permitidas === null || permitidas.includes(page);
}

function userCan(action) {
  const role = _currentUser?.role || 'colaborador';
  // Visão da área de Desenvolvimento: todos os perfis podem ao menos ver as
  // páginas que têm acesso (a restrição de QUAIS páginas é feita por
  // paginaPermitida/paginasPermitidas, não aqui).
  if (action === 'view_dev') return true;
  // Edição restrita a PDI, DISC e Avaliações de Desempenho: Liderança e Administrador.
  if (action === 'edit_dev') return ['lideranca', 'admin'].includes(role);
  // Aprovar/recusar solicitações em Formulários (Operações): Liderança e
  // Administrador. Colaborador só visualiza (e somente as próprias — o
  // filtro por dono é feito no servidor em GET /api/records).
  if (action === 'approve_formularios') return ['lideranca', 'admin'].includes(role);
  // Administração geral (usuários, configurações, exclusões, demais áreas).
  if (action === 'admin') return role === 'admin';
  // Edição genérica (Aprendizado, Documentos, Férias, Política, Cultura,
  // Comunicação, Colaboradores): apenas Administrador.
  if (action === 'edit') return role === 'admin';
  // Ação não reconhecida: nega por padrão.
  return false;
}

function showApp(user) {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('sidebar-name').textContent = user.name;
  document.getElementById('sidebar-role').textContent = ROLE_LABELS[user.role] || user.role;
  document.getElementById('sidebar-avatar').textContent = initials(user.name);

  // Controle de visibilidade do menu por perfil: esconde cada item do menu
  // (`onclick="navigate('...')"`) cuja página não está liberada para o
  // papel do usuário — não é mais só a seção "dev"/"settings", cobre toda
  // a lista de páginas do sidebar.
  const role = user.role || 'colaborador';
  document.querySelectorAll('.nav-item[onclick^="navigate("]').forEach(el => {
    const m = el.getAttribute('onclick').match(/navigate\('([^']+)'\)/);
    const page = m && m[1];
    if (!page) return;
    el.style.display = paginaPermitida(page) ? '' : 'none';
  });

  // Esconder Configurações para não-admin (não tem item de menu, mas mantém
  // a checagem aqui por precaução caso um link direto seja adicionado depois)
  document.querySelectorAll('[data-section="settings"]').forEach(el => {
    el.style.display = userCan('admin') ? '' : 'none';
  });
}

function showLoginPage() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  _currentUser = null;
}


function showForgotPassword() {
  document.getElementById('card-login').style.display = 'none';
  document.getElementById('card-forgot').style.display = 'block';
  document.getElementById('forgot-email').value = '';
  document.getElementById('forgot-msg').style.display = 'none';
}

function showLoginCard() {
  document.getElementById('card-forgot').style.display = 'none';
  document.getElementById('card-login').style.display = 'block';
}

async function handleForgotPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  const msgEl = document.getElementById('forgot-msg');
  const btn = document.getElementById('forgot-btn');

  if (!email) {
    msgEl.textContent = 'Informe o e-mail cadastrado.';
    msgEl.style.color = 'var(--danger)';
    msgEl.style.background = 'var(--danger-light)';
    msgEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
  msgEl.style.display = 'none';

  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await res.json();

  if (res.ok) {
    msgEl.textContent = 'Se este e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha em breve.';
    msgEl.style.color = '#15803d';
    msgEl.style.background = '#f0fdf4';
    msgEl.style.border = '1px solid #bbf7d0';
    msgEl.style.display = 'block';
  } else {
    msgEl.textContent = data.error || 'Erro ao processar solicitação.';
    msgEl.style.color = 'var(--danger)';
    msgEl.style.background = 'var(--danger-light)';
    msgEl.style.display = 'block';
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar link';
}

function toggleResetPassword() {
  const inp = document.getElementById('reset-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

async function handleResetPassword() {
  const password = document.getElementById('reset-password').value;
  const confirm = document.getElementById('reset-confirm').value;
  const msgEl = document.getElementById('reset-msg');
  const btn = document.getElementById('reset-btn');

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  msgEl.style.display = 'none';

  if (!token) {
    msgEl.textContent = 'Link inválido. Solicite um novo.';
    msgEl.style.color = 'var(--danger)';
    msgEl.style.background = 'var(--danger-light)';
    msgEl.style.display = 'block';
    return;
  }

  if (password.length < 8) {
    msgEl.textContent = 'A senha deve ter pelo menos 8 caracteres.';
    msgEl.style.color = 'var(--danger)';
    msgEl.style.background = 'var(--danger-light)';
    msgEl.style.display = 'block';
    return;
  }

  if (password !== confirm) {
    msgEl.textContent = 'As senhas não coincidem.';
    msgEl.style.color = 'var(--danger)';
    msgEl.style.background = 'var(--danger-light)';
    msgEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
  });

  const data = await res.json();

  msgEl.style.display = 'block';
  if (res.ok) {
    msgEl.textContent = data.message;
    msgEl.style.color = '#15803d';
    msgEl.style.background = '#f0fdf4';
    msgEl.style.border = '1px solid #bbf7d0';
    setTimeout(() => {
      window.history.replaceState({}, document.title, '/');
      showLoginCard();
    }, 3000);
  } else {
    msgEl.textContent = data.error || 'Erro ao redefinir senha.';
    msgEl.style.color = 'var(--danger)';
    msgEl.style.background = 'var(--danger-light)';
    btn.disabled = false;
    btn.innerHTML = '<span>Salvar nova senha</span> <i class="fa-solid fa-lock"></i>';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
  errEl.style.display = 'none';

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok && data.user) {
    _currentUser = data.user;
    showApp(data.user);
    navigate('dashboard');
  } else {
    errEl.textContent = data.error || 'Credenciais inválidas';
    errEl.style.display = 'block';
  }

  btn.disabled = false;
  btn.innerHTML = '<span>Entrar</span> <i class="fa-solid fa-arrow-right"></i>';
}

async function handleLogout() {
  await api.post('/auth/logout');
  showLoginPage();
  showToast('Sessão encerrada', 'info');

  // Sai só da sessão LOCAL do RH (sair de um portal não desloga dos outros
  // nem do Hub). Tenta fechar a aba — funciona porque o card do Hub agora
  // abre sem rel="noopener" — e cai de volta para o dashboard do Hub na
  // mesma aba como fallback, sem forçar logout do Hub.
  window.close();
  setTimeout(() => {
    window.location.href = 'https://portal.valore.com.br/';
  }, 250);
}

function togglePassword() {
  const inp = document.getElementById('login-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
const routes = {
  dashboard: renderDashboard,
  // Dev Talentos
  'dev-pesquisas':  genericListPage({ icon:'fa-magnifying-glass-chart', title:'Pesquisas', area:'dev_talentos', module:'pesquisas', fields:[
    {key:'title',label:'Título *',placeholder:'Nome da pesquisa'},
    {key:'objective',label:'Objetivo',placeholder:'O que você deseja medir?',type:'textarea'},
    {key:'target',label:'Público-alvo',placeholder:'Ex: Toda a empresa'},
  ]}),
  'dev-avaliacao':  renderAvaliacao,
  'dev-aprendizado': genericListPage({ icon:'fa-graduation-cap', title:'Aprendizado', area:'dev_talentos', module:'aprendizado', fields:[
    {key:'title',label:'Título do treinamento *'},
    {key:'provider',label:'Fornecedor / Plataforma'},
    {key:'duration',label:'Carga horária'},
    {key:'description',label:'Descrição',type:'textarea'},
  ]}),
  'dev-pdv': renderPDV,
  'dev-pdi360': renderPDI360,
  'dev-disc-perfis': renderDISCPerfis,
  // RH
  'rh-colaboradores': renderColaboradores,
  'rh-admissional': genericListPage({ icon:'fa-file-circle-plus', title:'Documentos Admissionais', area:'rh', module:'admissional', emptyText:'Registre documentos e checklists de admissão.', fields:[
    {key:'title',label:'Documento *',placeholder:'Ex: Contrato de trabalho'},
    {key:'employee',label:'Colaborador'},
    {key:'type',label:'Tipo',type:'select',options:[
      {value:'contract',label:'Contrato'},{value:'declaration',label:'Declaração'},
      {value:'certificate',label:'Certidão'},{value:'other',label:'Outro'}
    ]},
    {key:'notes',label:'Observações',type:'textarea'},
  ]}),
  'rh-onboarding': genericListPage({ icon:'fa-door-open', title:'Onboarding', area:'rh', module:'onboarding', emptyText:'Crie trilhas de onboarding para novos colaboradores.', fields:[
    {key:'title',label:'Título *',placeholder:'Ex: Onboarding Analista Financeiro'},
    {key:'employee',label:'Colaborador'},
    {key:'checklist',label:'Checklist',type:'textarea',placeholder:'Passo 1...\nPasso 2...'},
    {key:'responsible',label:'Responsável'},
  ]}),
  'rh-ferias': genericListPage({ icon:'fa-umbrella-beach', title:'Férias e Licença', area:'rh', module:'ferias', fields:[
    {key:'title',label:'Solicitação *',placeholder:'Ex: Férias - João Silva'},
    {key:'employee',label:'Colaborador'},
    {key:'type',label:'Tipo',type:'select',options:[
      {value:'ferias',label:'Férias'},{value:'licenca_medica',label:'Licença médica'},
      {value:'licenca_maternidade',label:'Licença maternidade'},{value:'licenca_paternidade',label:'Licença paternidade'},
      {value:'abono',label:'Abono'},{value:'outro',label:'Outro'}
    ]},
    {key:'period',label:'Período',placeholder:'01/07/2026 a 30/07/2026'},
  ]}),
  'rh-arquivos': genericListPage({ icon:'fa-folder-open', title:'Arquivos', area:'rh', module:'arquivos', emptyText:'Centralize documentos e arquivos importantes.', fields:[
    {key:'title',label:'Nome do arquivo *'},
    {key:'category',label:'Categoria',type:'select',options:[
      {value:'contrato',label:'Contrato'},{value:'politica',label:'Política'},{value:'relatorio',label:'Relatório'},{value:'outro',label:'Outro'}
    ]},
    {key:'description',label:'Descrição',type:'textarea'},
  ]}),
  'rh-politicas': renderPoliticas,
  // Cultura
  'cultura-referencia': genericListPage({ icon:'fa-user-plus', title:'Programa de Referência', area:'cultura', module:'referencia', emptyText:'Gerencie indicações de candidatos por colaboradores.', fields:[
    {key:'title',label:'Indicação *',placeholder:'Ex: João indicou Maria para Dev Senior'},
    {key:'referrer',label:'Quem indicou'},
    {key:'candidate',label:'Candidato indicado'},
    {key:'position',label:'Vaga'},
    {key:'notes',label:'Observações',type:'textarea'},
  ]}),
  'cultura-experiencia': genericListPage({ icon:'fa-face-smile-beam', title:'Experiência de Pessoas', area:'cultura', module:'experiencia', emptyText:'Registre iniciativas de Employee Experience.', fields:[
    {key:'title',label:'Iniciativa *'},
    {key:'objective',label:'Objetivo',type:'textarea'},
    {key:'impact',label:'Impacto esperado',type:'textarea'},
  ]}),
  'cultura-aniversarios': renderAniversarios,
  'cultura-aniversario-empresa': renderAniversarioEmpresa,
  'cultura-eventos': renderEventos,
  'cultura-reconhecimentos': renderReconhecimentos,
  // Comunicação
  'comm-feed': renderFeed,
  'comm-noticias': renderNoticias,
  'comm-organograma': renderOrganograma,
  'comm-biblioteca': renderBiblioteca,
  'comm-documentos': renderDocumentos,
  'comm-beneficios': renderBeneficios,
  // Operações
  'ops-servicos': renderChamados,
  'ops-formularios': renderFormularios,
  // Settings
  'settings': renderSettings,
};

async function navigate(page) {
  // Controle de acesso por perfil: bloqueia navegação direta (URL, F5, ou
  // qualquer chamada a navigate() fora do menu) para páginas fora da lista
  // liberada para o papel do usuário — cobre TODAS as páginas, não só
  // "dev"/"settings" (o menu já esconde os itens, isso é a segunda camada,
  // caso alguém chame navigate() diretamente pelo console/URL).
  if (!paginaPermitida(page)) {
    document.getElementById('page-container').innerHTML = `
      <div class="empty-state" style="margin-top:80px">
        <i class="fa-solid fa-lock" style="font-size:48px;color:var(--text-3)"></i>
        <h3>Acesso Restrito</h3>
        <p>Seu perfil não tem permissão para acessar esta área.</p>
      </div>`;
    return;
  }
  window._currentPage = page;
  const container = document.getElementById('page-container');
  container.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-3)"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px"></i></div>';

  const renderer = routes[page];
  if (!renderer) {
    container.innerHTML = '<div class="page-body"><div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Página não encontrada</h3></div></div>';
    return;
  }

  try {
    let html;
    if (typeof renderer === 'function') {
      html = await renderer();
    }
    container.innerHTML = html || '';

    // Post-render hooks
    if (page === 'settings') {
      setTimeout(loadAuditLog, 100);
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="page-body"><div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i><h3>Erro ao carregar</h3><p>${err.message}</p></div></div>`;
  }

  setActiveNav(page);
  window.scrollTo(0, 0);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
