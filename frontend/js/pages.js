
function getDeptIcon(dept) {
  const icons = {
    'Contábil':              { icon: 'fa-calculator',        color: '#1d4ed8', bg: '#dbeafe' },
    'Contabil':              { icon: 'fa-calculator',        color: '#1d4ed8', bg: '#dbeafe' },
    'Fiscal':                { icon: 'fa-file-invoice-dollar', color: '#b45309', bg: '#fef3c7' },
    'Financeiro':            { icon: 'fa-coins',             color: '#047857', bg: '#d1fae5' },
    'BPO Financeiro':        { icon: 'fa-building-columns',  color: '#6366f1', bg: '#e0e7ff' },
    'Departamento Pessoal':  { icon: 'fa-id-card',           color: '#be185d', bg: '#fce7f3' },
    'RH':                    { icon: 'fa-people-group',      color: '#7c3aed', bg: '#ede9fe' },
    'Recursos Humanos':      { icon: 'fa-people-group',      color: '#8b5cf6', bg: '#ede9fe' },
    'Tecnologia':            { icon: 'fa-microchip',         color: '#0369a1', bg: '#e0f2fe' },
    'TI':                    { icon: 'fa-microchip',         color: '#0ea5e9', bg: '#e0f2fe' },
    'Marketing':             { icon: 'fa-bullhorn',          color: '#c2410c', bg: '#ffedd5' },
    'Comercial':             { icon: 'fa-handshake',         color: '#0f766e', bg: '#ccfbf1' },
    'Vendas':                { icon: 'fa-chart-line',        color: '#22c55e', bg: '#dcfce7' },
    'Sucesso do Cliente':    { icon: 'fa-star',              color: '#a16207', bg: '#fef9c3' },
    'Diretoria':             { icon: 'fa-crown',             color: '#5b21b6', bg: '#ede9fe' },
    'Operações':             { icon: 'fa-gears',             color: '#0369a1', bg: '#e0f2fe' },
    'Administrativo':        { icon: 'fa-briefcase',         color: '#1e40af', bg: '#e0e7ff' },
    'Paralegal':             { icon: 'fa-scale-balanced',    color: '#92400e', bg: '#fef3c7' },
    'Consultoria':           { icon: 'fa-lightbulb',          color: '#0e7490', bg: '#cffafe' },
    'Jurídico':              { icon: 'fa-gavel',             color: '#b91c1c', bg: '#fee2e2' },
  };
  return icons[dept] || { icon: 'fa-building', color: '#7c3aed', bg: '#ede9fe' };
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
async function renderDashboard() {
  const stats = await api.get('/dashboard/stats') || {};
  const deptBars = (stats.dept_counts || []).map(d => {
    const pct = stats.employees ? Math.round((d.c / stats.employees) * 100) : 0;
    return `
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;font-weight:500">${d.department || 'Sem depto'}</span>
          <span style="font-size:12px;color:var(--text-3)">${d.c} pessoa${d.c !== 1 ? 's' : ''}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');

  const bdays = (stats.birthdays_this_month || []).map(b => {
    const day = b.birth_date ? b.birth_date.split('-')[2] : '—';
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      ${avatarHtml(b.name, 32)}
      <div>
        <div style="font-size:13px;font-weight:500">${b.name}</div>
        <div style="font-size:11.5px;color:var(--text-3)">Dia ${day}</div>
      </div>
      <span style="margin-left:auto;font-size:18px">🎂</span>
    </div>`;
  }).join('') || '<p style="color:var(--text-3);font-size:13px">Nenhum aniversariante este mês</p>';

  const workAnnivs = (stats.work_anniversaries_this_month || []).map(w => {
    const day = w.admission_date ? w.admission_date.split('-')[2] : '—';
    const year = w.admission_date ? w.admission_date.split('-')[0] : null;
    const anos = year ? (new Date().getFullYear() - parseInt(year)) : null;
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      ${avatarHtml(w.name, 32)}
      <div>
        <div style="font-size:13px;font-weight:500">${w.name}</div>
        <div style="font-size:11.5px;color:var(--text-3)">Dia ${day}${anos ? ' · ' + anos + ' ano' + (anos !== 1 ? 's' : '') : ''}</div>
      </div>
      <span style="margin-left:auto;font-size:18px">🏆</span>
    </div>`;
  }).join('') || '<p style="color:var(--text-3);font-size:13px">Nenhum aniversário de empresa este mês</p>';

  const recentNews = (stats.recent_news || []).map(n => `
    <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('comm-noticias')">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--accent);margin-top:5px;flex-shrink:0"></div>
      <div>
        <div style="font-size:13px;font-weight:500;margin-bottom:2px">${n.title}</div>
        <div style="font-size:11.5px;color:var(--text-3)">${n.category} · ${relativeTime(n.created_at)}</div>
      </div>
    </div>`).join('') || '<p style="color:var(--text-3);font-size:13px">Nenhuma notícia recente</p>';

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-chart-pie"></i>Dashboard</div>
  <div style="margin-left:auto;font-size:13px;color:var(--text-2)">
    <i class="fa-regular fa-calendar" style="margin-right:6px"></i>${new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
  </div>
</div>
<div class="page-body">
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon blue"><i class="fa-solid fa-users"></i></div>
      <div><div class="stat-value">${stats.employees || 0}</div><div class="stat-label">Colaboradores ativos</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green"><i class="fa-solid fa-bullhorn"></i></div>
      <div><div class="stat-value">${stats.news || 0}</div><div class="stat-label">Comunicados publicados</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon amber"><i class="fa-solid fa-ticket"></i></div>
      <div><div class="stat-value">${stats.open_requests || 0}</div><div class="stat-label">Chamados em aberto</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon purple"><i class="fa-solid fa-trophy"></i></div>
      <div><div class="stat-value">${stats.recognitions || 0}</div><div class="stat-label">Reconhecimentos</div></div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
    <div class="card">
      <div class="card-header"><i class="fa-solid fa-sitemap" style="color:var(--accent)"></i>Colaboradores por área</div>
      <div class="card-body">${deptBars || '<p style="color:var(--text-3);font-size:13px">Sem dados</p>'}</div>
    </div>
    <div class="card">
      <div class="card-header"><i class="fa-solid fa-newspaper" style="color:var(--accent)"></i>Últimas notícias</div>
      <div class="card-body">${recentNews}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
    <div class="card">
      <div class="card-header"><i class="fa-solid fa-cake-candles" style="color:#f59e0b"></i>Aniversários do mês</div>
      <div class="card-body">${bdays}</div>
    </div>
    <div class="card">
      <div class="card-header"><i class="fa-solid fa-trophy" style="color:#8b5cf6"></i>Aniversários de empresa</div>
      <div class="card-body">${workAnnivs}</div>
    </div>
  </div>

  <div style="margin-top:20px" class="card">
    <div class="card-header"><i class="fa-solid fa-bolt" style="color:#f59e0b"></i>Acesso rápido</div>
    <div class="card-body">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">
        ${[
          ['rh-colaboradores','fa-id-card','blue','Colaboradores'],
          ['dev-avaliacao','fa-star-half-stroke','purple','Avaliações'],
          ['cultura-reconhecimentos','fa-trophy','amber','Reconhecimentos'],
          ['comm-noticias','fa-bullhorn','green','Notícias'],
          ['ops-servicos','fa-ticket','pink','Chamados'],
          ['comm-beneficios','fa-gift','teal','Benefícios'],
        ].map(([page,icon,color,label]) => `
          <div onclick="navigate('${page}')" style="cursor:pointer;padding:16px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-lg);display:flex;align-items:center;gap:12px;transition:all .18s" onmouseover="this.style.boxShadow='var(--shadow)'" onmouseout="this.style.boxShadow='none'">
            <div class="stat-icon ${color}" style="width:36px;height:36px;font-size:15px"><i class="fa-solid ${icon}"></i></div>
            <span style="font-size:13px;font-weight:500">${label}</span>
          </div>`).join('')}
      </div>
    </div>
  </div>
</div>`;
}

// ─── COLABORADORES ────────────────────────────────────────────────────────────
async function renderColaboradores() {
  const employees = await api.get('/employees') || [];
  _allEmployees = employees;

  // Totalizador por área
  const deptCounts = {};
  employees.forEach(e => {
    if (e.department) deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
  });
  const totalAtivos = employees.filter(e => e.status === 'active').length;
  const totalPais = employees.filter(e => e.is_parent).length;

  const deptOptions = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const html = `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-id-card"></i>Perfil dos Colaboradores</div>
  <div class="page-actions" style="gap:8px">
    <button class="btn-secondary" onclick="exportEmployees()" title="Exportar CSV"><i class="fa-solid fa-file-csv"></i> Exportar</button>
    <button class="btn-secondary" onclick="document.getElementById('import-file').click()" title="Importar planilha"><i class="fa-solid fa-file-arrow-up"></i> Importar</button>
    <input type="file" id="import-file" accept=".csv,.xls,.xlsx" style="display:none" onchange="importEmployees(this)">
    <div style="display:flex;border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden">
      <button id="btn-view-grid" onclick="setEmpView('grid')" style="padding:7px 12px;border:none;background:var(--primary);color:#fff;cursor:pointer;font-size:13px" title="Quadros"><i class="fa-solid fa-grip"></i></button>
      <button id="btn-view-list" onclick="setEmpView('list')" style="padding:7px 12px;border:none;background:var(--surface);color:var(--text-2);cursor:pointer;font-size:13px" title="Lista"><i class="fa-solid fa-list"></i></button>
    </div>
    ${userCan("edit") ? `<button class="btn-primary" onclick="openNewEmployee()"><i class="fa-solid fa-plus"></i> Novo Colaborador</button>` : ""}
  </div>
</div>
<div class="page-body">

  <!-- Totalizadores -->
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);padding:14px 20px;display:flex;align-items:center;gap:12px;min-width:160px">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center">
        <i class="fa-solid fa-users" style="color:var(--primary);font-size:16px"></i>
      </div>
      <div>
        <div style="font-size:22px;font-weight:700;color:var(--primary)">${employees.length}</div>
        <div style="font-size:12px;color:var(--text-2)">Total de colaboradores</div>
      </div>
    </div>
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);padding:14px 20px;display:flex;align-items:center;gap:12px;min-width:160px">
      <div style="width:40px;height:40px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center">
        <i class="fa-solid fa-circle-check" style="color:#16a34a;font-size:16px"></i>
      </div>
      <div>
        <div style="font-size:22px;font-weight:700;color:#16a34a">${totalAtivos}</div>
        <div style="font-size:12px;color:var(--text-2)">Ativos</div>
      </div>
    </div>
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);padding:14px 20px;display:flex;align-items:center;gap:12px;min-width:160px">
      <div style="width:40px;height:40px;border-radius:50%;background:#fee2e2;display:flex;align-items:center;justify-content:center">
        <i class="fa-solid fa-heart" style="color:#dc2626;font-size:16px"></i>
      </div>
      <div>
        <div style="font-size:22px;font-weight:700;color:#ca8a04">${totalPais}</div>
        <div style="font-size:12px;color:var(--text-2)">Pais / Mães</div>
      </div>
    </div>
    ${deptOptions.map(d => `
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);padding:14px 20px;display:flex;align-items:center;gap:12px;min-width:140px;cursor:pointer" onclick="setDeptFilter('${d}')">
      <div style="width:40px;height:40px;border-radius:50%;background:${getDeptIcon(d).bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fa-solid ${getDeptIcon(d).icon}" style="color:${getDeptIcon(d).color};font-size:15px"></i>
      </div>
      <div>
        <div style="font-size:22px;font-weight:700;color:var(--text)">${deptCounts[d]}</div>
        <div style="font-size:11px;color:var(--text-2);max-width:90px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d}</div>
      </div>
    </div>`).join('')}
  </div>

  <div class="search-bar">
    <div class="search-input">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input type="text" id="emp-search" placeholder="Buscar colaborador..." oninput="filterEmployees(this.value)">
    </div>
    <select id="dept-filter" style="padding:9px 36px 9px 14px;border:1.5px solid var(--border);border-radius:var(--radius);font-size:13.5px;font-family:var(--font);color:var(--text);background:var(--surface);outline:none;cursor:pointer" onchange="filterEmployees(document.getElementById('emp-search').value)">
      <option value="">Todos os departamentos</option>
      ${deptOptions.map(d => `<option value="${d}">${d}</option>`).join('')}
    </select>
    <select id="parent-filter" style="padding:9px 36px 9px 14px;border:1.5px solid var(--border);border-radius:var(--radius);font-size:13.5px;font-family:var(--font);color:var(--text);background:var(--surface);outline:none;cursor:pointer" onchange="filterEmployees(document.getElementById('emp-search').value)">
      <option value="">Todos</option>
      <option value="parent">Pais / Mães</option>
      <option value="pai">Pais</option>
      <option value="mae">Mães</option>
    </select>
  </div>
  <div class="employee-grid" id="emp-grid">
    ${employees.map(e => renderEmployeeCard(e)).join('') || '<div class="empty-state"><i class="fa-solid fa-users"></i><h3>Nenhum colaborador</h3><p>Cadastre o primeiro colaborador.</p></div>'}
  </div>
</div>`;

  setTimeout(() => {
    const saved = localStorage.getItem('emp-view') || 'grid';
    setEmpView(saved, true);
  }, 50);

  return html;
}

function setEmpView(mode, silent) {
  localStorage.setItem('emp-view', mode);
  const grid = document.getElementById('emp-grid');
  const btnGrid = document.getElementById('btn-view-grid');
  const btnList = document.getElementById('btn-view-list');
  if (!grid) return;
  if (mode === 'list') {
    grid.style.display = 'flex';
    grid.style.flexDirection = 'column';
    grid.style.gap = '6px';
    grid.querySelectorAll('.employee-card').forEach(c => {
      c.style.display = 'flex';
      c.style.alignItems = 'center';
      c.style.gap = '14px';
      c.style.padding = '10px 16px';
      c.style.borderRadius = 'var(--radius)';
      c.style.minWidth = '';
    });
    if (btnGrid) { btnGrid.style.background='var(--surface)'; btnGrid.style.color='var(--text-2)'; }
    if (btnList) { btnList.style.background='var(--primary)'; btnList.style.color='#fff'; }
  } else {
    grid.style.display = '';
    grid.style.flexDirection = '';
    grid.style.gap = '';
    grid.querySelectorAll('.employee-card').forEach(c => {
      c.style.display = '';
      c.style.alignItems = '';
      c.style.gap = '';
      c.style.padding = '';
    });
    if (btnGrid) { btnGrid.style.background='var(--primary)'; btnGrid.style.color='#fff'; }
    if (btnList) { btnList.style.background='var(--surface)'; btnList.style.color='var(--text-2)'; }
  }
}

async function exportEmployees() {
  try {
    const res = await fetch('/api/employees/export', { credentials: 'include' });
    if (!res.ok) { showToast('Erro ao exportar', 'error'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'colaboradores.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Exportação concluída!');
  } catch { showToast('Erro ao exportar', 'error'); }
}

async function importEmployees(input) {
  const file = input.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/api/employees/import', { method: 'POST', body: fd, credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      showToast(`Importação concluída: ${data.inserted} adicionados, ${data.skipped} ignorados`);
      _allEmployees = [];
      navigate('rh-colaboradores');
    } else {
      showToast(data.error || 'Erro na importação', 'error');
    }
  } catch { showToast('Erro na importação', 'error'); }
  input.value = '';
}

function _renderColaboradoresOld() {
  // placeholder removido — função renomeada internamente
}

function renderEmployeeCard(e) {
  const parentIcon = e.is_parent
    ? `<span title="${e.parent_type === 'mae' ? 'Mãe' : 'Pai'}" style="font-size:14px;margin-left:4px">${e.parent_type === 'mae' ? '💜' : '💙'}</span>`
    : '';
  return `
<div class="employee-card" onclick="openEmployeeDetail('${e.id}')">
  ${avatarHtml(e.name || '?', 52)}
  <div class="emp-name">${e.name}${parentIcon}</div>
  <div class="emp-position">${e.position || 'Cargo não informado'}</div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
    <span class="emp-dept">${e.department || '—'}</span>
    ${statusBadge(e.status || 'active')}
  </div>
  ${e.admission_date ? `<div style="font-size:11.5px;color:var(--text-3);margin-top:6px"><i class="fa-regular fa-calendar" style="margin-right:4px"></i>Desde ${fmtDate(e.admission_date)}</div>` : ''}
</div>`;
}

let _allEmployees = [];
async function filterEmployees(search) {
  if (!_allEmployees.length) _allEmployees = await api.get('/employees') || [];
  const dept = document.getElementById('dept-filter')?.value || '';
  const parentF = document.getElementById('parent-filter')?.value || '';
  const filtered = _allEmployees.filter(e => {
    const matchSearch = !search || (e.name + e.email + e.position).toLowerCase().includes(search.toLowerCase());
    const matchDept = !dept || e.department === dept;
    let matchParent = true;
    if (parentF === 'parent') matchParent = !!e.is_parent;
    else if (parentF === 'pai') matchParent = e.is_parent && e.parent_type === 'pai';
    else if (parentF === 'mae') matchParent = e.is_parent && e.parent_type === 'mae';
    return matchSearch && matchDept && matchParent;
  });
  const grid = document.getElementById('emp-grid');
  if (grid) {
    grid.innerHTML = filtered.map(renderEmployeeCard).join('') || '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><h3>Nenhum resultado</h3><p>Tente outros termos.</p></div>';
    const saved = localStorage.getItem('emp-view') || 'grid';
    setEmpView(saved, true);
  }
}

function setDeptFilter(dept) {
  const sel = document.getElementById('dept-filter');
  if (sel) { sel.value = dept; filterEmployees(document.getElementById('emp-search')?.value || ''); }
}

async function openEmployeeDetail(id) {
  const e = await api.get('/employees/' + id);
  const history = await api.get('/employees/' + id + '/career') || [];
  if (!e) return;

  const eventLabels = { promotion: '🏆 Promoção', transfer: '🔄 Transferência', demotion: '⬇️ Rebaixamento', adjustment: '📝 Ajuste de Cargo' };

  const historyHtml = history.length === 0
    ? '<div style="color:var(--text-3);font-size:13px;text-align:center;padding:16px 0">Nenhum registro de movimentação</div>'
    : history.map(h => `
      <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--primary-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">${(eventLabels[h.event_type]||'📝').split(' ')[0]}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${(eventLabels[h.event_type]||h.event_type)}</div>
          <div style="font-size:12px;color:var(--text-2);margin-top:2px">
            ${h.previous_position ? `<span style="text-decoration:line-through;color:var(--text-3)">${h.previous_position}</span> → ` : ''}
            <strong>${h.new_position || '—'}</strong>
            ${h.new_department && h.new_department !== h.previous_department ? ` · ${h.previous_department||''} → ${h.new_department}` : ''}
          </div>
          ${h.notes ? `<div style="font-size:11.5px;color:var(--text-3);margin-top:2px">${h.notes}</div>` : ''}
        </div>
        <div style="font-size:11px;color:var(--text-3);white-space:nowrap">${fmtDate(h.event_date || h.created_at)}</div>
      </div>`).join('');

  openModal(e.name, `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
      ${avatarHtml(e.name, 64)}
      <div>
        <div style="font-size:18px;font-weight:600;color:var(--primary)">${e.name}</div>
        <div style="color:var(--text-2);margin-top:3px">${e.position || '—'} · ${e.department || '—'}</div>
        <div style="margin-top:8px">${statusBadge(e.status)}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;border-bottom:2px solid var(--border);margin-bottom:16px">
      <button onclick="showEmpTab('info','${e.id}')" id="tab-info" style="padding:8px 16px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px">Informações</button>
      <button onclick="showEmpTab('history','${e.id}')" id="tab-history" style="padding:8px 16px;border:none;background:none;cursor:pointer;font-size:13px;color:var(--text-2)">Histórico de Carreira</button>
      <button onclick="showEmpTab('disc','${e.id}')" id="tab-disc" style="padding:8px 16px;border:none;background:none;cursor:pointer;font-size:13px;color:var(--text-2)">DISC</button>
    </div>
    <div id="emp-tab-info">
      <div class="detail-grid">
        <div class="detail-item"><label>E-mail</label><span>${e.email || '—'}</span></div>
        <div class="detail-item"><label>Telefone</label><span>${e.phone || '—'}</span></div>
        <div class="detail-item"><label>Gestor</label><span>${e.manager || '—'}</span></div>
        <div class="detail-item"><label>Admissão</label><span>${fmtDate(e.admission_date)}</span></div>
        <div class="detail-item"><label>Nascimento</label><span>${fmtDate(e.birth_date)}</span></div>
        <div class="detail-item"><label>CPF</label><span>${e.cpf || '—'}</span></div>
        <div class="detail-item"><label>Pai / Mãe</label><span>${e.is_parent ? (e.parent_type === 'mae' ? '💜 Mãe' : '💙 Pai') : '—'}</span></div>
        ${e.status === 'inactive' ? `<div class="detail-item"><label>Data de saída</label><span style="color:#ef4444;font-weight:500">${e.exit_date ? fmtDate(e.exit_date) : '<em style="color:#f59e0b">Não informada</em>'}</span></div>` : ''}
      </div>
      ${e.notes ? `<hr class="divider"><div style="font-size:13px;color:var(--text-2)">${e.notes}</div>` : ''}
    </div>
    <div id="emp-tab-history" style="display:none">
      <div style="max-height:280px;overflow-y:auto">${historyHtml}</div>
      <button class="btn-secondary" style="margin-top:12px;width:100%" onclick="openAddCareerEvent('${e.id}')"><i class="fa-solid fa-plus"></i> Registrar Movimentação</button>
    </div>
    <div id="emp-tab-disc" style="display:none">
      <div id="disc-content-${e.id}">Carregando...</div>
    </div>
    <div class="modal-footer">
      ${userCan("edit") ? `<button class="btn-secondary" onclick="openEditEmployee('${e.id}')"><i class="fa-solid fa-pen"></i> Editar</button>` : ""}
      ${userCan("admin") ? `<button class="btn-danger" onclick="confirmDeactivate('${e.id}')"><i class="fa-solid fa-user-minus"></i> Inativar</button>` : ""}
    </div>
  `, 'lg');
}

function showEmpTab(tab, empId) {
  ['info','history','disc'].forEach(t => {
    const el = document.getElementById('emp-tab-' + t);
    if (el) el.style.display = t === tab ? '' : 'none';
    const btn = document.getElementById('tab-' + t);
    if (btn) btn.style.cssText = t === tab
      ? 'padding:8px 16px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px'
      : 'padding:8px 16px;border:none;background:none;cursor:pointer;font-size:13px;color:var(--text-2)';
  });
  if (tab === 'disc' && empId) loadDiscTab(empId);
}

async function loadDiscTab(empId) {
  const container = document.getElementById('disc-content-' + empId);
  if (!container) return;
  const disc = await api.get('/employees/' + empId + '/disc');
  if (!disc || !disc.dominant_profile) {
    container.innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:40px;margin-bottom:8px">📊</div>
        <div style="font-size:14px;font-weight:600;color:var(--text-2);margin-bottom:4px">DISC não aplicado</div>
        <div style="font-size:12px;color:var(--text-3);margin-bottom:16px">Aplique o questionário para ver o perfil comportamental</div>
        ${userCan('edit') ? '<button class="btn-primary" onclick="openDISC(\''+empId+'\')"><i class="fa-solid fa-clipboard-list"></i> Aplicar DISC</button>' : ''}
      </div>`;
    return;
  }
  const DISC_DESC = {
    D: { label: 'Executor', color: '#ef4444', desc: 'Ativo, competitivo, otimista e dinâmico. Age com rapidez, assume riscos e busca resultados concretos.', strengths: 'Proatividade, liderança sob pressão, energia para superar metas', development: 'Desenvolver paciência, escuta ativa e respeito ao ritmo da equipe', valore_context: 'Destaca-se em liderança de equipe, fechamentos críticos e gestão de demandas urgentes.' },
    I: { label: 'Comunicador', color: '#f59e0b', desc: 'Extrovertido, falante, adaptável e ativo. Constrói relacionamentos com facilidade e energiza os ambientes.', strengths: 'Comunicação fluida, trabalho em equipe, adaptabilidade', development: 'Aprimorar disciplina, organização e foco em detalhes técnicos', valore_context: 'Essencial no atendimento ao cliente, cultura interna e engajamento de equipes.' },
    S: { label: 'Planejador', color: '#22c55e', desc: 'Calmo, prudente e com muito autocontrole. Pilar de estabilidade, confiável e sempre disposto a ajudar.', strengths: 'Autocontrole, comprometimento com rotina e apoio à equipe', development: 'Desenvolver assertividade e flexibilidade diante de imprevistos', valore_context: 'Base operacional sólida — entrega consistente e suporte ao trabalho em equipe.' },
    C: { label: 'Analista', color: '#3b82f6', desc: 'Detalhista, preciso, cauteloso e crítico. Busca a perfeição e não abre mão da qualidade técnica.', strengths: 'Atenção aos detalhes, método, precisão e rigor técnico', development: 'Desenvolver agilidade decisória e tolerância à pressão', valore_context: 'Guardião da qualidade técnica nos setores Contábil, Fiscal e DP.' }
  };
  const p = disc.dominant_profile;
  const info = DISC_DESC[p] || {};
  const scores = [
    { label: 'D', value: disc.d_score, color: '#ef4444' },
    { label: 'I', value: disc.i_score, color: '#f59e0b' },
    { label: 'S', value: disc.s_score, color: '#22c55e' },
    { label: 'C', value: disc.c_score, color: '#3b82f6' },
  ];
  // Guardar dados para exportação
  window._discDataForExport = { disc, emp: empId, info, scores, p };

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
      <div style="width:60px;height:60px;border-radius:50%;background:${info.color};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;flex-shrink:0">${p}</div>
      <div style="flex:1">
        <div style="font-size:16px;font-weight:700;color:var(--text)">${info.label}</div>
        <div style="font-size:12px;color:var(--text-2);margin-top:2px">${info.desc}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      ${scores.map(s => `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
            <span style="font-weight:600;color:${s.color}">${s.label} — ${['D','Dominância','I','Influência','S','Estabilidade','C','Conformidade'].filter((_,i,a)=>a[i-1]===s.label)[0]||s.label}</span>
            <span style="color:var(--text-2)">${s.value.toFixed(0)}%</span>
          </div>
          <div style="height:8px;background:var(--border);border-radius:4px">
            <div style="width:${s.value}%;height:8px;background:${s.color};border-radius:4px"></div>
          </div>
        </div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;margin-bottom:12px">
      <div style="background:#f0fdf4;border-radius:8px;padding:10px">
        <div style="font-weight:600;color:#16a34a;margin-bottom:4px">✅ Pontos fortes</div>
        <div style="color:var(--text-2)">${info.strengths}</div>
      </div>
      <div style="background:#fff7ed;border-radius:8px;padding:10px">
        <div style="font-weight:600;color:#ea580c;margin-bottom:4px">📈 Desenvolvimento</div>
        <div style="color:var(--text-2)">${info.development}</div>
      </div>
    </div>
    <div style="background:#eff6ff;border-radius:8px;padding:10px;font-size:12px;margin-bottom:12px">
      <div style="font-weight:600;color:#1d4ed8;margin-bottom:4px">💼 No contexto da Valore</div>
      <div style="color:var(--text-2)">${info.valore_context}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:4px">
      <button onclick="exportDiscPDF('${empId}')" style="flex:1;padding:8px;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;font-size:12px;font-family:var(--font);color:var(--text)"><i class="fa-solid fa-file-pdf" style="color:#ef4444"></i> Exportar PDF</button>
      ${userCan('edit') ? '<button onclick="openDISC(\''+empId+'\')" style="flex:1;padding:8px;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;font-size:12px;font-family:var(--font);color:var(--text)"><i class="fa-solid fa-redo"></i> Reaplicar</button>' : ''}
    </div>
    <div style="margin-top:8px;font-size:11px;color:var(--text-3);text-align:right">Aplicado em ${fmtDate(disc.created_at)}</div>
  `;
}

function openAddCareerEvent(empId) {
  const DEPTS = ['Contábil','Fiscal','Departamento Pessoal','Sucesso do Cliente','Administrativo','Paralegal','Diretoria','Marketing','Tecnologia','Consultoria'];
  const CARGOS = ['Estagiário','Auxiliar','Assistente','Analista Júnior I','Analista Júnior II','Analista Pleno I','Analista Pleno II','Analista Sênior I','Analista Sênior II','Supervisor','Gerente'];
  openModal('Registrar Movimentação', `
    <div class="form-group"><label>Tipo de movimentação</label>
      <select id="ce-type">
        <option value="promotion">🏆 Promoção</option>
        <option value="transfer">🔄 Transferência</option>
        <option value="adjustment">📝 Ajuste de Cargo</option>
        <option value="demotion">⬇️ Rebaixamento</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Cargo anterior</label>
        <select id="ce-prev-pos"><option value="">Selecione...</option>${CARGOS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Cargo novo</label>
        <select id="ce-new-pos"><option value="">Selecione...</option>${CARGOS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Área anterior</label>
        <select id="ce-prev-dept"><option value="">Selecione...</option>${DEPTS.map(d=>`<option value="${d}">${d}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Área nova</label>
        <select id="ce-new-dept"><option value="">Selecione...</option>${DEPTS.map(d=>`<option value="${d}">${d}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-group"><label>Data da movimentação</label><input type="date" id="ce-date" value="${new Date().toISOString().split('T')[0]}"></div>
    <div class="form-group"><label>Observações</label><textarea id="ce-notes" placeholder="Contexto, motivo, conquistas..."></textarea></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveCareerEvent('${empId}')"><i class="fa-solid fa-floppy-disk"></i> Registrar</button>
    </div>
  `);
}

async function saveCareerEvent(empId) {
  const body = {
    event_type: document.getElementById('ce-type')?.value,
    previous_position: document.getElementById('ce-prev-pos')?.value,
    new_position: document.getElementById('ce-new-pos')?.value,
    previous_department: document.getElementById('ce-prev-dept')?.value,
    new_department: document.getElementById('ce-new-dept')?.value,
    event_date: document.getElementById('ce-date')?.value,
    notes: document.getElementById('ce-notes')?.value,
  };
  const res = await api.post('/employees/' + empId + '/career', body);
  if (res?.success) { closeModal(); showToast('Movimentação registrada!'); openEmployeeDetail(empId); }
  else showToast('Erro ao registrar', 'error');
}

function openNewEmployee() {
  openModal('Novo Colaborador', `
    <div class="form-row">
      <div class="form-group"><label>Nome completo *</label><input type="text" id="ne-name" placeholder="Maria Silva"></div>
      <div class="form-group"><label>E-mail</label><input type="email" id="ne-email" placeholder="maria@valore.com.br"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Departamento</label>
        <select id="ne-dept">
          <option value="">Selecione...</option>
          <option value="Contábil">Contábil</option>
          <option value="Fiscal">Fiscal</option>
          <option value="Departamento Pessoal">Departamento Pessoal</option>
          <option value="Sucesso do Cliente">Sucesso do Cliente</option>
          <option value="Administrativo">Administrativo</option>
          <option value="Paralegal">Paralegal</option>
          <option value="Diretoria">Diretoria</option>
          <option value="Marketing">Marketing</option>
          <option value="Tecnologia">Tecnologia</option>
          <option value="Consultoria">Consultoria</option>
        </select>
      </div>
      <div class="form-group"><label>Cargo</label>
        <select id="ne-position">
          <option value="">Selecione...</option>
          <option value="Estagiário">Estagiário</option>
          <option value="Auxiliar">Auxiliar</option>
          <option value="Assistente">Assistente</option>
          <option value="Analista Júnior I">Analista Júnior I</option>
          <option value="Analista Júnior II">Analista Júnior II</option>
          <option value="Analista Pleno I">Analista Pleno I</option>
          <option value="Analista Pleno II">Analista Pleno II</option>
          <option value="Analista Sênior I">Analista Sênior I</option>
          <option value="Analista Sênior II">Analista Sênior II</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Gerente">Gerente</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Gestor</label><input type="text" id="ne-manager" placeholder="Nome do gestor"></div>
      <div class="form-group"><label>Telefone</label><input type="tel" id="ne-phone" placeholder="(81) 99999-9999"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Data de admissão</label><input type="date" id="ne-admission"></div>
      <div class="form-group"><label>Data de nascimento</label><input type="date" id="ne-birth"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>CPF</label><input type="text" id="ne-cpf" placeholder="000.000.000-00"></div>
      <div class="form-group"><label>Status</label><select id="ne-status"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>É pai ou mãe?</label>
        <select id="ne-parent-type" onchange="document.getElementById('ne-is-parent').value=this.value?'1':''">
          <option value="">Não</option>
          <option value="pai">Sim — Pai 💙</option>
          <option value="mae">Sim — Mãe 💜</option>
        </select>
        <input type="hidden" id="ne-is-parent">
      </div>
    </div>
    <div class="form-group"><label>Observações</label><textarea id="ne-notes" placeholder="Informações adicionais..."></textarea></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveNewEmployee()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `, 'lg');
}

async function saveNewEmployee() {
  const name = document.getElementById('ne-name')?.value;
  if (!name) { showToast('Nome é obrigatório', 'error'); return; }
  const body = {
    name, email: document.getElementById('ne-email')?.value,
    department: document.getElementById('ne-dept')?.value,
    position: document.getElementById('ne-position')?.value,
    manager: document.getElementById('ne-manager')?.value,
    phone: document.getElementById('ne-phone')?.value,
    admission_date: document.getElementById('ne-admission')?.value,
    birth_date: document.getElementById('ne-birth')?.value,
    cpf: document.getElementById('ne-cpf')?.value,
    status: document.getElementById('ne-status')?.value,
    notes: document.getElementById('ne-notes')?.value,
    is_parent: !!document.getElementById('ne-parent-type')?.value,
    parent_type: document.getElementById('ne-parent-type')?.value || '',
  };
  const res = await api.post('/employees', body);
  if (res) {
    closeModal();
    _allEmployees = [];
    showToast('Colaborador cadastrado!');
    navigate('rh-colaboradores');
  }
}

async function openEditEmployee(id) {
  const e = await api.get('/employees/' + id);
  if (!e) return;
  openModal('Editar Colaborador', `
    <div class="form-row">
      <div class="form-group"><label>Nome completo</label><input type="text" id="ee-name" value="${e.name||''}"></div>
      <div class="form-group"><label>E-mail</label><input type="email" id="ee-email" value="${e.email||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Departamento</label>
        <select id="ee-dept">
          <option value="">Selecione...</option>
          <option value="Contábil" ${e.department==='Contábil'?'selected':''}>Contábil</option>
          <option value="Fiscal" ${e.department==='Fiscal'?'selected':''}>Fiscal</option>
          <option value="Departamento Pessoal" ${e.department==='Departamento Pessoal'?'selected':''}>Departamento Pessoal</option>
          <option value="Sucesso do Cliente" ${e.department==='Sucesso do Cliente'?'selected':''}>Sucesso do Cliente</option>
          <option value="Administrativo" ${e.department==='Administrativo'?'selected':''}>Administrativo</option>
          <option value="Paralegal" ${e.department==='Paralegal'?'selected':''}>Paralegal</option>
          <option value="Diretoria" ${e.department==='Diretoria'?'selected':''}>Diretoria</option>
          <option value="Marketing" ${e.department==='Marketing'?'selected':''}>Marketing</option>
          <option value="Tecnologia" ${e.department==='Tecnologia'?'selected':''}>Tecnologia</option>
          <option value="Consultoria" ${e.department==='Consultoria'?'selected':''}>Consultoria</option>
        </select>
      </div>
      <div class="form-group"><label>Cargo</label>
        <select id="ee-position">
          <option value="">Selecione...</option>
          <option value="Estagiário" ${e.position==='Estagiário'?'selected':''}>Estagiário</option>
          <option value="Auxiliar" ${e.position==='Auxiliar'?'selected':''}>Auxiliar</option>
          <option value="Assistente" ${e.position==='Assistente'?'selected':''}>Assistente</option>
          <option value="Analista Júnior I" ${e.position==='Analista Júnior I'?'selected':''}>Analista Júnior I</option>
          <option value="Analista Júnior II" ${e.position==='Analista Júnior II'?'selected':''}>Analista Júnior II</option>
          <option value="Analista Pleno I" ${e.position==='Analista Pleno I'?'selected':''}>Analista Pleno I</option>
          <option value="Analista Pleno II" ${e.position==='Analista Pleno II'?'selected':''}>Analista Pleno II</option>
          <option value="Analista Sênior I" ${e.position==='Analista Sênior I'?'selected':''}>Analista Sênior I</option>
          <option value="Analista Sênior II" ${e.position==='Analista Sênior II'?'selected':''}>Analista Sênior II</option>
          <option value="Supervisor" ${e.position==='Supervisor'?'selected':''}>Supervisor</option>
          <option value="Gerente" ${e.position==='Gerente'?'selected':''}>Gerente</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Gestor</label><input type="text" id="ee-manager" value="${e.manager||''}"></div>
      <div class="form-group"><label>Telefone</label><input type="tel" id="ee-phone" value="${e.phone||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Admissão</label><input type="date" id="ee-admission" value="${e.admission_date||''}"></div>
      <div class="form-group"><label>Nascimento</label><input type="date" id="ee-birth" value="${e.birth_date||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>CPF</label><input type="text" id="ee-cpf" value="${e.cpf||''}"></div>
      <div class="form-group"><label>Status</label><select id="ee-status"><option value="active" ${e.status==='active'?'selected':''}>Ativo</option><option value="inactive" ${e.status==='inactive'?'selected':''}>Inativo</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>É pai ou mãe?</label>
        <select id="ee-parent-type">
          <option value="" ${!e.is_parent?'selected':''}>Não</option>
          <option value="pai" ${e.is_parent&&e.parent_type==='pai'?'selected':''}>Sim — Pai 💙</option>
          <option value="mae" ${e.is_parent&&e.parent_type==='mae'?'selected':''}>Sim — Mãe 💜</option>
        </select>
      </div>
    </div>
    <div id="ee-exit-block" style="${e.status==='inactive'?'':'display:none'}">
      <div class="form-group">
        <label>Data de saída ${e.status==='inactive'?'*':''}</label>
        <input type="date" id="ee-exit-date" value="${e.exit_date||''}">
      </div>
    </div>
    <div class="form-group"><label>Observações</label><textarea id="ee-notes">${e.notes||''}</textarea></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveEditEmployee('${id}')"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `, 'lg');

  // Mostrar/esconder data de saída quando status muda
  setTimeout(() => {
    document.getElementById('ee-status')?.addEventListener('change', function() {
      const block = document.getElementById('ee-exit-block');
      if (block) block.style.display = this.value === 'inactive' ? '' : 'none';
    });
  }, 50);
}

async function saveEditEmployee(id) {
  const body = {
    name: document.getElementById('ee-name')?.value,
    email: document.getElementById('ee-email')?.value,
    department: document.getElementById('ee-dept')?.value,
    position: document.getElementById('ee-position')?.value,
    manager: document.getElementById('ee-manager')?.value,
    phone: document.getElementById('ee-phone')?.value,
    admission_date: document.getElementById('ee-admission')?.value,
    birth_date: document.getElementById('ee-birth')?.value,
    cpf: document.getElementById('ee-cpf')?.value,
    status: document.getElementById('ee-status')?.value,
    notes: document.getElementById('ee-notes')?.value,
    is_parent: !!document.getElementById('ee-parent-type')?.value,
    parent_type: document.getElementById('ee-parent-type')?.value || '',
    exit_date: document.getElementById('ee-exit-date')?.value || '',
  };
  // Validar data de saída obrigatória para inativo
  if (body.status === 'inactive' && !body.exit_date) {
    showToast('Data de saída obrigatória para colaborador inativo', 'error'); return;
  }
  const res = await api.put('/employees/' + id, body);
  if (res) { closeModal(); _allEmployees = []; showToast('Dados atualizados!'); navigate('rh-colaboradores'); }
}

function confirmDeactivate(id) {
  openModal('Inativar Colaborador', `
    <div style="margin-bottom:16px;color:var(--text-2);font-size:13.5px">
      <i class="fa-solid fa-triangle-exclamation" style="color:#f59e0b;margin-right:6px"></i>
      Esta ação marcará o colaborador como inativo. Informe a data de saída.
    </div>
    <div class="form-group">
      <label>Data de saída *</label>
      <input type="date" id="exit-date-input" value="${new Date().toISOString().split('T')[0]}">
    </div>
    <div class="form-group">
      <label>Motivo (opcional)</label>
      <input type="text" id="exit-reason" placeholder="Ex: Demissão, Pedido de demissão, Aposentadoria...">
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-danger" onclick="doDeactivate('${id}')"><i class="fa-solid fa-user-minus"></i> Confirmar Inativação</button>
    </div>
  `);
}

async function doDeactivate(id) {
  const exitDate = document.getElementById('exit-date-input')?.value;
  if (!exitDate) { showToast('Data de saída obrigatória', 'error'); return; }
  const reason = document.getElementById('exit-reason')?.value || '';
  const res = await fetch('/api/employees/' + id, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ exit_date: exitDate, notes: reason })
  });
  const data = await res.json();
  if (data.success) { closeModal(); _allEmployees = []; showToast('Colaborador inativado'); navigate('rh-colaboradores'); }
  else showToast('Erro ao inativar', 'error');
}


function confirmDeleteEmployee(id) {
  const nomeEl = document.getElementById('modal-title');
  const nome = nomeEl ? nomeEl.textContent : 'este colaborador';
  const body = document.getElementById('modal-body');
  body.innerHTML = '';
  const aviso = document.createElement('div');
  aviso.style.cssText = 'margin-bottom:16px;color:var(--text-2);font-size:13.5px';
  aviso.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;margin-right:6px"></i><strong>Atencao: esta acao e permanente!</strong>';
  const info = document.createElement('div');
  info.style.cssText = 'background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin-bottom:16px;font-size:13.5px;color:#991b1b';
  const strong = document.createElement('strong');
  strong.style.fontSize = '15px';
  strong.textContent = nome;
  info.appendChild(document.createTextNode('Voce esta prestes a excluir permanentemente: '));
  info.appendChild(strong);
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  const btnCancel = document.createElement('button');
  btnCancel.className = 'btn-secondary';
  btnCancel.textContent = 'Cancelar';
  btnCancel.onclick = closeModal;
  const btnConfirm = document.createElement('button');
  btnConfirm.className = 'btn-danger';
  btnConfirm.style.background = '#7f1d1d';
  btnConfirm.innerHTML = '<i class="fa-solid fa-trash"></i> Confirmar Exclusao Permanente';
  btnConfirm.onclick = () => doDeleteEmployee(id);
  footer.appendChild(btnCancel);
  footer.appendChild(btnConfirm);
  body.appendChild(aviso);
  body.appendChild(info);
  body.appendChild(footer);
}

async function doDeleteEmployee(id) {
  const res = await fetch('/api/employees/' + id + '/permanent', {
    method: 'DELETE',
    credentials: 'include'
  });
  const data = await res.json();
  if (data.success) {
    closeModal();
    _allEmployees = [];
    showToast('Colaborador excluído permanentemente');
    navigate('rh-colaboradores');
  } else {
    showToast(data.error || 'Erro ao excluir', 'error');
  }
}

// ─── NOTÍCIAS ─────────────────────────────────────────────────────────────────
async function renderNoticias() {
  const news = await api.get('/news') || [];

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-bullhorn"></i>Notícias</div>
  <div class="page-actions">
    <button class="btn-primary" onclick="openNewNews()"><i class="fa-solid fa-plus"></i> Nova Notícia</button>
  </div>
</div>
<div class="page-body">
  ${news.length === 0 ? '<div class="empty-state"><i class="fa-solid fa-newspaper"></i><h3>Nenhuma notícia</h3><p>Crie o primeiro comunicado.</p></div>' :
  `<div class="content-grid">
    ${news.map(n => `
      <div class="content-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div class="content-card-cat">${n.category || 'Geral'}</div>
          <div style="display:flex;gap:6px">
            ${n.pinned ? '<span class="badge badge-warning">📌 Fixado</span>' : ''}
            ${statusBadge(n.published ? 'published' : 'draft')}
          </div>
        </div>
        <div class="content-card-title">${n.title}</div>
        <div class="content-card-preview">${n.content || ''}</div>
        <div class="content-card-meta">
          <span><i class="fa-solid fa-user" style="margin-right:4px"></i>${n.author}</span>
          <span>${relativeTime(n.created_at)}</span>
          ${userCan("admin") ? `<button class="btn-icon" style="margin-left:auto" onclick="deleteNews('${n.id}')"><i class="fa-solid fa-trash"></i></button>` : ""}
        </div>
      </div>`).join('')}
  </div>`}
</div>`;
}

function openNewNews() {
  openModal('Nova Notícia', `
    <div class="form-group"><label>Título *</label><input type="text" id="nn-title" placeholder="Título da notícia"></div>
    <div class="form-row">
      <div class="form-group"><label>Categoria</label><select id="nn-category">
        <option>Comunicado</option><option>Metas</option><option>Treinamento</option><option>Benefícios</option><option>Cultura</option><option>Geral</option>
      </select></div>
      <div class="form-group" style="display:flex;align-items:flex-end;gap:12px">
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="nn-published"> Publicado
        </label>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="nn-pinned"> Fixar
        </label>
      </div>
    </div>
    <div class="form-group"><label>Conteúdo</label><textarea id="nn-content" style="min-height:160px" placeholder="Escreva o conteúdo da notícia..."></textarea></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveNews()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `);
}

async function saveNews() {
  const title = document.getElementById('nn-title')?.value;
  if (!title) { showToast('Título obrigatório', 'error'); return; }
  const body = {
    title, content: document.getElementById('nn-content')?.value,
    category: document.getElementById('nn-category')?.value,
    published: document.getElementById('nn-published')?.checked ? 1 : 0,
    pinned: document.getElementById('nn-pinned')?.checked ? 1 : 0,
  };
  const res = await api.post('/news', body);
  if (res) { closeModal(); showToast('Notícia criada!'); navigate('comm-noticias'); }
}

async function deleteNews(id) {
  if (!confirm('Excluir esta notícia?')) return;
  const res = await api.delete('/news/' + id);
  if (res) { showToast('Notícia excluída'); navigate('comm-noticias'); }
}

// ─── RECONHECIMENTOS ──────────────────────────────────────────────────────────
async function renderReconhecimentos() {
  const [recs, employees] = await Promise.all([
    api.get('/recognitions') || [],
    api.get('/employees') || []
  ]);
  const recognitions = recs || [];
  const emps = employees || [];

  const typeEmojis = { destaque: '⭐', inovacao: '💡', trabalho_equipe: '🤝', lideranca: '🏆', cliente: '❤️', resultado: '🎯' };

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-trophy"></i>Reconhecimentos</div>
  <div class="page-actions">
    <button class="btn-primary" onclick="openNewRecognition(${JSON.stringify(emps).replace(/"/g,'&quot;')})"><i class="fa-solid fa-plus"></i> Reconhecer Alguém</button>
  </div>
</div>
<div class="page-body">
  ${recognitions.length === 0 ? `
    <div class="empty-state">
      <i class="fa-solid fa-trophy"></i>
      <h3>Nenhum reconhecimento ainda</h3>
      <p>Reconheça o trabalho incrível dos seus colegas!</p>
    </div>` :
  `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
    ${recognitions.map(r => `
      <div class="recognition-card">
        <div class="recognition-type">${typeEmojis[r.type] || '⭐'}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          ${avatarHtml(r.employee_name || '?', 40)}
          <div>
            <div style="font-size:14px;font-weight:600">${r.employee_name || 'Colaborador'}</div>
            <div style="font-size:12px;color:var(--text-2)">${r.department || ''} · ${r.position || ''}</div>
          </div>
        </div>
        <p style="font-size:13.5px;color:var(--text-2);line-height:1.6;margin-bottom:10px">"${r.message || ''}"</p>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:12px;color:var(--text-3)">por <strong>${r.recognized_by || 'Equipe'}</strong></div>
          <div style="font-size:11.5px;color:var(--text-3)">${relativeTime(r.created_at)}</div>
        </div>
        ${r.points ? `<div style="margin-top:8px"><span class="badge badge-purple">+${r.points} pts</span></div>` : ''}
      </div>`).join('')}
  </div>`}
</div>`;
}

function openNewRecognition(emps) {
  const opts = emps.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  openModal('Reconhecer Colaborador', `
    <div class="form-group"><label>Colaborador *</label><select id="nr-emp"><option value="">Selecione...</option>${opts}</select></div>
    <div class="form-group"><label>Tipo de reconhecimento</label><select id="nr-type">
      <option value="destaque">⭐ Destaque</option>
      <option value="inovacao">💡 Inovação</option>
      <option value="trabalho_equipe">🤝 Trabalho em equipe</option>
      <option value="lideranca">🏆 Liderança</option>
      <option value="cliente">❤️ Foco no cliente</option>
      <option value="resultado">🎯 Resultado</option>
    </select></div>
    <div class="form-group"><label>Mensagem *</label><textarea id="nr-msg" placeholder="Escreva uma mensagem de reconhecimento..." style="min-height:120px"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Pontos (opcional)</label><input type="number" id="nr-points" value="0" min="0" max="100"></div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveRecognition()"><i class="fa-solid fa-star"></i> Reconhecer</button>
    </div>
  `);
}

async function saveRecognition() {
  const emp = document.getElementById('nr-emp')?.value;
  const msg = document.getElementById('nr-msg')?.value;
  if (!emp || !msg) { showToast('Preencha todos os campos obrigatórios', 'error'); return; }
  const body = {
    employee_id: emp,
    type: document.getElementById('nr-type')?.value,
    message: msg,
    points: parseInt(document.getElementById('nr-points')?.value) || 0,
    public: 1,
  };
  const res = await api.post('/recognitions', body);
  if (res) { closeModal(); showToast('Reconhecimento enviado! 🎉'); navigate('cultura-reconhecimentos'); }
}

// ─── EVENTOS ──────────────────────────────────────────────────────────────────
async function renderEventos() {
  const events = await api.get('/events') || [];
  const typeColors = { celebration: 'green', training: 'blue', meeting: 'purple', social: 'pink', offsite: 'amber' };
  const typeLabels = { celebration: 'Celebração', training: 'Treinamento', meeting: 'Reunião', social: 'Confraternização', offsite: 'Offsite' };

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-calendar-star"></i>Eventos</div>
  <div class="page-actions">
    <button class="btn-primary" onclick="openNewEvent()"><i class="fa-solid fa-plus"></i> Novo Evento</button>
  </div>
</div>
<div class="page-body">
  ${events.length === 0 ? '<div class="empty-state"><i class="fa-solid fa-calendar-star"></i><h3>Nenhum evento</h3><p>Agende o próximo evento.</p></div>' :
  `<div class="content-grid">
    ${events.map(e => {
      const tc = typeColors[e.event_type] || 'neutral';
      return `
      <div class="content-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span class="badge badge-${tc === 'neutral' ? 'neutral' : 'info'}" style="${tc !== 'neutral' && tc !== 'info' ? `background:var(--${tc}-light,var(--info-light))` : ''}">${typeLabels[e.event_type] || e.event_type}</span>
          <span style="font-size:12px;color:var(--text-3)">${fmtDate(e.date)}</span>
        </div>
        <div class="content-card-title">${e.title}</div>
        <div class="content-card-preview">${e.description || ''}</div>
        <div class="content-card-meta">
          ${e.time ? `<span><i class="fa-regular fa-clock" style="margin-right:4px"></i>${e.time}</span>` : ''}
          ${e.location ? `<span><i class="fa-solid fa-location-dot" style="margin-right:4px"></i>${e.location}</span>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>`}
</div>`;
}

function openNewEvent() {
  openModal('Novo Evento', `
    <div class="form-group"><label>Título *</label><input type="text" id="nev-title" placeholder="Nome do evento"></div>
    <div class="form-row">
      <div class="form-group"><label>Tipo</label><select id="nev-type">
        <option value="celebration">Celebração</option><option value="training">Treinamento</option>
        <option value="meeting">Reunião</option><option value="social">Confraternização</option><option value="offsite">Offsite</option>
      </select></div>
      <div class="form-group"><label>Data</label><input type="date" id="nev-date"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Horário</label><input type="time" id="nev-time"></div>
      <div class="form-group"><label>Local</label><input type="text" id="nev-location" placeholder="Sala, link ou endereço"></div>
    </div>
    <div class="form-group"><label>Descrição</label><textarea id="nev-desc" placeholder="Detalhes do evento..."></textarea></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveEvent()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `);
}

async function saveEvent() {
  const title = document.getElementById('nev-title')?.value;
  if (!title) { showToast('Título obrigatório', 'error'); return; }
  const body = {
    title, event_type: document.getElementById('nev-type')?.value,
    date: document.getElementById('nev-date')?.value,
    time: document.getElementById('nev-time')?.value,
    location: document.getElementById('nev-location')?.value,
    description: document.getElementById('nev-desc')?.value,
  };
  const res = await api.post('/events', body);
  if (res) { closeModal(); showToast('Evento criado!'); navigate('cultura-eventos'); }
}

// ─── BENEFÍCIOS ───────────────────────────────────────────────────────────────
async function renderBeneficios() {
  const benefits = await api.get('/benefits') || [];
  const catIcons = { Saúde: 'fa-heart-pulse', Alimentação: 'fa-utensils', 'Bem-estar': 'fa-dumbbell', Financeiro: 'fa-dollar-sign', Seguridade: 'fa-shield-halved', Educação: 'fa-graduation-cap', Mobilidade: 'fa-car' };
  const catColors = { Saúde: 'pink', Alimentação: 'amber', 'Bem-estar': 'green', Financeiro: 'teal', Seguridade: 'blue', Educação: 'purple', Mobilidade: 'coral' };
  const groups = {};
  benefits.forEach(b => { groups[b.category] = groups[b.category] || []; groups[b.category].push(b); });

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-gift"></i>Vantagens e Benefícios</div>
  <div class="page-actions">
    ${userCan("edit") ? `<button class="btn-primary" onclick="openNewBenefit()"><i class="fa-solid fa-plus"></i> Novo Benefício</button>` : ""}
  </div>
</div>
<div class="page-body">
  ${Object.entries(groups).map(([cat, items]) => `
    <div style="margin-bottom:28px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <div class="stat-icon ${catColors[cat] || 'blue'}" style="width:32px;height:32px;font-size:14px"><i class="fa-solid ${catIcons[cat] || 'fa-star'}"></i></div>
        <h3 style="font-size:15px;font-weight:600;color:var(--primary)">${cat}</h3>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">
        ${items.map(b => `
          <div class="card" style="padding:18px;position:relative">
            ${userCan("admin") ? `<button onclick="deleteBenefit('${b.id}')" title="Excluir" style="position:absolute;top:10px;right:10px;background:none;border:none;cursor:pointer;color:var(--text-3);font-size:14px;padding:4px" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-3)'"><i class="fa-solid fa-trash"></i></button>` : ""}
            <div style="font-size:15px;font-weight:600;margin-bottom:6px;padding-right:24px">${b.title}</div>
            <div style="font-size:13px;color:var(--text-2);margin-bottom:10px">${b.description || ''}</div>
            ${b.supplier ? `<div style="font-size:12px;color:var(--text-3)"><i class="fa-solid fa-building" style="margin-right:4px"></i>${b.supplier}</div>` : ''}
            ${b.url ? `<a href="${b.url}" target="_blank" style="font-size:12px;color:var(--accent);text-decoration:none;margin-top:6px;display:inline-block"><i class="fa-solid fa-external-link-alt" style="margin-right:4px"></i>Acessar</a>` : ''}
          </div>`).join('')}
      </div>
    </div>`).join('') || '<div class="empty-state"><i class="fa-solid fa-gift"></i><h3>Nenhum benefício cadastrado</h3><p>Adicione os benefícios da empresa.</p></div>'}
</div>`;
}

function openNewBenefit() {
  openModal('Novo Benefício', `
    <div class="form-group"><label>Título *</label><input type="text" id="nb-title" placeholder="Ex: Plano de Saúde"></div>
    <div class="form-row">
      <div class="form-group"><label>Categoria</label><select id="nb-cat">
        <option>Saúde</option><option>Alimentação</option><option>Bem-estar</option>
        <option>Financeiro</option><option>Seguridade</option><option>Educação</option><option>Mobilidade</option>
      </select></div>
      <div class="form-group"><label>Fornecedor</label><input type="text" id="nb-supplier" placeholder="Nome do fornecedor"></div>
    </div>
    <div class="form-group"><label>Descrição</label><textarea id="nb-desc" placeholder="Detalhes do benefício..."></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Contato</label><input type="text" id="nb-contact" placeholder="Email ou telefone"></div>
      <div class="form-group"><label>URL</label><input type="url" id="nb-url" placeholder="https://..."></div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveBenefit()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `);
}

async function deleteBenefit(id) {
  if (!confirm('Excluir este benefício?')) return;
  const res = await api.delete('/benefits/' + id);
  if (res?.success) { showToast('Benefício excluído'); navigate('rh-beneficios'); }
  else showToast('Erro ao excluir', 'error');
}

async function saveBenefit() {
  const title = document.getElementById('nb-title')?.value;
  if (!title) { showToast('Título obrigatório', 'error'); return; }
  const body = {
    title, category: document.getElementById('nb-cat')?.value,
    supplier: document.getElementById('nb-supplier')?.value,
    description: document.getElementById('nb-desc')?.value,
    contact: document.getElementById('nb-contact')?.value,
    url: document.getElementById('nb-url')?.value,
  };
  const res = await api.post('/benefits', body);
  if (res) { closeModal(); showToast('Benefício adicionado!'); navigate('comm-beneficios'); }
}

// ─── CHAMADOS ─────────────────────────────────────────────────────────────────
async function renderChamados() {
  const reqs = await api.get('/service-requests') || [];

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-ticket"></i>Gerenciamento de Serviços</div>
  <div class="page-actions">
    <button class="btn-primary" onclick="openNewRequest()"><i class="fa-solid fa-plus"></i> Abrir Chamado</button>
  </div>
</div>
<div class="page-body">
  <div class="card">
    <div class="card-body">
      ${reqs.length === 0 ? '<div class="empty-state"><i class="fa-solid fa-ticket"></i><h3>Nenhum chamado</h3><p>Nenhum chamado em aberto.</p></div>' :
      `<div class="table-wrap"><table>
        <thead><tr><th>Título</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th>Data</th><th></th></tr></thead>
        <tbody>${reqs.map(r => `
          <tr>
            <td><strong>${r.title}</strong><br><small style="color:var(--text-3)">${(r.description||'').substring(0,60)}...</small></td>
            <td><span class="chip"><i class="fa-solid fa-tag"></i>${r.category||'—'}</span></td>
            <td>${priorityBadge(r.priority)}</td>
            <td>${statusBadge(r.status)}</td>
            <td>${fmtDate(r.created_at)}</td>
            <td>
              <button class="btn-icon" onclick="openUpdateRequest('${r.id}','${r.status}')"><i class="fa-solid fa-pen"></i></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>`}
    </div>
  </div>
</div>`;
}

function openNewRequest() {
  openModal('Abrir Chamado', `
    <div class="form-group"><label>Título *</label><input type="text" id="nr2-title" placeholder="Descreva o problema resumidamente"></div>
    <div class="form-row">
      <div class="form-group"><label>Categoria</label><select id="nr2-cat">
        <option>TI</option><option>RH</option><option>Facilities</option><option>Financeiro</option><option>Jurídico</option><option>Outro</option>
      </select></div>
      <div class="form-group"><label>Prioridade</label><select id="nr2-priority">
        <option value="medium">Média</option><option value="high">Alta</option><option value="low">Baixa</option>
      </select></div>
    </div>
    <div class="form-group"><label>Descrição</label><textarea id="nr2-desc" placeholder="Detalhe o problema ou solicitação..." style="min-height:120px"></textarea></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveRequest()"><i class="fa-solid fa-paper-plane"></i> Enviar</button>
    </div>
  `);
}

async function saveRequest() {
  const title = document.getElementById('nr2-title')?.value;
  if (!title) { showToast('Título obrigatório', 'error'); return; }
  const body = {
    title, category: document.getElementById('nr2-cat')?.value,
    priority: document.getElementById('nr2-priority')?.value,
    description: document.getElementById('nr2-desc')?.value,
  };
  const res = await api.post('/service-requests', body);
  if (res) { closeModal(); showToast('Chamado aberto!'); navigate('ops-servicos'); }
}

function openUpdateRequest(id, currentStatus) {
  openModal('Atualizar Chamado', `
    <div class="form-group"><label>Status</label><select id="ur-status">
      <option value="open" ${currentStatus==='open'?'selected':''}>Aberto</option>
      <option value="in_progress" ${currentStatus==='in_progress'?'selected':''}>Em andamento</option>
      <option value="completed" ${currentStatus==='completed'?'selected':''}>Concluído</option>
      <option value="closed" ${currentStatus==='closed'?'selected':''}>Fechado</option>
    </select></div>
    <div class="form-group"><label>Responsável</label><input type="text" id="ur-assigned" placeholder="Nome do responsável"></div>
    <div class="form-group"><label>Resolução / Comentário</label><textarea id="ur-resolution" placeholder="Descreva a resolução ou andamento..."></textarea></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="updateRequest('${id}')"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `, 'sm');
}

async function updateRequest(id) {
  const body = {
    status: document.getElementById('ur-status')?.value,
    assigned_to: document.getElementById('ur-assigned')?.value,
    resolution: document.getElementById('ur-resolution')?.value,
  };
  const res = await api.put('/service-requests/' + id, body);
  if (res) { closeModal(); showToast('Chamado atualizado!'); navigate('ops-servicos'); }
}

// ─── BIBLIOTECA ───────────────────────────────────────────────────────────────

// ── PLANO DE DESENVOLVIMENTO (PDV) ───────────────────────────────────────────
let _pdvEmployees = [];

async function renderPDV() {
  _pdvEmployees = (await api.get('/employees') || []).filter(e => e.status === 'active');
  const records = await api.get('/records', { area: 'dev_talentos', module: 'pdv' }) || [];

  // Enriquecer records com dados do colaborador
  const empMap = {};
  _pdvEmployees.forEach(e => empMap[e.id] = e);
  records.forEach(r => { r._emp = empMap[r.employee_id] || null; });

  const depts = [...new Set(_pdvEmployees.map(e => e.department).filter(Boolean))].sort();

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-route"></i>Plano de Desenvolvimento</div>
  <div class="page-actions" style="gap:8px">
    ${userCan('edit') ? `<button class="btn-primary" onclick="openNewPDV()"><i class="fa-solid fa-plus"></i> Novo PDI</button>` : ''}
  </div>
</div>
<div class="page-body">

  <!-- Abas -->
  <div style="display:flex;gap:8px;border-bottom:2px solid var(--border);margin-bottom:20px">
    <button onclick="showPDVTab('lista')" id="pdv-tab-lista" style="padding:8px 18px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px">Lista</button>
    <button onclick="showPDVTab('gantt')" id="pdv-tab-gantt" style="padding:8px 18px;border:none;background:none;cursor:pointer;font-size:13px;color:var(--text-2)">Gráfico de Gantt</button>
  </div>

  <!-- Tab Lista -->
  <div id="pdv-lista">
    ${records.length === 0
      ? '<div class="empty-state"><i class="fa-solid fa-route"></i><h3>Nenhum PDI cadastrado</h3><p>Crie planos de desenvolvimento individual para os colaboradores.</p></div>'
      : `<div class="table-wrap"><table>
          <thead><tr><th>Título</th><th>Colaborador</th><th>Área</th><th>Período</th><th>Progresso</th><th>Status</th><th></th></tr></thead>
          <tbody>${records.map(r => {
            const emp = r._emp;
            const pct = r.progress || 0;
            const barColor = pct >= 75 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#3b82f6';
            return `<tr>
              <td><strong>${r.title}</strong></td>
              <td>${emp ? `<div style="display:flex;align-items:center;gap:8px">${avatarHtml(emp.name,24)}<span style="font-size:13px">${emp.name}</span></div>` : '<span style="color:var(--text-3)">—</span>'}</td>
              <td><span style="font-size:12px;color:var(--text-2)">${emp?.department || '—'}</span></td>
              <td><span style="font-size:12px;color:var(--text-2)">${r.start_date ? fmtDate(r.start_date) : '—'} → ${r.due_date ? fmtDate(r.due_date) : '—'}</span></td>
              <td style="min-width:120px">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="flex:1;height:6px;background:var(--border);border-radius:4px">
                    <div style="width:${pct}%;height:6px;background:${barColor};border-radius:4px;transition:width .3s"></div>
                  </div>
                  <span style="font-size:12px;color:var(--text-2);white-space:nowrap">${pct}%</span>
                </div>
              </td>
              <td>${statusBadge(r.status)}</td>
              <td style="display:flex;gap:6px">
                ${userCan('edit') ? `<button class="btn-icon" onclick="openEditPDV('${r.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>` : ''}
                ${userCan('admin') ? `<button class="btn-icon" onclick="deletePDV('${r.id}')" title="Excluir"><i class="fa-solid fa-trash"></i></button>` : ''}
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>`}
  </div>

  <!-- Tab Gantt -->
  <div id="pdv-gantt" style="display:none">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <div style="display:flex;border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden">
        <button id="pdv-gantt-colab" onclick="setPDVGanttView('colaborador')" style="padding:7px 14px;border:none;background:var(--primary);color:#fff;cursor:pointer;font-size:13px;font-family:var(--font)"><i class="fa-solid fa-user"></i> Por Colaborador</button>
        <button id="pdv-gantt-area" onclick="setPDVGanttView('area')" style="padding:7px 14px;border:none;background:var(--surface);color:var(--text-2);cursor:pointer;font-size:13px;font-family:var(--font)"><i class="fa-solid fa-building"></i> Por Área</button>
      </div>
      <select id="pdv-gantt-filter" onchange="renderPDVGantt()" style="padding:7px 14px;border:1.5px solid var(--border);border-radius:var(--radius);font-size:13px;font-family:var(--font);color:var(--text);background:var(--surface);outline:none">
        <option value="">Todos</option>
        ${_pdvEmployees.map(e => `<option value="emp:${e.id}">${e.name}</option>`).join('')}
        ${depts.map(d => `<option value="dept:${d}">${d}</option>`).join('')}
      </select>
    </div>
    <div id="pdv-gantt-chart" class="card"><div class="card-body" style="overflow-x:auto"></div></div>
  </div>
</div>`;
}

let _pdvGanttMode = 'colaborador';
let _pdvRecords = [];

async function showPDVTab(tab) {
  document.getElementById('pdv-lista').style.display = tab === 'lista' ? '' : 'none';
  document.getElementById('pdv-gantt').style.display = tab === 'gantt' ? '' : 'none';
  const tabLista = document.getElementById('pdv-tab-lista');
  const tabGantt = document.getElementById('pdv-tab-gantt');
  const activeStyle = 'padding:8px 18px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-2px';
  const inactiveStyle = 'padding:8px 18px;border:none;background:none;cursor:pointer;font-size:13px;color:var(--text-2)';
  if (tabLista) tabLista.style.cssText = tab === 'lista' ? activeStyle : inactiveStyle;
  if (tabGantt) tabGantt.style.cssText = tab === 'gantt' ? activeStyle : inactiveStyle;
  if (tab === 'gantt') {
    _pdvRecords = (await api.get('/records', { area: 'dev_talentos', module: 'pdv' }) || []);
    renderPDVGantt();
  }
}

function setPDVGanttView(mode) {
  _pdvGanttMode = mode;
  const btnC = document.getElementById('pdv-gantt-colab');
  const btnA = document.getElementById('pdv-gantt-area');
  if (btnC) { btnC.style.background = mode === 'colaborador' ? 'var(--primary)' : 'var(--surface)'; btnC.style.color = mode === 'colaborador' ? '#fff' : 'var(--text-2)'; }
  if (btnA) { btnA.style.background = mode === 'area' ? 'var(--primary)' : 'var(--surface)'; btnA.style.color = mode === 'area' ? '#fff' : 'var(--text-2)'; }
  renderPDVGantt();
}

function renderPDVGantt() {
  const container = document.querySelector('#pdv-gantt-chart .card-body');
  if (!container) return;

  const empMap = {};
  _pdvEmployees.forEach(e => empMap[e.id] = e);

  const filterVal = document.getElementById('pdv-gantt-filter')?.value || '';
  let records = _pdvRecords.filter(r => r.start_date && r.due_date);

  if (filterVal.startsWith('emp:')) {
    records = records.filter(r => r.employee_id === filterVal.slice(4));
  } else if (filterVal.startsWith('dept:')) {
    const dept = filterVal.slice(5);
    records = records.filter(r => empMap[r.employee_id]?.department === dept);
  }

  if (records.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-chart-gantt"></i><h3>Sem dados</h3><p>Cadastre PDIs com período definido para visualizar o Gantt.</p></div>';
    return;
  }

  // Calcular range total de datas
  const allDates = records.flatMap(r => [new Date(r.start_date), new Date(r.due_date)]);
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const totalDays = Math.max(1, (maxDate - minDate) / 86400000);

  // Agrupar
  let groups = {};
  records.forEach(r => {
    const emp = empMap[r.employee_id];
    const key = _pdvGanttMode === 'area' ? (emp?.department || 'Sem área') : (emp?.name || 'Sem colaborador');
    groups[key] = groups[key] || [];
    groups[key].push(r);
  });

  const COLORS = ['#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899'];
  let colorIdx = 0;

  const today = new Date();
  const todayPct = Math.max(0, Math.min(100, ((today - minDate) / 86400000 / totalDays) * 100));

  // Gerar header de meses
  const months = [];
  const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (cur <= maxDate) {
    const pct = ((cur - minDate) / 86400000 / totalDays) * 100;
    months.push({ label: cur.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), pct });
    cur.setMonth(cur.getMonth() + 1);
  }

  const rows = Object.entries(groups).map(([groupName, items]) => {
    const color = COLORS[colorIdx++ % COLORS.length];
    const itemRows = items.map(r => {
      const start = new Date(r.start_date);
      const end = new Date(r.due_date);
      const leftPct = ((start - minDate) / 86400000 / totalDays) * 100;
      const widthPct = Math.max(1, ((end - start) / 86400000 / totalDays) * 100);
      const pct = r.progress || 0;
      const statusColor = r.status === 'completed' ? '#22c55e' : r.status === 'in_progress' ? '#3b82f6' : '#f59e0b';
      return `
        <div style="display:flex;align-items:center;gap:0;height:36px;border-bottom:1px solid var(--border)">
          <div style="width:220px;flex-shrink:0;font-size:12px;color:var(--text-2);padding:0 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${r.title}">${r.title}</div>
          <div style="flex:1;position:relative;height:100%;padding:6px 0">
            <!-- Linha de fundo -->
            <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:var(--border);transform:translateY(-50%)"></div>
            <!-- Barra do PDI -->
            <div style="position:absolute;left:${leftPct}%;width:${widthPct}%;top:50%;transform:translateY(-50%);height:18px;background:${color}30;border:1.5px solid ${color};border-radius:4px;overflow:hidden" title="${r.title} — ${pct}%">
              <div style="height:100%;width:${pct}%;background:${color};opacity:.7"></div>
            </div>
            <!-- Linha de hoje -->
            <div style="position:absolute;left:${todayPct}%;top:0;bottom:0;width:2px;background:#ef444466"></div>
          </div>
          <div style="width:50px;flex-shrink:0;font-size:11px;text-align:center;color:${statusColor};font-weight:600">${pct}%</div>
        </div>`;
    }).join('');

    return `
      <div style="border-bottom:2px solid ${color}33">
        <div style="display:flex;align-items:center;height:32px;background:${color}12;border-bottom:1px solid ${color}33">
          <div style="width:220px;flex-shrink:0;font-size:12.5px;font-weight:700;color:${color};padding:0 12px">${groupName}</div>
          <div style="flex:1"></div>
          <div style="width:50px;flex-shrink:0;font-size:11px;color:var(--text-3);text-align:center">%</div>
        </div>
        ${itemRows}
      </div>`;
  }).join('');

  const monthHeader = `
    <div style="display:flex;height:28px;border-bottom:2px solid var(--border)">
      <div style="width:220px;flex-shrink:0;font-size:12px;font-weight:600;color:var(--text-2);padding:0 12px;line-height:28px">PDI / Período</div>
      <div style="flex:1;position:relative">
        ${months.map(m => `<div style="position:absolute;left:${m.pct}%;font-size:11px;color:var(--text-3);padding-top:6px;white-space:nowrap">${m.label}</div>`).join('')}
      </div>
      <div style="width:50px;flex-shrink:0;font-size:11px;color:var(--text-3);text-align:center;line-height:28px">Avanço</div>
    </div>`;

  container.innerHTML = `
    <div style="min-width:700px">
      ${monthHeader}
      ${rows}
      <div style="font-size:11px;color:var(--text-3);margin-top:8px;display:flex;align-items:center;gap:6px">
        <div style="width:12px;height:2px;background:#ef4444;opacity:.4"></div> Hoje
      </div>
    </div>`;
}

function openNewPDV() {
  const empOpts = _pdvEmployees.map(e => `<option value="${e.id}">${e.name} — ${e.department || ''}${e.position ? ' · ' + e.position : ''}</option>`).join('');
  openModal('Novo Plano de Desenvolvimento', `
    <div class="form-group"><label>Título do PDI *</label><input type="text" id="pdv-title" placeholder="Ex: Formação para Analista Pleno"></div>
    <div class="form-group"><label>Colaborador *</label>
      <select id="pdv-emp"><option value="">Selecione o colaborador...</option>${empOpts}</select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Data de início *</label><input type="date" id="pdv-start"></div>
      <div class="form-group"><label>Data de término *</label><input type="date" id="pdv-end"></div>
    </div>
    <div class="form-group"><label>Objetivos</label><textarea id="pdv-goals" placeholder="Descreva os objetivos do plano..."></textarea></div>
    <div class="form-group"><label>Ações planejadas</label><textarea id="pdv-actions" placeholder="Liste as ações e atividades previstas..."></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Progresso (0–100%)</label>
        <input type="range" id="pdv-progress" min="0" max="100" value="0" oninput="document.getElementById('pdv-pct-label').textContent=this.value+'%'" style="width:100%">
        <div id="pdv-pct-label" style="font-size:13px;color:var(--primary);font-weight:600;text-align:center;margin-top:4px">0%</div>
      </div>
      <div class="form-group"><label>Status</label>
        <select id="pdv-status">
          <option value="pending">Pendente</option>
          <option value="in_progress">Em andamento</option>
          <option value="completed">Concluído</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveNewPDV()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `);
}

async function saveNewPDV() {
  const title = document.getElementById('pdv-title')?.value?.trim();
  const emp = document.getElementById('pdv-emp')?.value;
  const start = document.getElementById('pdv-start')?.value;
  const end = document.getElementById('pdv-end')?.value;
  if (!title) { showToast('Título obrigatório', 'error'); return; }
  if (!emp) { showToast('Selecione o colaborador', 'error'); return; }
  if (!start || !end) { showToast('Defina o período', 'error'); return; }
  if (end < start) { showToast('Data de término deve ser após o início', 'error'); return; }
  const body = {
    area: 'dev_talentos', module: 'pdv',
    title,
    employee_id: emp,
    start_date: start,
    due_date: end,
    progress: parseInt(document.getElementById('pdv-progress')?.value || '0'),
    status: document.getElementById('pdv-status')?.value || 'pending',
    content: JSON.stringify({
      goals: document.getElementById('pdv-goals')?.value || '',
      actions: document.getElementById('pdv-actions')?.value || '',
    }),
  };
  const res = await api.post('/records', body);
  if (res?.id) { closeModal(); showToast('PDI criado!'); navigate('dev-pdv'); }
  else showToast('Erro ao salvar', 'error');
}

async function openEditPDV(id) {
  const all = await api.get('/records', { area: 'dev_talentos', module: 'pdv' }) || [];
  const r = all.find(x => x.id === id);
  if (!r) return;
  let content = {};
  try { content = JSON.parse(r.content || '{}'); } catch {}
  const empOpts = _pdvEmployees.map(e => `<option value="${e.id}" ${e.id === r.employee_id ? 'selected' : ''}>${e.name} — ${e.department || ''}</option>`).join('');
  openModal('Editar PDI', `
    <div class="form-group"><label>Título *</label><input type="text" id="pdv-title" value="${r.title || ''}"></div>
    <div class="form-group"><label>Colaborador</label>
      <select id="pdv-emp"><option value="">Selecione...</option>${empOpts}</select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Início</label><input type="date" id="pdv-start" value="${r.start_date || ''}"></div>
      <div class="form-group"><label>Término</label><input type="date" id="pdv-end" value="${r.due_date || ''}"></div>
    </div>
    <div class="form-group"><label>Objetivos</label><textarea id="pdv-goals">${content.goals || ''}</textarea></div>
    <div class="form-group"><label>Ações planejadas</label><textarea id="pdv-actions">${content.actions || ''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Progresso (0–100%)</label>
        <input type="range" id="pdv-progress" min="0" max="100" value="${r.progress || 0}" oninput="document.getElementById('pdv-pct-label').textContent=this.value+'%'" style="width:100%">
        <div id="pdv-pct-label" style="font-size:13px;color:var(--primary);font-weight:600;text-align:center;margin-top:4px">${r.progress || 0}%</div>
      </div>
      <div class="form-group"><label>Status</label>
        <select id="pdv-status">
          <option value="pending" ${r.status==='pending'?'selected':''}>Pendente</option>
          <option value="in_progress" ${r.status==='in_progress'?'selected':''}>Em andamento</option>
          <option value="completed" ${r.status==='completed'?'selected':''}>Concluído</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveEditPDV('${id}')"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `);
}

async function saveEditPDV(id) {
  const body = {
    title: document.getElementById('pdv-title')?.value?.trim(),
    employee_id: document.getElementById('pdv-emp')?.value,
    start_date: document.getElementById('pdv-start')?.value,
    due_date: document.getElementById('pdv-end')?.value,
    progress: parseInt(document.getElementById('pdv-progress')?.value || '0'),
    status: document.getElementById('pdv-status')?.value,
    content: JSON.stringify({
      goals: document.getElementById('pdv-goals')?.value || '',
      actions: document.getElementById('pdv-actions')?.value || '',
    }),
  };
  const res = await api.put('/records/' + id, body);
  if (res?.success) { closeModal(); showToast('PDI atualizado!'); navigate('dev-pdv'); }
  else showToast('Erro ao salvar', 'error');
}

async function deletePDV(id) {
  if (!confirm('Excluir este PDI?')) return;
  const res = await api.delete('/records/' + id);
  if (res?.success) { showToast('PDI excluído'); navigate('dev-pdv'); }
  else showToast('Erro ao excluir', 'error');
}

// ── DOCUMENTOS ────────────────────────────────────────────────────────────────
const DOC_CATS = ['Apresentação', 'Política', 'Procedimento', 'Formulário', 'Contrato', 'Treinamento', 'Geral'];
const DOC_ICONS = { pdf: 'fa-file-pdf', ppt: 'fa-file-powerpoint', pptx: 'fa-file-powerpoint', doc: 'fa-file-word', docx: 'fa-file-word', xls: 'fa-file-excel', xlsx: 'fa-file-excel', png: 'fa-file-image', jpg: 'fa-file-image', jpeg: 'fa-file-image' };
const DOC_COLORS = { pdf: '#ef4444', ppt: '#f97316', pptx: '#f97316', doc: '#3b82f6', docx: '#3b82f6', xls: '#22c55e', xlsx: '#22c55e', png: '#8b5cf6', jpg: '#8b5cf6', jpeg: '#8b5cf6' };

function docExt(filename) { return (filename || '').split('.').pop().toLowerCase(); }
function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}

async function renderDocumentos() {
  const docs = await api.get('/documents') || [];
  const groups = {};
  docs.forEach(d => { groups[d.category] = groups[d.category] || []; groups[d.category].push(d); });

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-folder-open"></i>Documentos</div>
  <div class="page-actions">
    ${userCan("edit") ? `<button class="btn-primary" onclick="openUploadDoc()"><i class="fa-solid fa-arrow-up-from-bracket"></i> Enviar Documento</button>` : ""}
  </div>
</div>
<div class="page-body">
  ${docs.length === 0 ? '<div class="empty-state"><i class="fa-solid fa-folder-open"></i><h3>Nenhum documento</h3><p>Envie o primeiro documento.</p></div>' :
    Object.entries(groups).map(([cat, items]) => `
    <div style="margin-bottom:28px">
      <div style="font-size:14px;font-weight:600;color:var(--primary);margin-bottom:12px;display:flex;align-items:center;gap:8px">
        <i class="fa-solid fa-folder" style="color:var(--accent)"></i>${cat} <span style="font-weight:400;color:var(--text-3);font-size:12px">(${items.length})</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
        ${items.map(d => {
          const ext = docExt(d.filename);
          const icon = DOC_ICONS[ext] || 'fa-file';
          const color = DOC_COLORS[ext] || '#6b7280';
          return `
          <div class="card" style="padding:16px;display:flex;align-items:flex-start;gap:14px;position:relative">
            <div style="width:42px;height:42px;border-radius:8px;background:${color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <i class="fa-solid ${icon}" style="color:${color};font-size:18px"></i>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13.5px;font-weight:600;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.title}</div>
              ${d.description ? `<div style="font-size:12px;color:var(--text-2);margin-bottom:4px">${d.description}</div>` : ''}
              <div style="font-size:11px;color:var(--text-3)">${fmtDate(d.created_at)} · ${fmtSize(d.size)}</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button onclick="downloadDoc('${d.id}','${d.original_name}')" title="Baixar" style="background:var(--primary-light);border:none;border-radius:6px;padding:6px 10px;cursor:pointer;color:var(--primary);font-size:13px"><i class="fa-solid fa-download"></i></button>
              ${userCan("admin") ? `<button onclick="deleteDoc('${d.id}')" title="Excluir" style="background:#fef2f2;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;color:#ef4444;font-size:13px"><i class="fa-solid fa-trash"></i></button>` : ""}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('')}
</div>`;
}

function openUploadDoc() {
  openModal('Enviar Documento', `
    <div class="form-group"><label>Título *</label><input type="text" id="ud-title" placeholder="Ex: Política de Férias"></div>
    <div class="form-row">
      <div class="form-group"><label>Categoria</label>
        <select id="ud-cat">
          ${DOC_CATS.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group"><label>Descrição</label><textarea id="ud-desc" placeholder="Descrição opcional..."></textarea></div>
    <div class="form-group"><label>Arquivo * <span style="font-size:11px;color:var(--text-3)">(PDF, PPT, DOC, XLS, imagens)</span></label>
      <input type="file" id="ud-file" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" style="padding:8px;border:1.5px solid var(--border);border-radius:var(--radius);width:100%;font-size:13px">
    </div>
    <div id="ud-progress" style="display:none;margin-top:8px">
      <div style="background:var(--border);border-radius:4px;height:6px">
        <div id="ud-bar" style="background:var(--primary);height:6px;border-radius:4px;width:0%;transition:width .3s"></div>
      </div>
      <div id="ud-status" style="font-size:12px;color:var(--text-3);margin-top:4px">Enviando...</div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" id="ud-btn" onclick="saveUploadDoc()"><i class="fa-solid fa-arrow-up-from-bracket"></i> Enviar</button>
    </div>
  `);
}

async function saveUploadDoc() {
  const title = document.getElementById('ud-title')?.value?.trim();
  const file = document.getElementById('ud-file')?.files[0];
  if (!title) { showToast('Título obrigatório', 'error'); return; }
  if (!file) { showToast('Selecione um arquivo', 'error'); return; }
  document.getElementById('ud-btn').disabled = true;
  document.getElementById('ud-progress').style.display = 'block';
  document.getElementById('ud-bar').style.width = '40%';
  const fd = new FormData();
  fd.append('file', file);
  fd.append('title', title);
  fd.append('description', document.getElementById('ud-desc')?.value || '');
  fd.append('category', document.getElementById('ud-cat')?.value || 'Geral');
  try {
    const res = await fetch('/api/documents', { method: 'POST', body: fd, credentials: 'include' });
    document.getElementById('ud-bar').style.width = '100%';
    const data = await res.json();
    if (data.success) { closeModal(); showToast('Documento enviado!'); navigate('comm-documentos'); }
    else showToast(data.error || 'Erro ao enviar', 'error');
  } catch { showToast('Erro ao enviar', 'error'); }
}

async function downloadDoc(id, name) {
  const a = document.createElement('a');
  a.href = `/api/documents/${id}/download`;
  a.download = name || 'documento';
  a.click();
}

async function deleteDoc(id) {
  if (!confirm('Excluir este documento?')) return;
  const res = await api.delete('/documents/' + id);
  if (res?.success) { showToast('Documento excluído'); navigate('comm-documentos'); }
  else showToast('Erro ao excluir', 'error');
}

async function renderBiblioteca() {
  const items = await api.get('/knowledge') || [];

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-book-bookmark"></i>Biblioteca do Conhecimento</div>
  <div class="page-actions">
    <button class="btn-primary" onclick="openNewKnowledge()"><i class="fa-solid fa-plus"></i> Novo Artigo</button>
  </div>
</div>
<div class="page-body">
  <div class="search-bar">
    <div class="search-input">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input type="text" placeholder="Buscar na biblioteca..." id="kb-search" oninput="searchKB(this.value)">
    </div>
  </div>
  <div class="content-grid" id="kb-grid">
    ${items.length === 0 ? '<div class="empty-state"><i class="fa-solid fa-book-bookmark"></i><h3>Biblioteca vazia</h3><p>Contribua com seu conhecimento!</p></div>' :
    items.map(k => `
      <div class="content-card" onclick="openKnowledgeItem('${k.id}')">
        <div class="content-card-cat">${k.category || 'Geral'}</div>
        <div class="content-card-title">${k.title}</div>
        <div class="content-card-preview">${k.content || ''}</div>
        <div class="content-card-meta">
          <span><i class="fa-solid fa-eye" style="margin-right:4px"></i>${k.views || 0} visualizações</span>
          <span>${k.author || 'Sistema'}</span>
          <span>${relativeTime(k.created_at)}</span>
        </div>
      </div>`).join('')}
  </div>
</div>`;
}

function openNewKnowledge() {
  openModal('Novo Artigo', `
    <div class="form-group"><label>Título *</label><input type="text" id="nk-title" placeholder="Título do artigo"></div>
    <div class="form-row">
      <div class="form-group"><label>Categoria</label><select id="nk-cat">
        <option>Processos</option><option>Políticas</option><option>Tutoriais</option><option>Onboarding</option><option>Cultura</option><option>Técnico</option>
      </select></div>
      <div class="form-group"><label>Tags</label><input type="text" id="nk-tags" placeholder="rh, processos, onboarding"></div>
    </div>
    <div class="form-group"><label>Conteúdo</label><textarea id="nk-content" style="min-height:200px" placeholder="Escreva o conteúdo do artigo..."></textarea></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveKnowledge()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `);
}

async function saveKnowledge() {
  const title = document.getElementById('nk-title')?.value;
  if (!title) { showToast('Título obrigatório', 'error'); return; }
  const body = {
    title, category: document.getElementById('nk-cat')?.value,
    tags: document.getElementById('nk-tags')?.value,
    content: document.getElementById('nk-content')?.value,
  };
  const res = await api.post('/knowledge', body);
  if (res) { closeModal(); showToast('Artigo criado!'); navigate('comm-biblioteca'); }
}

function openKnowledgeItem(id) {
  showToast('Artigo aberto', 'info');
}

async function searchKB(q) {
  const items = await api.get('/knowledge', q ? { search: q } : {}) || [];
  const grid = document.getElementById('kb-grid');
  if (!grid) return;
  grid.innerHTML = items.map(k => `
    <div class="content-card">
      <div class="content-card-cat">${k.category || 'Geral'}</div>
      <div class="content-card-title">${k.title}</div>
      <div class="content-card-preview">${k.content || ''}</div>
      <div class="content-card-meta">
        <span><i class="fa-solid fa-eye" style="margin-right:4px"></i>${k.views || 0}</span>
        <span>${k.author || 'Sistema'}</span>
      </div>
    </div>`).join('') || '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><h3>Nenhum resultado</h3></div>';
}

// ─── ORGANOGRAMA ──────────────────────────────────────────────────────────────
const CARGO_ORDER = [
  'Gerente', 'Supervisor',
  'Analista Sênior II', 'Analista Sênior I',
  'Analista Pleno II', 'Analista Pleno I',
  'Analista Júnior II', 'Analista Júnior I',
  'Assistente', 'Auxiliar', 'Estagiário'
];

function cargoRank(position) {
  const p = (position || '').toLowerCase().trim();
  const idx = CARGO_ORDER.findIndex(c => {
    const co = c.toLowerCase();
    return p === co || p === co + 'a' || co === p + 'a';
  });
  return idx === -1 ? 999 : idx;
}

function buildOrgDepts(employees, sortMode) {
  const byDept = {};
  employees.filter(e => e.status === 'active').forEach(e => {
    const d = e.department || 'Geral';
    byDept[d] = byDept[d] || [];
    byDept[d].push(e);
  });

  return Object.entries(byDept).sort(([a],[b]) => a.localeCompare(b)).map(([dept, emps]) => {
    const sorted = sortMode === 'cargo'
      ? [...emps].sort((a, b) => cargoRank(a.position) - cargoRank(b.position) || a.name.localeCompare(b.name))
      : [...emps].sort((a, b) => a.name.localeCompare(b.name));

    return `
    <div style="min-width:220px;text-align:center">
      <div style="background:var(--accent-light);color:var(--accent);padding:8px 16px;border-radius:var(--radius);font-weight:600;font-size:13px;margin-bottom:16px;border:2px solid var(--accent)">${dept} <span style="font-weight:400;font-size:11px">(${sorted.length})</span></div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:center">
        ${sorted.map(e => `
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;display:flex;align-items:center;gap:10px;width:100%;text-align:left">
            ${avatarHtml(e.name, 32)}
            <div>
              <div style="font-size:12.5px;font-weight:600">${e.name}</div>
              <div style="font-size:11px;color:var(--text-3)">${e.position || '—'}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

let _orgEmployees = [];
async function renderOrganograma() {
  _orgEmployees = await api.get('/employees') || [];
  const deptCards = buildOrgDepts(_orgEmployees, 'alfa');

  const html = `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-sitemap"></i>Organograma</div>
  <div class="page-actions">
    <div style="display:flex;border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden">
      <button id="btn-org-alfa" onclick="setOrgSort('alfa')" style="padding:7px 14px;border:none;background:var(--primary);color:#fff;cursor:pointer;font-size:13px;font-family:var(--font)"><i class="fa-solid fa-arrow-down-a-z"></i> Alfabética</button>
      <button id="btn-org-cargo" onclick="setOrgSort('cargo')" style="padding:7px 14px;border:none;background:var(--surface);color:var(--text-2);cursor:pointer;font-size:13px;font-family:var(--font)"><i class="fa-solid fa-layer-group"></i> Por Cargo</button>
    </div>
  </div>
</div>
<div class="page-body">
  <div class="card">
    <div class="card-body">
      <div style="overflow-x:auto;padding:8px 0">
        <div id="org-grid" style="display:flex;gap:24px;min-width:max-content">
          ${deptCards || '<div class="empty-state"><i class="fa-solid fa-sitemap"></i><h3>Nenhum dado</h3><p>Cadastre colaboradores para ver o organograma.</p></div>'}
        </div>
      </div>
    </div>
  </div>
</div>`;

  return html;
}

function setOrgSort(mode) {
  const grid = document.getElementById('org-grid');
  const btnAlfa = document.getElementById('btn-org-alfa');
  const btnCargo = document.getElementById('btn-org-cargo');
  if (!grid) return;
  grid.innerHTML = buildOrgDepts(_orgEmployees, mode) || '<div class="empty-state"><i class="fa-solid fa-sitemap"></i><h3>Nenhum dado</h3><p>Cadastre colaboradores para ver o organograma.</p></div>';
  if (mode === 'cargo') {
    btnCargo.style.background = 'var(--primary)'; btnCargo.style.color = '#fff';
    btnAlfa.style.background = 'var(--surface)'; btnAlfa.style.color = 'var(--text-2)';
  } else {
    btnAlfa.style.background = 'var(--primary)'; btnAlfa.style.color = '#fff';
    btnCargo.style.background = 'var(--surface)'; btnCargo.style.color = 'var(--text-2)';
  }
}

// ─── ANIVERSÁRIOS ─────────────────────────────────────────────────────────────
async function renderAniversarios() {
  const employees = await api.get('/employees') || [];
  const today = new Date();
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const byMonth = {};
  employees.forEach(e => {
    if (!e.birth_date) return;
    const m = parseInt(e.birth_date.split('-')[1]) - 1;
    byMonth[m] = byMonth[m] || [];
    byMonth[m].push(e);
  });

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-cake-candles"></i>Aniversários e Comemorações</div>
</div>
<div class="page-body">
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
    ${months.map((month, i) => {
      const emps = byMonth[i] || [];
      const isCurrent = i === today.getMonth();
      return `
        <div class="card ${isCurrent ? 'border-accent' : ''}" style="${isCurrent ? 'border:2px solid var(--accent)' : ''}">
          <div class="card-header" style="${isCurrent ? 'background:var(--accent-light)' : ''}">
            <span>${isCurrent ? '🎉 ' : ''}${month}</span>
            <span style="margin-left:auto;font-size:12px;color:var(--text-3)">${emps.length} aniversariante${emps.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="card-body" style="padding:14px">
            ${emps.length === 0 ? '<p style="font-size:13px;color:var(--text-3);text-align:center">Nenhum aniversariante</p>' :
            emps.map(e => {
              const day = e.birth_date.split('-')[2];
              return `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
                  ${avatarHtml(e.name, 34)}
                  <div style="flex:1">
                    <div style="font-size:13px;font-weight:500">${e.name}</div>
                    <div style="font-size:11.5px;color:var(--text-3)">${e.department || ''}</div>
                  </div>
                  <div style="font-size:18px;font-weight:600;color:var(--accent)">${day}</div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('')}
  </div>
</div>`;
}

// ─── AVALIAÇÃO DE DESEMPENHO ──────────────────────────────────────────────────
async function renderAvaliacao() {
  const [reviews, employees] = await Promise.all([
    api.get('/performance') || [],
    api.get('/employees') || []
  ]);
  const r = reviews || [], emps = employees || [];

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-star-half-stroke"></i>Avaliação de Desempenho</div>
  <div class="page-actions">
    <button class="btn-primary" onclick="openNewReview(${JSON.stringify(emps).replace(/"/g,'&quot;')})"><i class="fa-solid fa-plus"></i> Nova Avaliação</button>
  </div>
</div>
<div class="page-body">
  <div class="card">
    <div class="card-body">
      ${r.length === 0 ? '<div class="empty-state"><i class="fa-solid fa-star-half-stroke"></i><h3>Nenhuma avaliação</h3><p>Inicie o ciclo de avaliações.</p></div>' :
      `<div class="table-wrap"><table>
        <thead><tr><th>Colaborador</th><th>Período</th><th>Nota geral</th><th>Status</th><th>Data</th></tr></thead>
        <tbody>${r.map(rev => {
          const score = rev.overall_score;
          const scoreColor = score >= 4 ? 'var(--success)' : score >= 3 ? 'var(--warning)' : 'var(--danger)';
          return `
          <tr>
            <td><strong>${rev.employee_name || '—'}</strong></td>
            <td>${rev.period || '—'}</td>
            <td><span style="font-size:15px;font-weight:700;color:${scoreColor}">${score ? score.toFixed(1) : '—'}</span><span style="color:var(--text-3);font-size:12px">/5.0</span></td>
            <td>${statusBadge(rev.status)}</td>
            <td>${fmtDate(rev.created_at)}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table></div>`}
    </div>
  </div>
</div>`;
}

function openNewReview(emps) {
  const opts = emps.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  const criteria = ['Entregas / Resultados', 'Qualidade do trabalho', 'Colaboração', 'Iniciativa', 'Comunicação'];

  openModal('Nova Avaliação de Desempenho', `
    <div class="form-row">
      <div class="form-group"><label>Colaborador *</label><select id="rev-emp"><option value="">Selecione...</option>${opts}</select></div>
      <div class="form-group"><label>Período</label><input type="text" id="rev-period" placeholder="Ex: Q2 2026 / 2026"></div>
    </div>
    <hr class="divider">
    <p style="font-size:13px;font-weight:500;color:var(--primary);margin-bottom:14px">Critérios de Avaliação (1 a 5)</p>
    ${criteria.map((c, i) => `
      <div class="form-group">
        <label>${c}</label>
        <div style="display:flex;align-items:center;gap:12px">
          <input type="range" id="crit-${i}" min="1" max="5" value="3" step="1" style="flex:1" oninput="document.getElementById('cv-${i}').textContent=this.value">
          <span id="cv-${i}" style="min-width:20px;font-weight:600;color:var(--accent)">3</span>
        </div>
      </div>`).join('')}
    <div class="form-group"><label>Comentários</label><textarea id="rev-comments" placeholder="Feedback qualitativo..."></textarea></div>
    <div class="form-group"><label>Status</label><select id="rev-status">
      <option value="draft">Rascunho</option><option value="completed">Concluída</option><option value="approved">Aprovada</option>
    </select></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveReview(${criteria.length})"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `, 'lg');
}

async function saveReview(n) {
  const emp = document.getElementById('rev-emp')?.value;
  if (!emp) { showToast('Selecione o colaborador', 'error'); return; }
  const scores = {};
  let total = 0;
  for (let i = 0; i < n; i++) {
    const v = parseInt(document.getElementById('crit-' + i)?.value || 3);
    scores['crit_' + i] = v;
    total += v;
  }
  const overall = total / n;
  const body = {
    employee_id: emp,
    period: document.getElementById('rev-period')?.value,
    scores, overall_score: overall,
    comments: document.getElementById('rev-comments')?.value,
    status: document.getElementById('rev-status')?.value,
  };
  const res = await api.post('/performance', body);
  if (res) { closeModal(); showToast('Avaliação salva!'); navigate('dev-avaliacao'); }
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
async function renderSettings() {
  const users = await api.get('/users') || [];
  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-gear"></i>Configurações</div>
</div>
<div class="page-body">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
    <div class="card">
      <div class="card-header"><i class="fa-solid fa-users-cog" style="color:var(--accent)"></i>Gerenciador de Usuários</div>
      <div class="card-body">
        <div style="background:var(--bg);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;color:var(--text-3)">
          <i class="fa-solid fa-circle-info" style="color:var(--accent);margin-right:6px"></i>
          Novos usuários devem ter e-mail <strong>@valore.com.br</strong>
        </div>
        <button class="btn-primary" style="margin-bottom:16px;width:100%" onclick="openNewUser()"><i class="fa-solid fa-user-plus"></i> Novo Usuário</button>
        <div style="max-height:360px;overflow-y:auto">
          ${users.map(u => `
            <div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--border)">
              ${avatarHtml(u.name, 34)}
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.name}</div>
                <div style="font-size:11.5px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.email}</div>
              </div>
              <span class="badge ${u.role === 'admin' ? 'badge-purple' : 'badge-neutral'}" style="flex-shrink:0">${u.role}</span>
              ${statusBadge(u.active ? 'active' : 'inactive')}
              <button onclick="openResetPassword('${u.id}', '${u.name}')" title="Resetar senha" style="background:none;border:none;cursor:pointer;color:var(--accent);font-size:13px;padding:4px 5px;border-radius:6px;flex-shrink:0" onmouseover="this.style.background='var(--accent-light)'" onmouseout="this.style.background='none'"><i class="fa-solid fa-key"></i></button>
              ${u.active ? `<button onclick="toggleUserActive('${u.id}', false)" title="Desativar" style="background:none;border:none;cursor:pointer;color:#e53e3e;font-size:13px;padding:4px 5px;border-radius:6px;flex-shrink:0" onmouseover="this.style.background='rgba(229,62,62,0.1)'" onmouseout="this.style.background='none'"><i class="fa-solid fa-user-slash"></i></button>` : `<button onclick="toggleUserActive('${u.id}', true)" title="Reativar" style="background:none;border:none;cursor:pointer;color:#38a169;font-size:13px;padding:4px 5px;border-radius:6px;flex-shrink:0" onmouseover="this.style.background='rgba(56,161,105,0.1)'" onmouseout="this.style.background='none'"><i class="fa-solid fa-user-check"></i></button>`}
            </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><i class="fa-solid fa-shield-halved" style="color:var(--accent)"></i>Log de auditoria</div>
      <div class="card-body" id="audit-body" style="max-height:420px;overflow-y:auto">
        <p style="color:var(--text-3);font-size:13px">Carregando...</p>
      </div>
    </div>
  </div>
</div>`;
}

async function loadAuditLog() {
  const logs = await api.get('/audit') || [];
  const el = document.getElementById('audit-body');
  if (!el) return;
  el.innerHTML = logs.map(l => `
    <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:12.5px">
      <div style="flex:1">
        <span style="font-weight:500;color:var(--accent)">${l.action}</span>
        <span style="color:var(--text-2)"> ${l.resource}</span>
        ${l.details ? `<span style="color:var(--text-3)"> — ${l.details}</span>` : ''}
        <div style="font-size:11px;color:var(--text-3)">${l.user_name || 'Sistema'} · ${fmtDateTime(l.created_at)}</div>
      </div>
    </div>`).join('') || '<p style="color:var(--text-3)">Nenhum log</p>';
}


async function toggleUserActive(userId, activate) {
  if (!confirm('Tem certeza que deseja ' + (activate ? 'reativar' : 'desativar') + ' este usuário?')) return;
  const res = await api.put('/users/' + userId + '/toggle', { active: activate ? 1 : 0 });
  if (res) { showToast('Usuário ' + (activate ? 'reativado' : 'desativado') + '!'); navigate('settings'); }
}

function openResetPassword(userId, userName) {
  openModal('Resetar Senha — ' + userName, `
    <div class="form-group">
      <label>Nova senha *</label>
      <input type="password" id="rp-pass" placeholder="Mínimo 6 caracteres">
    </div>
    <div class="form-group">
      <label>Confirmar nova senha *</label>
      <input type="password" id="rp-pass2" placeholder="Repita a senha">
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveResetPassword('${userId}')"><i class="fa-solid fa-key"></i> Salvar Nova Senha</button>
    </div>
  `, 'sm');
}

async function saveResetPassword(userId) {
  const pass = document.getElementById('rp-pass')?.value;
  const pass2 = document.getElementById('rp-pass2')?.value;
  if (!pass || pass.length < 6) { showToast('A senha deve ter pelo menos 6 caracteres', 'error'); return; }
  if (pass !== pass2) { showToast('As senhas não coincidem', 'error'); return; }
  const res = await api.put('/users/' + userId + '/password', { password: pass });
  if (res) { closeModal(); showToast('Senha alterada com sucesso!'); }
}

function openNewUser() {
  openModal('Novo Usuário', `
    <div class="form-group">
      <label>Nome completo *</label>
      <input type="text" id="nu-name" placeholder="Ex: Maria Silva">
    </div>
    <div class="form-group">
      <label>E-mail *</label>
      <div style="display:flex;align-items:center">
        <input type="text" id="nu-email-prefix" placeholder="nome.sobrenome" style="border-radius:8px 0 0 8px;border-right:none;flex:1">
        <span style="background:var(--bg);border:1px solid var(--border);border-left:none;padding:0 12px;height:40px;display:flex;align-items:center;font-size:13px;color:var(--text-3);border-radius:0 8px 8px 0;white-space:nowrap">@valore.com.br</span>
      </div>
      <div style="font-size:11.5px;color:var(--text-3);margin-top:4px"><i class="fa-solid fa-circle-info" style="margin-right:4px"></i>Digite apenas a parte antes do @</div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Senha *</label>
        <input type="password" id="nu-pass" placeholder="Mínimo 6 caracteres">
      </div>
      <div class="form-group">
        <label>Perfil de Acesso</label>
        <select id="nu-role">
          <option value="colaborador">Colaborador — só visualização</option>
          <option value="lideranca">Liderança — visualização + Talentos</option>
          <option value="rh">RH / Gestor — edição completa</option>
          <option value="admin">Administrador — acesso total</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Departamento</label>
      <select id="nu-dept">
        <option value="">Selecione...</option>
        <option value="Contábil">Contábil</option>
        <option value="Fiscal">Fiscal</option>
        <option value="Departamento Pessoal">Departamento Pessoal</option>
        <option value="Sucesso do Cliente">Sucesso do Cliente</option>
        <option value="Administrativo">Administrativo</option>
        <option value="Paralegal">Paralegal</option>
        <option value="Diretoria">Diretoria</option>
        <option value="Marketing">Marketing</option>
        <option value="Tecnologia">Tecnologia</option>
        <option value="BPO Financeiro">BPO Financeiro</option>
        <option value="Financeiro">Financeiro</option>
      </select>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveNewUser()"><i class="fa-solid fa-floppy-disk"></i> Criar Usuário</button>
    </div>
  `, 'sm');
}

async function saveNewUser() {
  const name = document.getElementById('nu-name')?.value?.trim();
  const emailPrefix = document.getElementById('nu-email-prefix')?.value?.trim().toLowerCase();
  const pass = document.getElementById('nu-pass')?.value;
  if (!name) { showToast('Informe o nome do usuário', 'error'); return; }
  if (!emailPrefix) { showToast('Informe o e-mail', 'error'); return; }
  if (emailPrefix.includes('@')) { showToast('Digite apenas a parte antes do @valore.com.br', 'error'); return; }
  if (!/^[a-zA-Z0-9._-]+$/.test(emailPrefix)) { showToast('E-mail inválido: use apenas letras, números, ponto ou hífen', 'error'); return; }
  if (!pass || pass.length < 6) { showToast('A senha deve ter pelo menos 6 caracteres', 'error'); return; }
  const email = emailPrefix + '@valore.com.br';
  const res = await api.post('/users', {
    name, email, password: pass,
    role: document.getElementById('nu-role')?.value,
    department: document.getElementById('nu-dept')?.value,
  });
  if (res) { closeModal(); showToast('Usuário criado!'); navigate('settings'); }
}

// ─── FEED SOCIAL ──────────────────────────────────────────────────────────────
async function renderFeed() {
  const [news, recs] = await Promise.all([
    api.get('/news') || [],
    api.get('/recognitions') || [],
  ]);
  const n = (news || []).filter(x => x.published);
  const r = recs || [];

  const feedItems = [
    ...n.map(x => ({ ...x, _type: 'news', _ts: x.created_at })),
    ...r.map(x => ({ ...x, _type: 'recognition', _ts: x.created_at })),
  ].sort((a, b) => new Date(b._ts) - new Date(a._ts)).slice(0, 20);

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-newspaper"></i>Rede Social Interna</div>
</div>
<div class="page-body">
  <div style="max-width:680px">
    ${feedItems.length === 0 ? '<div class="empty-state"><i class="fa-solid fa-newspaper"></i><h3>Feed vazio</h3><p>Publique notícias ou reconheça colegas para ver aqui.</p></div>' :
    feedItems.map(item => {
      if (item._type === 'news') {
        return `
          <div class="card" style="margin-bottom:16px;padding:20px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <div class="stat-icon blue" style="width:36px;height:36px;font-size:14px"><i class="fa-solid fa-bullhorn"></i></div>
              <div>
                <div style="font-size:13px;font-weight:500">${item.author || 'Empresa'}</div>
                <div style="font-size:11.5px;color:var(--text-3)">${relativeTime(item._ts)}</div>
              </div>
              <span class="badge badge-info" style="margin-left:auto">${item.category}</span>
            </div>
            <div style="font-size:15px;font-weight:600;margin-bottom:8px">${item.title}</div>
            <div style="font-size:13.5px;color:var(--text-2);line-height:1.7">${item.content || ''}</div>
          </div>`;
      } else {
        const emojis = { destaque:'⭐',inovacao:'💡',trabalho_equipe:'🤝',lideranca:'🏆',cliente:'❤️',resultado:'🎯' };
        return `
          <div class="card" style="margin-bottom:16px;padding:20px;border-left:3px solid var(--accent)">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <div class="stat-icon purple" style="width:36px;height:36px;font-size:14px"><i class="fa-solid fa-trophy"></i></div>
              <div>
                <div style="font-size:13px;font-weight:500">${item.recognized_by || 'Equipe'} reconheceu</div>
                <div style="font-size:11.5px;color:var(--text-3)">${relativeTime(item._ts)}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;background:var(--surface2);padding:14px;border-radius:var(--radius);margin-bottom:10px">
              <span style="font-size:28px">${emojis[item.type]||'⭐'}</span>
              <div>
                <div style="font-size:14px;font-weight:600">${item.employee_name || 'Colaborador'}</div>
                <div style="font-size:12px;color:var(--text-2)">${item.department || ''}</div>
              </div>
            </div>
            <p style="font-size:13.5px;color:var(--text-2);font-style:italic">"${item.message || ''}"</p>
          </div>`;
      }
    }).join('')}
  </div>
</div>`;
}

// ─── FORMULÁRIOS ─────────────────────────────────────────────────────────────
async function renderFormularios() {
  const records = await api.get('/records', { area: 'operacoes', module: 'formularios' }) || [];

  const templates = [
    { icon: 'fa-umbrella-beach', title: 'Solicitação de Férias', color: 'green', fields: ['Período de início', 'Período de fim', 'Observações'] },
    { icon: 'fa-file-medical', title: 'Solicitação de Licença', color: 'blue', fields: ['Tipo de licença', 'Data início', 'Data fim', 'Justificativa'] },
    { icon: 'fa-receipt', title: 'Reembolso de Despesas', color: 'amber', fields: ['Tipo de despesa', 'Valor (R$)', 'Data', 'Descrição'] },
    { icon: 'fa-laptop', title: 'Solicitação de Equipamento', color: 'purple', fields: ['Tipo de equipamento', 'Justificativa', 'Urgência'] },
    { icon: 'fa-home', title: 'Home Office Eventual', color: 'teal', fields: ['Data', 'Motivo', 'Confirmação de infraestrutura'] },
  ];

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-list-check"></i>Formulários e Aprovações</div>
</div>
<div class="page-body">
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:28px">
    ${templates.map(t => `
      <div class="card" style="cursor:pointer;transition:all .18s" onclick="openFormTemplate(${JSON.stringify(t).replace(/"/g,'&quot;')})" onmouseover="this.style.boxShadow='var(--shadow)'" onmouseout="this.style.boxShadow=''">
        <div class="card-body" style="text-align:center;padding:28px 20px">
          <div class="stat-icon ${t.color}" style="width:48px;height:48px;font-size:20px;margin:0 auto 14px"><i class="fa-solid ${t.icon}"></i></div>
          <div style="font-size:14px;font-weight:600;margin-bottom:6px">${t.title}</div>
          <div style="font-size:12px;color:var(--text-3)">${t.fields.length} campos</div>
        </div>
      </div>`).join('')}
  </div>
  <div class="card">
    <div class="card-header"><i class="fa-solid fa-clock-rotate-left" style="color:var(--accent)"></i>Solicitações recentes</div>
    <div class="card-body">
      ${records.length === 0 ? '<p style="color:var(--text-3);font-size:13px">Nenhuma solicitação enviada ainda.</p>' :
      `<div class="table-wrap"><table>
        <thead><tr><th>Formulário</th><th>Status</th><th>Prioridade</th><th>Enviado em</th></tr></thead>
        <tbody>${records.map(r => `
          <tr>
            <td><strong>${r.title}</strong></td>
            <td>${statusBadge(r.status)}</td>
            <td>${priorityBadge(r.priority)}</td>
            <td>${fmtDate(r.created_at)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>`}
    </div>
  </div>
</div>`;
}

function openFormTemplate(t) {
  const formFields = t.fields.map((f, i) => `<div class="form-group"><label>${f}</label><input type="text" id="ft-${i}" placeholder="${f}..."></div>`).join('');
  openModal(t.title, `
    ${formFields}
    <div class="form-group"><label>Prioridade</label><select id="ft-priority">
      <option value="medium">Normal</option><option value="high">Urgente</option><option value="low">Baixa</option>
    </select></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="submitFormTemplate('${t.title}',${t.fields.length})"><i class="fa-solid fa-paper-plane"></i> Enviar solicitação</button>
    </div>
  `);
}

async function submitFormTemplate(title, n) {
  const content = {};
  for (let i = 0; i < n; i++) {
    content['field_' + i] = document.getElementById('ft-' + i)?.value || '';
  }
  const body = {
    area: 'operacoes', module: 'formularios',
    title, content,
    priority: document.getElementById('ft-priority')?.value || 'medium',
    status: 'pending',
  };
  const res = await api.post('/records', body);
  if (res) { closeModal(); showToast('Solicitação enviada!'); navigate('ops-formularios'); }
}

// ── DISC QUESTIONÁRIO (Metodologia de Adjetivos) ─────────────────────────────
// Banco de palavras mapeadas para cada dimensão DISC. Pontuação por contagem de
// adjetivos marcados em cada dimensão, normalizada em percentual.
const DISC_WORDS = [
  { word: "Alegre", dim: "I" }, { word: "Animado", dim: "I" }, { word: "Anti-Social", dim: "C" },
  { word: "Arrogante", dim: "D" }, { word: "Ativo", dim: "D" }, { word: "Audacioso (Ousado)", dim: "D" },
  { word: "Auto-Disciplinado", dim: "C" }, { word: "Auto-Suficiente", dim: "D" },
  { word: "Barulhento", dim: "I" }, { word: "Bem-Humorado", dim: "I" }, { word: "Bem-Quisto", dim: "I" },
  { word: "Bom Companheiro", dim: "S" }, { word: "Calculista", dim: "C" }, { word: "Calmo", dim: "S" },
  { word: "Compreensivo", dim: "S" }, { word: "Comunicativo", dim: "I" },
  { word: "Conservador", dim: "C" }, { word: "Contagiante", dim: "I" }, { word: "Corajoso", dim: "D" },
  { word: "Crítico", dim: "C" }, { word: "Cumpridor", dim: "C" }, { word: "Decidido", dim: "D" },
  { word: "Dedicado", dim: "S" }, { word: "Depressivo", dim: "S" },
  { word: "Desconfiado", dim: "C" }, { word: "Desmotivado", dim: "S" }, { word: "Desorganizado", dim: "I" },
  { word: "Destacado", dim: "D" }, { word: "Discreto", dim: "C" }, { word: "Eficiente", dim: "C" },
  { word: "Egocêntrico", dim: "D" }, { word: "Egoísta", dim: "D" },
  { word: "Empolgante", dim: "I" }, { word: "Enérgico", dim: "D" }, { word: "Entusiasta", dim: "I" },
  { word: "Equilibrado", dim: "S" }, { word: "Espalhafatoso", dim: "I" }, { word: "Estimulante", dim: "I" },
  { word: "Exagerado", dim: "I" }, { word: "Exigente", dim: "D" },
  { word: "Extrovertido", dim: "I" }, { word: "Exuberante", dim: "I" }, { word: "Firme", dim: "D" },
  { word: "Frio", dim: "C" }, { word: "Habilidoso", dim: "C" }, { word: "Idealista", dim: "I" },
  { word: "Impaciente", dim: "D" }, { word: "Indeciso", dim: "S" },
  { word: "Independente", dim: "D" }, { word: "Indisciplinado", dim: "I" }, { word: "Inflexível", dim: "C" },
  { word: "Influenciador", dim: "I" }, { word: "Ingênuo", dim: "S" }, { word: "Inseguro", dim: "S" },
  { word: "Insensível", dim: "D" }, { word: "Intolerante", dim: "D" },
  { word: "Introvertido", dim: "C" }, { word: "Leal", dim: "S" }, { word: "Líder", dim: "D" },
  { word: "Medroso", dim: "S" }, { word: "Metódico", dim: "C" }, { word: "Minucioso", dim: "C" },
  { word: "Modesto", dim: "S" }, { word: "Orgulhoso", dim: "D" },
  { word: "Otimista", dim: "I" }, { word: "Paciente", dim: "S" }, { word: "Perfeccionista", dim: "C" },
  { word: "Persistente", dim: "D" }, { word: "Pessimista", dim: "C" }, { word: "Popular", dim: "I" },
  { word: "Prático", dim: "D" }, { word: "Pretensioso", dim: "D" },
  { word: "Procrastinador", dim: "S" }, { word: "Racional", dim: "C" }, { word: "Reservado", dim: "C" },
  { word: "Resoluto (Decidido)", dim: "D" }, { word: "Rotineiro", dim: "S" }, { word: "Sarcástico", dim: "D" },
  { word: "Sensível", dim: "S" }, { word: "Sentimental", dim: "S" },
  { word: "Simpático", dim: "I" }, { word: "Sincero", dim: "S" }, { word: "Temeroso", dim: "S" },
  { word: "Teórico", dim: "C" }, { word: "Tranquilo", dim: "S" }, { word: "Vaidoso", dim: "I" },
  { word: "Vingativo", dim: "D" },
];

let _discSelected = [];
let _discEmpId = '';

function openDISC(empId) {
  _discSelected = [];
  _discEmpId = empId;
  renderDISCWords();
}

function toggleDISCWord(word) {
  const idx = _discSelected.indexOf(word);
  if (idx >= 0) _discSelected.splice(idx, 1);
  else _discSelected.push(word);
  renderDISCWords();
}

function renderDISCWords() {
  const minWords = 8;
  const count = _discSelected.length;
  const wordsHtml = DISC_WORDS.map(w => {
    const selected = _discSelected.includes(w.word);
    return `<button onclick="toggleDISCWord('${w.word.replace(/'/g,"\\'")}')" style="
      padding:9px 14px;border-radius:8px;cursor:pointer;font-size:12.5px;font-family:var(--font);
      border:1.5px solid ${selected ? 'var(--primary)' : 'var(--border)'};
      background:${selected ? 'var(--primary-light)' : 'var(--surface)'};
      color:${selected ? 'var(--primary)' : 'var(--text)'};
      font-weight:${selected ? '600' : '400'};">${w.word}</button>`;
  }).join('');

  openModal('Teste DISC — Marque os adjetivos que mais te representam', `
    <div style="font-size:12.5px;color:var(--text-2);margin-bottom:4px">
      Marque <strong>todos os adjetivos</strong> que você acredita que mais te representam no ambiente de trabalho. Responda sozinho, com sinceridade, sem ajuda de terceiros.
    </div>
    <div style="font-size:11.5px;color:var(--text-3);margin-bottom:14px">
      Selecionados: <strong style="color:${count >= minWords ? '#16a34a' : 'var(--text-2)'}">${count}</strong> ${count < minWords ? `(mínimo recomendado: ${minWords})` : '✓'}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;max-height:420px;overflow-y:auto;padding:4px 2px">
      ${wordsHtml}
    </div>
    <div class="modal-footer" style="justify-content:space-between;margin-top:16px">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="submitDISC()" ${count < minWords ? 'disabled' : ''}>
        Finalizar e Ver Resultado (${count} selecionados)
      </button>
    </div>
  `, 'lg');
}

async function submitDISC() {
  if (_discSelected.length < 8) {
    showToast('Selecione pelo menos 8 adjetivos antes de finalizar', 'error');
    return;
  }
  // Mapeia cada palavra selecionada para sua dimensão DISC correspondente
  const answers = _discSelected.map(word => {
    const found = DISC_WORDS.find(w => w.word === word);
    return found ? found.dim : null;
  }).filter(Boolean);

  const res = await api.post('/employees/' + _discEmpId + '/disc', { answers });
  if (res?.success) {
    closeModal();
    showToast('DISC aplicado com sucesso!');
    openEmployeeDetail(_discEmpId);
    setTimeout(() => showEmpTab('disc', _discEmpId), 300);
  } else {
    showToast('Erro ao salvar resultado', 'error');
  }
}

// ── PDI 360° COM IA ───────────────────────────────────────────────────────────
let _pdiEmpId = '';
let _pdiCurrentId = null;

async function renderPDI360() {
  const employees = (await api.get('/employees') || []).filter(e => e.status === 'active');
  window._pdi360Employees = employees;

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-chart-radar"></i>PDI — Avaliação 360°</div>
  ${userCan('edit') ? '<div class="page-actions"><button class="btn-primary" onclick="openNewPDI360()"><i class="fa-solid fa-plus"></i> Nova Avaliação</button></div>' : ''}
</div>
<div class="page-body">
  <div class="form-group" style="max-width:360px">
    <label>Selecione o colaborador</label>
    <select id="pdi360-emp-sel" onchange="loadPDI360List(this.value)" style="padding:9px 14px;border:1.5px solid var(--border);border-radius:var(--radius);font-size:13.5px;font-family:var(--font);color:var(--text);background:var(--surface);outline:none;width:100%">
      <option value="">Selecione...</option>
      ${employees.map(e => `<option value="${e.id}">${e.name} — ${e.department||''}</option>`).join('')}
    </select>
  </div>
  <div id="pdi360-list"></div>
</div>`;
}

async function loadPDI360List(empId) {
  if (!empId) return;
  _pdiEmpId = empId;
  const assessments = await api.get('/employees/' + empId + '/pdi') || [];
  const emp = (window._pdi360Employees||[]).find(e => e.id === empId);
  const container = document.getElementById('pdi360-list');
  if (!container) return;

  if (assessments.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-chart-radar"></i><h3>Nenhuma avaliação</h3><p>Crie a primeira avaliação PDI para ${emp?.name||'este colaborador'}.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div style="margin-top:20px">
      <div style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--text-2)">${emp?.name||''} · ${assessments.length} avaliação(ões)</div>
      <div style="display:grid;gap:12px">
        ${assessments.map(a => {
          const typeLabel = a.assessor_type === 'self' ? '🪞 Autoavaliação' : '👤 Gestor';
          const scoreColor = a.score_total >= 4 ? '#22c55e' : a.score_total >= 3 ? '#f59e0b' : '#ef4444';
          return `<div class="card" style="padding:16px;cursor:pointer" onclick="openViewPDI360('${empId}','${a.id}')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <div>
                <div style="font-size:13.5px;font-weight:600">${typeLabel} · ${a.period||'Sem período'}</div>
                <div style="font-size:12px;color:var(--text-3)">${fmtDate(a.created_at)}</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:24px;font-weight:700;color:${scoreColor}">${parseFloat(a.score_total).toFixed(1)}</div>
                <div style="font-size:10px;color:var(--text-3)">/ 5.0</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
              ${[['Estratégico',a.score_estrategico],['Conhecimentos',a.score_conhecimentos],['Habilidades',a.score_habilidades],['Atitudes',a.score_atitudes],['Treinamentos',a.score_treinamentos]].map(([label,val]) => `
                <div style="text-align:center">
                  <div style="font-size:11px;color:var(--text-3);margin-bottom:2px">${label.slice(0,5)}.</div>
                  <div style="font-size:13px;font-weight:600;color:var(--primary)">${parseFloat(val||0).toFixed(1)}</div>
                </div>`).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function openNewPDI360() {
  const employees = window._pdi360Employees || [];
  const empOpts = employees.map(e => `<option value="${e.id}" ${e.id===_pdiEmpId?'selected':''}>${e.name} — ${e.department||''}</option>`).join('');
  openModal('Nova Avaliação PDI 360°', `
    <div class="form-row">
      <div class="form-group"><label>Colaborador *</label>
        <select id="pdi-emp">${empOpts}</select>
      </div>
      <div class="form-group"><label>Tipo de avaliação</label>
        <select id="pdi-type">
          <option value="manager">👤 Gestor avalia colaborador</option>
          <option value="self">🪞 Autoavaliação</option>
        </select>
      </div>
    </div>
    <div class="form-group"><label>Período de referência</label>
      <input type="text" id="pdi-period" placeholder="Ex: 1º Semestre 2026"></div>
    <div style="margin-bottom:16px">
      <div style="font-size:13px;font-weight:600;color:var(--text-2);margin-bottom:12px">Pontuações (escala 0 a 5)</div>
      ${[['estrategico','Estratégico','Visão de negócio, alinhamento com missão/valores, orientação a resultados'],
         ['conhecimentos','Conhecimentos','Domínio técnico da área, legislação, sistemas e atualização profissional'],
         ['habilidades','Habilidades','Comunicação, organização, relacionamento interpessoal e liderança'],
         ['atitudes','Atitudes','Proatividade, ética, comprometimento, trabalho em equipe e iniciativa'],
         ['treinamentos','Treinamentos','Participação em cursos, aplicação do aprendizado e busca por desenvolvimento']
        ].map(([id,label,desc]) => `
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <label style="font-size:13px;font-weight:600">${label}</label>
            <span id="pdi-${id}-val" style="font-size:13px;font-weight:700;color:var(--primary)">0.0</span>
          </div>
          <div style="font-size:11px;color:var(--text-3);margin-bottom:5px">${desc}</div>
          <input type="range" id="pdi-${id}" min="0" max="5" step="0.5" value="0"
            oninput="document.getElementById('pdi-${id}-val').textContent=parseFloat(this.value).toFixed(1)"
            style="width:100%;accent-color:var(--primary)">
        </div>`).join('')}
    </div>
    <div class="form-group"><label>Pontos positivos do desempenho</label>
      <textarea id="pdi-positives" placeholder="Descreva os principais pontos fortes..."></textarea></div>
    <div class="form-group"><label>O que aperfeiçoar</label>
      <textarea id="pdi-improvements" placeholder="Áreas de desenvolvimento identificadas..."></textarea></div>
    <div class="form-group"><label>Compromissos de aperfeiçoamento</label>
      <textarea id="pdi-commitments" placeholder="Ações acordadas para o próximo ciclo..."></textarea></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="savePDI360()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `);
}

async function savePDI360() {
  const empId = document.getElementById('pdi-emp')?.value;
  if (!empId) { showToast('Selecione o colaborador', 'error'); return; }
  const body = {
    assessor_type: document.getElementById('pdi-type')?.value || 'manager',
    period: document.getElementById('pdi-period')?.value || '',
    score_estrategico: parseFloat(document.getElementById('pdi-estrategico')?.value || 0),
    score_conhecimentos: parseFloat(document.getElementById('pdi-conhecimentos')?.value || 0),
    score_habilidades: parseFloat(document.getElementById('pdi-habilidades')?.value || 0),
    score_atitudes: parseFloat(document.getElementById('pdi-atitudes')?.value || 0),
    score_treinamentos: parseFloat(document.getElementById('pdi-treinamentos')?.value || 0),
    positives: document.getElementById('pdi-positives')?.value || '',
    improvements: document.getElementById('pdi-improvements')?.value || '',
    commitments: document.getElementById('pdi-commitments')?.value || '',
    status: 'completed',
  };
  const res = await api.post('/employees/' + empId + '/pdi', body);
  if (res?.success) {
    closeModal();
    showToast('Avaliação salva!');
    _pdiEmpId = empId;
    const sel = document.getElementById('pdi360-emp-sel');
    if (sel) { sel.value = empId; }
    await loadPDI360List(empId);
  } else {
    showToast('Erro ao salvar', 'error');
  }
}

async function openViewPDI360(empId, pdiId) {
  const assessments = await api.get('/employees/' + empId + '/pdi') || [];
  const a = assessments.find(x => x.id === pdiId);
  if (!a) return;
  const emp = (window._pdi360Employees||[]).find(e => e.id === empId);
  const typeLabel = a.assessor_type === 'self' ? '🪞 Autoavaliação' : '👤 Avaliação do Gestor';
  const scoreColor = a.score_total >= 4 ? '#22c55e' : a.score_total >= 3 ? '#f59e0b' : '#ef4444';
  const dims = [
    ['Estratégico', a.score_estrategico, '#3b82f6'],
    ['Conhecimentos', a.score_conhecimentos, '#8b5cf6'],
    ['Habilidades', a.score_habilidades, '#22c55e'],
    ['Atitudes', a.score_atitudes, '#f59e0b'],
    ['Treinamentos', a.score_treinamentos, '#06b6d4'],
  ];
  const radarBars = dims.map(([label, val, color]) => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
        <span style="font-weight:500">${label}</span>
        <span style="font-weight:700;color:${color}">${parseFloat(val||0).toFixed(1)}</span>
      </div>
      <div style="height:8px;background:var(--border);border-radius:4px">
        <div style="width:${parseFloat(val||0)/5*100}%;height:8px;background:${color};border-radius:4px"></div>
      </div>
    </div>`).join('');

  openModal(`PDI — ${emp?.name||''}`, `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div>
        <div style="font-size:13px;color:var(--text-2)">${typeLabel} · ${a.period||'Sem período'}</div>
        <div style="font-size:11px;color:var(--text-3)">${fmtDate(a.created_at)}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:32px;font-weight:700;color:${scoreColor}">${parseFloat(a.score_total).toFixed(1)}</div>
        <div style="font-size:11px;color:var(--text-3)">nota geral / 5.0</div>
      </div>
    </div>
    ${radarBars}
    ${a.positives ? `<div style="margin-top:12px;background:#f0fdf4;border-radius:8px;padding:10px"><div style="font-size:12px;font-weight:600;color:#16a34a;margin-bottom:4px">✅ Pontos Positivos</div><div style="font-size:12px;color:var(--text-2)">${a.positives}</div></div>` : ''}
    ${a.improvements ? `<div style="margin-top:8px;background:#fff7ed;border-radius:8px;padding:10px"><div style="font-size:12px;font-weight:600;color:#ea580c;margin-bottom:4px">📈 O que Aperfeiçoar</div><div style="font-size:12px;color:var(--text-2)">${a.improvements}</div></div>` : ''}
    ${a.commitments ? `<div style="margin-top:8px;background:#eff6ff;border-radius:8px;padding:10px"><div style="font-size:12px;font-weight:600;color:#2563eb;margin-bottom:4px">🎯 Compromissos</div><div style="font-size:12px;color:var(--text-2)">${a.commitments}</div></div>` : ''}
    ${a.ai_recommendations ? `<div style="margin-top:8px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:1.5px solid #7dd3fc;border-radius:8px;padding:12px"><div style="font-size:12px;font-weight:600;color:#0369a1;margin-bottom:6px">🤖 Recomendações do Agente Valore</div><div style="font-size:12px;color:var(--text-2);white-space:pre-wrap;line-height:1.6">${a.ai_recommendations}</div></div>` : ''}
    <div class="modal-footer" style="justify-content:space-between">
      ${userCan('admin') ? `<button class="btn-danger" onclick="deletePDI360('${empId}','${pdiId}')"><i class="fa-solid fa-trash"></i></button>` : '<div></div>'}
      ${userCan('edit') ? `<button class="btn-primary" onclick="generateAI360('${empId}','${pdiId}')" id="btn-ai-360"><i class="fa-solid fa-robot"></i> Gerar Recomendações IA</button>` : ''}
    </div>
  `, 'lg');
}

async function generateAI360(empId, pdiId) {
  const btn = document.getElementById('btn-ai-360');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando...'; }
  const assessments = await api.get('/employees/' + empId + '/pdi') || [];
  const a = assessments.find(x => x.id === pdiId);
  if (!a) return;
  const body = {
    score_estrategico: a.score_estrategico,
    score_conhecimentos: a.score_conhecimentos,
    score_habilidades: a.score_habilidades,
    score_atitudes: a.score_atitudes,
    score_treinamentos: a.score_treinamentos,
    positives: a.positives,
    improvements: a.improvements,
  };
  try {
    const res = await fetch('/api/employees/' + empId + '/pdi/ai-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      await api.put('/employees/' + empId + '/pdi/' + pdiId, { ...a, ai_recommendations: data.recommendations });
      showToast('Recomendações geradas!');
      closeModal();
      await loadPDI360List(empId);
      setTimeout(() => openViewPDI360(empId, pdiId), 300);
    } else {
      showToast(data.error || 'Erro ao gerar recomendações', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-robot"></i> Gerar Recomendações IA'; }
    }
  } catch(e) {
    showToast('Erro de conexão com a IA', 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-robot"></i> Gerar Recomendações IA'; }
  }
}

async function deletePDI360(empId, pdiId) {
  if (!confirm('Excluir esta avaliação?')) return;
  const res = await fetch('/api/employees/' + empId + '/pdi/' + pdiId, { method: 'DELETE', credentials: 'include' });
  const data = await res.json();
  if (data.success) { closeModal(); showToast('Avaliação excluída'); loadPDI360List(empId); }
}

// ── DISC DESCRIÇÕES COMPLETAS + EXPORTAÇÃO + TELA DE PERFIS ──────────────────
const DISC_FULL = {
  D: {
    label: 'Executor', color: '#ef4444', emoji: '🔴',
    desc: 'Ativo, competitivo, otimista e dinâmico. Age com rapidez, assume riscos e busca resultados concretos com energia e determinação.',
    valore_context: 'Na Valore, o Executor se destaca na liderança de equipes, na condução de fechamentos críticos e na gestão de demandas urgentes. Sua energia e competitividade impulsionam resultados, e precisa equilibrar velocidade com escuta e colaboração.',
    strengths: ['Proatividade e energia para agir com rapidez', 'Liderança natural em situações de pressão', 'Disposição para assumir riscos calculados', 'Foco em resultados e superação de metas', 'Otimismo que contagia e mobiliza a equipe'],
    development: ['Desenvolver paciência com processos e pessoas', 'Maior escuta ativa e empatia com o time', 'Aprender a delegar sem perder o controle', 'Respeitar os ritmos diferentes dos colegas', 'Valorizar planejamento antes da execução'],
    roles: 'Supervisor, Analista Sênior, Líder de Equipe',
    motivations: 'Desafios, liderança, autonomia e liberdade para assumir riscos',
    fears: 'Processos lentos, falta de autonomia e ambientes muito controlados',
    communication: 'Direto e objetivo. Vai ao ponto sem rodeios e espera o mesmo dos outros.',
  },
  I: {
    label: 'Comunicador', color: '#f59e0b', emoji: '🟡',
    desc: 'Extrovertido, falante, adaptável e ativo. Constrói relacionamentos com facilidade e transforma ambientes com sua energia e entusiasmo.',
    valore_context: 'Na Valore, o Comunicador é essencial no atendimento ao cliente, na disseminação da cultura e no engajamento do time. Sua versatilidade e facilidade de conexão fortalecem o valor de "Compartilhar e Colaborar" e a experiência do cliente.',
    strengths: ['Comunicação fluida e persuasiva', 'Facilidade em trabalhar em equipe', 'Alta adaptabilidade a mudanças e contextos', 'Capacidade de motivar e engajar pessoas', 'Criatividade e espontaneidade nas soluções'],
    development: ['Desenvolver disciplina e organização pessoal', 'Maior foco em tarefas repetitivas e detalhes técnicos', 'Aprender a lidar com rotinas estruturadas', 'Equilibrar comunicação com entrega objetiva', 'Aprofundar conhecimentos técnicos da área'],
    roles: 'Sucesso do Cliente, Comercial, Marketing, Analista Pleno',
    motivations: 'Falta de rotina, autonomia, trabalho em equipe e reconhecimento',
    fears: 'Rigidez, monotonia e falta de reconhecimento pelo trabalho',
    communication: 'Expressivo e empático. Responde bem a ambientes de diálogo aberto e reconhecimento.',
  },
  S: {
    label: 'Planejador', color: '#22c55e', emoji: '🟢',
    desc: 'Calmo, prudente e com muito autocontrole. É o pilar de estabilidade da equipe — confiável, consistente e sempre disposto a ajudar.',
    valore_context: 'Na Valore, o Planejador representa a base operacional sólida — entrega com consistência, mantém os processos organizados e apoia os colegas ao redor. Alinhado ao valor "Trabalhar e Crescer Juntos", é o guardião da qualidade no dia a dia.',
    strengths: ['Autocontrole e serenidade em situações de pressão', 'Comprometimento com planejamento e rotina', 'Disposição genuína para ajudar a equipe', 'Lealdade e confiabilidade nas entregas', 'Execução cuidadosa e metódica das tarefas'],
    development: ['Desenvolver assertividade e posicionamento', 'Maior flexibilidade diante de imprevistos', 'Aprender a agir mesmo sem planejamento completo', 'Sair da zona de conforto para assumir novos desafios', 'Comunicar discordâncias de forma mais direta'],
    roles: 'Analista Júnior, Assistente, Analista Pleno, DP',
    motivations: 'Rotina, planejamento, estabilidade e poder ajudar os outros',
    fears: 'Falta de disciplina, improviso e ambientes desorganizados',
    communication: 'Calmo e receptivo. Prefere conversas estruturadas e com espaço para ouvir.',
  },
  C: {
    label: 'Analista', color: '#3b82f6', emoji: '🔵',
    desc: 'Detalhista, preciso, cauteloso e crítico. Busca a perfeição em tudo que faz e não abre mão da qualidade técnica.',
    valore_context: 'Na Valore, o Analista é o guardião da qualidade técnica — fundamental nos setores Contábil, Fiscal e DP, onde precisão na aplicação da legislação e exatidão nos lançamentos são inegociáveis. Alinhado ao Culture Code "Somos extraordinários no que fazemos".',
    strengths: ['Atenção extrema aos detalhes e à precisão', 'Método e rigor na execução das tarefas', 'Capacidade crítica de identificar inconsistências', 'Busca constante pela perfeição nas entregas', 'Ambiente calmo favorece alta concentração e qualidade'],
    development: ['Desenvolver agilidade na tomada de decisão', 'Aprender a agir com informações incompletas', 'Melhorar comunicação interpessoal e empatia', 'Equilibrar perfeccionismo com produtividade', 'Maior tolerância à pressão e a erros alheios'],
    roles: 'Analista Contábil, Analista Fiscal, Analista DP, Supervisor',
    motivations: 'Perfeição, métodos bem definidos e ambientes calmos e organizados',
    fears: 'Pressão excessiva, falta de garantias e ambientes com pouca segurança',
    communication: 'Formal e baseado em dados. Responde melhor a argumentos técnicos e evidências.',
  }
};

// Corrigir DISC_DESC na loadDiscTab para usar DISC_FULL
async function loadDiscTabV2(empId) {
  const container = document.getElementById('disc-content-' + empId);
  if (!container) return;
  const disc = await api.get('/employees/' + empId + '/disc');
  if (!disc || !disc.dominant_profile) {
    container.innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:40px;margin-bottom:8px">📊</div>
        <div style="font-size:14px;font-weight:600;color:var(--text-2);margin-bottom:4px">DISC não aplicado</div>
        <div style="font-size:12px;color:var(--text-3);margin-bottom:16px">Aplique o questionário para ver o perfil comportamental</div>
        ${userCan('edit') ? `<button class="btn-primary" onclick="openDISC('${empId}')"><i class="fa-solid fa-clipboard-list"></i> Aplicar DISC</button>` : ''}
      </div>`;
    return;
  }
  const p = disc.dominant_profile;
  const info = DISC_FULL[p] || {};
  const scores = [
    { label: 'D', full: 'Dominância', value: disc.d_score, color: '#ef4444' },
    { label: 'I', full: 'Influência', value: disc.i_score, color: '#f59e0b' },
    { label: 'S', full: 'Estabilidade', value: disc.s_score, color: '#22c55e' },
    { label: 'C', full: 'Conformidade', value: disc.c_score, color: '#3b82f6' },
  ];
  window._discDataForExport = { disc, empId, info, scores, p };

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
      <div style="width:60px;height:60px;border-radius:50%;background:${info.color};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;flex-shrink:0">${p}</div>
      <div style="flex:1">
        <div style="font-size:16px;font-weight:700;color:var(--text)">${info.emoji} ${info.label}</div>
        <div style="font-size:12px;color:var(--text-2);margin-top:2px">${info.desc}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      ${scores.map(s => `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
            <span style="font-weight:600;color:${s.color}">${s.label} — ${s.full}</span>
            <span style="color:var(--text-2)">${s.value.toFixed(0)}%</span>
          </div>
          <div style="height:8px;background:var(--border);border-radius:4px">
            <div style="width:${s.value}%;height:8px;background:${s.color};border-radius:4px"></div>
          </div>
        </div>`).join('')}
    </div>
    <div style="background:#eff6ff;border-radius:8px;padding:10px;font-size:12px;margin-bottom:10px">
      <div style="font-weight:600;color:#1d4ed8;margin-bottom:4px">💼 No contexto da Valore</div>
      <div style="color:var(--text-2)">${info.valore_context}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:10px">
      <div style="background:#f0fdf4;border-radius:8px;padding:10px">
        <div style="font-weight:600;color:#16a34a;margin-bottom:6px">✅ Pontos fortes</div>
        ${(info.strengths||[]).map(s => `<div style="color:var(--text-2);margin-bottom:3px">· ${s}</div>`).join('')}
      </div>
      <div style="background:#fff7ed;border-radius:8px;padding:10px">
        <div style="font-weight:600;color:#ea580c;margin-bottom:6px">📈 Desenvolvimento</div>
        ${(info.development||[]).map(s => `<div style="color:var(--text-2);margin-bottom:3px">· ${s}</div>`).join('')}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:12px">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px">
        <div style="font-weight:600;color:var(--text-2);margin-bottom:3px">🎯 Cargos naturais</div>
        <div style="color:var(--text-3)">${info.roles}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px">
        <div style="font-weight:600;color:var(--text-2);margin-bottom:3px">💬 Comunicação</div>
        <div style="color:var(--text-3)">${info.communication}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="exportDiscPDF('${empId}')" style="flex:1;padding:8px;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;font-size:12px;font-family:var(--font);color:var(--text)"><i class="fa-solid fa-file-pdf" style="color:#ef4444"></i> Exportar PDF</button>
      ${userCan('edit') ? `<button onclick="openDISC('${empId}')" style="flex:1;padding:8px;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;font-size:12px;font-family:var(--font);color:var(--text)"><i class="fa-solid fa-redo"></i> Reaplicar</button>` : ''}
    </div>
    <div style="margin-top:8px;font-size:11px;color:var(--text-3);text-align:right">Aplicado em ${fmtDate(disc.created_at)}</div>
  `;
}

// Sobrescrever loadDiscTab com versão completa
const _loadDiscTabOriginal = loadDiscTab;
window.loadDiscTab = loadDiscTabV2;

async function exportDiscPDF(empId) {
  const d = window._discDataForExport;
  if (!d) { showToast('Dados não disponíveis', 'error'); return; }
  const { disc, info, scores, p } = d;
  // Buscar nome do colaborador
  const emp = await api.get('/employees/' + empId);
  const name = emp?.name || 'Colaborador';
  const dept = emp?.department || '';
  const position = emp?.position || '';
  const date = fmtDate(disc.created_at);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Resultado DISC — ${name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 3px solid ${info.color}; padding-bottom:16px; margin-bottom:24px; }
  .brand { font-size:22px; font-weight:700; color: #1e293b; letter-spacing:-0.5px; }
  .brand span { color: ${info.color}; }
  .subtitle { font-size:12px; color:#64748b; margin-top:4px; }
  .emp-info h1 { font-size:20px; font-weight:700; }
  .emp-info p { font-size:13px; color:#64748b; margin-top:2px; }
  .profile-badge { display:inline-flex; align-items:center; gap:12px; background:${info.color}15; border:2px solid ${info.color}; border-radius:12px; padding:12px 20px; margin:16px 0; }
  .badge-letter { width:52px; height:52px; border-radius:50%; background:${info.color}; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700; color:#fff; flex-shrink:0; }
  .badge-text h2 { font-size:18px; font-weight:700; color:${info.color}; }
  .badge-text p { font-size:12px; color:#475569; margin-top:2px; max-width:480px; line-height:1.5; }
  .section { margin:20px 0; }
  .section h3 { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:10px; }
  .bars { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .bar-item label { display:flex; justify-content:space-between; font-size:12px; margin-bottom:3px; font-weight:600; }
  .bar-track { height:10px; background:#e2e8f0; border-radius:5px; }
  .bar-fill { height:10px; border-radius:5px; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:12px 0; }
  .box { border-radius:8px; padding:12px; }
  .box h4 { font-size:12px; font-weight:700; margin-bottom:6px; }
  .box ul { list-style:none; }
  .box ul li { font-size:12px; color:#475569; margin-bottom:3px; }
  .box ul li::before { content:"· "; }
  .context-box { background:#eff6ff; border:1.5px solid #93c5fd; border-radius:8px; padding:12px; margin:12px 0; }
  .context-box h4 { font-size:12px; font-weight:700; color:#1d4ed8; margin-bottom:4px; }
  .context-box p { font-size:12px; color:#1e40af; line-height:1.6; }
  .info-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px; }
  .info-card { border:1px solid #e2e8f0; border-radius:8px; padding:10px; }
  .info-card h4 { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px; }
  .info-card p { font-size:12px; color:#334155; line-height:1.5; }
  .footer { margin-top:32px; padding-top:12px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; }
  @media print { body { padding:20px; } button { display:none; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">VALORE <span>HUB</span></div>
    <div class="subtitle">Relatório de Perfil Comportamental — DISC</div>
  </div>
  <div class="emp-info" style="text-align:right">
    <h1>${name}</h1>
    <p>${position}${dept ? ' · ' + dept : ''}</p>
    <p style="margin-top:4px;font-size:11px">Avaliação realizada em ${date}</p>
  </div>
</div>

<div class="profile-badge">
  <div class="badge-letter">${p}</div>
  <div class="badge-text">
    <h2>${info.emoji} ${info.label}</h2>
    <p>${info.desc}</p>
  </div>
</div>

<div class="section">
  <h3>Pontuações por dimensão</h3>
  <div class="bars">
    ${scores.map(s => `
    <div class="bar-item">
      <label><span style="color:${s.color}">${s.label} — ${s.full}</span><span>${s.value.toFixed(0)}%</span></label>
      <div class="bar-track"><div class="bar-fill" style="width:${s.value}%;background:${s.color}"></div></div>
    </div>`).join('')}
  </div>
</div>

<div class="context-box">
  <h4>💼 No contexto do Grupo Valore</h4>
  <p>${info.valore_context}</p>
</div>

<div class="two-col">
  <div class="box" style="background:#f0fdf4;border:1.5px solid #86efac">
    <h4 style="color:#16a34a">✅ Pontos fortes</h4>
    <ul>${(info.strengths||[]).map(s => `<li>${s}</li>`).join('')}</ul>
  </div>
  <div class="box" style="background:#fff7ed;border:1.5px solid #fdba74">
    <h4 style="color:#ea580c">📈 Pontos de desenvolvimento</h4>
    <ul>${(info.development||[]).map(s => `<li>${s}</li>`).join('')}</ul>
  </div>
</div>

<div class="info-row">
  <div class="info-card">
    <h4>🎯 Cargos naturais</h4>
    <p>${info.roles}</p>
  </div>
  <div class="info-card">
    <h4>💬 Estilo de comunicação</h4>
    <p>${info.communication}</p>
  </div>
  <div class="info-card">
    <h4>⚡ O que motiva</h4>
    <p>${info.motivations}</p>
  </div>
  <div class="info-card">
    <h4>⚠️ O que gera desconforto</h4>
    <p>${info.fears}</p>
  </div>
</div>

<div class="footer">
  <span>Valore Hub — Sistema de Gestão de Pessoas</span>
  <span>${new Date().toLocaleDateString('pt-BR')}</span>
</div>
<br>
<button onclick="window.print()" style="padding:10px 24px;background:#1e40af;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-family:Arial">🖨️ Imprimir / Salvar como PDF</button>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) win.focus();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── TELA DE PERFIS DISC ───────────────────────────────────────────────────────
async function renderDISCPerfis() {
  const profiles = ['D','I','S','C'];
  const cards = profiles.map(p => {
    const info = DISC_FULL[p];
    return `
    <div class="card" style="padding:20px">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
        <div style="width:56px;height:56px;border-radius:50%;background:${info.color};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0">${p}</div>
        <div>
          <div style="font-size:16px;font-weight:700">${info.emoji} ${info.label}</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:2px">Perfil ${p}</div>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text-2);margin-bottom:12px;line-height:1.6">${info.desc}</div>
      <div style="background:#eff6ff;border-radius:8px;padding:10px;font-size:12px;margin-bottom:10px">
        <div style="font-weight:600;color:#1d4ed8;margin-bottom:4px">💼 Na Valore</div>
        <div style="color:#1e40af;line-height:1.5">${info.valore_context}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:10px">
        <div style="background:#f0fdf4;border-radius:8px;padding:8px">
          <div style="font-weight:600;color:#16a34a;margin-bottom:4px">✅ Forças</div>
          ${info.strengths.slice(0,3).map(s => `<div style="color:var(--text-2);margin-bottom:2px">· ${s}</div>`).join('')}
        </div>
        <div style="background:#fff7ed;border-radius:8px;padding:8px">
          <div style="font-weight:600;color:#ea580c;margin-bottom:4px">📈 Desenvolver</div>
          ${info.development.slice(0,3).map(s => `<div style="color:var(--text-2);margin-bottom:2px">· ${s}</div>`).join('')}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11.5px">
        <div style="border:1px solid var(--border);border-radius:6px;padding:7px">
          <div style="font-weight:600;color:var(--text-2);margin-bottom:2px">🎯 Cargos naturais</div>
          <div style="color:var(--text-3)">${info.roles}</div>
        </div>
        <div style="border:1px solid var(--border);border-radius:6px;padding:7px">
          <div style="font-weight:600;color:var(--text-2);margin-bottom:2px">⚡ Motivado por</div>
          <div style="color:var(--text-3)">${info.motivations.split(',')[0]}...</div>
        </div>
      </div>
    </div>`;
  }).join('');

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-brain"></i>Perfis DISC</div>
</div>
<div class="page-body">
  <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);border-radius:var(--radius);padding:20px;color:#fff;margin-bottom:24px">
    <div style="font-size:16px;font-weight:700;margin-bottom:6px">Metodologia DISC na Valore</div>
    <div style="font-size:13px;opacity:.9;line-height:1.6">O DISC é uma ferramenta de análise comportamental que identifica 4 perfis dominantes. Na Valore, usamos o DISC para potencializar o desenvolvimento individual, melhorar a comunicação entre equipes e alinhar cada colaborador ao perfil mais adequado para sua função.</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
    ${cards}
  </div>
</div>`;
}


// ─── POLÍTICAS DE EMPRESA ────────────────────────────────────────────────────
async function renderPoliticas() {
  const isAdmin = userCan('admin');
  const policies = await api.get('/policies') || [];

  // Agrupa por categoria
  const grouped = {};
  policies.forEach(p => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  const categoriaIcons = {
    'RH': 'fa-people-group',
    'Financeiro': 'fa-coins',
    'TI': 'fa-microchip',
    'Compliance': 'fa-shield-halved',
    'Operacional': 'fa-gears',
    'Geral': 'fa-book',
  };

  return `
<div class="page-header">
  <div class="page-title"><i class="fa-solid fa-book"></i>Políticas de Empresa</div>
  <div class="page-actions">
    ${isAdmin ? `<button class="btn-primary" onclick="openNewPolicy()"><i class="fa-solid fa-plus"></i> Nova Política</button>` : ''}
  </div>
</div>
<div class="page-body">
  ${policies.length === 0 ? `
    <div class="empty-state">
      <i class="fa-solid fa-book"></i>
      <h3>Nenhuma política cadastrada</h3>
      <p>Documente as políticas e diretrizes da empresa.</p>
    </div>` :
    Object.entries(grouped).map(([cat, items]) => `
      <div style="margin-bottom:28px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <i class="fa-solid ${categoriaIcons[cat] || 'fa-folder'}" style="color:var(--primary);font-size:15px"></i>
          <span style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-2)">${cat}</span>
        </div>
        <div class="content-grid">
          ${items.map(p => `
            <div class="content-card" style="cursor:pointer" onclick="openViewPolicy('${p.id}')">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                <div class="content-card-title" style="margin-bottom:6px">${p.title}</div>
                ${isAdmin ? `
                  <div style="display:flex;gap:4px;flex-shrink:0">
                    <button class="btn-icon" title="Editar" onclick="event.stopPropagation();openEditPolicy('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon" title="Excluir" onclick="event.stopPropagation();deletePolicy('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                  </div>` : ''}
              </div>
              <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
                ${{alta:'<span style="background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">🔴 Alta</span>',media:'<span style="background:#fef9c3;color:#a16207;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">🟡 Média</span>',baixa:'<span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">🟢 Baixa</span>'}[p.priority] || ''}
                ${p.status === 'inativa' ? '<span style="background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">⚫ Inativa</span>' : '<span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">✅ Ativa</span>'}
              </div>
              <div class="content-card-meta" style="margin-top:8px">
                <span><i class="fa-solid fa-calendar" style="margin-right:4px"></i>${fmtDate(p.created_at)}</span>
                ${p.pdf_filename ? '<span style="color:var(--primary)"><i class="fa-solid fa-file-pdf" style="margin-right:4px"></i>PDF anexo</span>' : ''}
              </div>
            </div>`).join('')}
        </div>
      </div>`).join('')}
</div>`;
}

async function openViewPolicy(id) {
  const p = await api.get('/policies/' + id);
  if (!p) return;
  openModal(p.title, `
    <div style="margin-bottom:12px">
      <span style="background:var(--primary-light);color:var(--primary);padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">${p.category}</span>
    </div>
    ${p.content ? `<div style="font-size:14px;line-height:1.7;color:var(--text-1);margin-bottom:16px;white-space:pre-wrap">${p.content}</div>` : ''}
    ${p.pdf_filename ? `
      <div style="margin-top:16px;padding:12px 16px;background:var(--surface-2);border-radius:var(--radius);display:flex;align-items:center;gap:10px">
        <i class="fa-solid fa-file-pdf" style="color:#dc2626;font-size:20px"></i>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">Documento PDF anexo</div>
          <div style="font-size:12px;color:var(--text-3)">Clique para visualizar</div>
        </div>
        <a href="/api/policies/${p.id}/pdf" target="_blank" class="btn-primary" style="text-decoration:none;font-size:13px">
          <i class="fa-solid fa-external-link"></i> Abrir PDF
        </a>
      </div>` : ''}
    <div style="margin-top:16px;font-size:12px;color:var(--text-3)">
      Criado em ${fmtDate(p.created_at)}${p.updated_at ? ' · Atualizado em ' + fmtDate(p.updated_at) : ''}
    </div>
  `);
}

function openNewPolicy() {
  openModal('Nova Política', `
    <div class="form-group"><label>Título *</label><input type="text" id="pol-title" placeholder="Ex: Política de Férias"></div>
    <div class="form-group"><label>Categoria *</label><select id="pol-category">
      <option value="RH">RH</option>
      <option value="Financeiro">Financeiro</option>
      <option value="TI">TI</option>
      <option value="Compliance">Compliance</option>
      <option value="Operacional">Operacional</option>
      <option value="Geral">Geral</option>
    </select></div>
    <div class="form-group"><label>Descrição</label><textarea id="pol-content" style="min-height:140px" placeholder="Descreva o conteúdo da política..."></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Status</label><select id="pol-status">
        <option value="ativa">Ativa</option>
        <option value="inativa">Inativa</option>
      </select></div>
      <div class="form-group"><label>Prioridade</label><select id="pol-priority">
        <option value="alta">🔴 Alta</option>
        <option value="media" selected>🟡 Média</option>
        <option value="baixa">🟢 Baixa</option>
      </select></div>
    </div>
    <div class="form-group"><label>Arquivo PDF (opcional)</label><input type="file" id="pol-pdf" accept=".pdf"></div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveNewPolicy()"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `);
}

async function saveNewPolicy() {
  const title = document.getElementById('pol-title')?.value?.trim();
  const category = document.getElementById('pol-category')?.value;
  if (!title) { showToast('Título obrigatório', 'error'); return; }
  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('content', document.getElementById('pol-content')?.value || '');
  formData.append('status', document.getElementById('pol-status')?.value || 'ativa');
  formData.append('priority', document.getElementById('pol-priority')?.value || 'media');
  const pdfFile = document.getElementById('pol-pdf')?.files[0];
  if (pdfFile) formData.append('pdf', pdfFile);
  const res = await fetch('/api/policies', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
  const data = await res.json();
  if (res.ok) { closeModal(); showToast('Política criada!'); navigate('rh-politicas'); }
  else showToast(data.error || 'Erro ao salvar', 'error');
}

async function openEditPolicy(id) {
  const p = await api.get('/policies/' + id);
  if (!p) return;
  openModal('Editar Política', `
    <div class="form-group"><label>Título *</label><input type="text" id="pol-title" value="${p.title.replace(/"/g,'&quot;')}"></div>
    <div class="form-group"><label>Categoria *</label><select id="pol-category">
      <option value="RH" ${p.category==='RH'?'selected':''}>RH</option>
      <option value="Financeiro" ${p.category==='Financeiro'?'selected':''}>Financeiro</option>
      <option value="TI" ${p.category==='TI'?'selected':''}>TI</option>
      <option value="Compliance" ${p.category==='Compliance'?'selected':''}>Compliance</option>
      <option value="Operacional" ${p.category==='Operacional'?'selected':''}>Operacional</option>
      <option value="Geral" ${p.category==='Geral'?'selected':''}>Geral</option>
    </select></div>
    <div class="form-group"><label>Descrição</label><textarea id="pol-content" style="min-height:140px">${p.content || ''}</textarea></div>
    <div class="form-group"><label>${p.pdf_filename ? 'Substituir PDF (opcional)' : 'Arquivo PDF (opcional)'}</label>
      ${p.pdf_filename ? `<div style="margin-bottom:8px;font-size:12px;color:var(--text-3)"><i class="fa-solid fa-file-pdf" style="color:#dc2626"></i> PDF já anexado — envie outro para substituir</div>` : ''}
      <input type="file" id="pol-pdf" accept=".pdf">
    </div>
    <div class="form-row">
      <div class="form-group"><label>Status</label><select id="pol-status">
        <option value="ativa" ${p.status === 'ativa' ? 'selected' : ''}>Ativa</option>
        <option value="inativa" ${p.status === 'inativa' ? 'selected' : ''}>Inativa</option>
      </select></div>
      <div class="form-group"><label>Prioridade</label><select id="pol-priority">
        <option value="alta" ${p.priority === 'alta' ? 'selected' : ''}>🔴 Alta</option>
        <option value="media" ${p.priority === 'media' ? 'selected' : ''}>🟡 Média</option>
        <option value="baixa" ${p.priority === 'baixa' ? 'selected' : ''}>🟢 Baixa</option>
      </select></div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="saveEditPolicy('${id}')"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
    </div>
  `);
}

async function saveEditPolicy(id) {
  const title = document.getElementById('pol-title')?.value?.trim();
  const category = document.getElementById('pol-category')?.value;
  if (!title) { showToast('Título obrigatório', 'error'); return; }
  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('content', document.getElementById('pol-content')?.value || '');
  formData.append('status', document.getElementById('pol-status')?.value || 'ativa');
  formData.append('priority', document.getElementById('pol-priority')?.value || 'media');
  const pdfFile = document.getElementById('pol-pdf')?.files[0];
  if (pdfFile) formData.append('pdf', pdfFile);
  const res = await fetch('/api/policies/' + id, {
    method: 'PUT',
    body: formData,
    credentials: 'include'
  });
  const data = await res.json();
  if (res.ok) { closeModal(); showToast('Política atualizada!'); navigate('rh-politicas'); }
  else showToast(data.error || 'Erro ao salvar', 'error');
}

async function deletePolicy(id) {
  if (!confirm('Excluir esta política? Esta ação não pode ser desfeita.')) return;
  const res = await api.delete('/policies/' + id);
  if (res) { showToast('Política excluída'); navigate('rh-politicas'); }
}