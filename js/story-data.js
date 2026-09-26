export const STORY_ASSETS = {
  backgrounds: {
    lantern: 'assets/backgrounds/story/lantern-terrace-v2.webp',
    home: 'assets/backgrounds/story/home-night-v1.png',
    road: 'assets/backgrounds/story/lantern-road-v1.png',
    hill: 'assets/backgrounds/story/moon-hill-v1.png',
    ending: 'assets/backgrounds/story/ending-back-view-v1.png',
  },
  characters: {
    phoebe: 'assets/characters/phoebe/phoebe-poses-v1.webp',
    brother: 'assets/characters/brother/brother-poses-v1.webp',
    dad: 'assets/characters/dad/dad-poses-v1.webp',
    oli: 'assets/characters/oli/oli-novel-poses-v1.png',
    moon: 'assets/characters/moon/moon-messenger-poses-v1.png',
  },
};

export const OLI_POSE_ASSETS = {
  normal: 'assets/characters/oli/story/normal.webp',
  happy: 'assets/characters/oli/story/happy.webp',
  tilt: 'assets/characters/oli/story/tilt.webp',
  surprised: 'assets/characters/oli/story/surprised.webp',
  runLeft: 'assets/characters/oli/story/run-left.webp',
  runRight: 'assets/characters/oli/story/run-right.webp',
  wish: 'assets/characters/oli/story/wish.webp',
  jump: 'assets/characters/oli/story/jump.webp',
};

export const CHARACTER_POSES = {
  phoebe: { normal: 0, happy: 1, surprised: 2, up: 3, thinking: 4, wish: 5, laugh: 6, call: 7 },
  brother: { normal: 0, smile: 1, surprised: 2, up: 3, point: 4, thinking: 5, wish: 6, laugh: 7 },
  dad: { normal: 0, arms: 1, amused: 2, up: 3, point: 4, thinking: 5, wish: 6, laugh: 7 },
  oli: { normal: 0, happy: 1, tilt: 2, surprised: 3, runLeft: 4, runRight: 5, wish: 6, jump: 7 },
  moon: { normal: 0, happy: 1, angry: 2, surprised: 3, dim: 4, powered: 5, talking: 6, fly: 7 },
};

export const CHARACTER_NAMES = {
  phoebe: 'Phoebe', brother: '弟弟', dad: '爸爸', oli: 'Oli', moon: '小月亮', narrator: '',
};

export const MOON_STORY = [
  { scene: 'lantern', visible: ['phoebe', 'brother', 'dad', 'oli'], speaker: 'phoebe', pose: 'up', text: '你們看，今天好多天燈！' },
  { speaker: 'brother', pose: 'up', text: '上面好像都有寫東西耶。' },
  { speaker: 'dad', pose: 'amused', text: '應該都是大家今年的願望吧。' },
  { speaker: 'oli', pose: 'surprised', text: '汪！', effect: 'lanternNotice' },
  { speaker: 'phoebe', pose: 'surprised', text: '欸？這裡剛好還有一盞空的。' },
  { speaker: 'brother', pose: 'thinking', text: '那要寫什麼？' },
  { speaker: 'dad', pose: 'thinking', text: '只有一個願望，好像不太夠。' },
  { speaker: 'phoebe', pose: 'thinking', text: '那就不要只寫我們的啊。' },
  { speaker: 'phoebe', pose: 'call', text: '這一盞，留給正在看故事的你。', effect: 'inviteViewer' },
  { speaker: 'oli', pose: 'happy', text: '汪？', effect: 'meatThought' },
  { speaker: 'brother', pose: 'smile', text: '等等，Oli 也想寫。' },
  { speaker: 'phoebe', pose: 'laugh', text: '你的願望我們已經知道了。' },
  { speaker: 'oli', pose: 'jump', text: '汪！', effect: 'happyBounce' },
  { action: 'lantern' },
];
