import { ASSETS } from './assets.js';
import { CatchGame } from './catch-game.js';
import { playMoonStory } from './story-player.js';
import { FestivalMusic } from './music.js';
import { claimPlayerName, fetchSharedLeaderboard, normalizeName, saveLocalBest, submitSharedScore } from './leaderboard.js';

const app = document.querySelector('#app');
const soundBtn = document.querySelector('#soundBtn');
const toast = document.querySelector('#toast');
let sound = JSON.parse(localStorage.getItem('oliSound') ?? 'true');
let game = null;
const music = new FestivalMusic();

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[char]));

const normalizePlayerName = normalizeName;

function ping(frequency = 560, duration = 0.09) {
  if (sound) music.chime(frequency, duration);
}

function say(message, tone = 'normal') {
  toast.textContent = `🐶 ${message}`;
  toast.dataset.tone = tone;
  toast.classList.add('show');
  clearTimeout(say.timer);
  say.timer = setTimeout(() => toast.classList.remove('show'), 1700);
}

function updateSound() {
  soundBtn.textContent = sound ? '🔊' : '🔇';
}

soundBtn.onclick = () => {
  sound = !sound;
  localStorage.setItem('oliSound', sound);
  music.setEnabled(sound);
  updateSound();
  ping();
};
updateSound();

