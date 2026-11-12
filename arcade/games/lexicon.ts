import type { GameFactory } from '../core/types';
import { C, roundRect, text } from '../core/draw';

// Answer pool: common, unambiguous five-letter words. Any 5-letter guess is accepted.
const WORDS = ('about above actor adapt admit adopt after again agent agree ahead alarm album alert alike alive allow alone along alter amber angle angry apart apple apply arena argue arise armor array arrow aside asset audio avoid award aware badge baker basic beach beard beast begin being below bench berry birth black blade blame blank blast blaze blend bless blind block bloom blown board boast bonus boost booth brain brake brand brave bread break brick bride brief bring broad brown brush build bunch burst buyer cabin cable camel candy carry catch cause chain chair chalk charm chart chase cheap check chess chest chief child chill choir civic claim class clean clear clerk click cliff climb clock close cloud coach coast color comet coral couch count court cover craft crane crash crawl cream crisp cross crowd crown crush curve cycle daily dance delta depth diary digit diner dizzy dough draft drain drama dream dress drift drill drink drive eager eagle early earth eight elbow elder elite email empty enjoy enter entry equal error essay event every exact exile exist extra fable faint faith false fancy feast fence ferry fever field fiery fifth fight final flame flash fleet flint float flock flood floor flour fluid focus force forge forth forum found frame fresh front frost fruit funny gamer giant glass gleam globe glory glove grace grade grain grand grant grape graph grasp grass great green greet grill grind group grove guard guess guest guide habit happy harsh heart heavy hedge hello hobby honey honor horse hotel house human humor hurry ideal image index inner input issue ivory jelly jewel joint joker judge juice karma knife knock label lager large laser later laugh layer learn lemon level light limit linen liver local lodge logic loose lover lucky lunar lunch magic major maker maple march match maybe mayor medal media melon mercy merit metal meter micro might minor mixer model money month moral motor mount mouse mouth movie music naive nerve never night noble noise north novel nurse ocean offer often olive onion opera orbit order organ other otter outer owner paint panel paper party pasta patch pause peace peach pearl pedal penny phase phone photo piano piece pilot pinch pixel pizza place plain plane plant plate plaza point polar porch pound power press price pride prime print prize proof proud prove pulse punch pupil quest queue quick quiet quilt quota quote radar radio raise rally ranch range rapid ratio raven reach react ready realm rebel relax reply rider ridge rifle right rival river roast robot rocky round route royal rugby ruler rural salad sauce scale scarf scene scope score scout screen serve seven shade shake shape share shark sharp sheep shelf shell shift shine shirt shock shore short shout sight skill skirt slate sleep slice slide smart smile smoke snack snake solar solid solve sound south space spare spark speak speed spend spice spike spine spoon sport spray squad stack staff stage stair stamp stand start state steam steel stick still stone storm story stove strap straw strip study style sugar suite sunny super surge swamp sweet swift swing sword table taste teach tempo thank theme thick thing think third thorn three throw thumb tiger timer toast token tooth topic torch total touch tower track trade trail train treat trend trial tribe trick truck truly trunk trust truth tulip tutor twist ultra uncle under union unity upper upset urban usage usual valid value vapor vault video vigor vinyl viral virus visit vital vivid vocal voice voter wagon waste watch water whale wheat wheel while white whole width woman world worry worth wrist write yacht young youth zebra').split(' ').filter(s => s.length === 5);

const ROWS = 6, LEN = 5, TS = 62, GAP = 8;
const KB = ['qwertyuiop', 'asdfghjkl', '>zxcvbnm<'];
type Mark = 0 | 1 | 2 | 3; // 0 none, 1 absent, 2 present, 3 correct
const FILL: Record<number, string> = { 1: '#2a3140', 2: '#d9a821', 3: '#2fbf63' };

