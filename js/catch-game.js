import { ASSETS, TREAT_POSES } from './assets.js';

const CFG = { duration: 30, speed: 56, spawn: 0.56 };
const TYPES = {
  mooncake: { v: 100, good: true },
  yolk: { v: 150, good: true },
  osmanthus: { v: 200, good: true },
  star: { v: 300, good: true },
  chili: { v: -200 },
  onion: { v: -300 },
  super: { v: 500, fever: true },
  golden: { v: 888, fever: true },
};
const REACTIONS = {
  chili: ['汪！舌頭著火了，辣椒快閃！', '這顆不是點心，是辣椒偷襲隊！', '呼——好辣！Oli 需要一口月光水！'],
  onion: ['洋蔥攻擊！Oli 眼淚汪汪！', '這顆會流淚，籃子拒絕收件！', '洋蔥成功偽裝成月餅……下次一定認得你！'],
  combo: ['漂亮！Oli 的尾巴已經搖成節拍器！', '默契滿分，再接一個就能把月亮逗笑！', '籃子穩穩的，這串 Combo 太順啦！'],
  super: ['月光爆發！接下來全部 ×2！', 'Oli 全身發光，六秒內分數加倍！', '月亮送來加速包，快把籃子裝滿！'],
  golden: ['月餅王駕到！黃金 +888！', '金光閃閃的大傢伙被你接住了！', '傳說月餅入籃，月宮全場歡呼！'],
};
const ITEM_POSES = {
  mooncake: 'catch-mooncake',
  yolk: 'catch-yolk',
  osmanthus: 'catch-osmanthus',
  star: 'catch-star',
  chili: 'catch-chili',
  onion: 'catch-onion',
  super: 'catch-super',
  golden: 'catch-golden',
};
const randomLine = (items) => items[Math.floor(Math.random() * items.length)];

export class CatchGame {
  constructor(options) {
    Object.assign(this, options);
    this.x = 44;
    this.vx = 0;
    this.keys = { l: 0, r: 0 };
    this.items = [];
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.caught = 0;
    this.hearts = 5;
    this.time = CFG.duration;
    this.fever = 0;
    this.running = false;
    this.last = 0;
    this.spawnClock = 0.18;
    this.poseUntil = 0;
    this.nextIdlePose = 0;
    this.finalCalled = false;
    this.down = (event) => this.key(event, 1);
    this.up = (event) => this.key(event, 0);
  }

  start() {
    this.root.innerHTML = `
      <section class="catch-stage" style="--stage:url('${ASSETS.STAGE}')">
        <div class="catch-shade"></div>
        <header class="catch-hud">
          <div class="catch-logo"><b>Oli</b><span>月餅接接樂</span></div>
          <div class="hud-chip" aria-label="目前分數">🌙 <strong id="score">0</strong></div>
          <div class="hud-chip" aria-label="剩餘時間">◷ <strong id="time">0:30</strong></div>
          <div class="hearts" id="hearts" aria-label="生命值">♥♥♥♥♥</div>
          <div class="combo-box"><span id="combo">COMBO ×0</span><div><i id="comboBar"></i></div></div>
          <div class="fever-meter" aria-label="月光狂熱能量"><b>☾</b><div><i id="feverBar"></i></div></div>
        </header>
        <div class="fall-zone" id="zone">
          <div class="catcher-art catch-idle player" id="oli" aria-label="Oli 背著接物籃"></div>
          <div id="effects"></div>
        </div>
        <div class="catch-message" id="message">看準落點，讓 Oli 的籃子裝滿月光！</div>
        <div class="game-start-countdown" id="gameStartCountdown" hidden aria-live="assertive"></div>
        <div class="catch-controls">
          <button class="move-left" data-dir="-1" aria-label="向左移動"><span>◀</span><small>向左</small></button>
          <button class="move-right" data-dir="1" aria-label="向右移動"><span>▶</span><small>向右</small></button>
        </div>
        <div class="tutorial" id="tutorial">
          <div class="tutorial-card">
            <h1>30 秒月餅接接樂</h1>
            <div class="tutorial-demo">
              <span class="demo-treat">🥮</span><span class="demo-arrow">↓</span>
              <div class="catcher-art catch-idle demo-oli"></div>
            </div>
            <p><b>左右移動 Oli</b>，把香噴噴的點心接進籃子！</p>
            <div class="tutorial-rules"><span>✓ 連續接住衝 Combo</span><span>× 辣椒洋蔥快閃開</span></div>
            <button id="ready" class="cta">準備好了，開接！</button>
          </div>
        </div>
      </section>`;

    this.stage = this.root.querySelector('.catch-stage');
    this.zone = this.root.querySelector('#zone');
    this.oli = this.root.querySelector('#oli');
    this.effects = this.root.querySelector('#effects');
    this.hud();
    addEventListener('keydown', this.down);
    addEventListener('keyup', this.up);

    this.root.querySelectorAll('[data-dir]').forEach((button) => {
      const direction = Number(button.dataset.dir);
      const on = (event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        this.keys[direction < 0 ? 'l' : 'r'] = 1;
        this.nudge(direction);
        button.classList.add('active');
      };
      const off = (event) => {
        event.preventDefault();
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        this.keys[direction < 0 ? 'l' : 'r'] = 0;
        button.classList.remove('active');
      };
      button.onpointerdown = on;
      button.onpointerup = off;
      button.onpointercancel = off;
      button.onpointerleave = off;
      button.oncontextmenu = (event) => event.preventDefault();
    });

    this.root.querySelector('#ready').onclick = () => {
      const ready = this.root.querySelector('#ready');
      const tutorial = this.root.querySelector('#tutorial');
      const countdown = this.root.querySelector('#gameStartCountdown');
      ready.disabled = true;
      tutorial.classList.add('closing');
      setTimeout(() => {
        tutorial.remove();
        countdown.hidden = false;
        const steps = ['3', '2', '1', '開始！'];
        steps.forEach((step, index) => setTimeout(() => {
          countdown.textContent = step;
          countdown.classList.remove('beat');
          requestAnimationFrame(() => countdown.classList.add('beat'));
          this.sound(index === 3 ? 'fever' : 'good');
        }, index * 720));
        setTimeout(() => {
          countdown.remove();
          this.stage.classList.add('is-playing');
          this.running = true;
          this.last = performance.now();
          this.nextIdlePose = this.last + 2200;
          this.raf = requestAnimationFrame((time) => this.loop(time));
        }, 3060);
      }, 260);
    };
  }

