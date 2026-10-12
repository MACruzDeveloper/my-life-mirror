"""Genera el catálogo de avatares de RF-26. Herramienta offline: se ejecuta a mano, en el
ordenador del autor, y no forma parte de la app desplegada (ADR-01, apartado 7).

Tres pasos, siempre con una persona al final:

  python3 scripts/avatars/generate_avatars.py check
      Enseña los prompts que se enviarían. Sin red, sin token, sin dependencias.

  python3 scripts/avatars/generate_avatars.py generate [--seeds 12 ...] [--only clave ...]
      1) Un modelo de lenguaje (Claude Haiku, por la API) razona, paso a paso, si cada
         descripción cae en algún estereotipo cultural, de género o de apariencia
         (ADR-05, apartado 4.1). La que no pasa NO se genera, y el motivo queda en
         out/log.json. Son llamadas cortas: menos de un céntimo por las doce.
      2) Un modelo de texto a imagen de HuggingFace, ejecutado EN ESTE ORDENADOR
         (sin API ni crédito), genera las candidatas en scripts/avatars/out/: una
         por avatar y semilla, unos 100 segundos cada una en un Mac M3. La primera
         vez descarga el modelo (unos 7 GB).
      3) Escribe out/review.html: la hoja de contactos para revisarlas.

  python3 scripts/avatars/generate_avatars.py publish curlyGlasses=12 longBraids=12 ...
      Copia la candidata elegida a public/avatars/<clave>.webp y marca ese avatar como
      publicado en el catálogo. Solo lo publicado aparece en la app.

Necesita ANTHROPIC_API_KEY (variable de entorno, o la línea del .env, que no se sube a
Git) para el razonamiento; la clave nunca se imprime. Las dependencias van en un entorno
propio, fuera del proyecto de Node:

  python3 -m venv scripts/avatars/.venv
  scripts/avatars/.venv/bin/pip install -r scripts/avatars/requirements.txt
  scripts/avatars/.venv/bin/python scripts/avatars/generate_avatars.py generate --only curlyGlasses
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "src/modules/accounts/domain/catalog/avatars.json"
BANNED_TERMS = ROOT / "src/modules/accounts/domain/catalog/avatarBannedTerms.json"
OUT = Path(__file__).resolve().parent / "out"
PUBLISHED = ROOT / "public/avatars"

# Los nombres de modelo cambian con el tiempo: se pueden sustituir con --image-model y
# --reasoning-model sin tocar el código.
# SDXL base, no la versión "turbo": la rápida ignoraba el tono de piel pedido y dibujaba
# a todo el mundo con piel clara (probado el 11 oct. con seis variantes del prompt). El
# modelo normal, con guía, sí lo respeta. Tarda mucho más: es el precio.
DEFAULT_IMAGE_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
# El decodificador de imagen original falla en media precisión; este es el corregido.
IMAGE_VAE = "madebyollin/sdxl-vae-fp16-fix"
DEFAULT_REASONING_MODEL = "claude-haiku-5-5"
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
REASONING_MAX_TOKENS = 2500
INFERENCE_STEPS = 28
GUIDANCE_SCALE = 7.5
# El estilo del dibujo depende de la semilla, no solo del texto: la misma semilla para todos
# los avatares da un catálogo uniforme. La 12 es la que eligió el autor (insignia circular).
DEFAULT_SEEDS = [12]
NEGATIVE_PROMPT = "photo, realistic, 3d render, text, letters, watermark, logo, signature, frame, multiple people, deformed, extra limbs"

GENERATED_SIZE = 768
PUBLISHED_SIZE = 256

# El estilo, igual para todos: es lo que hace que parezcan un catálogo y no doce dibujos sueltos.
STYLE = (
    "Flat vector illustration, minimalist avatar icon, head and shoulders portrait of one person facing the viewer, "
    "calm friendly smile, simple rounded shapes, clean thin outlines, flat solid colours, plain light background, "
    "centred composition."
)

REASONING_SYSTEM = """You review one written description that will be sent to an image model to draw an avatar \
for a wellbeing app. Users will pick one avatar to represent themselves, so the set must not rely on stereotypes.

Think step by step, and write your reasoning:
1. List every attribute the description mentions.
2. For each one, say whether it is a neutral visible feature (hair, skin tone, glasses, clothes, an assistive device) \
or whether it names or implies gender, ethnic or national origin, religion, age group, social class, profession or \
personality.
3. Say whether any combination of the features works as a cultural, gender or appearance stereotype or caricature, \
or presents a feature as a flaw, a joke or something exotic.
4. Say whether any wording judges how the person looks.

