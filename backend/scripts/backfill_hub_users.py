"""
Backfill: provisiona no Valore Hub todos os funcionários que já estavam
cadastrados no RH ANTES da integração automática existir.

Reaproveita exatamente a mesma lógica de app.py (RH_DEPT_TO_HUB_GROUP,
POST /api/provisioning/rh/): o Hub usa o e-mail como chave única — se já
existe um usuário com aquele e-mail lá, só atualiza o grupo/departamento;
se não existe, cria um novo (sem acesso a nenhum portal, senha
inutilizável, só com o grupo do departamento).

STANDALONE — não roda sozinho. Executar manualmente:

    python backend/scripts/backfill_hub_users.py            # dry run
    python backend/scripts/backfill_hub_users.py --apply    # aplica de verdade
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

_THIS_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _THIS_DIR.parent
_ROOT_DIR = _BACKEND_DIR.parent
for p in (_ROOT_DIR, _BACKEND_DIR):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

import psycopg2  # noqa: E402
import requests  # noqa: E402
from dotenv import load_dotenv  # noqa: E402

load_dotenv()

HUB_BASE_URL = os.environ.get('HUB_BASE_URL', 'https://portal.valore.com.br').rstrip('/')
RH_PROVISIONING_API_KEY = os.environ.get('RH_PROVISIONING_API_KEY', '')

RH_DEPT_TO_HUB_GROUP = {
    'Contábil': 'Contábil',
    'Fiscal': 'Fiscal',
    'Departamento Pessoal': 'Departamento Pessoal',
    'Sucesso do Cliente': 'Sucesso do Cliente',
    'Administrativo': 'Administrativo',
    'Paralegal': 'Paralegal',
    'Diretoria': 'Diretoria',
    'Marketing': 'Marketing',
    'Tecnologia': 'Tecnologia',
    'BPO Financeiro': 'Financeiro',
    'Financeiro': 'Financeiro',
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Aplica de verdade. Sem essa flag, só mostra o que faria.')
    args = parser.parse_args()

    if not RH_PROVISIONING_API_KEY:
        print('RH_PROVISIONING_API_KEY não configurada no .env — abortando.')
        return

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    c = conn.cursor()
    c.execute("""
        SELECT name, email, department, position FROM employees
        WHERE status = 'active' AND email IS NOT NULL AND email != ''
        ORDER BY name
    """)
    todos = c.fetchall()
    conn.close()

    funcionarios = [f for f in todos if '@' in (f[1] or '')]
    invalidos = [f for f in todos if '@' not in (f[1] or '')]
    if invalidos:
        print(f'{len(invalidos)} funcionário(s) com e-mail inválido (ignorados, corrija na fonte):')
        for nome, email, _, _ in invalidos:
            print(f'  - {nome} <{email}>')

    print(f'{len(funcionarios)} funcionário(s) ativo(s) com e-mail encontrados no RH.')

    if not args.apply:
        print('\nDry run — nenhuma chamada será feita ao Hub. Amostra:')
        for nome, email, depto, cargo in funcionarios[:10]:
            grupo = RH_DEPT_TO_HUB_GROUP.get(depto or '', depto or '(sem departamento)')
            print(f'  - {nome} <{email}> — departamento "{depto}" -> grupo Hub "{grupo}", cargo "{cargo}"')
        if len(funcionarios) > 10:
            print(f'  ... e mais {len(funcionarios) - 10}.')
        print('\nRe-rode com --apply para provisionar de verdade no Hub.')
        return

    criados = 0
    atualizados = 0
    falhas = []

    for nome, email, depto, cargo in funcionarios:
        grupo = RH_DEPT_TO_HUB_GROUP.get(depto or '', depto or '')
        try:
            resp = requests.post(
                f'{HUB_BASE_URL}/api/provisioning/rh/',
                json={
                    'api_key': RH_PROVISIONING_API_KEY,
                    'name': nome or '',
                    'email': email,
                    'department_group': grupo,
                    'position': cargo or '',
                },
                timeout=10,
            )
            resp.raise_for_status()
            dados = resp.json()
            if dados.get('created'):
                criados += 1
                print(f'  [criado]     {email}')
            else:
                atualizados += 1
                print(f'  [atualizado] {email}')
        except requests.RequestException as exc:
            falhas.append((email, str(exc)))
            print(f'  [falhou]     {email} — {exc}')

    print(f'\nResumo: {criados} criado(s), {atualizados} já existiam (grupo atualizado), {len(falhas)} falha(s).')
    if falhas:
        print('Falhas:')
        for email, erro in falhas:
            print(f'  - {email}: {erro}')


if __name__ == '__main__':
    main()