function leaderboardRows(scores, currentName = '') {
  if (!scores.length) return '<div class="empty-score">月宮還在等第一位接餅高手！</div>';
  const medals = ['🥇', '🥈', '🥉'];
  return scores.slice(0, 8).map((entry, index) => `
    <div class="leader-row ${normalizePlayerName(entry.name) === normalizePlayerName(currentName) ? 'current' : ''}">
      <b>${medals[index] || `#${index + 1}`}</b>
      <span>${escapeHtml(entry.name || '神秘旅人')}</span>
      <strong>${Number(entry.score || 0).toLocaleString()}</strong>
      <small>Combo ×${Number(entry.combo || 0)}</small>
    </div>`).join('');
}

const choose = (items, seed = 0) => items[Math.abs(seed) % items.length];

const CHARACTER_DIALOGUES = {
  oli: [
    '汪！中秋快樂～月餅你吃，肉肉給我！🐶🥩', '月亮圓圓，我的肚肚也要圓圓！', '汪你中秋快樂！每天都有肉肉吃～',
    '今天不當邊牧，今天當月餅守護汪 🌕', '聽說中秋要團圓，那零食也要全部集合！', '月亮可以賞，烤肉一定要吃！汪！',
    '中秋願望很簡單：散步、肉肉、還有更多肉肉！', '嫦娥住月亮，我住零食櫃旁邊 🐾', '祝你煩惱像我的毛一樣——通通被吹走！',
    '汪汪！祝你今年的好運比我的毛還多！', '月餅我不能亂吃，但肉肉可以分我一點吧？🥺', '中秋快樂！今天可以多散步一圈嗎？',
    '月亮負責發光，我負責可愛 ✨🐶', '今晚一起賞月吧！但看到肉記得先叫我。', '汪你月圓、人圓、零食罐永遠滿滿！',
    '中秋節就是要一家人整整齊齊，還有一隻狗狗！', '月亮這麼圓，一定是偷偷吃了很多肉肉。', '今天的任務：賞月 ❌　等烤肉掉下來 ✅',
    'Oli 祝你每天都有搖尾巴等級的開心！', '汪～中秋快樂！祝你今年旺、旺、旺！🐶🧧',
  ],
  phoebe: [
    '中秋快樂！🌕 願今年所有期待都慢慢變成真的。', '月亮負責圓，我負責祝你快樂！', '祝你月餅甜甜、假期長長、煩惱少少～',
    '中秋願望：吃好吃的、睡飽飽、每天都開心！', '月亮都圓了，今年的願望也該圓了吧！✨', '中秋快樂！今天先把煩惱放假一天～',
    '願你的生活像今晚的月亮一樣，亮晶晶 ✨', '月餅可以有很多口味，生活也要有很多驚喜！', '今年的中秋 KPI：快樂 100%、煩惱 0%！',
    '今天不談熱量，只談月餅好不好吃 😂', '祝你想見的人都在身邊，想做的事都能實現。', '月圓人團圓，快樂也要一起團圓！',
    '中秋限定 Buff：好運 +100、快樂 +100、煩惱 -100！', '祝你接下來的每一天，都比今天再幸運一點點 🍀', '月亮這麼漂亮，不許你今天不開心！',
    '送你一顆虛擬月餅 🥮 吃完獲得一整年的好運！', '願你的願望不是「等等再說」，而是「成功達成」！', '中秋節嘛～最重要的就是大家都在、大家都開心。',
    '把今年沒用完的好運，一次全部送給你！', '🌕 中秋快樂！願我們明年的今天，也能一起賞月。',
  ],
  brother: [
    '【系統通知】中秋活動已開啟！登入即可領取快樂 ×999！', '🌕 中秋限定副本開啟：擊敗月餅 Boss！', '今日 Buff：幸運 +100%、快樂 +200%、作業 -100%。',
    '恭喜獲得「中秋限定禮包」：月餅 ×10、好運 ×999！', '🎮 Achievement Unlocked：又成功度過一年中秋節！', '祝你抽卡十連全金，保底永遠用不到！',
    '中秋限定角色「嫦娥 SSR」登場！🌕', '今晚主線任務：吃烤肉。支線任務：賞月。', 'HP 已補滿、MP 已補滿，準備迎接中秋假期！',
    '祝你打 Boss 不滅團、排位不掉分、隊友不搞事。', '🎮 中秋登入獎勵：快樂 +999、運氣 +999。', '月亮已刷新，請各位玩家前往戶外查看 🌕',
    '今日伺服器公告：禁止不開心，違者強制吃月餅。', '祝你今年一路 Level Up，人生直接升滿等！', '中秋活動任務：月餅 1/1、烤肉 1/1、快樂 999/999。',
    '祝你開箱永遠出傳說，抽卡永遠不歪！', '【警告⚠️】附近偵測到大量月餅，是否拾取？「YES」', '人生偶爾 Lag 沒關係，重新連線再出發！',
    '🌕 隱藏成就解鎖：「全家一起賞月」＋1000 EXP！', 'GG！今年的煩惱已被擊敗，下一關：快樂過中秋！',
  ],
  father: [
    '📈 祝你中秋快樂，月亮漲停、股票也漲停！', '願今年的 K 線一路向上，月餅一路吃不完！', '中秋最佳投資標的：家人 ❤️ 報酬率無限。',
    '🌕 月亮越來越圓，股票越漲越高！', '祝你買的都漲、賣的都對、錯過的都跌 😂', '中秋三大願望：股票漲、荷包漲、快樂也漲！',
    '📊 今日行情：月餅多頭、烤肉大漲、煩惱跌停。', '祝你今年財運一路長紅，天天都是紅 K！', '月圓人團圓，帳戶數字也要越來越圓 💰',
    '中秋快樂！祝你的投資報酬率比月亮還漂亮。', '願你的持股沒有套牢，只有牢牢賺錢！', '🌕 今晚月亮突破前高，準備挑戰歷史新高！',
    '中秋行情正式開盤：幸福漲停、煩惱跌停。', '祝你看盤看到的都是紅色，帳戶看到的都是獲利！', '📈 人生可以震盪，資產記得長期向上。',
    '願你的財富像複利一樣，一年比一年多！', '月餅要分著吃，獲利記得落袋為安 😎', '祝爸爸中秋節：身體健康、投資順利、財源滾滾！',
    '今天不看盤，看月亮；明天再繼續賺錢 🌕💰', '中秋最大利多公布：一家人團圓！幸福直接漲停 ❤️',
  ],
};

const randomDialogue = (role) => CHARACTER_DIALOGUES[role][Math.floor(Math.random() * CHARACTER_DIALOGUES[role].length)];

function getScoreTier(score) {
  if (score >= 8000) return {
    icon: '🏆', title: '月宮神話', level: 'SS',
    results: ['月餅才剛離開雲端，你和 Oli 已經在落點等候！', '今晚不是滿月照亮你，是你的分數照亮整座月宮。', '月兔一致通過：這份接餅技術可以直接寫進月宮史冊！', 'Oli 尾巴搖出一道旋風——新的傳說成績正式誕生。'],
    blessings: ['願你一路閃耀，也永遠保有享受旅程的從容。', '願所有努力都被看見，所有期待都有漂亮的答案。', '願你帶著今晚的滿格好運，迎接下一個精彩篇章。', '願圓滿不只在月亮，也落在你珍惜的每件事情上。'],
  };
  if (score >= 6500) return {
    icon: '👑', title: '月宮傳說', level: 'S',
    results: ['月餅還沒落地，Oli 的籃子就已經準備好了！', '這個反應速度，連月兔都想拜你為師。', '一人一狗默契滿分，月宮今晚幾乎零失誤！', '你的 Combo 讓星星排成一列替你鼓掌。'],
    blessings: ['願你的每一次努力，都像滿月一樣耀眼圓滿。', '願你所到之處都有光，所盼之事都有好消息。', '願好運總在最剛好的時候，穩穩落進你的懷裡。', '願你保有這份專注，也保有被幸福接住的柔軟。'],
  };
  if (score >= 5000) return {
    icon: '🌕', title: '滿月接餅王', level: 'A',
    results: ['好厲害！Oli 開心得尾巴都快搖成風扇了。', '籃子裝得香噴噴，今晚的月宮大豐收！', '這個接餅節奏太漂亮，連月亮都忍不住替你鼓掌。', 'Oli 決定頒給你一枚會發光的月餅勳章。'],
    blessings: ['願你的日子香甜有餡，喜歡的事情都剛好發生。', '願每一份用心都有回報，每一次期待都有回音。', '願你常有豐收，也常有能一起分享的人。', '願生活像今晚的籃子，總能盛住滿滿的幸福。'],
  };
  if (score >= 3500) return {
    icon: '✨', title: '月光默契王', level: 'B',
    results: ['你和 Oli 的默契已經通過月宮正式認證！', '幾顆點心溜走了，但更多好運被你牢牢接住。', '節奏越來越順，Oli 已經學會看你的眼神行動。', '這一籃不只裝月餅，還裝進了漂亮的團隊合作。'],
    blessings: ['願溫柔月光陪著你，把日常照成喜歡的模樣。', '願你身邊常有好夥伴，忙碌之中也不忘記開心。', '願每一次合作都彼此成就，每一段旅程都不孤單。', '願日常的小確幸，慢慢聚成一輪完整的月亮。'],
  };
  if (score >= 2000) return {
    icon: '🥮', title: '桂香好搭檔', level: 'C',
    results: ['暖身完成！Oli 說下一籃一定會裝得更滿。', '有接住、有閃開，今晚的冒險表現很有模有樣。', '你的反應正在升級，月餅們已經開始緊張了。', '這份成績剛剛好香甜，還留了一點再挑戰的空間。'],
    blessings: ['願你享受每一次進步，也珍惜沿途的小驚喜。', '願你不急著完美，依然能好好喜歡每一次出發。', '願每個平凡日子，都有一口剛剛好的香甜。', '願你慢慢累積勇氣，也慢慢靠近心裡的願望。'],
  };
  return {
    icon: '🌼', title: '月光新芽', level: 'D',
    results: ['第一次冒險就很棒，Oli 已經記住你的腳步了！', '幾顆月餅去散步了沒關係，快樂有接住就好。', '籃子還有空位，正好留給下一次更厲害的你。', 'Oli 說今天先熟悉路線，下次要一起大豐收！'],
    blessings: ['願你帶著勇氣慢慢前進，每一天都有小小驚喜。', '願每一個小進步，都被月光溫柔地看見。', '願你不和別人比較，只比昨天多一點快樂。', '願你總有重新出發的勇氣，也有人為你加油。'],
  };
}

function tierCopy(tier, score, salt = 0) {
  return {
    result: choose(tier.results, score + salt),
    blessing: choose(tier.blessings, score + salt),
  };
}

function wishReply(wishText, score) {
  const groups = [
    { words: ['家人', '健康', '平安', '爸爸', '媽媽'], replies: ['願牽掛的人平安健康，團聚時總有笑聲。', '願家裡的燈永遠溫暖，重要的人都好好的。', '願月光替你守護家人，把平安送進每一天。'] },
    { words: ['夢想', '成功', '工作', '考試', '學業'], replies: ['願努力都有方向，想抵達的地方一步步靠近。', '願你的才華被看見，下一個好消息正在路上。', '願勇氣比猶豫多一點，夢想比昨天更近一點。'] },
    { words: ['愛', '朋友', '幸福', '感情', '陪伴'], replies: ['願真心被珍惜，想念的人也正好想念你。', '願身邊常有懂你的人，把平凡日子過得閃閃發亮。', '願所有溫柔都有回音，每次相聚都值得收藏。'] },
    { words: ['快樂', '開心', '旅行', '自由'], replies: ['願生活多一點驚喜，煩惱都被晚風吹遠。', '願你常去喜歡的地方，也常成為自己喜歡的模樣。', '願每個普通日子，都藏著讓你微笑的小事。'] },
  ];
  const match = groups.find((group) => group.words.some((word) => wishText.includes(word)));
  return choose((match || { replies: ['願寫下的心意被月亮收好，在適合的日子悄悄成真。', '願你心有所盼、行有所往，每一步都有柔和月光相伴。', '願今晚升起的不只是天燈，還有滿滿的勇氣與好運。'] }).replies, score + wishText.length);
}

function wrapWish(text, size) {
  const perLine = { large: 7, medium: 10, small: 13 }[size] || 10;
  const clean = text.replace(/\s+/g, ' ').trim();
  const lines = [];
  for (let index = 0; index < clean.length; index += perLine) lines.push(clean.slice(index, index + perLine));
  if (lines.length > 1 && lines.at(-1).length === 1) {
    lines[lines.length - 1] = lines.at(-2).slice(-1) + lines.at(-1);
    lines[lines.length - 2] = lines.at(-2).slice(0, -1);
  }
  return lines.join('\n');
}

async function showLeaderboard(currentName = '') {
  const existing = app.querySelector('.score-modal');
  if (existing) existing.remove();
  app.insertAdjacentHTML('beforeend', `
    <div class="score-modal" role="dialog" aria-modal="true" aria-labelledby="scoreTitle">
      <section class="score-board">
        <button class="score-close" aria-label="關閉得分榜">×</button>
        <div class="score-crown">☾</div>
        <h2 id="scoreTitle">月宮得分榜</h2>
        <p>每一次接住，都是 Oli 尾巴努力搖出來的榮耀！</p>
        <div class="score-head"><span>名次</span><span>冒險者</span><span>月光值</span><span>最高連擊</span></div>
        <div class="score-list"><div class="empty-score">正在向月宮取得最新排名…</div></div>
        <button class="cta score-done">繼續去接月餅</button>
      </section>
    </div>`);
  const close = () => app.querySelector('.score-modal')?.remove();
  app.querySelector('.score-close').onclick = close;
  app.querySelector('.score-done').onclick = close;
  const scores = await fetchSharedLeaderboard();
  const list = app.querySelector('.score-list');
  if (list) list.innerHTML = leaderboardRows(scores, currentName);
}

function cover() {
  music.setTheme('cover');
  game?.destroy();
  app.innerHTML = `
    <section class="cover-screen">
      <div class="cover-moon"></div>
      <div class="cover-stars" aria-hidden="true"></div>
      <div class="cover-content">
        <p>歡迎進入</p>
        <h1 class="art-title"><span>Oli</span><strong>月光大冒險</strong></h1>
        <div class="title-ornament"><i></i><b>☾</b><i></i></div>
        <p class="cover-subtitle">今晚，和最可愛的月光嚮導一起前往月宮</p>
        <button id="enterMoon" class="cta cover-enter">踏入月光之門</button>
      </div>
      <div class="cover-oli story-art story-moon" aria-label="Oli 在月光下等你"></div>
    </section>`;
  app.querySelector('#enterMoon').onclick = () => {
    music.setEnabled(sound);
    app.querySelector('.cover-screen').classList.add('leaving');
    ping(720, 0.12);
    setTimeout(intro, 420);
  };
}

function intro() {
  music.setTheme('cover');
  game?.destroy();
  const playerName = localStorage.getItem('oliPlayer') || '';
  app.innerHTML = `
    <section class="intro-screen catch-intro">
      <div class="intro-brand"><span>☾</span><div><b>Oli</b><strong>月光大冒險</strong></div></div>
      <div class="intro-story">
        <p>先讓 Oli 認識今晚的冒險夥伴</p>
        <h1 class="section-art-title">你叫什麼名字呢？</h1>
        <div class="intro-dialogue">香香的接起來，辣辣的閃開來——你能讓 Oli 的籃子滿載而歸嗎？</div>
        <label>冒險者暱稱<input id="playerName" maxlength="12" value="${escapeHtml(playerName)}" placeholder="輸入你的暱稱"></label>
        <div class="intro-actions">
          <button id="startGame" class="cta">🥮 出發！開始接月餅</button>
          <button id="showScores" class="secondary">🏆 月宮得分榜</button>
          <button id="backCover" class="text-button">返回封面</button>
        </div>
      </div>
      <div class="intro-oli story-art story-play" aria-label="Oli 開心地邀請你出發"></div>
      <div class="intro-hint"><span>← →</span> 左右移動，接住美味</div>
    </section>`;

  app.querySelector('#startGame').onclick = async () => {
    const input = app.querySelector('#playerName');
    const name = input.value.trim();
    if (!name) return say('先幫月宮簽到，告訴我你的名字吧！');
    const button = app.querySelector('#startGame');
    button.disabled = true;
    button.textContent = '🌕 正在向月宮報到…';
    const claim = await claimPlayerName(name);
    button.disabled = false;
    button.textContent = '🥮 出發！開始接月餅';
    if (!claim.ok && claim.reason === 'name_taken') {
      input.focus();
      input.select();
      return say('這個名字已經在其他裝置使用囉！請換一個專屬名字～', 'urgent');
    }
    if (!claim.ok) return say('月宮排行榜暫時連不上，請稍後再試一次～', 'urgent');
    localStorage.setItem('oliPlayer', name);
    start(name);
  };
  app.querySelector('#showScores').onclick = () => showLeaderboard();
  app.querySelector('#backCover').onclick = cover;
}

function start(name) {
  music.setEnabled(sound);
  music.setTheme('game');
  app.innerHTML = '<div id="gameMount"></div>';
  game = new CatchGame({
    root: app.querySelector('#gameMount'),
    say,
    sound: (type) => ping(type === 'bad' ? 160 : type === 'fever' ? 820 : 600, type === 'fever' ? 0.16 : 0.07),
    onFinish: (result) => summary(name, result),
  });
  game.start();
}

function summary(name, result) {
  music.setTheme('story');
  result.remarkSeed ??= Math.floor(Math.random() * 10000);
  const tier = getScoreTier(result.score);
  const copy = tierCopy(tier, result.score, result.remarkSeed);
  app.innerHTML = `
    <section class="summary-screen">
      <div class="summary-card fancy-frame">
        <div class="story-art story-dance summary-oli"></div>
        <p>${escapeHtml(name)} 和 Oli 把月光裝進籃子了！</p>
        <div class="tier-badge"><span>${tier.icon}</span><div><small>${tier.level} 級評價</small><b>${tier.title}</b></div></div>
        <h1>${result.score.toLocaleString()} <small>Moon Points</small></h1>
        <div class="summary-stats">
          <span>🥮 接住 ${result.caught} 份美味</span>
          <span>✨ 最長 Combo ×${result.bestCombo}</span>
          <span>❤️ 剩下 ${result.hearts}/5 顆愛心</span>
        </div>
        <blockquote>${copy.result}<br>籃子裡最後一點月光，忽然輕輕跳了一下……</blockquote>
        <button id="wishNext" class="cta">🌕 繼續故事：把月亮帶回家</button>
      </div>
    </section>`;
  app.querySelector('#wishNext').onclick = () => playStory(name, result);
}

function playStory(name, result) {
  music.setTheme('story');
  playMoonStory({
    root: app,
    sound: ping,
    onLantern: () => wish(name, result, (wishText) => ending(name, result, wishText), true),
    onComplete: (wishText) => ending(name, result, wishText || '願大家平安快樂'),
  });
}

function moonStory(name, result) {
  const scenes = [
    {
      image: ASSETS.STORY_FOUND,
      chapter: '第一幕｜中秋夜',
      title: '草叢裡的月光',
      text: '中秋夜，三位家人和 Oli 沿著桂花小路散步。滿月把影子拉得長長的，Oli 卻突然停在草叢前。葉片之間，竟躺著一顆掌心大小、忽明忽暗的小月亮。',
      button: '輕輕捧起小月亮',
    },
    {
      image: ASSETS.STORY_ROAD,
      chapter: '第二幕｜一起找回家的路',
      title: '燈籠小路',
      text: '小月亮一會兒亮、一會兒暗，像在尋找什麼。於是大家陪它走過掛滿燈籠的街道；桂花被晚風吹起，星星也一路跟著，直到一座能看見整片夜空的山丘。',
      button: '走上月光山丘',
    },
    {
      image: ASSETS.STORY_WISH,
      chapter: '第三幕｜原來它在找願望',
      title: '把願望交給月亮',
      text: '小月亮慢慢飄到半空：「我不是迷路了。每年中秋，我都會來收集大家最珍惜的願望，再把它們帶回月亮。」大家閉上眼睛，Oli 也很認真——沒有人知道牠想的是家人，還是烤肉。',
      button: '把我的願望寫進天燈',
    },
  ];
  let index = 0;
  app.innerHTML = `
    <section class="moon-story" aria-live="polite">
      <img class="moon-story-image" alt="">
      <div class="moon-story-shade"></div>
      <article class="moon-story-caption">
        <div class="moon-story-progress" aria-label="故事進度">${scenes.map((_, i) => `<i data-step="${i}"></i>`).join('')}</div>
        <p class="moon-story-chapter"></p>
        <h1></h1>
        <p class="moon-story-text"></p>
        <button class="cta moon-story-next"></button>
      </article>
    </section>`;
  const image = app.querySelector('.moon-story-image');
  const chapter = app.querySelector('.moon-story-chapter');
  const title = app.querySelector('.moon-story-caption h1');
  const text = app.querySelector('.moon-story-text');
  const next = app.querySelector('.moon-story-next');
  const render = () => {
    const scene = scenes[index];
    image.classList.add('changing');
    setTimeout(() => {
      image.src = scene.image;
      image.alt = `${scene.title}的中秋故事插畫`;
      chapter.textContent = scene.chapter;
      title.textContent = scene.title;
      text.textContent = scene.text;
      next.textContent = scene.button;
      app.querySelectorAll('.moon-story-progress i').forEach((dot, i) => dot.classList.toggle('active', i <= index));
      image.classList.remove('changing');
    }, index ? 180 : 0);
  };
  next.onclick = () => {
    ping(660, .1);
    if (index < scenes.length - 1) { index += 1; render(); }
    else wish(name, result);
  };
  render();
}

function wish(name, result, afterLaunch = null, fromStory = false) {
  music.setTheme('story');
  app.innerHTML = `
    <section class="wish-screen${fromStory ? ' story-wish-transition' : ''}">
      <div class="wish-stars"></div>
      <div class="wish-copy fancy-frame">
        <p>把它寫下來，讓我們一起送到月亮身邊吧。</p>
        <h1 class="section-art-title">今年中秋，你有什麼願望？</h1>
        <label>今年中秋，我希望……
          <textarea id="wishText" maxlength="56" placeholder="例如：願家人平安健康，每一天都有值得期待的小驚喜"></textarea>
        </label>
        <div class="wish-suggestions" aria-label="願望靈感">
          <button data-wish="願家人平安健康，天天都有好心情">家人平安</button>
          <button data-wish="願每一天都有值得期待的小驚喜">每天開心</button>
          <button data-wish="願心裡珍藏的夢想都能慢慢實現">夢想成真</button>
        </div>
        <div class="lantern-editor" aria-label="天燈樣式設定">
          <div class="editor-row"><b>天燈顏色</b><div class="color-options">
            <button class="color-dot active" data-color="amber" aria-label="暖橘色"></button><button class="color-dot" data-color="rose" aria-label="櫻花粉"></button><button class="color-dot" data-color="jade" aria-label="桂葉綠"></button><button class="color-dot" data-color="blue" aria-label="月光藍"></button><button class="color-dot" data-color="violet" aria-label="星夜紫"></button>
          </div></div>
        </div>
        <div class="wish-meta"><span>願望會寫在天燈上</span><b id="wishCount">0 / 56</b></div>
        <button id="launch" class="cta">🏮 Oli，幫我把願望送上天空！</button>
      </div>
      <div class="lantern-stage">
        <div class="launch-countdown" aria-live="polite"></div>
        <div class="wish-prayer-cast" aria-label="Phoebe、弟弟、爸爸和 Oli 一起為願望祈福">
          <figure class="wish-prayer wish-prayer-brother"><img src="assets/characters/family/prayer-brother.png" alt="弟弟閉上眼睛陪你一起祈福"></figure>
          <figure class="wish-prayer wish-prayer-father"><img src="assets/characters/family/prayer-father.png" alt="爸爸閉上眼睛陪你一起祈福"></figure>
          <figure class="wish-prayer wish-prayer-phoebe"><img src="assets/characters/family/prayer-phoebe.png" alt="Phoebe 閉上眼睛陪你一起祈福"></figure>
          <figure class="wish-prayer wish-prayer-oli"><img src="assets/characters/oli/game/pray.png" alt="Oli 閉上眼睛一起祈福"></figure>
        </div>
        <div class="wish-lantern" data-color="amber" data-size="medium" role="img" aria-label="寫著玩家願望的精緻中秋天燈">
          <span id="lanternWords">在這裡寫下願望</span>
        </div>
      </div>
    </section>`;

  const input = app.querySelector('#wishText');
  const words = app.querySelector('#lanternWords');
  const count = app.querySelector('#wishCount');
  const lantern = app.querySelector('.wish-lantern');
  let fontSize = 'medium';
  if (fromStory) setTimeout(() => input.focus(), 650);
  input.oninput = () => {
    words.textContent = input.value.trim() ? wrapWish(input.value, fontSize) : '在這裡寫下\n願望';
    count.textContent = `${input.value.length} / 56`;
  };
  app.querySelectorAll('[data-color]').forEach((button) => button.onclick = () => {
    app.querySelectorAll('[data-color]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    lantern.dataset.color = button.dataset.color;
  });
  app.querySelectorAll('[data-size]').forEach((button) => button.onclick = () => {
    app.querySelectorAll('[data-size]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    fontSize = button.dataset.size;
    lantern.dataset.size = fontSize;
    input.dispatchEvent(new Event('input'));
  });
  app.querySelectorAll('[data-wish]').forEach((button) => {
    button.onclick = () => {
      input.value = button.dataset.wish;
      input.dispatchEvent(new Event('input'));
      input.focus();
    };
  });
  app.querySelector('#launch').onclick = () => {
    const text = input.value.trim() || '願大家平安快樂';
    words.textContent = wrapWish(text, fontSize);
    localStorage.setItem('oliWish', text);
    localStorage.setItem('oliWishStyle', JSON.stringify({ color: lantern.dataset.color, size: fontSize }));
    const stage = app.querySelector('.lantern-stage');
    const countdown = app.querySelector('.launch-countdown');
    const launchButton = app.querySelector('#launch');
    launchButton.disabled = true;
    app.querySelector('.wish-screen').classList.add('is-launching');
    app.querySelector('.wish-copy').classList.add('fade');
    stage.classList.add('cinematic');
    lantern.classList.add('counting');
    countdown.textContent = '3';
    countdown.classList.add('show');
    ping(520, .12);
    setTimeout(() => { countdown.textContent = '2'; ping(610, .12); }, 750);
    setTimeout(() => { countdown.textContent = '1'; ping(720, .14); }, 1500);
    setTimeout(() => {
      countdown.textContent = '';
      countdown.classList.remove('show');
      lantern.classList.remove('counting');
      lantern.classList.add('takeoff');
      ping(880, .2);
    }, 2250);
    setTimeout(() => afterLaunch ? afterLaunch(text) : storyFinale(name, result, text), 4300);
  };
}

function storyFinale(name, result, wishText) {
  const tier = getScoreTier(result.score);
  const copy = tierCopy(tier, result.score, wishText.length);
  const reply = wishReply(wishText, result.score);
  const lanterns = Array.from({ length: 22 }, (_, index) => `<i style="--x:${5 + (index * 17) % 91}%;--d:${(index % 8) * -.73}s;--s:${.46 + (index % 6) * .11};--drift:${(index % 3 - 1) * 42}px"></i>`).join('');
  app.innerHTML = `
    <section class="story-finale" style="--finale-image:url('${ASSETS.STORY_FINALE}')">
      <div class="story-finale-lanterns" aria-hidden="true">${lanterns}</div>
      <article class="story-finale-caption">
        <p>第四幕｜把月亮帶回家</p>
        <h1>所有願望，都在回家的路上</h1>
        <div class="story-finale-copy">寫在天燈上的願望化成星光。山腳下的天燈也一盞盞升起，陪著小月亮飛回天空。</div>
        <blockquote>「月亮會記得每一個願望，<br>而我們會記得每一次相聚。」</blockquote>
        <p class="story-finale-blessing">${escapeHtml(name)}，${reply}<br>${copy.blessing}</p>
        <button id="receiveBlessing" class="cta">一起回到月光下</button>
      </article>
    </section>`;
  app.querySelector('#receiveBlessing').onclick = () => ending(name, result, wishText);
}

async function ending(name, result, wishText) {
  music.setTheme('story');
  const tier = getScoreTier(result.score);
  const copy = tierCopy(tier, result.score, result.remarkSeed || name.length);
  const finalBlessing = wishReply(wishText, result.score + (result.remarkSeed || 0));
  saveLocalBest(name, result.score, result.bestCombo);
  await submitSharedScore(name, result.score, result.bestCombo);
  const scores = await fetchSharedLeaderboard();
  const rankIndex = scores.findIndex((entry) => normalizePlayerName(entry.name) === normalizePlayerName(name));
  const rank = rankIndex >= 0 ? rankIndex + 1 : '—';
  const lines = {
    brother: randomDialogue('brother'),
    father: randomDialogue('father'),
    phoebe: randomDialogue('phoebe'),
    oli: randomDialogue('oli'),
  };

  app.innerHTML = `
    <section class="festival-ending" style="--ending-bg:url('${ASSETS.ENDING_BG}')">
      <div class="festival-sparkles" aria-hidden="true"></div>
      <div class="festival-title ending-title">
        <span>花好月圓・平安相伴</span>
        <h1>中秋節快樂</h1>
        <p>Happy Mid-Autumn Festival</p>
      </div>
      <div class="ending-cast" aria-label="Oli 和家人一起送上中秋祝福">
        <figure class="cast-member cast-brother" data-character="brother" role="button" tabindex="0" aria-label="點擊弟弟切換祝福">
          <div class="character-bubble" aria-live="polite"><span>${escapeHtml(lines.brother)}</span></div>
          <img src="${ASSETS.MAN}" alt="穿古裝的弟弟送上遊戲系祝福">
        </figure>
        <figure class="cast-member cast-father" data-character="father" role="button" tabindex="0" aria-label="點擊爸爸切換祝福">
          <div class="character-bubble" aria-live="polite"><span>${escapeHtml(lines.father)}</span></div>
          <img src="${ASSETS.FATHER}" alt="穿古裝的爸爸端著月餅送上祝福">
        </figure>
        <figure class="cast-member cast-phoebe" data-character="phoebe" role="button" tabindex="0" aria-label="點擊 Phoebe 切換祝福">
          <div class="character-bubble" aria-live="polite"><span>${escapeHtml(lines.phoebe)}</span></div>
          <img src="${ASSETS.WOMAN}" alt="穿古裝的 Phoebe 提著兔子燈籠送上祝福">
        </figure>
        <figure class="cast-member cast-oli" data-character="oli" role="button" tabindex="0" aria-label="點擊 Oli 切換祝福">
          <div class="character-bubble" aria-live="polite"><span>${escapeHtml(lines.oli)}</span></div>
          <div class="ending-oli story-art story-wave" aria-label="Oli 開心揮手祝福"></div>
        </figure>
      </div>
      <div class="ending-actions">
        <button id="showResult" class="cta">查看我的月光成績</button>
        <button id="again" class="ending-link">再玩一次</button>
      </div>
      <div class="result-modal" id="resultModal" hidden>
        <button class="result-backdrop" aria-label="關閉成績"></button>
        <article class="festival-result-card" role="dialog" aria-modal="true" aria-labelledby="resultTitle">
          <button class="result-close" aria-label="關閉成績">×</button>
          <div class="festival-to">送給 <b>${escapeHtml(name)}</b> 的月光祝福</div>
          <div class="festival-grade"><span>${tier.level}</span><div><small>本次稱號</small><h2 id="resultTitle">${tier.icon} ${tier.title}</h2></div></div>
          <p class="festival-comment">${copy.result}</p>
          <div class="result-stats festival-stats">
            <span><b>${result.score.toLocaleString()}</b> 月光值</span>
            <span><b>×${result.bestCombo}</b> 最高連擊</span>
            <span><b>${rank === '—' ? rank : `#${rank}`}</b> 月宮排名</span>
          </div>
          <blockquote>「${escapeHtml(wishText)}」</blockquote>
          <p class="festival-blessing">${finalBlessing}</p>
          <div class="result-actions">
            <button id="again" class="cta">再玩一次</button>
            <button id="showScoresResult" class="secondary">查看月宮得分榜</button>
          </div>
        </article>
      </div>
    </section>`;

  const resultModal = app.querySelector('#resultModal');
  const openResult = () => { resultModal.hidden = false; app.querySelector('.result-close').focus(); };
  const closeResult = () => { resultModal.hidden = true; app.querySelector('#showResult').focus(); };
  app.querySelector('#showResult').onclick = openResult;
  app.querySelector('.result-close').onclick = closeResult;
  app.querySelector('.result-backdrop').onclick = closeResult;
  app.querySelectorAll('#again').forEach((button) => button.onclick = () => start(name));
  app.querySelector('#showScoresResult').onclick = () => showLeaderboard(name);
  app.querySelectorAll('.cast-member[data-character]').forEach((member) => {
    let previous = member.querySelector('.character-bubble span').textContent;
    const changeLine = () => {
      const role = member.dataset.character;
      let next = randomDialogue(role);
      while (next === previous && CHARACTER_DIALOGUES[role].length > 1) next = randomDialogue(role);
      previous = next;
      const bubble = member.querySelector('.character-bubble');
      bubble.querySelector('span').textContent = next;
      bubble.classList.remove('is-changing');
      requestAnimationFrame(() => bubble.classList.add('is-changing'));
      ping(role === 'oli' ? 740 : 620, .08);
    };
    member.onclick = changeLine;
    member.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); changeLine(); }
    };
  });
}

cover();
