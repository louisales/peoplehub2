# 🚀 PeopleHub — Instruções de Deploy no Linux com PostgreSQL

## ⚠️ ANTES DE TRANSFERIR OS ARQUIVOS — Faça isso no servidor Linux

### 1. Criar o banco de dados no PostgreSQL

```bash
sudo -u postgres psql
```

Dentro do prompt do PostgreSQL (vai aparecer `postgres=#`), execute linha por linha:

```sql
CREATE DATABASE peoplehub;
CREATE USER peoplehub_user WITH PASSWORD 'SUA_SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON DATABASE peoplehub TO peoplehub_user;
\q
```

> Anote a senha que você colocar — vai precisar no próximo passo.

---

## 📁 DEPOIS DE TRANSFERIR OS ARQUIVOS via WinSCP

Transfira a pasta toda para: `/opt/peoplehub/`

---

## ⚙️ CONFIGURAR O ARQUIVO .env

No servidor Linux, execute:

```bash
cd /opt/peoplehub
cp .env.example .env
nano .env
```

Preencha o arquivo `.env` com seus dados reais:

```env
SECRET_KEY=coloque-uma-senha-longa-e-aleatoria-aqui-ex-xK9mP2vR8nQ4wL7j

PORT=5000
HOST=0.0.0.0
FLASK_DEBUG=False

DATABASE_URL=postgresql://peoplehub_user:SUA_SENHA_FORTE_AQUI@localhost:5432/peoplehub

UPLOAD_FOLDER=./uploads
MAX_UPLOAD_SIZE=16777216
```

Salve: `Ctrl+X` → `Y` → `Enter`

---

## 🐍 INSTALAR AS DEPENDÊNCIAS PYTHON

```bash
cd /opt/peoplehub
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
mkdir -p uploads logs
```

---

## ✅ TESTAR O SISTEMA (faça isso antes de tudo)

```bash
cd /opt/peoplehub
source venv/bin/activate
cd backend
python3 app.py
```

Abra no navegador: `http://IP_DO_SEU_SERVIDOR:5000`
- Login: `admin@empresa.com`
- Senha: `admin123`

Se o dashboard abrir e mostrar dados → está funcionando!

Para parar: `Ctrl+C`

---

## 🔧 CONFIGURAR COMO SERVIÇO (para ficar sempre ligado)

```bash
# Criar pasta de logs
sudo mkdir -p /var/log/peoplehub
sudo chown www-data:www-data /var/log/peoplehub
sudo chown -R www-data:www-data /opt/peoplehub

# Instalar e iniciar o serviço
sudo cp /opt/peoplehub/peoplehub.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable peoplehub
sudo systemctl start peoplehub

# Verificar se está rodando (deve aparecer "active (running)")
sudo systemctl status peoplehub
```

---

## 🌐 CONFIGURAR O NGINX

```bash
# Editar o nginx.conf e trocar 'seu-dominio.com.br' pelo IP ou domínio real
nano /opt/peoplehub/nginx.conf

# Ativar no Nginx
sudo cp /opt/peoplehub/nginx.conf /etc/nginx/sites-available/peoplehub
sudo ln -s /etc/nginx/sites-available/peoplehub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Após isso, acesse: `http://IP_DO_SEU_SERVIDOR` (sem a porta 5000)

---

## 🔍 Comandos úteis no dia a dia

```bash
# Ver status
sudo systemctl status peoplehub

# Reiniciar após mudanças
sudo systemctl restart peoplehub

# Ver logs em tempo real
sudo tail -f /var/log/peoplehub/error.log

# Entrar no banco de dados para verificar
sudo -u postgres psql -d peoplehub
\dt          # lista as tabelas
SELECT COUNT(*) FROM users;
\q
```