const lexicon: GameFactory = (api) => {
  const { input, sfx, w } = api;
  const answer = api.pick(WORDS);
  const guesses: string[] = [], marks: Mark[][] = [];
  const keyMark: Record<string, Mark> = {};
  let cur = '', shakeT = 0, revealT = 0, done = false, doneT = 0, won = false, toast = '', toastT = 0;
  const ox = (w - (LEN * TS + (LEN - 1) * GAP)) / 2, oy = 28;
  const kbY = oy + ROWS * (TS + GAP) + 10;

  const score = (g: string): Mark[] => {
    const m: Mark[] = Array(LEN).fill(1);
    const pool: Record<string, number> = {};
    for (let i = 0; i < LEN; i++) { if (g[i] === answer[i]) m[i] = 3; else pool[answer[i]] = (pool[answer[i]] ?? 0) + 1; }
    for (let i = 0; i < LEN; i++) if (m[i] !== 3 && pool[g[i]]) { m[i] = 2; pool[g[i]]--; }
    return m;
  };

  const submit = () => {
    if (done || revealT > 0) return;
    if (cur.length < LEN) { shakeT = 0.35; toast = 'NOT ENOUGH LETTERS'; toastT = 1.2; sfx.blip(); return; }
    const m = score(cur);
    guesses.push(cur); marks.push(m);
    m.forEach((v, i) => { const k = cur[i]; if ((keyMark[k] ?? 0) < v) keyMark[k] = v; });
    revealT = 1.1; sfx.select();
    if (cur === answer) { won = true; done = true; }
    else if (guesses.length === ROWS) done = true;
    cur = '';
  };
  const type = (ch: string) => {
    if (done || revealT > 0) return;
    if (ch === '<') { cur = cur.slice(0, -1); sfx.key(); }
    else if (ch === '>') submit();
    else if (cur.length < LEN) { cur += ch; sfx.key(); }
  };

  const keyRects = () => {
    const out: { ch: string; x: number; y: number; w: number; h: number }[] = [];
    const kh = 46, kw = 40;
    KB.forEach((row, r) => {
      const widths = [...row].map(c => (c === '>' || c === '<' ? kw * 1.5 : kw));
      const total = widths.reduce((a, b) => a + b, 0) + (row.length - 1) * 5;
      let x = (w - total) / 2;
      [...row].forEach((c, i) => { out.push({ ch: c, x, y: kbY + r * (kh + 7), w: widths[i], h: kh }); x += widths[i] + 5; });
    });
    return out;
  };
  const keys = keyRects();

  return {
    update(dt) {
      shakeT = Math.max(0, shakeT - dt); toastT = Math.max(0, toastT - dt);
      if (revealT > 0) { revealT -= dt; if (revealT <= 0 && done) sfx[won ? 'win' : 'lose'](); }
      if (done && revealT <= 0) {
        doneT += dt;
        if (doneT > 1.6) {
          const grid = marks.map(r => r.map(v => (v === 3 ? '🟩' : v === 2 ? '🟨' : '⬛')).join('')).join('\n');
          api.setScore(won ? (7 - guesses.length) * 150 : 0);
          api.gameOver({ win: won, message: won ? `Solved in ${guesses.length}/6` : `The word was ${answer.toUpperCase()}`, share: `Lexicon ${won ? guesses.length : 'X'}/6\n${grid}` });
        }
        return;
      }
      for (const ch of input.typed) type(ch);
      if (input.codesPressed.includes('Backspace')) type('<');
      if (input.codesPressed.includes('Enter')) type('>');
      const p = input.pointer;
      if (p.pressed) for (const k of keys) if (p.x >= k.x && p.x <= k.x + k.w && p.y >= k.y && p.y <= k.y + k.h) type(k.ch);
    },

    render(g) {
      g.fillStyle = '#0a0f0c'; g.fillRect(0, 0, w, api.h);
      for (let r = 0; r < ROWS; r++) {
        const isCur = r === guesses.length;
        const sx = isCur && shakeT > 0 ? Math.sin(shakeT * 60) * 6 : 0;
        for (let i = 0; i < LEN; i++) {
          const x = ox + i * (TS + GAP) + sx, y = oy + r * (TS + GAP);
          let ch = '', m: Mark = 0, flip = 1;
          if (r < guesses.length) {
            ch = guesses[r][i]; m = marks[r][i];
            if (r === guesses.length - 1 && revealT > 0) {
              const local = (1.1 - revealT) / 0.2 - i; // staggered flip
              if (local < 0) m = 0; flip = local < 0 ? 1 : local < 1 ? Math.abs(Math.cos(local * Math.PI)) : 1;
              if (local >= 0 && local < 0.5) m = 0;
            }
          } else if (isCur) ch = cur[i] ?? '';
          const th = TS * flip;
          g.fillStyle = m ? FILL[m] : '#0a0f0c';
          roundRect(g, x, y + (TS - th) / 2, TS, th, 6); g.fill();
          if (!m) { g.strokeStyle = ch ? '#5a6a60' : '#25302a'; g.lineWidth = 2; roundRect(g, x + 1, y + 1, TS - 2, TS - 2, 6); g.stroke(); }
          if (ch && flip > 0.2) text(g, ch.toUpperCase(), x + TS / 2, y + TS / 2 + 2, { size: 24, align: 'center', baseline: 'middle', color: '#fff' });
        }
      }
      for (const k of keys) {
        const m = k.ch.length === 1 && k.ch !== '<' && k.ch !== '>' ? keyMark[k.ch] ?? 0 : 0;
        g.fillStyle = m ? FILL[m] : '#3a4440';
        roundRect(g, k.x, k.y, k.w, k.h, 6); g.fill();
        const lab = k.ch === '>' ? 'ENTER' : k.ch === '<' ? 'DEL' : k.ch.toUpperCase();
        text(g, lab, k.x + k.w / 2, k.y + k.h / 2 + 1, { size: lab.length > 1 ? 8 : 12, align: 'center', baseline: 'middle', color: '#fff' });
      }
      if (toastT > 0) {
        g.fillStyle = '#fff'; roundRect(g, w / 2 - 110, 6, 220, 22, 5); g.fill();
        text(g, toast, w / 2, 17, { size: 8, align: 'center', baseline: 'middle', color: '#000' });
      }
      if (done && revealT <= 0 && !won) {
        g.fillStyle = '#fff'; roundRect(g, w / 2 - 70, 6, 140, 22, 5); g.fill();
        text(g, answer.toUpperCase(), w / 2, 17, { size: 10, align: 'center', baseline: 'middle', color: '#000' });
      }
    },
  };
};

export default lexicon;
