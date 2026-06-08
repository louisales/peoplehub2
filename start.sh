#!/bin/bash
# ─── Script de inicialização local ────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║         Valore Hub — Sistema de RH        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado. Instale Python 3.9+"
    exit 1
fi

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
fi

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
echo "📦 Instalando dependências..."
pip install -r requirements.txt -q

# Copiar .env se não existir
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Arquivo .env criado a partir do .env.example"
    echo "   Edite as variáveis conforme necessário"
fi

# Criar pastas necessárias
mkdir -p data uploads

# Iniciar servidor
echo ""
echo "✅ Iniciando servidor..."
echo "🌐 Acesse: http://localhost:5000"
echo "📧 Login: admin@empresa.com"
echo "🔑 Senha: admin123"
echo ""
echo "Pressione Ctrl+C para encerrar"
echo ""

cd backend
python3 app.py