  key(event, on) {
    if (['ArrowLeft', 'a', 'A'].includes(event.key)) {
      event.preventDefault();
      if (on && !event.repeat) this.nudge(-1);
      this.keys.l = on;
    }
    if (['ArrowRight', 'd', 'D'].includes(event.key)) {
      event.preventDefault();
      if (on && !event.repeat) this.nudge(1);
      this.keys.r = on;
    }
  }

  nudge(direction) {
    this.x = Math.max(3, Math.min(87, this.x + direction * 3.5));
    this.vx = direction * 22;
    if (this.oli) this.oli.style.transform = `translate3d(${this.x}vw,0,0)`;
  }

  setOliPose(pose) {
    this.oli.className = `catcher-art player ${pose}`;
  }

  spawn() {
    const random = Math.random();
    const type = random < 0.035 ? 'golden' : random < 0.10 ? 'super' : random < 0.20 ? 'onion'
      : random < 0.32 ? 'chili' : random < 0.47 ? 'star' : random < 0.64 ? 'osmanthus'
        : random < 0.81 ? 'yolk' : 'mooncake';
    const element = document.createElement('div');
    element.className = `fall-item item-${type}`;
    element.style.backgroundPosition = TREAT_POSES[type];
    this.zone.append(element);
    this.items.push({
      el: element,
      type,
      x: 12 + Math.random() * 78,
      y: -15,
      vy: 35 + (1 - this.time / CFG.duration) * 25 + Math.random() * 8,
      rot: (Math.random() - 0.5) * 80,
    });
  }

  loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.last) / 1000, 0.034);
    this.last = timestamp;
    this.time -= dt;
    if (this.time <= 0 || this.hearts <= 0) return this.finish();

    const direction = this.keys.r - this.keys.l;
    const target = direction * CFG.speed;
    this.vx += (target - this.vx) * Math.min(1, dt * 16);
    if (!direction) this.vx *= Math.pow(0.001, dt);
    this.x = Math.max(3, Math.min(87, this.x + this.vx * dt));
    this.oli.style.transform = `translate3d(${this.x}vw,0,0)`;

    if (timestamp > this.poseUntil) {
      if (Math.abs(this.vx) < 1 && this.fever <= 0 && timestamp > this.nextIdlePose) {
        this.setOliPose('catch-proud');
        this.poseUntil = timestamp + 520;
        this.nextIdlePose = timestamp + 2500 + Math.random() * 1800;
      } else {
        this.setOliPose(this.vx < -1 ? 'catch-left' : this.vx > 1 ? 'catch-right' : this.fever > 0 ? 'catch-fever' : 'catch-idle');
      }
    }

    this.spawnClock -= dt;
    const interval = CFG.spawn - (1 - this.time / CFG.duration) * 0.18;
    if (this.spawnClock <= 0) {
      this.spawn();
      this.spawnClock = interval * (0.75 + Math.random() * 0.5);
    }

    this.fever = Math.max(0, this.fever - dt);
    this.stage.classList.toggle('moon-fever', this.fever > 0);
    if (!this.finalCalled && this.time <= 5) {
      this.finalCalled = true;
      this.root.querySelector('#message').textContent = '最後 5 秒！Oli 的籃子還裝得下！';
      this.say(randomLine(['尾巴加速模式！最後 5 秒衝高分！', '最後五秒，Oli 要把籃子塞得滿滿的！', '月亮正在倒數——再接最後一輪！']));
    }
    this.updateItems(dt);
    this.hud();
    this.raf = requestAnimationFrame((time) => this.loop(time));
  }

  updateItems(dt) {
    this.items = this.items.filter((item) => {
      item.y += item.vy * dt;
      item.rot += dt * 45;
      item.el.style.transform = `translate3d(${item.x}vw,${item.y}vh,0) rotate(${item.rot}deg)`;
      if (item.y > 72 && item.y < 89 && Math.abs(item.x - (this.x + 5)) < 8.5) {
        this.catch(item);
        item.el.remove();
        return false;
      }
      if (item.y > 96) {
        item.el.remove();
        if (TYPES[item.type].good) {
          this.combo = 0;
          this.pop(item.x, 82, 'MISS', '#fff');
        }
        return false;
      }
      return true;
    });
  }

  catch(item) {
    const info = TYPES[item.type];
    if (info.v < 0) {
      this.hearts -= 1;
      this.combo = 0;
      this.score = Math.max(0, this.score + info.v);
      this.poseUntil = performance.now() + 620;
      this.setOliPose(ITEM_POSES[item.type]);
      this.stage.classList.add('shake');
      setTimeout(() => this.stage?.classList.remove('shake'), 600);
      this.pop(this.x + 5, 72, String(info.v), '#ff968b');
      this.say(randomLine(REACTIONS[item.type]), 'bad');
      this.sound('bad');
      return;
    }

    this.caught += 1;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const multiplier = (this.fever > 0 ? 2 : 1) * (1 + Math.min(1.5, Math.floor(this.combo / 5) * 0.2));
    const gain = Math.round(info.v * multiplier);
    this.score += gain;
    this.poseUntil = performance.now() + 520;
    const itemPose = ITEM_POSES[item.type];
    this.setOliPose(itemPose);
    this.pop(this.x + 5, 70, `+${gain}`, '#fff0a3');
    this.burst();
    this.sound(info.fever ? 'fever' : 'good');

    if (info.fever) {
      this.fever = 6;
      this.poseUntil = performance.now() + 700;
      this.setOliPose(ITEM_POSES[item.type]);
      this.say(randomLine(REACTIONS[item.type]));
    } else if (this.combo > 0 && this.combo % 5 === 0) {
      this.say(`${randomLine(REACTIONS.combo)} Combo ×${this.combo}`);
    }
  }

  pop(x, y, text, color) {
    const element = document.createElement('b');
    element.className = 'catch-pop';
    element.textContent = text;
    element.style.left = `${x}vw`;
    element.style.top = `${y}vh`;
    element.style.color = color;
    this.effects.append(element);
    setTimeout(() => element.remove(), 800);
  }

  burst() {
    for (let index = 0; index < 7; index += 1) {
      const spark = document.createElement('i');
      spark.className = 'catch-spark';
      spark.textContent = '✦';
      spark.style.setProperty('--a', `${index * 51}deg`);
      this.effects.append(spark);
      setTimeout(() => spark.remove(), 600);
    }
  }

  hud() {
    this.root.querySelector('#score').textContent = this.score.toLocaleString();
    this.root.querySelector('#time').textContent = `0:${String(Math.ceil(this.time)).padStart(2, '0')}`;
    this.root.querySelector('#hearts').textContent = '♥'.repeat(this.hearts) + '♡'.repeat(5 - this.hearts);
    this.root.querySelector('#combo').textContent = `COMBO ×${this.combo}`;
    this.root.querySelector('#comboBar').style.width = `${Math.min(100, this.combo * 10)}%`;
    this.root.querySelector('#feverBar').style.width = `${(this.fever / 6) * 100}%`;
  }

  finish() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.root.querySelector('#message').textContent = this.hearts <= 0 ? 'Oli 的籃子需要休息一下！' : '叮咚！30 秒月光收集完成！';
    setTimeout(() => {
      this.destroy(false);
      this.onFinish({ score: this.score, caught: this.caught, bestCombo: this.bestCombo, hearts: this.hearts });
    }, 900);
  }

  destroy(clear = true) {
    this.running = false;
    cancelAnimationFrame(this.raf);
    removeEventListener('keydown', this.down);
    removeEventListener('keyup', this.up);
    this.items.forEach((item) => item.el.remove());
    if (clear) this.root.innerHTML = '';
  }
}
