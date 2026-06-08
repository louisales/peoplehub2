// ─── APP CONTROLLER ───────────────────────────────────────────────────────────
let _currentUser = null;
window._currentPage = 'dashboard';

async function init() {
  const user = await api.get('/auth/me');
  if (user && user.id) {
    _currentUser = user;
    showApp(user);
    navigate('dashboard');
  } else {
    showLoginPage();
  }
}

// ─── ROLE HELPERS ─────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  admin: 'Administrador',
  rh: 'RH / Gestor',
  gestor: 'RH / Gestor',
  lideranca: 'Liderança',
  colaborador: 'Colaborador',
};

function userCan(action) {
  const role = _currentUser?.role || 'colaborador';
  if (action === 'edit') return ['admin', 'rh', 'gestor'].includes(role);
  if (action === 'view_dev') return ['admin', 'rh', 'gestor', 'lideranca'].includes(role);
  if (action === 'admin') return role === 'admin';
  return true;
}

function showApp(user) {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('sidebar-name').textContent = user.name;
  document.getElementById('sidebar-role').textContent = ROLE_LABELS[user.role] || user.role;
  document.getElementById('sidebar-avatar').textContent = initials(user.name);

  // Controle de visibilidade do menu por perfil
  const role = user.role || 'colaborador';
  const canEdit = userCan('edit');
  const canViewDev = userCan('view_dev');
  const isAdmin = userCan('admin');

  // Esconder seção Desenvolvimento de Talentos para colaborador
  document.querySelectorAll('[data-section="dev"]').forEach(el => {
    el.style.display = canViewDev ? '' : 'none';
  });

  // Esconder Configurações para não-admin
  document.querySelectorAll('[data-section="settings"]').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
}

function showLoginPage() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  _currentUser = null;
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
  'rh-politicas': genericListPage({ icon:'fa-book', title:'Políticas de Empresa', area:'rh', module:'politicas', emptyText:'Documente as políticas e diretrizes da empresa.', fields:[
    {key:'title',label:'Nome da política *'},
    {key:'version',label:'Versão',placeholder:'Ex: v2.1'},
    {key:'summary',label:'Resumo',type:'textarea'},
    {key:'scope',label:'Abrangência',placeholder:'Ex: Toda a empresa'},
  ]}),
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
  // Controle de acesso por perfil
  const devPages = ['dev-pesquisas','dev-avaliacao','dev-aprendizado','dev-pdv'];
  const adminPages = ['settings'];
  if (devPages.includes(page) && !userCan('view_dev')) {
    document.getElementById('page-content').innerHTML = `
      <div class="empty-state" style="margin-top:80px">
        <i class="fa-solid fa-lock" style="font-size:48px;color:var(--text-3)"></i>
        <h3>Acesso Restrito</h3>
        <p>Seu perfil não tem permissão para acessar esta área.</p>
      </div>`;
    return;
  }
  if (adminPages.includes(page) && !userCan('admin')) {
    document.getElementById('page-content').innerHTML = `
      <div class="empty-state" style="margin-top:80px">
        <i class="fa-solid fa-lock" style="font-size:48px;color:var(--text-3)"></i>
        <h3>Acesso Restrito</h3>
        <p>Apenas administradores podem acessar esta área.</p>
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