Then finish with exactly one last line:
VERDICT: OK
or
VERDICT: REJECT - <the reason, in a few words>

Reject when in doubt: a person reviews everything afterwards, and a rejected description is simply rewritten."""


def load_catalog():
    return json.loads(CATALOG.read_text(encoding="utf-8"))


def image_prompt(description):
    return f"{STYLE} The person has {description}."


def banned_terms_in(description):
    """El mismo filtro determinista que el test de integridad de la app."""
    banned = set(json.loads(BANNED_TERMS.read_text(encoding="utf-8")))
    return sorted(set(re.split(r"[^a-z]+", description.lower())) & banned)


def read_secret(name):
    """Una clave del entorno o de su línea en .env. Nunca se imprime."""
    value = os.environ.get(name, "").strip()
    if value:
        return value
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            match = re.match(r"\s*" + re.escape(name) + r"\s*=\s*(.*)\s*$", line)
            if match:
                return match.group(1).strip().strip("\"'")
    return ""


def selected(catalog, only):
    if not only:
        return catalog
    known = {avatar["key"] for avatar in catalog}
    unknown = [key for key in only if key not in known]
    if unknown:
        sys.exit(f"No están en el catálogo: {', '.join(unknown)}")
    return [avatar for avatar in catalog if avatar["key"] in only]


def command_check(args):
    catalog = selected(load_catalog(), args.only)
    problems = 0
    for avatar in catalog:
        found = banned_terms_in(avatar["description"])
        problems += bool(found)
        state = f"PALABRAS PROHIBIDAS: {', '.join(found)}" if found else "ok"
        print(f"\n[{avatar['key']}] {state}{' · publicado' if avatar.get('published') else ''}\n  {image_prompt(avatar['description'])}")
    print(f"\n{len(catalog)} descripciones, {problems} con palabras prohibidas. No se ha enviado nada a ningún sitio.")
    return 1 if problems else 0


def reason_about(api_key, model, description):
    """Paso de razonamiento (Chain-of-Thought): devuelve ("ok" | "reject" | "unfinished", razonamiento completo)."""
    body = json.dumps({
        "model": model,
        # Holgado: con 700 la respuesta se cortaba antes del veredicto en 5 de 12 descripciones
        # (11 oct.), y un razonamiento cortado no es un rechazo.
        "max_tokens": REASONING_MAX_TOKENS,
        "system": REASONING_SYSTEM,
        "messages": [{"role": "user", "content": f"Description: {description}"}],
    }).encode("utf-8")
    request = urllib.request.Request(ANTHROPIC_URL, data=body, headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            answer = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        sys.exit(f"El modelo de razonamiento respondió {error.code}: {error.read().decode('utf-8')[:300]}")
    reasoning = "".join(block.get("text", "") for block in answer.get("content", [])).strip()
    verdicts = re.findall(r"^VERDICT:\s*(OK|REJECT)\b.*$", reasoning, flags=re.MULTILINE)
    # Sin veredicto (respuesta cortada o vacía) tampoco se genera, pero se dice aparte:
    # no es que la descripción esté mal, es que el razonamiento no terminó.
    if not verdicts or answer.get("stop_reason") == "max_tokens":
        return "unfinished", reasoning
    return ("ok" if verdicts[-1] == "OK" else "reject"), reasoning


def load_image_pipeline(model):
    import torch
    from diffusers import AutoencoderKL, AutoPipelineForText2Image

    device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
    if device == "cpu":
        pipeline = AutoPipelineForText2Image.from_pretrained(model, torch_dtype=torch.float32)
    else:
        vae = AutoencoderKL.from_pretrained(IMAGE_VAE, torch_dtype=torch.float16)
        pipeline = AutoPipelineForText2Image.from_pretrained(model, vae=vae, torch_dtype=torch.float16, variant="fp16")
    pipeline.set_progress_bar_config(disable=True)
    return pipeline.to(device), device


def is_blank(image):
    """Una imagen en negro es un fallo del equipo o del modelo, no una candidata: no se guarda."""
    return max(high for _, high in image.convert("RGB").getextrema()) < 16


def command_generate(args):
    api_key = read_secret("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("Falta ANTHROPIC_API_KEY (variable de entorno, o su línea en .env) para el paso de razonamiento.")
    try:
        import torch
        import diffusers  # noqa: F401
    except ImportError:
        sys.exit("Faltan las dependencias: ver las instrucciones al principio de este archivo.")

    catalog = selected(load_catalog(), args.only)
    OUT.mkdir(exist_ok=True)
    log = {"startedAt": datetime.now(timezone.utc).isoformat(), "imageModel": args.image_model, "reasoningModel": args.reasoning_model, "style": STYLE, "negativePrompt": NEGATIVE_PROMPT, "steps": INFERENCE_STEPS, "guidance": GUIDANCE_SCALE, "seeds": args.seeds, "avatars": []}

    # 1) Filtro de palabras y razonamiento, para todas, antes de cargar el modelo de imagen.
    approved_entries = []
    for avatar in catalog:
        key, description = avatar["key"], avatar["description"]
        # `avoid` (opcional): lo que no debe aparecer. Va al prompt negativo, porque escribir
        # "sin barba" en la descripción hace que el modelo dibuje una barba.
        entry = {"key": key, "description": description, "prompt": image_prompt(description), "avoid": avatar.get("avoid", ""), "variants": []}
        log["avatars"].append(entry)

        found = banned_terms_in(description)
        if found:
            entry["rejectedBy"] = "lista de palabras"
            entry["reason"] = ", ".join(found)
            print(f"✘ {key}: palabras prohibidas ({entry['reason']}). No se genera.")
            continue

        verdict, reasoning = reason_about(api_key, args.reasoning_model, description)
        if verdict == "unfinished":
            # Un segundo intento antes de darlo por perdido.
            verdict, reasoning = reason_about(api_key, args.reasoning_model, description)
        entry["reasoning"] = reasoning
        if verdict == "unfinished":
            entry["rejectedBy"] = "razonamiento sin terminar"
            entry["reason"] = "la respuesta del modelo se cortó o llegó vacía; repite la orden con --only " + key
            print(f"? {key}: el razonamiento no terminó. No se genera; repítelo con --only {key}.")
            continue
        if verdict == "reject":
            entry["rejectedBy"] = "razonamiento"
            print(f"✘ {key}: el razonamiento la rechaza. No se genera (ver out/log.json).")
            continue
        print(f"· {key}: razonamiento OK", flush=True)
        approved_entries.append(entry)

    # 2) Imágenes, en este ordenador.
    if approved_entries:
        print(f"\nCargando {args.image_model} (la primera vez se descarga)…")
        pipeline, device = load_image_pipeline(args.image_model)
        log["device"] = device
        for entry in approved_entries:
            # Todas juntas en out/, como <clave>-<semilla>.webp: `publish clave=12` publica la de la semilla 12.
            for seed in args.seeds:
                image = generate_image(pipeline, entry["prompt"], seed, entry["avoid"])
                if is_blank(image):
                    print(f"  {entry['key']} con la semilla {seed} ha salido en negro: se descarta.")
                    continue
                image.save(candidate_path(entry["key"], seed), "WEBP", quality=90)
                entry["variants"].append(seed)
            print(f"✓ {entry['key']}: {len(entry['variants'])} candidata(s)", flush=True)

    (OUT / "log.json").write_text(json.dumps(log, indent=2, ensure_ascii=False), encoding="utf-8")
    write_review_sheet(log)
    print(f"\nRevisa las candidatas en {OUT / 'review.html'} y publica las que valgan con `publish clave=semilla`.")
    return 0


def generate_image(pipeline, prompt, seed, avoid=""):
    import torch

    generator = torch.Generator(device="cpu").manual_seed(seed)
    return pipeline(prompt=prompt, negative_prompt=", ".join(filter(None, [NEGATIVE_PROMPT, avoid])), num_inference_steps=INFERENCE_STEPS, guidance_scale=GUIDANCE_SCALE, width=GENERATED_SIZE, height=GENERATED_SIZE, generator=generator).images[0]


def candidate_path(key, seed):
    return OUT / f"{key}-{seed}.webp"


def candidates_of(key):
    """Las semillas de todas las candidatas de ese avatar que hay en out/, de esta ejecución o de otras."""
    return sorted(int(path.stem.rsplit("-", 1)[1]) for path in OUT.glob(f"{key}-*.webp"))


def write_review_sheet(log):
    """La hoja enseña el catálogo entero, no solo lo generado ahora: repetir un avatar no borra a los demás."""
    this_run = {entry["key"]: entry for entry in log["avatars"]}
    rows = []
    for avatar in load_catalog():
        entry = this_run.get(avatar["key"], {"key": avatar["key"], "description": avatar["description"]})
        images = "".join(f'<figure><img src="{entry["key"]}-{seed}.webp" alt=""><figcaption>{entry["key"]}={seed}</figcaption></figure>' for seed in candidates_of(entry["key"]))
        note = f'<p class="rejected">No generada ({entry["rejectedBy"]}): {entry.get("reason", "ver el razonamiento")}</p>' if "rejectedBy" in entry else ""
        reasoning = f'<details><summary>Razonamiento previo</summary><pre>{escape(entry.get("reasoning", ""))}</pre></details>' if entry.get("reasoning") else ""
        rows.append(f'<section><h2>{entry["key"]}</h2><p>{escape(entry["description"])}</p>{note}<div class="row">{images}</div>{reasoning}</section>')
    html = f"""<!doctype html><html lang="es"><meta charset="utf-8"><title>Avatares: revisión</title>
