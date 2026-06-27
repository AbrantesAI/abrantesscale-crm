# -*- coding: utf-8 -*-
# Limpa as notas dos contactos: remove emojis e o abre-portas, encurta.
# DRY-RUN por defeito. Aplica com --commit.
import sys, re, json, argparse, urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
def env(k):
    for l in (REPO / ".env.local").read_text().splitlines():
        if l.startswith(k + "="):
            return l.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("falta " + k)

URL = env("NEXT_PUBLIC_SUPABASE_URL")
SRK = env("SUPABASE_SERVICE_ROLE_KEY")
H = {"apikey": SRK, "Authorization": f"Bearer {SRK}", "Content-Type": "application/json"}

EMOJI = re.compile("["
    "\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF"
    "\U00002190-\U000021FF\U00002B00-\U00002BFF\U0001F900-\U0001F9FF"
    "\U0000FE00-\U0000FE0F\U0000200D\U00002300-\U000023FF\U00002000-\U0000200B"
    "\U00002460-\U000024FF\U0000FE0F]+", flags=re.UNICODE)

def limpa(nota):
    if not nota:
        return nota
    t = nota.split("· Abre-portas:")[0]      # corta o abre-portas
    t = t.split("Abre-portas:")[0]
    t = EMOJI.sub("", t)                       # tira emojis
    t = re.sub(r"\s+", " ", t)                 # espaços a mais
    t = re.sub(r"(\s*·\s*)+", " · ", t)        # separadores repetidos
    t = t.strip(" ·. ")
    return t[:130].strip()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--commit", action="store_true")
    args = ap.parse_args()
    req = urllib.request.Request(
        URL + "/rest/v1/contacts?select=id,full_name,source,notes&order=created_at.desc", headers=H)
    contactos = json.loads(urllib.request.urlopen(req, timeout=30).read())

    mudar = []
    for c in contactos:
        nova = limpa(c.get("notes"))
        if nova != (c.get("notes") or ""):
            mudar.append((c, nova))

    print(f"Contactos a limpar: {len(mudar)} de {len(contactos)}\n")
    for c, nova in mudar[:4]:
        print(f"# {c['full_name']}")
        print(f"  ANTES: {(c.get('notes') or '')[:110]}")
        print(f"  DEPOIS: {nova}\n")

    if not args.commit:
        print("[DRY-RUN] Nada alterado. Corre com --commit para aplicar.")
        return
    for c, nova in mudar:
        body = json.dumps({"notes": nova}).encode()
        r = urllib.request.Request(
            URL + f"/rest/v1/contacts?id=eq.{c['id']}", data=body, headers=H, method="PATCH")
        urllib.request.urlopen(r, timeout=30).read()
    print(f"✅ {len(mudar)} notas limpas.")

if __name__ == "__main__":
    main()
