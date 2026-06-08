from flask import Flask, request, jsonify, session, send_from_directory, render_template_string
from flask_cors import CORS
import sqlite3
import bcrypt
import os
import uuid
import json
from datetime import datetime, date
import re

app = Flask(__name__, static_folder='../frontend', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'sistema-rh-secret-key-change-in-production')
CORS(app, supports_credentials=True)

DB_PATH = os.environ.get('DB_PATH', os.path.join(os.path.dirname(__file__), '..', 'data', 'sistema_rh.db'))
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            department TEXT,
            avatar TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            department TEXT,
            position TEXT,
            manager TEXT,
            admission_date TEXT,
            birth_date TEXT,
            phone TEXT,
            cpf TEXT,
            status TEXT DEFAULT 'active',
            photo TEXT,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS records (
            id TEXT PRIMARY KEY,
            area TEXT NOT NULL,
            module TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            employee_id TEXT,
            status TEXT DEFAULT 'active',
            priority TEXT DEFAULT 'medium',
            due_date TEXT,
            tags TEXT,
            attachments TEXT,
            created_by TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS performance_reviews (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            reviewer_id TEXT,
            period TEXT,
            scores TEXT,
            overall_score REAL,
            comments TEXT,
            status TEXT DEFAULT 'draft',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS surveys (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            questions TEXT,
            responses TEXT,
            status TEXT DEFAULT 'draft',
            start_date TEXT,
            end_date TEXT,
            created_by TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            event_type TEXT,
            date TEXT,
            time TEXT,
            location TEXT,
            attendees TEXT,
            created_by TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS news (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            category TEXT,
            author TEXT,
            published INTEGER DEFAULT 0,
            pinned INTEGER DEFAULT 0,
            image TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS org_chart (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            parent_id TEXT,
            position TEXT,
            level INTEGER DEFAULT 0,
            order_index INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS knowledge_base (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            category TEXT,
            tags TEXT,
            author TEXT,
            views INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS benefits (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            supplier TEXT,
            contact TEXT,
            url TEXT,
            active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS recognitions (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            recognized_by TEXT,
            type TEXT,
            message TEXT,
            points INTEGER DEFAULT 0,
            public INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS service_requests (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            priority TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'open',
            requester_id TEXT,
            assigned_to TEXT,
            resolution TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            action TEXT,
            resource TEXT,
            resource_id TEXT,
            details TEXT,
            ip_address TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    ''')

    # Seed admin user
    admin_check = c.execute("SELECT id FROM users WHERE email = 'admin@empresa.com'").fetchone()
    if not admin_check:
        hashed = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        c.execute("""INSERT INTO users (id, name, email, password_hash, role, department)
                     VALUES (?, ?, ?, ?, ?, ?)""",
                  (str(uuid.uuid4()), 'Administrador', 'admin@empresa.com', hashed, 'admin', 'RH'))

        # Seed demo employees
        departments = ['Tecnologia', 'Financeiro', 'Comercial', 'Operações', 'RH', 'Marketing']
        positions = ['Analista', 'Coordenador', 'Gerente', 'Diretor', 'Assistente', 'Especialista']
        demo_employees = [
            ('Ana Silva', 'ana.silva@empresa.com', 'RH', 'Gerente de RH', '2021-03-15', '1988-07-22'),
            ('Carlos Mendes', 'carlos.mendes@empresa.com', 'Tecnologia', 'Desenvolvedor Sênior', '2020-06-01', '1990-11-05'),
            ('Fernanda Lima', 'fernanda.lima@empresa.com', 'Financeiro', 'Analista Financeiro', '2022-01-10', '1993-04-18'),
            ('Roberto Costa', 'roberto.costa@empresa.com', 'Comercial', 'Gerente Comercial', '2019-08-20', '1985-09-30'),
            ('Juliana Rocha', 'juliana.rocha@empresa.com', 'Marketing', 'Analista de Marketing', '2023-02-14', '1995-12-03'),
            ('Marcos Andrade', 'marcos.andrade@empresa.com', 'Operações', 'Coordenador Operacional', '2021-11-08', '1987-06-25'),
        ]
        for emp in demo_employees:
            emp_id = str(uuid.uuid4())
            c.execute("""INSERT INTO employees (id, name, email, department, position, admission_date, birth_date, status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')""",
                      (emp_id, emp[0], emp[1], emp[2], emp[3], emp[4], emp[5]))

        # Seed demo news
        news_items = [
            ('Bem-vindo ao novo Sistema de Gestão de Pessoas!', 'Estamos lançando nossa plataforma integrada...', 'Comunicado', 1, 1),
            ('Programa de Metas Q3 2026', 'Acesse os objetivos do trimestre...', 'Metas', 1, 0),
            ('Treinamento de Liderança - Vagas Abertas', 'Inscrições abertas para o programa de liderança...', 'Treinamento', 1, 0),
        ]
        for n in news_items:
            c.execute("""INSERT INTO news (id, title, content, category, author, published, pinned)
                         VALUES (?, ?, ?, ?, ?, ?, ?)""",
                      (str(uuid.uuid4()), n[0], n[1], n[2], 'Administrador', n[3], n[4]))

        # Sem benefícios padrão — cadastre pelo portal

    conn.commit()

    # Migrações seguras — não recriam tabelas, apenas adicionam colunas se não existirem
    migrations = [
        "ALTER TABLE employees ADD COLUMN is_parent INTEGER DEFAULT 0",
        "ALTER TABLE employees ADD COLUMN parent_type TEXT DEFAULT ''",
        "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'",
        "ALTER TABLE records ADD COLUMN start_date TEXT DEFAULT ''",
        "ALTER TABLE records ADD COLUMN progress INTEGER DEFAULT 0",
        "ALTER TABLE employees ADD COLUMN exit_date TEXT DEFAULT ''",
        """CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'Geral',
            filename TEXT NOT NULL,
            original_name TEXT,
            size INTEGER,
            uploaded_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
        """CREATE TABLE IF NOT EXISTS career_history (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            event_type TEXT DEFAULT 'promotion',
            previous_position TEXT,
            new_position TEXT,
            previous_department TEXT,
            new_department TEXT,
            notes TEXT,
            event_date TEXT,
            created_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""",
    ]
    for sql in migrations:
        try:
            conn.execute(sql)
            conn.commit()
        except Exception:
            pass  # Coluna já existe, ignorar

    conn.close()

def log_action(user_id, action, resource, resource_id='', details=''):
    try:
        conn = get_db()
        conn.execute("""INSERT INTO audit_log (id, user_id, action, resource, resource_id, details)
                        VALUES (?, ?, ?, ?, ?, ?)""",
                     (str(uuid.uuid4()), user_id, action, resource, resource_id, details))
        conn.commit()
        conn.close()
    except:
        pass

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Não autorizado'}), 401
        return f(*args, **kwargs)
    return decorated

def require_role(*allowed_roles):
    from functools import wraps
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'Não autorizado'}), 401
            role = session.get('user_role', 'colaborador')
            if role not in allowed_roles:
                return jsonify({'error': 'Acesso negado para este perfil'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

EDIT_ROLES = ['admin', 'rh', 'gestor']
READ_ROLES = ['admin', 'rh', 'gestor', 'lideranca', 'colaborador']

# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ? AND active = 1", (email,)).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'Credenciais inválidas'}), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({'error': 'Credenciais inválidas'}), 401

    session['user_id'] = user['id']
    session['user_name'] = user['name']
    session['user_role'] = user['role']
    session.permanent = True

    log_action(user['id'], 'LOGIN', 'auth')
    return jsonify({'user': {'id': user['id'], 'name': user['name'], 'email': user['email'], 'role': user['role'], 'department': user['department']}})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/auth/me', methods=['GET'])
@login_required
def me():
    conn = get_db()
    user = conn.execute("SELECT id, name, email, role, department FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    conn.close()
    if user:
        return jsonify(dict(user))
    return jsonify({'error': 'Usuário não encontrado'}), 404

# ── DASHBOARD ─────────────────────────────────────────────────────────────────
@app.route('/api/dashboard/stats', methods=['GET'])
@login_required
def dashboard_stats():
    conn = get_db()
    employees = conn.execute("SELECT COUNT(*) as c FROM employees WHERE status='active'").fetchone()['c']
    news_count = conn.execute("SELECT COUNT(*) as c FROM news WHERE published=1").fetchone()['c']
    open_requests = conn.execute("SELECT COUNT(*) as c FROM service_requests WHERE status='open'").fetchone()['c']
    recognitions = conn.execute("SELECT COUNT(*) as c FROM recognitions").fetchone()['c']

    today = date.today()
    month = today.month
    birthdays = conn.execute(
        "SELECT name, birth_date FROM employees WHERE status='active' AND strftime('%m', birth_date) = ?",
        (f"{month:02d}",)
    ).fetchall()

    work_anniversaries = conn.execute(
        """SELECT name, admission_date FROM employees
           WHERE status='active'
           AND strftime('%m', admission_date) = ?
           AND admission_date IS NOT NULL AND admission_date != ''
           AND strftime('%Y', admission_date) < strftime('%Y', 'now')""",
        (f"{month:02d}",)
    ).fetchall()

    recent_news = conn.execute(
        "SELECT id, title, category, created_at FROM news WHERE published=1 ORDER BY created_at DESC LIMIT 5"
    ).fetchall()

    dept_counts = conn.execute(
        "SELECT department, COUNT(*) as c FROM employees WHERE status='active' GROUP BY department ORDER BY c DESC"
    ).fetchall()

    conn.close()
    return jsonify({
        'employees': employees,
        'news': news_count,
        'open_requests': open_requests,
        'recognitions': recognitions,
        'birthdays_this_month': [dict(b) for b in birthdays],
        'work_anniversaries_this_month': [dict(w) for w in work_anniversaries],
        'recent_news': [dict(n) for n in recent_news],
        'dept_counts': [dict(d) for d in dept_counts]
    })

# ── EMPLOYEES ─────────────────────────────────────────────────────────────────
@app.route('/api/employees', methods=['GET'])
@login_required
def get_employees():
    search = request.args.get('search', '')
    dept = request.args.get('department', '')
    status = request.args.get('status', 'active')
    conn = get_db()
    query = "SELECT * FROM employees WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status)
    if search:
        query += " AND (name LIKE ? OR email LIKE ? OR position LIKE ?)"
        params.extend([f'%{search}%'] * 3)
    if dept:
        query += " AND department = ?"
        params.append(dept)
    query += " ORDER BY name ASC"
    employees = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(e) for e in employees])

@app.route('/api/employees', methods=['POST'])
@require_role(*EDIT_ROLES)
def create_employee():
    data = request.get_json()
    emp_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute("""INSERT INTO employees (id, name, email, department, position, manager, admission_date, birth_date, phone, cpf, status, notes, is_parent, parent_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                 (emp_id, data.get('name'), data.get('email'), data.get('department'), data.get('position'),
                  data.get('manager'), data.get('admission_date'), data.get('birth_date'),
                  data.get('phone'), data.get('cpf'), data.get('status', 'active'), data.get('notes'),
                  1 if data.get('is_parent') else 0, data.get('parent_type', '')))
    conn.commit()
    conn.close()
    log_action(session['user_id'], 'CREATE', 'employee', emp_id, data.get('name'))
    return jsonify({'id': emp_id, 'success': True}), 201

@app.route('/api/employees/<emp_id>', methods=['GET'])
@login_required
def get_employee(emp_id):
    conn = get_db()
    emp = conn.execute("SELECT * FROM employees WHERE id = ?", (emp_id,)).fetchone()
    conn.close()
    if not emp:
        return jsonify({'error': 'Não encontrado'}), 404
    return jsonify(dict(emp))

@app.route('/api/employees/<emp_id>', methods=['PUT'])
@require_role(*EDIT_ROLES)
def update_employee(emp_id):
    data = request.get_json()
    conn = get_db()
    conn.execute("""UPDATE employees SET name=?, email=?, department=?, position=?, manager=?,
                    admission_date=?, birth_date=?, phone=?, cpf=?, status=?, notes=?,
                    is_parent=?, parent_type=?, exit_date=?, updated_at=CURRENT_TIMESTAMP
                    WHERE id=?""",
                 (data.get('name'), data.get('email'), data.get('department'), data.get('position'),
                  data.get('manager'), data.get('admission_date'), data.get('birth_date'),
                  data.get('phone'), data.get('cpf'), data.get('status'), data.get('notes'),
                  1 if data.get('is_parent') else 0, data.get('parent_type', ''),
                  data.get('exit_date', ''), emp_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/employees/<emp_id>', methods=['DELETE'])
@require_role('admin')
def delete_employee(emp_id):
    data = request.get_json(silent=True) or {}
    exit_date = data.get('exit_date', '')
    conn = get_db()
    conn.execute("UPDATE employees SET status='inactive', exit_date=? WHERE id=?", (exit_date, emp_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── EXPORT / IMPORT EMPLOYEES ─────────────────────────────────────────────────
@app.route('/api/employees/export', methods=['GET'])
@login_required
def export_employees():
    import csv, io
    conn = get_db()
    emps = conn.execute("SELECT name, email, department, position, manager, admission_date, birth_date, phone, cpf, status, is_parent, parent_type, notes FROM employees ORDER BY name").fetchall()
    conn.close()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Nome','E-mail','Departamento','Cargo','Gestor','Admissão','Nascimento','Telefone','CPF','Status','É Pai/Mãe','Tipo (pai/mae)','Observações'])
    for e in emps:
        writer.writerow([
            e['name'], e['email'] or '', e['department'] or '', e['position'] or '',
            e['manager'] or '', e['admission_date'] or '', e['birth_date'] or '',
            e['phone'] or '', e['cpf'] or '', e['status'] or 'active',
            'Sim' if e['is_parent'] else 'Não', e['parent_type'] or '', e['notes'] or ''
        ])
    output.seek(0)
    from flask import Response
    return Response(
        '\ufeff' + output.getvalue(),
        mimetype='text/csv; charset=utf-8',
        headers={'Content-Disposition': 'attachment; filename=colaboradores.csv'}
    )

@app.route('/api/employees/import', methods=['POST'])
@require_role(*EDIT_ROLES)
def import_employees():
    import csv, io
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    file = request.files['file']
    content = file.read().decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(content))
    conn = get_db()
    inserted, skipped = 0, 0
    for row in reader:
        name = row.get('Nome') or row.get('name') or ''
        if not name.strip():
            skipped += 1
            continue
        email = row.get('E-mail') or row.get('email') or ''
        dept = row.get('Departamento') or row.get('department') or ''
        position = row.get('Cargo') or row.get('position') or ''
        manager = row.get('Gestor') or row.get('manager') or ''
        admission = row.get('Admissão') or row.get('admission_date') or ''
        birth = row.get('Nascimento') or row.get('birth_date') or ''
        phone = row.get('Telefone') or row.get('phone') or ''
        cpf = row.get('CPF') or row.get('cpf') or ''
        status = row.get('Status') or row.get('status') or 'active'
        is_parent_raw = row.get('É Pai/Mãe') or row.get('is_parent') or ''
        is_parent = 1 if is_parent_raw.lower() in ['sim', '1', 'true', 'yes'] else 0
        parent_type = row.get('Tipo (pai/mae)') or row.get('parent_type') or ''
        notes = row.get('Observações') or row.get('notes') or ''
        try:
            conn.execute(
                """INSERT INTO employees (id, name, email, department, position, manager, admission_date, birth_date, phone, cpf, status, notes, is_parent, parent_type)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (str(uuid.uuid4()), name.strip(), email.strip(), dept.strip(), position.strip(),
                 manager.strip(), admission.strip(), birth.strip(), phone.strip(), cpf.strip(),
                 status.strip(), notes.strip(), is_parent, parent_type.strip())
            )
            inserted += 1
        except Exception:
            skipped += 1
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'inserted': inserted, 'skipped': skipped})

# ── RECORDS (Generic for most modules) ───────────────────────────────────────
@app.route('/api/records', methods=['GET'])
@login_required
def get_records():
    area = request.args.get('area', '')
    module = request.args.get('module', '')
    employee_id = request.args.get('employee_id', '')
    search = request.args.get('search', '')
    conn = get_db()
    query = "SELECT * FROM records WHERE 1=1"
    params = []
    if area:
        query += " AND area = ?"
        params.append(area)
    if module:
        query += " AND module = ?"
        params.append(module)
    if employee_id:
        query += " AND employee_id = ?"
        params.append(employee_id)
    if search:
        query += " AND (title LIKE ? OR content LIKE ?)"
        params.extend([f'%{search}%', f'%{search}%'])
    query += " ORDER BY created_at DESC"
    records = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in records])

@app.route('/api/records', methods=['POST'])
@login_required
def create_record():
    data = request.get_json()
    rec_id = str(uuid.uuid4())
    content = json.dumps(data.get('content', {})) if isinstance(data.get('content'), dict) else data.get('content', '')
    tags = json.dumps(data.get('tags', [])) if isinstance(data.get('tags'), list) else data.get('tags', '')
    conn = get_db()
    conn.execute("""INSERT INTO records (id, area, module, title, content, employee_id, status, priority, due_date, start_date, progress, tags, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                 (rec_id, data.get('area'), data.get('module'), data.get('title'), content,
                  data.get('employee_id'), data.get('status', 'active'), data.get('priority', 'medium'),
                  data.get('due_date'), data.get('start_date', ''), data.get('progress', 0),
                  tags, session['user_id']))
    conn.commit()
    conn.close()
    log_action(session['user_id'], 'CREATE', f"{data.get('area')}/{data.get('module')}", rec_id, data.get('title'))
    return jsonify({'id': rec_id, 'success': True}), 201

@app.route('/api/records/<rec_id>', methods=['PUT'])
@login_required
def update_record(rec_id):
    data = request.get_json()
    content = json.dumps(data.get('content', {})) if isinstance(data.get('content'), dict) else data.get('content', '')
    conn = get_db()
    conn.execute("""UPDATE records SET title=?, content=?, status=?, priority=?, due_date=?,
                    start_date=?, progress=?, updated_at=CURRENT_TIMESTAMP WHERE id=?""",
                 (data.get('title'), content, data.get('status'), data.get('priority'),
                  data.get('due_date'), data.get('start_date', ''), data.get('progress', 0), rec_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/records/<rec_id>', methods=['DELETE'])
@login_required
def delete_record(rec_id):
    conn = get_db()
    conn.execute("DELETE FROM records WHERE id=?", (rec_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── NEWS ──────────────────────────────────────────────────────────────────────
@app.route('/api/news', methods=['GET'])
@login_required
def get_news():
    conn = get_db()
    news = conn.execute("SELECT * FROM news ORDER BY pinned DESC, created_at DESC").fetchall()
    conn.close()
    return jsonify([dict(n) for n in news])

@app.route('/api/news', methods=['POST'])
@require_role(*EDIT_ROLES)
def create_news():
    data = request.get_json()
    news_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute("""INSERT INTO news (id, title, content, category, author, published, pinned)
                    VALUES (?, ?, ?, ?, ?, ?, ?)""",
                 (news_id, data.get('title'), data.get('content'), data.get('category'),
                  session.get('user_name', 'Sistema'), data.get('published', 0), data.get('pinned', 0)))
    conn.commit()
    conn.close()
    return jsonify({'id': news_id, 'success': True}), 201

@app.route('/api/news/<news_id>', methods=['PUT'])
@login_required
def update_news(news_id):
    data = request.get_json()
    conn = get_db()
    conn.execute("""UPDATE news SET title=?, content=?, category=?, published=?, pinned=?, updated_at=CURRENT_TIMESTAMP
                    WHERE id=?""",
                 (data.get('title'), data.get('content'), data.get('category'),
                  data.get('published', 0), data.get('pinned', 0), news_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/news/<news_id>', methods=['DELETE'])
@require_role('admin')
def delete_news(news_id):
    conn = get_db()
    conn.execute("DELETE FROM news WHERE id=?", (news_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── EVENTS ────────────────────────────────────────────────────────────────────
@app.route('/api/events', methods=['GET'])
@login_required
def get_events():
    conn = get_db()
    events = conn.execute("SELECT * FROM events ORDER BY date ASC").fetchall()
    conn.close()
    return jsonify([dict(e) for e in events])

@app.route('/api/events', methods=['POST'])
@require_role(*EDIT_ROLES)
def create_event():
    data = request.get_json()
    ev_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute("""INSERT INTO events (id, title, description, event_type, date, time, location, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                 (ev_id, data.get('title'), data.get('description'), data.get('event_type'),
                  data.get('date'), data.get('time'), data.get('location'), session['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'id': ev_id, 'success': True}), 201

# ── BENEFITS ──────────────────────────────────────────────────────────────────
@app.route('/api/benefits', methods=['GET'])
@login_required
def get_benefits():
    conn = get_db()
    benefits = conn.execute("SELECT * FROM benefits WHERE active=1 ORDER BY category, title").fetchall()
    conn.close()
    return jsonify([dict(b) for b in benefits])

@app.route('/api/benefits', methods=['POST'])
@require_role(*EDIT_ROLES)
def create_benefit():
    data = request.get_json()
    b_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute("""INSERT INTO benefits (id, title, description, category, supplier, contact, url)
                    VALUES (?, ?, ?, ?, ?, ?, ?)""",
                 (b_id, data.get('title'), data.get('description'), data.get('category'),
                  data.get('supplier'), data.get('contact'), data.get('url')))
    conn.commit()
    conn.close()
    return jsonify({'id': b_id, 'success': True}), 201

@app.route('/api/benefits/<b_id>', methods=['DELETE'])
@require_role('admin')
def delete_benefit(b_id):
    conn = get_db()
    conn.execute("UPDATE benefits SET active=0 WHERE id=?", (b_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── RECOGNITIONS ──────────────────────────────────────────────────────────────
@app.route('/api/recognitions', methods=['GET'])
@login_required
def get_recognitions():
    conn = get_db()
    recs = conn.execute("""
        SELECT r.*, e.name as employee_name, e.department, e.position
        FROM recognitions r
        LEFT JOIN employees e ON r.employee_id = e.id
        ORDER BY r.created_at DESC LIMIT 50
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in recs])

@app.route('/api/recognitions', methods=['POST'])
@login_required
def create_recognition():
    data = request.get_json()
    r_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute("""INSERT INTO recognitions (id, employee_id, recognized_by, type, message, points, public)
                    VALUES (?, ?, ?, ?, ?, ?, ?)""",
                 (r_id, data.get('employee_id'), session.get('user_name', 'Sistema'),
                  data.get('type'), data.get('message'), data.get('points', 0), data.get('public', 1)))
    conn.commit()
    conn.close()
    return jsonify({'id': r_id, 'success': True}), 201

# ── KNOWLEDGE BASE ────────────────────────────────────────────────────────────
@app.route('/api/knowledge', methods=['GET'])
@login_required
def get_knowledge():
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    conn = get_db()
    query = "SELECT * FROM knowledge_base WHERE 1=1"
    params = []
    if search:
        query += " AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)"
        params.extend([f'%{search}%'] * 3)
    if category:
        query += " AND category = ?"
        params.append(category)
    query += " ORDER BY views DESC, created_at DESC"
    items = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(i) for i in items])

@app.route('/api/knowledge', methods=['POST'])
@require_role(*EDIT_ROLES)
def create_knowledge():
    data = request.get_json()
    k_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute("""INSERT INTO knowledge_base (id, title, content, category, tags, author)
                    VALUES (?, ?, ?, ?, ?, ?)""",
                 (k_id, data.get('title'), data.get('content'), data.get('category'),
                  data.get('tags'), session.get('user_name')))
    conn.commit()
    conn.close()
    return jsonify({'id': k_id, 'success': True}), 201

# ── SERVICE REQUESTS ──────────────────────────────────────────────────────────
@app.route('/api/service-requests', methods=['GET'])
@login_required
def get_service_requests():
    conn = get_db()
    reqs = conn.execute("SELECT * FROM service_requests ORDER BY created_at DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in reqs])

@app.route('/api/service-requests', methods=['POST'])
@login_required
def create_service_request():
    data = request.get_json()
    req_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute("""INSERT INTO service_requests (id, title, description, category, priority, status, requester_id)
                    VALUES (?, ?, ?, ?, ?, 'open', ?)""",
                 (req_id, data.get('title'), data.get('description'), data.get('category'),
                  data.get('priority', 'medium'), session['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'id': req_id, 'success': True}), 201

@app.route('/api/service-requests/<req_id>', methods=['PUT'])
@login_required
def update_service_request(req_id):
    data = request.get_json()
    conn = get_db()
    conn.execute("""UPDATE service_requests SET status=?, assigned_to=?, resolution=?, updated_at=CURRENT_TIMESTAMP
                    WHERE id=?""",
                 (data.get('status'), data.get('assigned_to'), data.get('resolution'), req_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── PERFORMANCE REVIEWS ───────────────────────────────────────────────────────
@app.route('/api/performance', methods=['GET'])
@login_required
def get_performance():
    employee_id = request.args.get('employee_id', '')
    conn = get_db()
    query = """SELECT pr.*, e.name as employee_name FROM performance_reviews pr
               LEFT JOIN employees e ON pr.employee_id = e.id"""
    params = []
    if employee_id:
        query += " WHERE pr.employee_id = ?"
        params.append(employee_id)
    query += " ORDER BY pr.created_at DESC"
    reviews = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in reviews])

@app.route('/api/performance', methods=['POST'])
@require_role(*EDIT_ROLES)
def create_performance():
    data = request.get_json()
    pr_id = str(uuid.uuid4())
    scores = json.dumps(data.get('scores', {}))
    conn = get_db()
    conn.execute("""INSERT INTO performance_reviews (id, employee_id, reviewer_id, period, scores, overall_score, comments, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                 (pr_id, data.get('employee_id'), session['user_id'], data.get('period'),
                  scores, data.get('overall_score'), data.get('comments'), data.get('status', 'draft')))
    conn.commit()
    conn.close()
    return jsonify({'id': pr_id, 'success': True}), 201

# ── USERS ─────────────────────────────────────────────────────────────────────
@app.route('/api/users', methods=['GET'])
@login_required
def get_users():
    if session.get('user_role') != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    conn = get_db()
    users = conn.execute("SELECT id, name, email, role, department, created_at, active FROM users").fetchall()
    conn.close()
    return jsonify([dict(u) for u in users])

@app.route('/api/users', methods=['POST'])
@login_required
def create_user():
    if session.get('user_role') != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    data = request.get_json()
    user_id = str(uuid.uuid4())
    hashed = bcrypt.hashpw(data.get('password', 'senha123').encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    conn = get_db()
    try:
        conn.execute("""INSERT INTO users (id, name, email, password_hash, role, department)
                        VALUES (?, ?, ?, ?, ?, ?)""",
                     (user_id, data.get('name'), data.get('email'), hashed, data.get('role', 'user'), data.get('department')))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email já cadastrado'}), 400
    finally:
        conn.close()
    return jsonify({'id': user_id, 'success': True}), 201

@app.route('/api/users/<user_id>/password', methods=['PUT'])
@login_required
def change_password(user_id):
    if session.get('user_id') != user_id and session.get('user_role') != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    data = request.get_json()
    hashed = bcrypt.hashpw(data.get('password', '').encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    conn = get_db()
    conn.execute("UPDATE users SET password_hash=? WHERE id=?", (hashed, user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── AUDIT ─────────────────────────────────────────────────────────────────────
@app.route('/api/audit', methods=['GET'])
@login_required
def get_audit():
    if session.get('user_role') != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    conn = get_db()
    logs = conn.execute("""
        SELECT al.*, u.name as user_name FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC LIMIT 200
    """).fetchall()
    conn.close()
    return jsonify([dict(l) for l in logs])

# ── DOCUMENTS ─────────────────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {'pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/documents', methods=['GET'])
@login_required
def get_documents():
    conn = get_db()
    docs = conn.execute("SELECT * FROM documents ORDER BY created_at DESC").fetchall()
    conn.close()
    return jsonify([dict(d) for d in docs])

@app.route('/api/documents', methods=['POST'])
@require_role(*EDIT_ROLES)
def upload_document():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    file = request.files['file']
    if not file.filename or not allowed_file(file.filename):
        return jsonify({'error': 'Tipo de arquivo não permitido'}), 400
    ext = file.filename.rsplit('.', 1)[1].lower()
    doc_id = str(uuid.uuid4())
    safe_name = f"{doc_id}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, safe_name)
    file.save(filepath)
    size = os.path.getsize(filepath)
    title = request.form.get('title') or file.filename
    description = request.form.get('description', '')
    category = request.form.get('category', 'Geral')
    conn = get_db()
    conn.execute("""INSERT INTO documents (id, title, description, category, filename, original_name, size, uploaded_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                 (doc_id, title, description, category, safe_name, file.filename, size, session.get('user_id')))
    conn.commit()
    conn.close()
    return jsonify({'id': doc_id, 'success': True}), 201

@app.route('/api/documents/<doc_id>/download', methods=['GET'])
@login_required
def download_document(doc_id):
    conn = get_db()
    doc = conn.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
    conn.close()
    if not doc:
        return jsonify({'error': 'Não encontrado'}), 404
    from flask import send_file
    filepath = os.path.join(UPLOAD_FOLDER, doc['filename'])
    return send_file(filepath, as_attachment=True, download_name=doc['original_name'])

@app.route('/api/documents/<doc_id>', methods=['DELETE'])
@require_role('admin')
def delete_document(doc_id):
    conn = get_db()
    doc = conn.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
    if doc:
        try:
            os.remove(os.path.join(UPLOAD_FOLDER, doc['filename']))
        except Exception:
            pass
        conn.execute("DELETE FROM documents WHERE id=?", (doc_id,))
        conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── CAREER HISTORY ─────────────────────────────────────────────────────────────
@app.route('/api/employees/<emp_id>/career', methods=['GET'])
@login_required
def get_career_history(emp_id):
    conn = get_db()
    history = conn.execute(
        "SELECT * FROM career_history WHERE employee_id=? ORDER BY event_date DESC, created_at DESC",
        (emp_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(h) for h in history])

@app.route('/api/employees/<emp_id>/career', methods=['POST'])
@require_role(*EDIT_ROLES)
def add_career_event(emp_id):
    data = request.get_json()
    conn = get_db()
    conn.execute("""INSERT INTO career_history (id, employee_id, event_type, previous_position, new_position,
                    previous_department, new_department, notes, event_date, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                 (str(uuid.uuid4()), emp_id, data.get('event_type', 'promotion'),
                  data.get('previous_position'), data.get('new_position'),
                  data.get('previous_department'), data.get('new_department'),
                  data.get('notes'), data.get('event_date'), session.get('user_id')))
    conn.commit()
    conn.close()
    return jsonify({'success': True}), 201

@app.route('/api/employees/<emp_id>/career/<hist_id>', methods=['DELETE'])
@require_role('admin')
def delete_career_event(emp_id, hist_id):
    conn = get_db()
    conn.execute("DELETE FROM career_history WHERE id=? AND employee_id=?", (hist_id, emp_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ── SERVE FRONTEND ────────────────────────────────────────────────────────────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        response = send_from_directory(app.static_folder, path)
    else:
        response = send_from_directory(app.static_folder, 'index.html')
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    return response

# Inicializar banco ao carregar o módulo (necessário para gunicorn)
init_db()

if __name__ == '__main__':
    print("\n✅ Sistema RH iniciado em http://localhost:5000")
    print("📧 Login: admin@empresa.com | Senha: admin123\n")
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(debug=debug, port=port, host='0.0.0.0')
