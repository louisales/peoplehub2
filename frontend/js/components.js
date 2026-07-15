// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
  document.getElementById('toast-container').prepend(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function openModal(title, bodyHtml, size = '') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  const box = document.getElementById('modal-box');
  box.style.maxWidth = size === 'lg' ? '760px' : size === 'sm' ? '400px' : '560px';
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function getAvatarColor(name = '') {
  let hash = 0;
  for (const ch of name) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return 'av-' + Math.abs(hash) % 8;
}

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function avatarHtml(name, size = 44) {
  return `<div class="emp-avatar ${getAvatarColor(name)}" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.38)}px">${initials(name)}</div>`;
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    active: ['badge-success', 'Ativo'],
    inactive: ['badge-neutral', 'Inativo'],
    pending: ['badge-warning', 'Pendente'],
    open: ['badge-info', 'Aberto'],
    closed: ['badge-neutral', 'Fechado'],
    draft: ['badge-neutral', 'Rascunho'],
    published: ['badge-success', 'Publicado'],
    in_progress: ['badge-warning', 'Em andamento'],
    completed: ['badge-success', 'Concluído'],
    approved: ['badge-success', 'Aprovado'],
    rejected: ['badge-danger', 'Recusado'],
  };
  const [cls, label] = map[status] || ['badge-neutral', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

function priorityBadge(p) {
  const map = { high: ['badge-danger','Alta'], medium: ['badge-warning','Média'], low: ['badge-success','Baixa'] };
  const [cls, label] = map[p] || ['badge-neutral', p];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ─── DATE FORMAT ──────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function relativeTime(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d atrás`;
  return fmtDate(d);
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function toggleSubmenu(key) {
  const menu = document.getElementById('sub-' + key);
  const arrow = document.getElementById('arrow-' + key);
  menu.classList.toggle('open');
  if (arrow) arrow.classList.toggle('open');
}

function handleLogoClick() {
  window.open('https://www.valore.com.br', '_blank');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
  const icon = sidebar.querySelector('.sidebar-toggle i');
  if (icon) {
    icon.className = sidebar.classList.contains('collapsed')
      ? 'bi bi-chevron-right'
      : 'bi bi-list';
  }
}

// ─── ACTIVE NAV ───────────────────────────────────────────────────────────────
function setActiveNav(page) {
  document.querySelectorAll('.nav-item, .nav-sub-item').forEach(el => el.classList.remove('active'));
  const navMap = {
    'dashboard': '.nav-item:first-of-type',
    'dev-pesquisas': '[onclick="navigate(\'dev-pesquisas\')"]',
    'dev-avaliacao': '[onclick="navigate(\'dev-avaliacao\')"]',
    'dev-aprendizado': '[onclick="navigate(\'dev-aprendizado\')"]',
    'dev-pdv': '[onclick="navigate(\'dev-pdv\')"]',
    'dev-pdi360': '[onclick="navigate(\'dev-pdi360\')"]',
    'dev-disc-perfis': '[onclick="navigate(\'dev-disc-perfis\')"]',
    'rh-colaboradores': '[onclick="navigate(\'rh-colaboradores\')"]',
    'rh-admissional': '[onclick="navigate(\'rh-admissional\')"]',
    'rh-onboarding': '[onclick="navigate(\'rh-onboarding\')"]',
    'rh-ferias': '[onclick="navigate(\'rh-ferias\')"]',
    'rh-arquivos': '[onclick="navigate(\'rh-arquivos\')"]',
    'rh-politicas': '[onclick="navigate(\'rh-politicas\')"]',
    'cultura-referencia': '[onclick="navigate(\'cultura-referencia\')"]',
    'cultura-experiencia': '[onclick="navigate(\'cultura-experiencia\')"]',
    'cultura-aniversarios': '[onclick="navigate(\'cultura-aniversarios\')"]',
    'cultura-eventos': '[onclick="navigate(\'cultura-eventos\')"]',
    'cultura-reconhecimentos': '[onclick="navigate(\'cultura-reconhecimentos\')"]',
    'comm-feed': '[onclick="navigate(\'comm-feed\')"]',
    'comm-noticias': '[onclick="navigate(\'comm-noticias\')"]',
    'comm-organograma': '[onclick="navigate(\'comm-organograma\')"]',
    'comm-biblioteca': '[onclick="navigate(\'comm-biblioteca\')"]',
    'comm-beneficios': '[onclick="navigate(\'comm-beneficios\')"]',
    'ops-servicos': '[onclick="navigate(\'ops-servicos\')"]',
    'ops-formularios': '[onclick="navigate(\'ops-formularios\')"]',
  };
  const prefix = page.split('-')[0];
  const subMenuKey = { dev: 'dev', rh: 'rh', cultura: 'cultura', comm: 'comm', ops: 'ops' }[prefix];
  if (subMenuKey) {
    const menu = document.getElementById('sub-' + subMenuKey);
    const arrow = document.getElementById('arrow-' + subMenuKey);
    if (menu && !menu.classList.contains('open')) {
      menu.classList.add('open');
      if (arrow) arrow.classList.add('open');
    }
  }
  const selector = navMap[page];
  if (selector) {
    const el = document.querySelector(selector);
    if (el) el.classList.add('active');
  }
}

// ─── GENERIC LIST PAGE ────────────────────────────────────────────────────────
function genericListPage({ icon, title, area, module, fields, emptyIcon = 'fa-folder-open', emptyText = 'Nenhum registro encontrado.' }) {
  return async () => {
    const records = await api.get('/records', { area, module }) || [];
    const formFields = fields.map(f => {
      if (f.type === 'select') {
        return `<div class="form-group"><label>${f.label}</label><select id="f-${f.key}">${f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}</select></div>`;
      }
      if (f.type === 'textarea') return `<div class="form-group"><label>${f.label}</label><textarea id="f-${f.key}" placeholder="${f.placeholder||''}"></textarea></div>`;
      return `<div class="form-group"><label>${f.label}</label><input type="${f.type||'text'}" id="f-${f.key}" placeholder="${f.placeholder||''}"></div>`;
    }).join('');

    return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid ${icon}"></i>${title}</div>
  <div class="page-actions">
    <button class="btn-primary" onclick="openCreateRecord('${area}','${module}',${JSON.stringify(fields).replace(/"/g,'&quot;')})">
      <i class="fa-solid fa-plus"></i> Novo Registro
    </button>
  </div>
</div>
<div class="page-body">
  <div class="card">
    <div class="card-body">
      ${records.length === 0 ? `<div class="empty-state"><i class="fa-solid ${emptyIcon}"></i><h3>Nenhum registro</h3><p>${emptyText}</p></div>` :
        `<div class="table-wrap"><table>
          <thead><tr><th>Título</th><th>Status</th><th>Prioridade</th><th>Data</th><th></th></tr></thead>
          <tbody>${records.map(r => `
            <tr>
              <td><strong>${r.title}</strong></td>
              <td>${statusBadge(r.status)}</td>
              <td>${priorityBadge(r.priority)}</td>
              <td>${fmtDate(r.created_at)}</td>
              <td>
                <button class="btn-icon" onclick="deleteRecord('${r.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table></div>`}
    </div>
  </div>
</div>`;
  };
}

function openCreateRecord(area, module, fields) {
  const formFields = fields.map(f => {
    if (f.type === 'select') {
      return `<div class="form-group"><label>${f.label}</label><select id="f-${f.key}">${f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}</select></div>`;
    }
    if (f.type === 'textarea') return `<div class="form-group"><label>${f.label}</label><textarea id="f-${f.key}" placeholder="${f.placeholder||''}"></textarea></div>`;
    return `<div class="form-group"><label>${f.label}</label><input type="${f.type||'text'}" id="f-${f.key}" placeholder="${f.placeholder||''}"></div>`;
  }).join('');

  openModal('Novo Registro', `
    ${formFields}
    <div class="form-row">
      <div class="form-group">
        <label>Status</label>
        <select id="f-status">
          <option value="active">Ativo</option>
          <option value="pending">Pendente</option>
          <option value="in_progress">Em andamento</option>
          <option value="completed">Concluído</option>
        </select>
      </div>
      <div class="form-group">
        <label>Prioridade</label>
        <select id="f-priority">
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="low">Baixa</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Data limite</label>
      <input type="date" id="f-due_date">
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveRecord('${area}','${module}',${JSON.stringify(fields).replace(/"/g,'&quot;')})">
        <i class="fa-solid fa-floppy-disk"></i> Salvar
      </button>
    </div>
  `);
}

async function saveRecord(area, module, fields) {
  const titleField = fields[0];
  const title = document.getElementById('f-' + titleField.key)?.value;
  if (!title) { showToast('Preencha o título', 'error'); return; }

  const content = {};
  fields.forEach(f => {
    const el = document.getElementById('f-' + f.key);
    if (el) content[f.key] = el.value;
  });

  const body = {
    area, module,
    title,
    content,
    status: document.getElementById('f-status')?.value || 'active',
    priority: document.getElementById('f-priority')?.value || 'medium',
    due_date: document.getElementById('f-due_date')?.value || null,
  };

  const res = await api.post('/records', body);
  if (res) {
    closeModal();
    showToast('Registro criado com sucesso!');
    navigate(window._currentPage);
  }
}

async function deleteRecord(id) {
  if (!confirm('Confirmar exclusão?')) return;
  const res = await api.delete('/records/' + id);
  if (res) {
    showToast('Registro excluído');
    navigate(window._currentPage);
  }
}
