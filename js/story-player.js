import { CHARACTER_NAMES, CHARACTER_POSES, MOON_STORY, OLI_POSE_ASSETS, STORY_ASSETS } from './story-data.js';

const POSITIONS = ['phoebe', 'brother', 'dad', 'oli'];

export function playMoonStory({ root, onLantern, onComplete, sound = () => {} }) {
  let stepIndex = 0;
  let visible = new Set();
  let scene = '';
  let typingTimer = 0;
  let typing = false;
  let fullText = '';
  let els = {};

  const poseIndex = (character, pose = 'normal') => CHARACTER_POSES[character]?.[pose] ?? 0;

  function spriteStyle(character, pose) {
    if (character === 'oli') {
      const asset = OLI_POSE_ASSETS[pose] || OLI_POSE_ASSETS.normal;
      return `--sprite:url('${asset}');--col:0;--row:0`;
    }
    const index = poseIndex(character, pose);
    return `--sprite:url('${STORY_ASSETS.characters[character]}');--col:${index % 4};--row:${Math.floor(index / 4)}`;
  }

  function mount() {
    clearInterval(typingTimer);
    root.innerHTML = `
      <section class="visual-novel short-story" data-scene="${scene || 'lantern'}">
        <div class="vn-background"></div>
        <div class="vn-sky-effects" aria-hidden="true"></div>
        <div class="vn-cast" aria-label="故事角色">
          ${POSITIONS.map((character) => `<div class="vn-character vn-${character}" data-character="${character}" style="${spriteStyle(character, 'normal')}"><div class="vn-sprite"></div></div>`).join('')}
        </div>
        <div class="vn-story-lantern" aria-label="尚未寫下願望的空白天燈"><span></span></div>
        <div class="vn-thought" aria-hidden="true"><span>🥩</span></div>
        <div class="vn-dialogue" role="button" tabindex="0" aria-label="故事對話，點擊繼續">
          <div class="vn-text" aria-live="polite"></div>
          <button class="vn-next" aria-label="下一句"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>
        </div>
        <div class="vn-ending" hidden>
          <div class="vn-ending-copy">
            <p>願每一個小小的願望，<br>都能找到屬於自己的月光。</p>
            <p>也願每一次月圓，<br>都有重要的人陪在身邊。</p>
            <h1>中秋節快樂 🌕</h1>
            <button class="cta vn-continue">點擊繼續</button>
          </div>
        </div>
      </section>`;
    els = {
      shell: root.querySelector('.visual-novel'),
      bg: root.querySelector('.vn-background'),
      cast: root.querySelector('.vn-cast'),
      dialogue: root.querySelector('.vn-dialogue'),
      text: root.querySelector('.vn-text'),
      next: root.querySelector('.vn-next'),
      effects: root.querySelector('.vn-sky-effects'),
      thought: root.querySelector('.vn-thought'),
      lantern: root.querySelector('.vn-story-lantern'),
      ending: root.querySelector('.vn-ending'),
    };
    els.dialogue.onclick = (event) => {
      if (event.target.closest('.vn-next')) event.stopPropagation();
      advanceOrComplete();
    };
    els.next.onclick = (event) => { event.stopPropagation(); advanceOrComplete(); };
    els.dialogue.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advanceOrComplete(); }
    };
    setScene(scene || 'lantern', false);
    syncCast();
  }

  function setScene(nextScene, animate = true) {
    scene = nextScene;
    els.shell.dataset.scene = scene;
    els.bg.style.backgroundImage = `url('${STORY_ASSETS.backgrounds[scene]}')`;
    if (animate) {
      els.shell.classList.add('scene-changing');
      setTimeout(() => els.shell?.classList.remove('scene-changing'), 650);
    }
  }

  function setPose(character, pose, animation = '') {
    const node = root.querySelector(`[data-character="${character}"]`);
    if (!node) return;
    node.setAttribute('style', spriteStyle(character, pose));
    node.dataset.pose = pose;
    node.classList.remove('react-jump', 'react-shake', 'react-bounce', 'run-out');
    if (animation) void node.offsetWidth;
    if (animation) node.classList.add(animation);
  }

  function syncCast() {
    POSITIONS.forEach((character) => {
      root.querySelector(`[data-character="${character}"]`)?.classList.toggle('is-visible', visible.has(character));
    });
  }

  function focusSpeaker(speaker) {
    root.querySelectorAll('.vn-character').forEach((node) => {
      const active = speaker === 'narrator' || !speaker || node.dataset.character === speaker;
      node.classList.toggle('is-speaking', active);
      node.classList.toggle('is-listening', !active);
    });
  }

  function clearEffects() {
    els.shell.classList.remove('effect-shooting', 'effect-flash', 'effect-star1', 'effect-star23', 'effect-star4', 'effect-power', 'effect-orbit', 'effect-moon-flight');
    root.querySelector('.vn-moon')?.classList.remove('is-dim');
    els.thought.classList.remove('show');
    els.effects.innerHTML = '';
  }

  function addStars(count = 8) {
    els.effects.innerHTML = Array.from({ length: count }, (_, index) => `<i style="--x:${12 + (index * 29) % 78}%;--y:${12 + (index * 17) % 55}%;--d:${index * -.13}s">✦</i>`).join('');
  }

  function applyEffect(effect) {
    clearEffects();
    if (!effect) return;
    const speaker = root.querySelector('.vn-character.is-speaking');
    if (effect === 'shooting') els.shell.classList.add('effect-shooting');
    if (effect === 'flash') els.shell.classList.add('effect-flash');
    if (effect === 'jump') speaker?.classList.add('react-jump');
    if (effect === 'angry') root.querySelector('.vn-moon')?.classList.add('react-shake');
    if (effect === 'happyBounce') speaker?.classList.add('react-bounce');
    if (effect === 'dim') root.querySelector('.vn-moon')?.classList.add('is-dim');
    if (effect === 'star1' || effect === 'star23' || effect === 'star4') { els.shell.classList.add(`effect-${effect}`); addStars(effect === 'star23' ? 10 : 6); }
    if (effect === 'meatThought') els.thought.classList.add('show');
    if (effect === 'lanternNotice') els.lantern.classList.add('noticed');
    if (effect === 'inviteViewer') els.shell.classList.add('invite-viewer');
    if (effect === 'power') { els.shell.classList.add('effect-power'); addStars(14); }
    if (effect === 'starOrbit') { els.shell.classList.add('effect-orbit'); addStars(18); }
    if (effect === 'moonFlight') els.shell.classList.add('effect-moon-flight');
    if (effect === 'oliExit') root.querySelector('.vn-oli')?.classList.add('run-out');
  }

  function typeText(text, delay = 0) {
    clearInterval(typingTimer);
    fullText = text;
    els.text.textContent = '';
    els.next.classList.remove('ready');
    typing = true;
    const begin = () => {
      let cursor = 0;
      typingTimer = setInterval(() => {
        cursor += 1;
        els.text.textContent = fullText.slice(0, cursor);
        if (cursor >= fullText.length) finishTyping();
      }, 28);
    };
    if (delay) setTimeout(begin, delay); else begin();
  }

  function finishTyping() {
    clearInterval(typingTimer);
    els.text.textContent = fullText;
    typing = false;
    els.next.classList.add('ready');
  }

  function renderStep() {
    const step = MOON_STORY[stepIndex];
    if (!step) return showEnding();
    if (step.action === 'lantern') {
      clearInterval(typingTimer);
      els.dialogue.hidden = true;
      els.shell.classList.add('lantern-handoff');
      setTimeout(() => onLantern(), 1050);
      return;
    }
    if (step.action === 'ending') return showEnding();
    if (step.scene && step.scene !== scene) setScene(step.scene);
    if (step.visible) { visible = new Set(step.visible); syncCast(); }
    if (step.poseChanges) Object.entries(step.poseChanges).forEach(([character, pose]) => setPose(character, pose));
    if (step.speaker && step.speaker !== 'narrator' && step.pose) setPose(step.speaker, step.pose);
    focusSpeaker(step.speaker);
    els.dialogue.setAttribute('aria-label', `${CHARACTER_NAMES[step.speaker] || '旁白'}：${step.text}。點擊繼續`);
    applyEffect(step.effect);
    typeText(step.text, step.delay);
    sound(step.effect === 'flash' || step.effect === 'power' ? 820 : 560, .06);
  }

  function advanceOrComplete() {
    if (typing) return finishTyping();
    stepIndex += 1;
    renderStep();
  }

  function showEnding() {
    clearInterval(typingTimer);
    clearEffects();
    setScene('ending');
    els.dialogue.hidden = true;
    els.ending.hidden = false;
    els.shell.classList.add('show-ending');
    setPose('oli', 'runRight');
    root.querySelector('.vn-ending-copy')?.classList.add('reveal');
    root.querySelector('.vn-continue').onclick = () => onComplete('');
  }

  mount();
  renderStep();

  return { destroy: () => clearInterval(typingTimer) };
}
