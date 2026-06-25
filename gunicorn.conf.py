# ─── Configuração Gunicorn (Produção) ─────────────────────────────────────────
import multiprocessing
import os

bind = f"{os.getenv('HOST', '0.0.0.0')}:{os.getenv('PORT', '5000')}"

workers = multiprocessing.cpu_count() * 2 + 1
timeout = 120
keepalive = 5

# Logs com caminho absoluto
accesslog = "/var/log/valore-rh/access.log"
errorlog  = "/var/log/valore-rh/error.log"
loglevel  = "info"

worker_class = "sync"
reload = os.getenv("FLASK_DEBUG", "False").lower() == "true"

# Pasta de trabalho explícita
chdir = "/var/www/valore-RH"
