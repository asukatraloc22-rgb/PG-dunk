from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(root / 'public/icons/pg-dunk-icon-master.png').convert('RGB')
# Replace near-white generated corner pixels with the brand navy so maskable icons have no white corners.
pixels = source.load()
for y in range(source.height):
    for x in range(source.width):
        r, g, b = pixels[x, y]
        if r > 245 and g > 245 and b > 245:
            pixels[x, y] = (5, 21, 42)
for size in (192, 512):
    source.resize((size, size), Image.Resampling.LANCZOS).save(root / f'public/icons/icon-{size}.png', optimize=True)
source.resize((180, 180), Image.Resampling.LANCZOS).save(root / 'public/icons/apple-touch-icon.png', optimize=True)
