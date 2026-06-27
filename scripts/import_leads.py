# -*- coding: utf-8 -*-
# ============================================================
# Scalit — Importar leads (CSV do gerador) para o CRM (Supabase)
# Le credenciais de .env.local. De-duplica por telefone e por nome.
# DRY-RUN por defeito. So escreve com --commit.
#
# USAR:
#   python3 scripts/import_leads.py "<caminho.csv>"            # dry-run
#   python3 scripts/import_leads.py "<caminho.csv>" --commit   # escreve
# ============================================================
import sys, os, re, csv, json, argparse, datetime, urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

def env(key):
    for linha in (REPO / ".env.local").read_text().splitlines():
        if linha.startswith(key + "="):
            return linha.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"ERRO: {key} nao encontrado em .env.local")

URL = env("NEXT_PUBLIC_SUPABASE_URL")
SRK = env("SUPABASE_SERVICE_ROLE_KEY")
HEADERS = {"apikey": SRK, "Authorization": f"Bearer {SRK}",
           "Content-Type": "application/json"}

def norm_tel(t):
    d = re.sub(r"\D", "", t or "")
    if d.startswith("351") and len(d) > 9:
        d = d[3:]
    return d

def norm_nome(n):
    return re.sub(r"[^a-z0-9]", "", (n or "").lower())

def get(path):
    req = urllib.request.Request(URL + path, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

def post(path, payload):
    req = urllib.request.Request(
        URL + path, data=json.dumps(payload).encode(),
        headers={**HEADERS, "Prefer": "return=representation"}, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv")
    ap.add_argument("--commit", action="store_true")
    args = ap.parse_args()

    # owner_id (assumimos 1 dono — o do CRM)
    existentes = get("/rest/v1/contacts?select=full_name,company,phone,instagram,owner_id")
    if not existentes:
        sys.exit("ERRO: sem contactos existentes para inferir owner_id. Cria 1 contacto manualmente primeiro.")
    owner_id = existentes[0]["owner_id"]
    tel_set = {norm_tel(c.get("phone")) for c in existentes if c.get("phone")}
    nome_set = {norm_nome(c.get("company") or c.get("full_name")) for c in existentes}
    insta_set = {(c.get("instagram") or "").lstrip("@").lower() for c in existentes if c.get("instagram")}

    hoje = datetime.date.today().isoformat()
    novos, dups = [], []
    with open(args.csv, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        is_ig = "Instagram" in (reader.fieldnames or [])
        print(f"Formato detetado: {'Instagram (agentes)' if is_ig else 'Google Maps (imobiliárias)'}\n")
        for row in reader:
            if is_ig:
                nome = (row["Nome"] or "").strip()
                handle = (row["Instagram"] or "").lstrip("@").strip().lower()
                tel = (row["WhatsApp"] or "").strip()
                if (handle and handle in insta_set) or (tel and norm_tel(tel) in tel_set):
                    dups.append(nome or handle); continue
                nota = (f"Agente imobiliário (IG · {row.get('Seguidores') or '?'} seg). "
                        f"{(row.get('Bio') or '')[:80]} · Abre-portas: {row.get('Abre-portas') or ''}")
                novos.append({
                    "owner_id": owner_id, "full_name": nome or handle, "company": nome or handle,
                    "phone": tel or None, "instagram": "@" + handle if handle else None,
                    "website": f"https://instagram.com/{handle}" if handle else None,
                    "source": "instagram", "lead_type": "pme", "funnel_destination": "scalit",
                    "outreach_status": "a_contactar", "status": "active", "deal_value": 0,
                    "notes": nota,
                })
                if handle: insta_set.add(handle)
                if tel: tel_set.add(norm_tel(tel))
            else:
                nome = (row["Imobiliária"] or "").strip()
                tel = (row["Telefone"] or "").strip()
                if (tel and norm_tel(tel) in tel_set) or norm_nome(nome) in nome_set:
                    dups.append(nome); continue
                nota = (f"{row['Prioridade']} · {row['Ângulo']} · {row['Reviews']} reviews · "
                        f"{row['Rating'] or 's/'}⭐ · {row['Cidade']} · via Google Maps {hoje}")
                novos.append({
                    "owner_id": owner_id, "full_name": nome, "company": nome,
                    "phone": tel or None, "website": (row["Website"] or "").strip() or None,
                    "source": "google_maps", "lead_type": "pme", "funnel_destination": "scalit",
                    "outreach_status": "a_contactar", "status": "active", "deal_value": 0,
                    "notes": nota,
                })
                if tel: tel_set.add(norm_tel(tel))
                nome_set.add(norm_nome(nome))

    print(f"CSV: {Path(args.csv).name}")
    print(f"  Novos a inserir: {len(novos)}")
    print(f"  Duplicados ignorados: {len(dups)}  {dups if dups else ''}")
    print()
    for n in novos[:5]:
        print(f"   + {n['full_name']}  | {n['phone'] or '—'} | {n['outreach_status']}")
    if len(novos) > 5:
        print(f"   ... e mais {len(novos)-5}")

    if not args.commit:
        print("\n[DRY-RUN] Nada foi escrito. Corre com --commit para inserir.")
        return
    if not novos:
        print("\nNada para inserir.")
        return
    res = post("/rest/v1/contacts", novos)
    print(f"\n✅ INSERIDOS {len(res)} contactos no CRM (outreach_status=a_contactar).")

if __name__ == "__main__":
    main()
