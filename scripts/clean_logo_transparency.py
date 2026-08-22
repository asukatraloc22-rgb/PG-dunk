from collections import deque
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(root / "public/icons/rize-ball-transparent.png").convert("RGBA")
pixels = source.load()
width, height = source.size

def is_background(x: int, y: int) -> bool:
    r, g, b, _ = pixels[x, y]
    return r >= 210 and g >= 210 and b >= 210 and max(r, g, b) - min(r, g, b) <= 18

seen = set()
queue = deque()
for x in range(width):
    queue.append((x, 0)); queue.append((x, height - 1))
for y in range(height):
    queue.append((0, y)); queue.append((width - 1, y))

while queue:
    x, y = queue.popleft()
    if (x, y) in seen or not (0 <= x < width and 0 <= y < height) or not is_background(x, y):
        continue
    seen.add((x, y))
    queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

for x, y in seen:
    r, g, b, _ = pixels[x, y]
    pixels[x, y] = (r, g, b, 0)

output = root / "public/icons/pg-dunk-icon-master.png"
source.save(output, optimize=True)
print(f"Removed {len(seen)} connected background pixels; saved {output}")
