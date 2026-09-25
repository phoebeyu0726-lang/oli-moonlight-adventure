from pathlib import Path
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
GENERATED = Path(r"C:\Users\USER\.codex\generated_images\01a0c843-80b0-7c60-bcba-36cb87f8a807")
GAME = ROOT / "assets" / "characters" / "oli" / "game"
STORY = ROOT / "assets" / "characters" / "oli" / "story"


def normalized(source: Path, mirror: bool = False) -> Image.Image:
    image = Image.open(source).convert("RGBA")
    if mirror:
        image = ImageOps.mirror(image)
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 12 else 0).getbbox()
    if not bbox:
        raise ValueError(f"No visible pixels in {source}")
    subject = image.crop(bbox)
    max_width, max_height = 820, 790
    scale = min(max_width / subject.width, max_height / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    x = (1024 - subject.width) // 2
    y = 932 - subject.height
    canvas.alpha_composite(subject, (x, y))
    return canvas


def save(source: Path, destination: Path, mirror: bool = False) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    normalized(source, mirror).save(destination, optimize=True)


sources = {
    "normal": GENERATED / "exec-d71ad5af-3343-4921-8c85-3827c8512fce.png",
    "pray": GENERATED / "exec-5cb058dd-116e-43b0-8044-1d2ccc9ce6e5.png",
    "mooncake": GENERATED / "exec-7ee00394-12f7-4e44-b7ae-4af2923dfe1d.png",
    "jump": GENERATED / "exec-33f1d4ea-a885-4bb7-ad8c-b14481c25cbb.png",
    "yolk": GENERATED / "exec-34ce6522-1a21-48b1-9fc8-97a91b4e7261.png",
    "osmanthus": GENERATED / "exec-d442da93-487d-4a89-b9e2-75ed300c70aa.png",
    "star": GENERATED / "exec-3fcf49da-4ea2-4a4c-92a4-463ef87b92e0.png",
    "chili": GENERATED / "exec-0c0f5ca0-3cf3-42ae-9d59-23b45963f8eb.png",
    "onion": GENERATED / "exec-f062bf0a-b9fe-478c-b2de-25924759b793.png",
    "super": GENERATED / "exec-865f3fd4-4dc2-42a4-a042-47806c2d8b1f.png",
    "golden": GENERATED / "exec-543c7bb9-f159-4a6a-8ed4-5cc50739fa30.png",
    "surprised": GENERATED / "exec-6a7b79a4-4d09-4c20-a29c-89a055c6e6ba.png",
    "run": GENERATED / "exec-195bdf01-3a7d-49cb-8916-db2a1c58d729.png",
}

game_outputs = {
    "idle.png": ("normal", False),
    "run-right.png": ("run", False),
    "run-left.png": ("run", True),
    "catch-mooncake.png": ("mooncake", False),
    "catch-yolk.png": ("yolk", False),
    "catch-osmanthus.png": ("osmanthus", False),
    "catch-star.png": ("star", False),
    "catch-chili.png": ("chili", False),
    "catch-onion.png": ("onion", False),
    "catch-super.png": ("super", False),
    "catch-golden.png": ("golden", False),
    "pray.png": ("pray", False),
    "jump.png": ("jump", False),
    "surprised.png": ("surprised", False),
    # Compatibility names used by older styles.
    "success.png": ("mooncake", False),
    "shock.png": ("chili", False),
    "dizzy.png": ("onion", False),
    "fever.png": ("super", False),
    "proud.png": ("golden", False),
}

for filename, (key, mirror) in game_outputs.items():
    save(sources[key], GAME / filename, mirror)

story_outputs = {
    "normal.png": ("normal", False),
    "happy.png": ("mooncake", False),
    "tilt.png": ("normal", False),
    "surprised.png": ("surprised", False),
    "run-right.png": ("run", False),
    "run-left.png": ("run", True),
    "wish.png": ("pray", False),
    "jump.png": ("jump", False),
}

for filename, (key, mirror) in story_outputs.items():
    save(sources[key], STORY / filename, mirror)

print(f"Normalized {len(game_outputs) + len(story_outputs)} Oli assets to 1024x1024 transparent canvases.")
