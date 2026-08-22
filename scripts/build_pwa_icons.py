from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(root / 'public/icons/pg-dunk-icon-master.png').convert('RGBA')
for size in (192, 512):
    source.resize((size, size), Image.Resampling.LANCZOS).save(root / f'public/icons/icon-{size}.png', optimize=True)
source.resize((180, 180), Image.Resampling.LANCZOS).save(root / 'public/icons/apple-touch-icon.png', optimize=True)
