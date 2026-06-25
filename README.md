# PeopleHub — Sistema de Gestão de Pessoas

Sistema web completo para gestão de pessoas, desenvolvido em Python/Flask com SQLite.

## Credenciais padrão

| Campo | Valor |
|-------|-------|
| Email | admin@empresa.com |
| Senha | admin123 |

> ⚠️ **Troque a senha após o primeiro acesso em produção!**

---

## Estrutura do projeto

```
sistema-rh/
├── backend/
│   └── app.py              # Servidor Flask + API REST + banco de dados
├── frontend/
│   ├── index.html          # SPA (Single Page Application)
│   ├── css/main.css        # Estilos
│   └── js/
│       ├── api.js          # Cliente HTTP
│       ├── components.js   # Componentes reutilizáveis (toast, modal, avatar...)
│       ├── pages.js        # Renderização de cada página
│       └── app.js          # Roteador e controlador principal
├── data/                   # Banco SQLite (criado automaticamente)
├── uploads/                # Arquivos enviados
├── requirements.txt        # Dependências Python
├── .env.example            # Template de variáveis de ambiente
├── gunicorn.conf.py        # Config de produção
├── nginx.conf              # Config Nginx
├── peoplehub.service       # Serviço systemd
└── start.sh                # Script de início (desenvolvimento)
```

---

## Início rápido (desenvolvimento local)

### Pré-requisitos
- Python 3.9+
- pip

### Passo a passo

```bash
# 1. Clone ou extraia o projeto
cd sistema-rh

# 2. Crie o ambiente virtual
python3 -m venv venv
source venv/bin/activate       # Linux/Mac
# venv\Scripts\activate        # Windows

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Configure o .env
cp .env.example .env
# Edite o .env se necessário

# 5. Crie as pastas necessárias
mkdir -p data uploads

# 6. Inicie o servidor
cd backend
python3 app.py
```

Acesse: **http://localhost:5000**

Ou use o script helper:
```bash
chmod +x start.sh
./start.sh
```

---

## Deploy em servidor interno (Linux/Ubuntu)

### 1. Preparar o servidor

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar Python, Nginx
sudo apt install python3 python3-pip python3-venv nginx -y
```

### 2. Deploy da aplicação

```bash
# Criar diretório
sudo mkdir -p /opt/peoplehub
sudo chown $USER:$USER /opt/peoplehub

# Copiar arquivos do projeto para /opt/peoplehub
cp -r . /opt/peoplehub/
cd /opt/peoplehub

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Edite a SECRET_KEY e demais variáveis

# Criar pastas de dados e logs
mkdir -p data uploads logs
```

### 3. Configurar como serviço (systemd)

```bash
# Editar o .service com o caminho correto
sudo cp peoplehub.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable peoplehub
sudo systemctl start peoplehub

# Verificar status
sudo systemctl status peoplehub
```

### 4. Configurar Nginx

```bash
# Edite nginx.conf com seu domínio/IP
sudo cp nginx.conf /etc/nginx/sites-available/peoplehub
sudo ln -s /etc/nginx/sites-available/peoplehub /etc/nginx/sites-enabled/
sudo nginx -t  # Testar configuração
sudo systemctl restart nginx
```

### 5. (Opcional) HTTPS com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com.br
```

---

## API REST

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/auth/login | Autenticação |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Usuário logado |
| GET | /api/dashboard/stats | Dados do dashboard |
| GET/POST | /api/employees | Listar/criar colaboradores |
| GET/PUT/DELETE | /api/employees/:id | Detalhe/editar/inativar |
| GET/POST | /api/records | Registros genéricos |
| PUT/DELETE | /api/records/:id | Editar/excluir registro |
| GET/POST | /api/news | Notícias |
| GET/POST | /api/events | Eventos |
| GET/POST | /api/benefits | Benefícios |
| GET/POST | /api/recognitions | Reconhecimentos |
| GET/POST | /api/knowledge | Biblioteca |
| GET/POST | /api/service-requests | Chamados |
| PUT | /api/service-requests/:id | Atualizar chamado |
| GET/POST | /api/performance | Avaliações de desempenho |
| GET/POST | /api/users | Usuários (admin) |
| GET | /api/audit | Log de auditoria (admin) |

---

## Módulos implementados

### 🎓 Desenvolvimento de Talentos
- **Pesquisas** — Cadastro e acompanhamento de pesquisas internas
- **Avaliação de Desempenho** — Ciclos com critérios configuráveis e score automático
- **Aprendizado** — Registro de treinamentos e cursos
- **Plano de Desenvolvimento (PDI)** — Planos individuais por colaborador

### 📋 Gestão de RH
- **Perfil do Colaborador** — CRUD completo com busca e filtros
- **Documentos Admissionais** — Controle de documentação
- **Onboarding** — Trilhas de integração
- **Férias e Licença** — Solicitações e controle
- **Arquivos** — Central de documentos
- **Políticas de Empresa** — Repositório de normas

### ❤️ Cultura de Empresa
- **Programa de Referência** — Indicações de candidatos
- **Experiência de Pessoas** — Iniciativas de EX
- **Aniversários** — Visualização mensal com destaque do mês atual
- **Eventos** — Agenda de eventos corporativos
- **Reconhecimentos** — Mural de reconhecimentos com tipos e pontos

### 💬 Comunicação Interna
- **Feed / Rede Interna** — Agregador de notícias e reconhecimentos
- **Notícias** — Publicação de comunicados com categorias
- **Organograma** — Visualização por departamento
- **Biblioteca do Conhecimento** — Base de artigos internos
- **Vantagens e Benefícios** — Catálogo de benefícios por categoria

### ⚙️ Operações
- **Gerenciamento de Serviços** — Sistema de tickets/chamados
- **Formulários e Aprovações** — Templates para solicitações comuns

---

## Sugestões de melhorias futuras

### Curto prazo
- [ ] Upload real de arquivos (PDF, imagens) para colaboradores e documentos
- [ ] Notificações por e-mail (aniversários, avaliações vencendo)
- [ ] Exportação para Excel/PDF (relatórios de colaboradores, férias)
- [ ] Calendário integrado com eventos e vencimentos
- [ ] Sistema de NPS/eNPS integrado às pesquisas

### Médio prazo
- [ ] Autenticação SSO (Active Directory / LDAP)
- [ ] App mobile (PWA ou React Native)
- [ ] Workflow de aprovações com múltiplos níveis
- [ ] Assinatura digital de documentos
- [ ] Integração com sistemas de folha (e-Social, Domínio, Protheus)

### Longo prazo
- [ ] BI integrado (dashboards avançados com gráficos)
- [ ] IA para sugestões de PDI baseadas em competências
- [ ] Pesquisas com analytics automático
- [ ] Módulo de recrutamento e seleção

---

## Segurança

- Senhas hasheadas com bcrypt
- Sessões server-side com chave secreta configurável
- Todas as rotas da API protegidas por autenticação
- Log de auditoria de todas as ações
- Separação de permissões admin/user
- CORS configurado

> Em produção, utilize HTTPS obrigatoriamente e configure um SECRET_KEY forte.

---

## Suporte

Para dúvidas técnicas sobre deploy, entre em contato com o time de Tecnologia.