<style>body{{font-family:system-ui;max-width:900px;margin:2rem auto;padding:0 1rem}}.row{{display:flex;gap:1rem;flex-wrap:wrap}}
img{{width:192px;height:192px;border-radius:50%;display:block}}figure{{margin:0;text-align:center}}pre{{white-space:pre-wrap;background:#f4f4f4;padding:1rem}}
.rejected{{color:#b00020}}section{{border-top:1px solid #ddd;padding:1rem 0}}</style>
<h1>Avatares generados: revisión editorial</h1>
<p>Modelo de imagen: {escape(log["imageModel"])} · razonamiento: {escape(log["reasoningModel"])} · {escape(log["startedAt"])}</p>
<p>Mira cada candidata: ¿se parece a la descripción?, ¿algún rasgo exagerado o caricaturesco?, ¿manos, ojos o texto raros?,
¿el conjunto es variado sin que ninguno sea "el raro"? Publica solo las que valgan: <code>publish clave=semilla</code>.</p>
{"".join(rows)}</html>"""
    (OUT / "review.html").write_text(html, encoding="utf-8")


def escape(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def command_publish(args):
    try:
        from PIL import Image
    except ImportError:
        sys.exit("Faltan las dependencias: ver las instrucciones al principio de este archivo.")

    catalog = load_catalog()
    by_key = {avatar["key"]: avatar for avatar in catalog}
    choices = []
    for choice in args.choices:
        key, _, variant = choice.partition("=")
        source = candidate_path(key, variant or DEFAULT_SEEDS[0])
        if key not in by_key:
            sys.exit(f"'{key}' no está en el catálogo.")
        if not source.exists():
            sys.exit(f"No existe {source}: genera antes esa candidata.")
        choices.append((key, source))

    PUBLISHED.mkdir(parents=True, exist_ok=True)
    for key, source in choices:
        image = Image.open(source).convert("RGB").resize((PUBLISHED_SIZE, PUBLISHED_SIZE), Image.LANCZOS)
        image.save(PUBLISHED / f"{key}.webp", "WEBP", quality=85)
        by_key[key]["published"] = True
        print(f"✓ {key} publicado → public/avatars/{key}.webp")
    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n{sum(avatar['published'] for avatar in catalog)} de {len(catalog)} avatares publicados. Ejecuta los tests: npm run test")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Genera el catálogo de avatares de RF-26 (herramienta offline).")
    commands = parser.add_subparsers(dest="command", required=True)

    check = commands.add_parser("check", help="enseña los prompts, sin enviar nada")
    check.add_argument("--only", nargs="*", default=[])
    check.set_defaults(run=command_check)

    generate = commands.add_parser("generate", help="razona, genera las candidatas y escribe la hoja de revisión")
    generate.add_argument("--seeds", type=int, nargs="+", default=DEFAULT_SEEDS, help="una candidata por semilla; cada semilla es un estilo")
    generate.add_argument("--only", nargs="*", default=[])
    generate.add_argument("--image-model", default=DEFAULT_IMAGE_MODEL)
    generate.add_argument("--reasoning-model", default=DEFAULT_REASONING_MODEL)
    generate.set_defaults(run=command_generate)

    publish = commands.add_parser("publish", help="publica las candidatas elegidas: clave=semilla")
    publish.add_argument("choices", nargs="+")
    publish.set_defaults(run=command_publish)

    args = parser.parse_args()
    sys.exit(args.run(args))


if __name__ == "__main__":
    main()
