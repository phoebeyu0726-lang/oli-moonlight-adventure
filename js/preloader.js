const BASE_ASSETS = [
  'assets/backgrounds/moon-chase-stage.png',
  'assets/backgrounds/catch-game-concept.png',
  'assets/backgrounds/ending-festival-bg.png',
  'assets/backgrounds/story/lantern-terrace-v2.png',
  'assets/characters/brother/brother-poses-v1.png',
  'assets/characters/dad/dad-poses-v1.png',
  'assets/characters/phoebe/phoebe-poses-v1.png',
  'assets/items/falling-treats-v2.png',
  'assets/props/wish-lantern.png',
  'assets/characters/family/prayer-brother.png',
  'assets/characters/family/prayer-father.png',
  'assets/characters/family/prayer-phoebe.png',
  'assets/characters/family/young-man-hanfu.png',
  'assets/characters/family/father-hanfu-v3.png',
  'assets/characters/family/young-woman-hanfu.png',
];

const OLI_GAME_POSES = [
  'catch-chili', 'catch-golden', 'catch-mooncake', 'catch-onion',
  'catch-osmanthus', 'catch-star', 'catch-super', 'catch-yolk',
  'dizzy', 'fever', 'idle', 'jump', 'pray', 'proud',
  'run-left', 'run-right', 'shock', 'success', 'surprised',
].map((name) => `assets/characters/oli/game/${name}.png`);

const OLI_STORY_POSES = [
  'happy', 'jump', 'normal', 'run-left', 'run-right', 'surprised', 'tilt', 'wish',
].map((name) => `assets/characters/oli/story/${name}.png`);

export const PRELOAD_ASSETS = [...new Set([...BASE_ASSETS, ...OLI_GAME_POSES, ...OLI_STORY_POSES])];

const retainedImages = [];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = async () => {
      try { await image.decode(); } catch { /* onload already proves the image is usable */ }
      retainedImages.push(image);
      resolve(src);
    };
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

export async function preloadGameAssets(onProgress = () => {}) {
  const total = PRELOAD_ASSETS.length;
  let completed = 0;
  const failed = [];
  onProgress({ completed, total, percent: 0, current: '' });

  const queue = [...PRELOAD_ASSETS];
  const workers = Array.from({ length: Math.min(6, total) }, async () => {
    while (queue.length) {
      const src = queue.shift();
      try { await loadImage(src); } catch { failed.push(src); }
      completed += 1;
      onProgress({ completed, total, percent: Math.round((completed / total) * 100), current: src });
    }
  });

  await Promise.all(workers);
  return { failed, total };
}
