from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent
OUT = ROOT.parent.parent / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)
NAMES = [
    "duck", "goose", "swan", "bird",
    "grouse", "crane", "deer", "moose",
    "fox", "bear", "beaver", "hare",
    "badger", "mustelid", "boar", "cormorant",
]
CREAM = (234, 220, 192)
ORANGE = (233, 137, 61)


def component_mask(image: Image.Image, color=CREAM) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    accepted = bytearray(width * height)
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            distance = ((r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2) ** 0.5
            if a > 24 and distance < 72:
                accepted[y * width + x] = 1

    seen = bytearray(width * height)
    largest: list[int] = []
    for start, value in enumerate(accepted):
        if not value or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        component: list[int] = []
        while queue:
            current = queue.popleft()
            component.append(current)
            x, y = current % width, current // width
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                neighbor = ny * width + nx
                if 0 <= nx < width and 0 <= ny < height and accepted[neighbor] and not seen[neighbor]:
                    seen[neighbor] = 1
                    queue.append(neighbor)
        if len(component) > len(largest):
            largest = component

    output = Image.new("RGBA", rgba.size)
    target = output.load()
    for index in largest:
        x, y = index % width, index // width
        original_alpha = pixels[x, y][3]
        target[x, y] = (*color, original_alpha)
    return output


def fit_square(image: Image.Image, size: int, padding: int) -> Image.Image:
    bbox = image.getbbox()
    if bbox is None:
        raise ValueError("No icon subject found")
    cropped = image.crop(bbox)
    maximum = size - 2 * padding
    cropped.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (size, size))
    output.alpha_composite(cropped, ((size - cropped.width) // 2, (size - cropped.height) // 2))
    return output


def color_mask(image: Image.Image, color) -> Image.Image:
    rgba = image.convert("RGBA")
    output = Image.new("RGBA", rgba.size)
    source, target = rgba.load(), output.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = source[x, y]
            distance = ((r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2) ** 0.5
            if a > 24 and distance < 85:
                target[x, y] = (*color, a)
    return output


sprite = Image.open(ROOT / "sprite-source.png").convert("RGBA")
for index, name in enumerate(NAMES):
    column, row = index % 4, index // 4
    left = round(column * sprite.width / 4)
    right = round((column + 1) * sprite.width / 4)
    top = round(row * sprite.height / 4)
    bottom = round((row + 1) * sprite.height / 4)
    icon = fit_square(component_mask(sprite.crop((left, top, right, bottom))), 192, 16)
    icon.save(OUT / f"animal-{name}.png", optimize=True)

logo = fit_square(component_mask(Image.open(ROOT / "logo-source.png")), 256, 10)
logo.save(OUT / "brand-antlers.png", optimize=True)

calendar = fit_square(component_mask(Image.open(ROOT / "calendar-source.png")), 128, 10)
calendar.save(OUT / "ui-calendar.png", optimize=True)

solar = Image.open(ROOT / "solar-source.png").convert("RGBA")
for index, name in enumerate(("dawn", "sunrise", "sunset", "dusk")):
    left = round(index * solar.width / 4)
    right = round((index + 1) * solar.width / 4)
    icon = fit_square(color_mask(solar.crop((left, 0, right, solar.height)), ORANGE), 128, 12)
    icon.save(OUT / f"solar-{name}.png", optimize=True)
