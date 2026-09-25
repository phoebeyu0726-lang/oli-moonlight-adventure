from pathlib import Path
from PIL import Image


ROOT = Path(r"C:\Users\USER\Desktop\中秋節")
OUT = ROOT / "assets" / "characters" / "family"
SOURCES = {
    "prayer-brother.png": Path(r"C:\Users\USER\.codex\generated_images\01a0c843-80b0-7c60-bcba-36cb87f8a807\exec-0a02e4c7-0641-4792-a42f-981ce784624d.png"),
    "prayer-father.png": Path(r"C:\Users\USER\.codex\generated_images\01a0c843-80b0-7c60-bcba-36cb87f8a807\exec-ba9691f8-14dc-422c-bddc-8491f81f54a0.png"),
    "prayer-phoebe.png": Path(r"C:\Users\USER\.codex\generated_images\01a0c843-80b0-7c60-bcba-36cb87f8a807\exec-b572cc45-ec22-497d-9280-e2e4242a0909.png"),
}


def normalize(source: Path, target: Path) -> None:
    image = Image.open(source).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError(f"No visible pixels in {source}")
    subject = image.crop(bbox)
    canvas = Image.new("RGBA", (1024, 1536), (0, 0, 0, 0))
    scale = min(850 / subject.width, 1320 / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(size, Image.Resampling.LANCZOS)
    x = (canvas.width - subject.width) // 2
    y = 1450 - subject.height
    canvas.alpha_composite(subject, (x, y))
    canvas.save(target, optimize=True)


OUT.mkdir(parents=True, exist_ok=True)
for name, source in SOURCES.items():
    normalize(source, OUT / name)
    print(OUT / name)
