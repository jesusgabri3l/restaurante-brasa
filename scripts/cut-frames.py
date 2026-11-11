# Quita el fondo de fuentes/video/raw/*.png -> fuentes/video/cut/ combinando dos modelos de rembg:
# BiRefNet recorta mejor los bordes finos (lechuga) e ISNet no deja huecos en lo que cae borroso.
# El alfa final es el máximo de los dos.
# Uso: ../.venv-rembg/Scripts/python scripts/cut-frames.py [raw_dir cut_dir]  (por defecto el video principal)
import sys
from pathlib import Path
from PIL import Image, ImageChops
from rembg import new_session, remove

sessions = [new_session('birefnet-general-lite'), new_session('isnet-general-use')]
raw, cut = (Path(p) for p in (sys.argv[1:3] if len(sys.argv) > 2 else ('fuentes/video/raw', 'fuentes/video/cut')))
cut.mkdir(parents=True, exist_ok=True)
for f in sorted(raw.glob('frame-*.png')):
    out = cut / f.name
    if out.exists():
        continue
    image = Image.open(f).convert('RGB')
    alphas = [remove(image, session=s, only_mask=True) for s in sessions]
    image.putalpha(ImageChops.lighter(*alphas))
    image.save(out)
    print(f.name, flush=True)
