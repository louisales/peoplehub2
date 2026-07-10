from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import psycopg2.errors
import bcrypt
import os
import uuid
import json
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, date, timedelta
from dotenv import load_dotenv
import secrets
import hashlib
import csv as _csv
import io as _io
from flask import Response as _Response

load_dotenv()

app = Flask(__name__, static_folder='../frontend', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'sistema-rh-secret-key-change-in-production')
CORS(app, supports_credentials=True)

DATABASE_URL = os.environ.get('DATABASE_URL')
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def row_to_dict(row, cursor):
    if row is None:
        return None
    columns = [desc[0] for desc in cursor.description]
    result = {}
    for col, val in zip(columns, row):
        if isinstance(val, (datetime, date)):
            result[col] = val.isoformat()
        else:
            result[col] = val
    return result


def rows_to_list(rows, cursor):
    columns = [desc[0] for desc in cursor.description]
    result = []
    for row in rows:
        d = {}
        for col, val in zip(columns, row):
            if isinstance(val, (datetime, date)):
                d[col] = val.isoformat()
            else:
                d[col] = val
        result.append(d)
    return result


def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            department TEXT,
            avatar TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            active INTEGER DEFAULT 1
        )
    """)

    c.execute("""
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS performance_reviews (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            reviewer_id TEXT,
            period TEXT,
            scores TEXT,
            overall_score REAL,
            comments TEXT,
            status TEXT DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS news (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            category TEXT,
            author TEXT,
            published INTEGER DEFAULT 0,
            pinned INTEGER DEFAULT 0,
            image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS org_chart (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            parent_id TEXT,
            position TEXT,
            level INTEGER DEFAULT 0,
            order_index INTEGER DEFAULT 0
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_base (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            category TEXT,
            tags TEXT,
            author TEXT,
            views INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS benefits (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            supplier TEXT,
            contact TEXT,
            url TEXT,
            active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS recognitions (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            recognized_by TEXT,
            type TEXT,
            message TEXT,
            points INTEGER DEFAULT 0,
            public INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            action TEXT,
            resource TEXT,
            resource_id TEXT,
            details TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS password_resets (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            email TEXT NOT NULL,
            token_hash TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used INTEGER DEFAULT 0,
            used_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS policies (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            content TEXT,
            pdf_filename TEXT,
            created_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)

    # Seed admin user
    c.execute("SELECT id FROM users WHERE email = 'admin@empresa.com'")
    if not c.fetchone():
        hashed = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        c.execute("""INSERT INTO users (id, name, email, password_hash, role, department)
                     VALUES (%s, %s, %s, %s, %s, %s)""",
                  (str(uuid.uuid4()), 'Administrador', 'admin@empresa.com', hashed, 'admin', 'RH'))

        demo_employees = [
            ('Ana Silva', 'ana.silva@empresa.com', 'RH', 'Gerente de RH', '2021-03-15', '1988-07-22'),
            ('Carlos Mendes', 'carlos.mendes@empresa.com', 'Tecnologia', 'Desenvolvedor Sênior', '2020-06-01', '1990-11-05'),
            ('Fernanda Lima', 'fernanda.lima@empresa.com', 'Financeiro', 'Analista Financeiro', '2022-01-10', '1993-04-18'),
            ('Roberto Costa', 'roberto.costa@empresa.com', 'Comercial', 'Gerente Comercial', '2019-08-20', '1985-09-30'),
            ('Juliana Rocha', 'juliana.rocha@empresa.com', 'Marketing', 'Analista de Marketing', '2023-02-14', '1995-12-03'),
            ('Marcos Andrade', 'marcos.andrade@empresa.com', 'Operações', 'Coordenador Operacional', '2021-11-08', '1987-06-25'),
        ]
        for emp in demo_employees:
            c.execute("""INSERT INTO employees (id, name, email, department, position, admission_date, birth_date, status)
                         VALUES (%s, %s, %s, %s, %s, %s, %s, 'active')""",
                      (str(uuid.uuid4()), emp[0], emp[1], emp[2], emp[3], emp[4], emp[5]))

        news_items = [
            ('Bem-vindo ao novo Sistema de Gestão de Pessoas!', 'Estamos lançando nossa plataforma integrada...', 'Comunicado', 1, 1),
            ('Programa de Metas Q3 2026', 'Acesse os objetivos do trimestre...', 'Metas', 1, 0),
            ('Treinamento de Liderança - Vagas Abertas', 'Inscrições abertas para o programa de liderança...', 'Treinamento', 1, 0),
        ]
        for n in news_items:
            c.execute("""INSERT INTO news (id, title, content, category, author, published, pinned)
                         VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                      (str(uuid.uuid4()), n[0], n[1], n[2], 'Administrador', n[3], n[4]))

        benefits_items = [
            ('Plano de Saúde', 'Cobertura médica e hospitalar completa', 'Saúde', 'Unimed'),
            ('Vale Refeição', 'R$ 35,00 por dia útil', 'Alimentação', 'Sodexo'),
            ('Gympass', 'Acesso a academias parceiras', 'Bem-estar', 'Gympass'),
            ('PLR', 'Participação nos Lucros e Resultados', 'Financeiro', 'Empresa'),
            ('Seguro de Vida', 'Cobertura para colaboradores e dependentes', 'Seguridade', 'Porto Seguro'),
        ]
        for b in benefits_items:
            c.execute("""INSERT INTO benefits (id, title, description, category, supplier, active)
                         VALUES (%s, %s, %s, %s, %s, 1)""",
                      (str(uuid.uuid4()), b[0], b[1], b[2], b[3]))

    conn.commit()
    conn.close()


def log_action(user_id, action, resource, resource_id='', details=''):
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("""INSERT INTO audit_log (id, user_id, action, resource, resource_id, details)
                     VALUES (%s, %s, %s, %s, %s, %s)""",
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


# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = %s AND active = 1", (email,))
    row = c.fetchone()
    user = row_to_dict(row, c) if row else None
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
    return jsonify({'user': {'id': user['id'], 'name': user['name'], 'email': user['email'],
                             'role': user['role'], 'department': user['department']}})


@app.route('/api/auth/logout', methods=['GET', 'POST'])
def logout():
    from flask import redirect
    session.clear()
    return redirect('/')

def send_reset_email(to_email, reset_link, user_name):
    gmail_user = os.environ.get('GMAIL_USER')
    gmail_password = os.environ.get('GMAIL_PASSWORD')

    if not gmail_user or not gmail_password:
        raise ValueError('GMAIL_USER e GMAIL_PASSWORD nao configurados no .env')

    subject = 'Redefinicao de Senha — Valore RH'

    html_body = (
        '<div style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">'
        '<div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden;">'
        '<div style="background: #1d4ed8; padding: 28px 32px;">'
        '<h1 style="color: #ffffff; margin: 0; font-size: 20px;">Valore RH</h1>'
        '<p style="color: #bfdbfe; margin: 4px 0 0;">Redefinicao de Senha</p>'
        '</div>'
        '<div style="padding: 32px;">'
        '<p style="color: #374151; font-size: 15px;">Ola, <strong>' + user_name + '</strong>!</p>'
        '<p style="color: #374151; font-size: 15px;">'
        'Recebemos uma solicitacao para redefinir a senha da sua conta no Valore RH. '
        'Clique no botao abaixo para criar uma nova senha.'
        '</p>'
        '<div style="text-align: center; margin: 32px 0;">'
        '<a href="' + reset_link + '" style="background: #1d4ed8; color: #ffffff; padding: 14px 28px; '
        'border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">'
        'Redefinir Minha Senha'
        '</a>'
        '</div>'
        '<p style="color: #6b7280; font-size: 13px;">'
        'Este link expira em <strong>1 hora</strong>.'
        '</p>'
        '<p style="color: #6b7280; font-size: 13px;">'
        'Se voce nao solicitou isso, pode ignorar este e-mail com seguranca. '
        'Sua senha nao sera alterada.'
        '</p>'
        '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">'
        '<p style="color: #9ca3af; font-size: 12px;">'
        'Se o botao nao funcionar, copie e cole este link no navegador:<br>'
        '<a href="' + reset_link + '" style="color: #1d4ed8;">' + reset_link + '</a>'
        '</p>'
        '</div>'
        '<div style="background: #f9fafb; padding: 16px 32px; text-align: center;">'
        '<p style="color: #9ca3af; font-size: 12px; margin: 0;">'
        'Este e um e-mail automatico. Por favor, nao responda.'
        '</p>'
        '</div>'
        '</div>'
        '</div>'
    )

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = 'Valore RH <' + gmail_user + '>'
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(gmail_user, gmail_password)
        server.sendmail(gmail_user, to_email, msg.as_string())


@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'E-mail e obrigatorio'}), 400

    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id, name, email FROM users WHERE email = %s AND active = 1', (email,))
    user = c.fetchone()

    if not user:
        c.close()
        conn.close()
        return jsonify({'message': 'Se este e-mail estiver cadastrado, voce recebera as instrucoes em breve.'}), 200

    user_id = user[0]
    user_name = user[1]
    user_email = user[2]

    c.execute('UPDATE password_resets SET used = 1 WHERE user_id = %s AND used = 0', (user_id,))

    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(hours=1)
    reset_id = str(uuid.uuid4())

    c.execute(
        'INSERT INTO password_resets (id, user_id, email, token_hash, expires_at) VALUES (%s, %s, %s, %s, %s)',
        (reset_id, user_id, user_email, token_hash, expires_at)
    )
    conn.commit()
    c.close()
    conn.close()

    app_url = os.environ.get('APP_URL', 'https://rh.valore.com.br')
    reset_link = app_url + '/reset-senha?token=' + raw_token

    try:
        send_reset_email(user_email, reset_link, user_name)
    except Exception as e:
        print('[ERRO EMAIL] ' + str(e))
        return jsonify({'error': 'Falha ao enviar e-mail. Contate o administrador.'}), 500

    return jsonify({'message': 'Se este e-mail estiver cadastrado, voce recebera as instrucoes em breve.'}), 200


@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    raw_token = data.get('token', '').strip()
    new_password = data.get('password', '')

    if not raw_token or not new_password:
        return jsonify({'error': 'Token e nova senha sao obrigatorios'}), 400

    if len(new_password) < 8:
        return jsonify({'error': 'A senha deve ter pelo menos 8 caracteres'}), 400

    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    now = datetime.utcnow()

    conn = get_db()
    c = conn.cursor()
    c.execute(
        'SELECT * FROM password_resets WHERE token_hash = %s AND used = 0 AND expires_at > %s',
        (token_hash, now)
    )
    reset = c.fetchone()

    if not reset:
        c.close()
        conn.close()
        return jsonify({'error': 'Link invalido ou expirado. Solicite um novo.'}), 400

    user_id = reset[1]
    hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    c.execute('UPDATE users SET password_hash = %s WHERE id = %s', (hashed, user_id))
    c.execute('UPDATE password_resets SET used = 1, used_at = %s WHERE id = %s', (now, reset[0]))
    conn.commit()
    c.close()
    conn.close()

    return jsonify({'message': 'Senha redefinida com sucesso! Voce ja pode fazer login.'}), 200




@app.route('/api/auth/me', methods=['GET'])
@login_required
def me():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, name, email, role, department FROM users WHERE id = %s", (session['user_id'],))
    row = c.fetchone()
    user = row_to_dict(row, c) if row else None
    conn.close()
    if user:
        return jsonify(user)
    return jsonify({'error': 'Usuário não encontrado'}), 404


# ── DASHBOARD ─────────────────────────────────────────────────────────────────
@app.route('/api/dashboard/stats', methods=['GET'])
@login_required
def dashboard_stats():
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM employees WHERE status='active'")
    employees = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM news WHERE published=1")
    news_count = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM service_requests WHERE status='open'")
    open_requests = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM recognitions")
    recognitions = c.fetchone()[0]

    month = date.today().month
    c.execute("""SELECT name, birth_date FROM employees
                 WHERE status='active' AND birth_date IS NOT NULL
                 AND birth_date != ''
                 AND EXTRACT(MONTH FROM birth_date::date) = %s""", (month,))
    birthdays = rows_to_list(c.fetchall(), c)

    c.execute("SELECT id, title, category, created_at FROM news WHERE published=1 ORDER BY created_at DESC LIMIT 5")
    recent_news = rows_to_list(c.fetchall(), c)

    c.execute("SELECT department, COUNT(*) as c FROM employees WHERE status='active' GROUP BY department ORDER BY c DESC")
    dept_counts = rows_to_list(c.fetchall(), c)

    conn.close()
    return jsonify({
        'employees': employees,
        'news': news_count,
        'open_requests': open_requests,
        'recognitions': recognitions,
        'birthdays_this_month': birthdays,
        'recent_news': recent_news,
        'dept_counts': dept_counts
    })


# ── EMPLOYEES ─────────────────────────────────────────────────────────────────
@app.route('/api/employees', methods=['GET'])
@login_required
def get_employees():
    search = request.args.get('search', '')
    dept = request.args.get('department', '')
    status = request.args.get('status', 'active')
    conn = get_db()
    c = conn.cursor()
    query = "SELECT * FROM employees WHERE 1=1"
    params = []
    if status:
        query += " AND status = %s"
        params.append(status)
    if search:
        query += " AND (name ILIKE %s OR email ILIKE %s OR position ILIKE %s)"
        params.extend([f'%{search}%'] * 3)
    if dept:
        query += " AND department = %s"
        params.append(dept)
    query += " ORDER BY name ASC"
    c.execute(query, params)
    employees = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(employees)


@app.route('/api/employees', methods=['POST'])
@login_required
def create_employee():
    data = request.get_json()
    emp_id = str(uuid.uuid4())
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO employees (id, name, email, department, position, manager,
                 admission_date, birth_date, phone, cpf, status, notes, is_parent, parent_type)
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
              (emp_id, data.get('name'), data.get('email'), data.get('department'),
               data.get('position'), data.get('manager'), data.get('admission_date'),
               data.get('birth_date'), data.get('phone'), data.get('cpf'),
               data.get('status', 'active'), data.get('notes'),
               data.get('is_parent', False), data.get('parent_type', '')))
    conn.commit()
    conn.close()
    log_action(session['user_id'], 'CREATE', 'employee', emp_id, data.get('name'))
    return jsonify({'id': emp_id, 'success': True}), 201


@app.route('/api/employees/<emp_id>', methods=['GET'])
@login_required
def get_employee(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM employees WHERE id = %s", (emp_id,))
    row = c.fetchone()
    emp = row_to_dict(row, c) if row else None
    conn.close()
    if not emp:
        return jsonify({'error': 'Não encontrado'}), 404
    return jsonify(emp)


@app.route('/api/employees/<emp_id>', methods=['PUT'])
@login_required
def update_employee(emp_id):
    data = request.get_json()
    conn = get_db()
    c = conn.cursor()
    c.execute("""UPDATE employees SET name=%s, email=%s, department=%s, position=%s, manager=%s,
                 admission_date=%s, birth_date=%s, phone=%s, cpf=%s, status=%s, notes=%s,
                 is_parent=%s, parent_type=%s, updated_at=CURRENT_TIMESTAMP WHERE id=%s""",
              (data.get('name'), data.get('email'), data.get('department'), data.get('position'),
               data.get('manager'), data.get('admission_date'), data.get('birth_date'),
               data.get('phone'), data.get('cpf'), data.get('status'), data.get('notes'),
               data.get('is_parent', False), data.get('parent_type', ''), emp_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/employees/<emp_id>', methods=['DELETE'])
@login_required
def delete_employee(emp_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE employees SET status='inactive' WHERE id=%s", (emp_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


# ── RECORDS ───────────────────────────────────────────────────────────────────
@app.route('/api/records', methods=['GET'])
@login_required
def get_records():
    area = request.args.get('area', '')
    module = request.args.get('module', '')
    employee_id = request.args.get('employee_id', '')
    search = request.args.get('search', '')
    conn = get_db()
    c = conn.cursor()
    query = "SELECT * FROM records WHERE 1=1"
    params = []
    if area:
        query += " AND area = %s"
        params.append(area)
    if module:
        query += " AND module = %s"
        params.append(module)
    if employee_id:
        query += " AND employee_id = %s"
        params.append(employee_id)
    if search:
        query += " AND (title ILIKE %s OR content ILIKE %s)"
        params.extend([f'%{search}%', f'%{search}%'])
    query += " ORDER BY created_at DESC"
    c.execute(query, params)
    records = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(records)


@app.route('/api/records', methods=['POST'])
@login_required
def create_record():
    data = request.get_json()
    rec_id = str(uuid.uuid4())
    content = json.dumps(data.get('content', {})) if isinstance(data.get('content'), dict) else data.get('content', '')
    tags = json.dumps(data.get('tags', [])) if isinstance(data.get('tags'), list) else data.get('tags', '')
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO records (id, area, module, title, content, employee_id, status, priority, due_date, tags, created_by)
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
              (rec_id, data.get('area'), data.get('module'), data.get('title'), content,
               data.get('employee_id'), data.get('status', 'active'), data.get('priority', 'medium'),
               data.get('due_date'), tags, session['user_id']))
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
    c = conn.cursor()
    c.execute("""UPDATE records SET title=%s, content=%s, status=%s, priority=%s, due_date=%s,
                 updated_at=CURRENT_TIMESTAMP WHERE id=%s""",
              (data.get('title'), content, data.get('status'), data.get('priority'), data.get('due_date'), rec_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/records/<rec_id>', methods=['DELETE'])
@login_required
def delete_record(rec_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM records WHERE id=%s", (rec_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


# ── NEWS ──────────────────────────────────────────────────────────────────────
@app.route('/api/news', methods=['GET'])
@login_required
def get_news():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM news ORDER BY pinned DESC, created_at DESC")
    news = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(news)


@app.route('/api/news', methods=['POST'])
@login_required
def create_news():
    data = request.get_json()
    news_id = str(uuid.uuid4())
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO news (id, title, content, category, author, published, pinned)
                 VALUES (%s, %s, %s, %s, %s, %s, %s)""",
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
    c = conn.cursor()
    c.execute("""UPDATE news SET title=%s, content=%s, category=%s, published=%s, pinned=%s,
                 updated_at=CURRENT_TIMESTAMP WHERE id=%s""",
              (data.get('title'), data.get('content'), data.get('category'),
               data.get('published', 0), data.get('pinned', 0), news_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/news/<news_id>', methods=['DELETE'])
@login_required
def delete_news(news_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM news WHERE id=%s", (news_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


# ── EVENTS ────────────────────────────────────────────────────────────────────
@app.route('/api/events', methods=['GET'])
@login_required
def get_events():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM events ORDER BY date ASC")
    events = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(events)


@app.route('/api/events', methods=['POST'])
@login_required
def create_event():
    data = request.get_json()
    ev_id = str(uuid.uuid4())
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO events (id, title, description, event_type, date, time, location, created_by)
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
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
    c = conn.cursor()
    c.execute("SELECT * FROM benefits WHERE active=1 ORDER BY category, title")
    benefits = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(benefits)


@app.route('/api/benefits', methods=['POST'])
@login_required
def create_benefit():
    data = request.get_json()
    b_id = str(uuid.uuid4())
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO benefits (id, title, description, category, supplier, contact, url)
                 VALUES (%s, %s, %s, %s, %s, %s, %s)""",
              (b_id, data.get('title'), data.get('description'), data.get('category'),
               data.get('supplier'), data.get('contact'), data.get('url')))
    conn.commit()
    conn.close()
    return jsonify({'id': b_id, 'success': True}), 201


@app.route('/api/benefits/<b_id>', methods=['DELETE'])
@login_required
def delete_benefit(b_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE benefits SET active=0 WHERE id=%s", (b_id,))
    conn.commit()
    conn.close()
    log_action(session['user_id'], 'DELETE', 'benefit', b_id)
    return jsonify({'success': True})


# ── RECOGNITIONS ──────────────────────────────────────────────────────────────
@app.route('/api/recognitions', methods=['GET'])
@login_required
def get_recognitions():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT r.*, e.name as employee_name, e.department, e.position
        FROM recognitions r
        LEFT JOIN employees e ON r.employee_id = e.id
        ORDER BY r.created_at DESC LIMIT 50
    """)
    recs = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(recs)


@app.route('/api/recognitions', methods=['POST'])
@login_required
def create_recognition():
    data = request.get_json()
    r_id = str(uuid.uuid4())
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO recognitions (id, employee_id, recognized_by, type, message, points, public)
                 VALUES (%s, %s, %s, %s, %s, %s, %s)""",
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
    c = conn.cursor()
    query = "SELECT * FROM knowledge_base WHERE 1=1"
    params = []
    if search:
        query += " AND (title ILIKE %s OR content ILIKE %s OR tags ILIKE %s)"
        params.extend([f'%{search}%'] * 3)
    if category:
        query += " AND category = %s"
        params.append(category)
    query += " ORDER BY views DESC, created_at DESC"
    c.execute(query, params)
    items = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(items)


@app.route('/api/knowledge', methods=['POST'])
@login_required
def create_knowledge():
    data = request.get_json()
    k_id = str(uuid.uuid4())
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO knowledge_base (id, title, content, category, tags, author)
                 VALUES (%s, %s, %s, %s, %s, %s)""",
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
    c = conn.cursor()
    c.execute("SELECT * FROM service_requests ORDER BY created_at DESC")
    reqs = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(reqs)


@app.route('/api/service-requests', methods=['POST'])
@login_required
def create_service_request():
    data = request.get_json()
    req_id = str(uuid.uuid4())
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO service_requests (id, title, description, category, priority, status, requester_id)
                 VALUES (%s, %s, %s, %s, %s, 'open', %s)""",
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
    c = conn.cursor()
    c.execute("""UPDATE service_requests SET status=%s, assigned_to=%s, resolution=%s,
                 updated_at=CURRENT_TIMESTAMP WHERE id=%s""",
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
    c = conn.cursor()
    query = """SELECT pr.*, e.name as employee_name FROM performance_reviews pr
               LEFT JOIN employees e ON pr.employee_id = e.id"""
    params = []
    if employee_id:
        query += " WHERE pr.employee_id = %s"
        params.append(employee_id)
    query += " ORDER BY pr.created_at DESC"
    c.execute(query, params)
    reviews = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(reviews)


@app.route('/api/performance', methods=['POST'])
@login_required
def create_performance():
    data = request.get_json()
    pr_id = str(uuid.uuid4())
    scores = json.dumps(data.get('scores', {}))
    conn = get_db()
    c = conn.cursor()
    c.execute("""INSERT INTO performance_reviews (id, employee_id, reviewer_id, period, scores, overall_score, comments, status)
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
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
    c = conn.cursor()
    c.execute("SELECT id, name, email, role, department, created_at, active FROM users")
    users = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(users)


@app.route('/api/users', methods=['POST'])
@login_required
def create_user():
    if session.get('user_role') != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    data = request.get_json()
    user_id = str(uuid.uuid4())
    hashed = bcrypt.hashpw(data.get('password', 'senha123').encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("""INSERT INTO users (id, name, email, password_hash, role, department)
                     VALUES (%s, %s, %s, %s, %s, %s)""",
                  (user_id, data.get('name'), data.get('email'), hashed,
                   data.get('role', 'user'), data.get('department')))
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
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
    c = conn.cursor()
    c.execute("UPDATE users SET password_hash=%s WHERE id=%s", (hashed, user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/users/<user_id>/toggle', methods=['PUT'])
@login_required
def toggle_user_active(user_id):
    if session.get('user_role') != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    # Protege o próprio admin de se desativar
    if session.get('user_id') == user_id:
        return jsonify({'error': 'Você não pode desativar sua própria conta'}), 400
    data = request.get_json()
    active = 1 if data.get('active') else 0
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE users SET active=%s WHERE id=%s", (active, user_id))
    conn.commit()
    conn.close()
    acao = 'ACTIVATE' if active else 'DEACTIVATE'
    log_action(session['user_id'], acao, 'user', user_id)
    return jsonify({'success': True})


# ── AUDIT ─────────────────────────────────────────────────────────────────────
@app.route('/api/audit', methods=['GET'])
@login_required
def get_audit():
    if session.get('user_role') != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT al.*, u.name as user_name FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC LIMIT 200
    """)
    logs = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(logs)


# ── IMPORT / EXPORT COLABORADORES ────────────────────────────────────────────
_EMPLOYEE_FIELDS = [
    'name', 'email', 'department', 'position', 'manager',
    'admission_date', 'birth_date', 'phone', 'cpf', 'status', 'notes'
]

@app.route('/api/employees/export', methods=['GET'])
@login_required
def export_employees():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM employees ORDER BY name ASC")
    employees = rows_to_list(c.fetchall(), c)
    conn.close()

    MAPA = [
        ('name','Nome'),('email','E-mail'),('department','Departamento'),
        ('position','Cargo'),('manager','Gestor'),('admission_date','Admissao'),
        ('birth_date','Nascimento'),('phone','Telefone'),('cpf','CPF'),
        ('status','Status'),('is_parent','Pai_Mae'),('parent_type','Tipo_Pai_Mae'),
        ('notes','Observacoes'),
    ]
    output = _io.StringIO()
    writer = _csv.writer(output, delimiter=';')
    writer.writerow([col for _,col in MAPA])
    for emp in employees:
        linha = []
        for field,_ in MAPA:
            val = emp.get(field, '') or ''
            if isinstance(val, bool):
                val = 'Sim' if val else 'Nao'
            linha.append(val)
        writer.writerow(linha)

    csv_bytes = output.getvalue().encode('utf-8-sig')
    return _Response(
        csv_bytes,
        mimetype='text/csv',
        headers={
            'Content-Disposition': 'attachment; filename=colaboradores.csv',
            'Content-Type': 'text/csv; charset=utf-8'
        }
    )

@app.route('/api/employees/import', methods=['POST'])
@login_required
def import_employees():
    if session.get('user_role') not in ('admin', 'rh'):
        return jsonify({'error': 'Acesso negado'}), 403

    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400

    filename = file.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        return jsonify({'error': 'Formato invalido. Use CSV ou XLSX.'}), 400

    def norm(v):
        if v is None:
            return ''
        if hasattr(v, 'strftime'):
            return v.strftime('%Y-%m-%d')
        return str(v).strip()

    def get_field(row, *keys):
        for k in keys:
            val = row.get(k)
            if val is not None and str(val).strip() not in ('', 'None'):
                return norm(val)
        return ''

    try:
        if filename.endswith('.csv'):
            content = file.read().decode('utf-8-sig')
            reader = _csv.DictReader(_io.StringIO(content))
            rows = list(reader)
        else:
            import openpyxl
            wb = openpyxl.load_workbook(file)
            ws = wb.active
            headers = [str(cell.value).strip() if cell.value else '' for cell in ws[1]]
            rows = []
            for row in ws.iter_rows(min_row=2, values_only=True):
                rows.append(dict(zip(headers, row)))

        conn = get_db()
        c = conn.cursor()
        inserted = 0
        skipped = 0

        for row in rows:
            name  = get_field(row, 'name', 'Nome', 'nome')
            email = get_field(row, 'email', 'E-mail', 'Email', 'e-mail')

            if not name or not email:
                skipped += 1
                continue

            c.execute("SELECT id FROM employees WHERE email = %s", (email,))
            if c.fetchone():
                skipped += 1
                continue

            emp_id = str(uuid.uuid4())
            c.execute("""
                INSERT INTO employees
                  (id, name, email, department, position, manager,
                   admission_date, birth_date, phone, cpf, status, notes)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                emp_id,
                name,
                email,
                get_field(row, 'department', 'Departamento', 'departamento'),
                get_field(row, 'position', 'Cargo', 'cargo'),
                get_field(row, 'manager', 'Gestor', 'gestor'),
                get_field(row, 'admission_date', 'Admiss\u00e3o', 'Admissao', 'data_admissao') or None,
                get_field(row, 'birth_date', 'Nascimento', 'data_nascimento') or None,
                get_field(row, 'phone', 'Telefone', 'telefone'),
                get_field(row, 'cpf', 'CPF'),
                get_field(row, 'status', 'Status') or 'active',
                get_field(row, 'notes', 'Observa\u00e7\u00f5es', 'Observacoes', 'observacoes'),
            ))
            inserted += 1

        conn.commit()
        conn.close()
        log_action(session['user_id'], 'IMPORT', 'employee', None, f'{inserted} importados')
        return jsonify({'success': True, 'inserted': inserted, 'skipped': skipped})

    except Exception as e:
        return jsonify({'error': f'Erro ao processar arquivo: {str(e)}'}), 500


@app.route('/api/employees/<emp_id>/permanent', methods=['DELETE'])
@login_required
def delete_employee_permanent(emp_id):
    if session.get('user_role') != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM employees WHERE id = %s", (emp_id,))
    conn.commit()
    conn.close()
    log_action(session['user_id'], 'DELETE_PERMANENT', 'employee', emp_id)
    return jsonify({'success': True})


# ── DISC ──────────────────────────────────────────────────────────────────────
@app.route('/api/employees/<emp_id>/disc', methods=['GET'])
@login_required
def get_disc(emp_id):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("SELECT * FROM disc_results WHERE employee_id = %s ORDER BY created_at DESC LIMIT 1", (emp_id,))
        row = c.fetchone()
        result = row_to_dict(row, c) if row else None
    except:
        result = None
    conn.close()
    return jsonify(result)

@app.route('/api/employees/<emp_id>/disc', methods=['POST'])
@login_required
def save_disc(emp_id):
    data = request.get_json()
    answers = data.get('answers', [])
    # answers é lista de strings: 'D', 'I', 'S' ou 'C'
    scores = {'D': 0, 'I': 0, 'S': 0, 'C': 0}
    for ans in answers:
        if ans in scores:
            scores[ans] += 1
    total = sum(scores.values()) or 1
    pct = {k: round(v/total*100) for k, v in scores.items()}
    dominant = max(scores, key=scores.get)
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id FROM disc_results WHERE employee_id = %s", (emp_id,))
    existing = c.fetchone()
    if existing:
        c.execute(
            "UPDATE disc_results SET d_score=%s, i_score=%s, s_score=%s, c_score=%s, dominant_profile=%s, answers=%s, updated_at=CURRENT_TIMESTAMP WHERE employee_id=%s",
            (pct['D'], pct['I'], pct['S'], pct['C'], dominant, json.dumps(answers), emp_id)
        )
    else:
        c.execute(
            "INSERT INTO disc_results (id, employee_id, d_score, i_score, s_score, c_score, dominant_profile, answers) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            (str(uuid.uuid4()), emp_id, pct['D'], pct['I'], pct['S'], pct['C'], dominant, json.dumps(answers))
        )
    conn.commit()
    conn.close()
    log_action(session['user_id'], 'DISC', 'employee', emp_id)
    return jsonify({'success': True, 'scores': pct, 'dominant': dominant})

# ── CAREER HISTORY ─────────────────────────────────────────────────────────────
@app.route('/api/employees/<emp_id>/career', methods=['GET'])
@login_required
def get_career(emp_id):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("SELECT * FROM career_history WHERE employee_id = %s ORDER BY created_at DESC", (emp_id,))
        rows = rows_to_list(c.fetchall(), c)
    except:
        rows = []
    conn.close()
    return jsonify(rows)

@app.route('/api/employees/<emp_id>/career', methods=['POST'])
@login_required
def add_career(emp_id):
    data = request.get_json()
    rec_id = str(uuid.uuid4())
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute(
            "INSERT INTO career_history (id, employee_id, event_type, previous_position, new_position, previous_department, new_department, event_date, notes) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (rec_id, emp_id, data.get('event_type'), data.get('previous_position'), data.get('new_position'), data.get('previous_department'), data.get('new_department'), data.get('event_date'), data.get('notes'))
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': str(e)}), 500
    conn.close()
    return jsonify({'success': True, 'id': rec_id})


# ── POLÍTICAS DE EMPRESA ─────────────────────────────────────────────────────
@app.route('/api/policies', methods=['GET'])
@login_required
def get_policies():
    conn = get_db()
    c = conn.cursor()
    if session.get('user_role') == 'admin':
        c.execute("SELECT id, title, category, content, pdf_filename, created_by, created_at, updated_at, status, priority FROM policies ORDER BY category, title")
    else:
        c.execute("SELECT id, title, category, content, pdf_filename, created_by, created_at, updated_at, status, priority FROM policies WHERE status = 'ativa' ORDER BY category, title")
    policies = rows_to_list(c.fetchall(), c)
    conn.close()
    return jsonify(policies)

@app.route('/api/policies', methods=['POST'])
@login_required
def create_policy():
    if session.get('user_role') != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    title = request.form.get('title', '').strip()
    category = request.form.get('category', '').strip()
    content = request.form.get('content', '').strip()
    status = request.form.get('status', 'ativa')
    priority = request.form.get('priority', 'media')
    if not title or not category:
        return jsonify({'error': 'Título e categoria são obrigatórios'}), 400
    pdf_filename = None
    if 'pdf' in request.files:
        pdf = request.files['pdf']
        if pdf.filename:
            ext = os.path.splitext(pdf.filename)[1].lower()
            if ext != '.pdf':
                return jsonify({'error': 'Apenas arquivos PDF são permitidos'}), 400
            pdf_filename = str(uuid.uuid4()) + '.pdf'
            pdf.save(os.path.join('/var/www/valore-RH/uploads', pdf_filename))
    policy_id = str(uuid.uuid4())
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute(
            "INSERT INTO policies (id, title, category, content, pdf_filename, created_by, created_at, status, priority) VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s, %s)",
            (policy_id, title, category, content, pdf_filename, session.get('user_id'), status, priority)
        )
        conn.commit()
        log_action(session.get('user_id'), 'create_policy', policy_id, f'Política criada: {title}')
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': str(e)}), 500
    conn.close()
    return jsonify({'success': True, 'id': policy_id})

@app.route('/api/policies/<policy_id>', methods=['GET'])
@login_required
def get_policy(policy_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, title, category, content, pdf_filename, created_by, created_at, updated_at, status, priority FROM policies WHERE id = %s", (policy_id,))
    row = c.fetchone()
    policy = row_to_dict(row, c) if row else None
    conn.close()
    if not policy:
        return jsonify({'error': 'Política não encontrada'}), 404
    return jsonify(policy)

@app.route('/api/policies/<policy_id>', methods=['PUT'])
@login_required
def update_policy(policy_id):
    if session.get('user_role') != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    title = request.form.get('title', '').strip()
    category = request.form.get('category', '').strip()
    content = request.form.get('content', '').strip()
    status = request.form.get('status', 'ativa')
    priority = request.form.get('priority', 'media')
    if not title or not category:
        return jsonify({'error': 'Título e categoria são obrigatórios'}), 400
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT pdf_filename FROM policies WHERE id = %s", (policy_id,))
    row = c.fetchone()
    existing = row_to_dict(row, c) if row else None
    if not existing:
        conn.close()
        return jsonify({'error': 'Política não encontrada'}), 404
    pdf_filename = existing.get('pdf_filename')
    if 'pdf' in request.files:
        pdf = request.files['pdf']
        if pdf.filename:
            ext = os.path.splitext(pdf.filename)[1].lower()
            if ext != '.pdf':
                conn.close()
                return jsonify({'error': 'Apenas arquivos PDF são permitidos'}), 400
            if pdf_filename:
                old_path = os.path.join('/var/www/valore-RH/uploads', pdf_filename)
                if os.path.exists(old_path):
                    os.remove(old_path)
            pdf_filename = str(uuid.uuid4()) + '.pdf'
            pdf.save(os.path.join('/var/www/valore-RH/uploads', pdf_filename))
    try:
        c.execute(
            "UPDATE policies SET title=%s, category=%s, content=%s, pdf_filename=%s, status=%s, priority=%s, updated_at=NOW() WHERE id=%s",
            (title, category, content, pdf_filename, status, priority, policy_id)
        )
        conn.commit()
        log_action(session.get('user_id'), 'update_policy', policy_id, f'Política editada: {title}')
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': str(e)}), 500
    conn.close()
    return jsonify({'success': True})

@app.route('/api/policies/<policy_id>', methods=['DELETE'])
@login_required
def delete_policy(policy_id):
    if session.get('user_role') != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT pdf_filename FROM policies WHERE id = %s", (policy_id,))
    row = c.fetchone()
    existing = row_to_dict(row, c) if row else None
    if not existing:
        conn.close()
        return jsonify({'error': 'Política não encontrada'}), 404
    if existing.get('pdf_filename'):
        pdf_path = os.path.join('/var/www/valore-RH/uploads', existing['pdf_filename'])
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
    try:
        c.execute("DELETE FROM policies WHERE id = %s", (policy_id,))
        conn.commit()
        log_action(session.get('user_id'), 'delete_policy', policy_id, 'Política excluída')
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': str(e)}), 500
    conn.close()
    return jsonify({'success': True})

@app.route('/api/policies/<policy_id>/pdf', methods=['GET'])
@login_required
def get_policy_pdf(policy_id):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT pdf_filename, title FROM policies WHERE id = %s", (policy_id,))
    row = c.fetchone()
    policy = row_to_dict(row, c) if row else None
    conn.close()
    if not policy or not policy.get('pdf_filename'):
        return jsonify({'error': 'PDF não encontrado'}), 404
    return send_from_directory('/var/www/valore-RH/uploads', policy['pdf_filename'], as_attachment=False)

# ── SERVE FRONTEND ────────────────────────────────────────────────────────────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    init_db()
    print("\n✅ Sistema RH iniciado em http://localhost:5000")
    print("📧 Login: admin@empresa.com | Senha: admin123\n")
    app.run(debug=False, port=5000, host='0.0.0.0')


# Rota explícita para reset de senha (SPA fallback)
@app.route('/reset-senha')
def reset_senha():
    from flask import send_from_directory
    return send_from_directory(app.static_folder, 'index.html')
