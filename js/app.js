// app.js — DOM + routing + persistence for Judo Canon. All study logic is in lib.js (pure,
// unit-tested); this file only renders state and wires events.
//
// ROUTES (hash): #/ path · #/browse · #/t/<id> · #/cards?set=<set> · #/quiz?set=<set> · #/decode
//   · #/lessons · #/lesson/<id>  (study material derived from the owner's videos — see courses.js)
// STORAGE: localStorage 'judo-canon:v1' = { srs: {id: card}, notes: {id: text} }. Per-browser
//   by design (personal study progress); every access is try/catch'd so private mode still works.
// SETS: named subsets (Gokyo 1–5, the two kata, families, everything) shared by the path,
//   flashcards and quiz, so "study this set" is one link from anywhere. Lesson sets
//   (`course:<id>`, `lesson:<id>`) are Q/A sets: authored cards and quiz questions, not generated.

import { TECHNIQUES, GROUPS, GOKYO_SETS, KATA, VOCAB, GLOSSARY } from './data.js';
import { COURSES, CONCEPTS } from './courses.js';
import { links, decodeName, filter, review, statusOf, buildDeck, makeQuiz, QUIZ_MODES, progress,
  byId, BOX_INTERVAL_DAYS, DAY, lessonById, lessonCards, qaCardById, authoredQuiz, mentions } from './lib.js';

// ── State ────────────────────────────────────────────────────────────────────
const KEY = 'judo-canon:v1';
const state = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.srs) return { notes: {}, ...s }; } catch {}
  return { srs: {}, notes: {} };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

// ── Sets ─────────────────────────────────────────────────────────────────────
const SUBS = GROUPS.flatMap(g => g.subs);
const subName = id => SUBS.find(s => s.id === id)?.name ?? id;
const idsWhere = pred => TECHNIQUES.filter(pred).map(t => t.id);
const SETS = [
  ...GOKYO_SETS.map(g => ({ id: `gokyo-${g.n}`, name: `Gokyo · ${g.name}`, en: `${g.en} of the Gokyo`, ids: g.members })),
  ...KATA.map(k => ({ id: k.id, name: k.name, en: k.en, ids: k.members })),
  { id: 'beyond', name: 'Beyond the Gokyo', en: 'The remaining 28 throws (incl. counters & banned)', ids: idsWhere(t => t.group === 'nage' && !t.gokyo) },
  ...GROUPS[1].subs.map(s => ({ id: s.id, name: s.name, en: s.en, ids: idsWhere(t => t.sub === s.id) })),
  { id: 'all', name: 'The full canon', en: 'All 100 techniques', ids: TECHNIQUES.map(t => t.id) },
];
const cardIds = ls => ls.flatMap(l => lessonCards(l).map(c => c.id));
const LESSON_SETS = COURSES.flatMap(c => [
  { id: `course:${c.id}`, name: c.title, en: `All lessons · ${c.instructor}`, ids: cardIds(c.lessons), qa: true, lessons: c.lessons, course: c },
  ...c.lessons.map(l => ({ id: `lesson:${l.id}`, name: `Lesson ${l.n}`, en: l.title, ids: cardIds([l]), qa: true, lessons: [l], course: c })),
]);
const setById = id => SETS.find(s => s.id === id) ?? LESSON_SETS.find(s => s.id === id) ?? SETS.at(-1);

// ── Helpers ──────────────────────────────────────────────────────────────────
const $app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const st = id => statusOf(state.srs[id]);
const bar = p => `<div class="bar" role="img" aria-label="${p.mastered} mastered, ${p.learning} learning of ${p.total}">
  <i class="m" style="width:${(p.mastered / p.total) * 100}%"></i><i class="l" style="width:${(p.learning / p.total) * 100}%"></i></div>`;
const tags = t => [
  `<span class="tag">${esc(subName(t.sub))}</span>`,
  t.gokyo ? `<span class="tag">Gokyo ${t.gokyo}</span>` : '',
  ...KATA.filter(k => k.members.includes(t.id)).map(k => `<span class="tag">${esc(k.name)}</span>`),
  t.banned ? '<span class="tag ban">Prohibited in IJF contest</span>' : '',
].join('');
// Technique sets plus each course; inside a course, its per-lesson sets as well.
const setPicker = (cur, base) => {
  const curSet = setById(cur);
  const shown = curSet.qa ? LESSON_SETS.filter(s => s.course === curSet.course)
    : [...SETS, ...LESSON_SETS.filter(s => s.id.startsWith('course:'))];
  const back = curSet.qa ? `<a class="btn" href="${base}?set=all">← Techniques</a>` : '';
  return `<div class="seg" role="group" aria-label="Choose a set">${back}${shown.map(s =>
    `<a class="btn ${s.id === cur ? 'sel' : ''}" href="${base}?set=${s.id}">${esc(s.name)}</a>`).join('')}</div>`;
};
const lessonLink = l => `<a href="#/lesson/${l.id}">Lesson ${l.n} — ${esc(l.title)}</a>`;
const fmtDue = ms => { const d = Math.round(ms / DAY); return d <= 0 ? 'soon' : d === 1 ? 'tomorrow' : `in ${d} days`; };

// ── Views ────────────────────────────────────────────────────────────────────
function viewPath() {
  const all = progress(TECHNIQUES.map(t => t.id), state.srs);
  const due = TECHNIQUES.filter(t => state.srs[t.id]?.due <= Date.now()).length;
  return `
    <h1>Learn the full canon of judo</h1>
    <p class="lede">The Kodokan recognises 100 named techniques. Follow the path from the first Gokyo set to the
      full canon: open a technique to watch instructionals and competition ippons, then lock it in with spaced-repetition
      flashcards and quizzes.</p>
    <div class="stats">
      <div class="card stat"><b>${all.mastered}</b><span>mastered of 100</span></div>
      <div class="card stat"><b>${all.learning}</b><span>learning</span></div>
      <div class="card stat"><b>${due}</b><span>due for review</span></div>
      <div class="card stat"><b>${all.pct}%</b><span>of the canon</span></div>
    </div>
    ${bar(all)}
    <div class="row" style="margin-top:16px">
      <a class="btn primary" href="#/cards?set=${due ? 'all' : (SETS.find(s => progress(s.ids, state.srs).new) ?? SETS[0]).id}">
        ${due ? `Review ${due} due card${due > 1 ? 's' : ''}` : 'Continue studying'}</a>
      <a class="btn" href="#/browse">Browse all 100</a>
    </div>
    <h2>The study path</h2>
    <div class="path">${SETS.map((s, i) => {
      const p = progress(s.ids, state.srs);
      return `<div class="card step ${p.mastered === p.total ? 'done' : ''}">
        <div class="num">${p.mastered === p.total ? '✓' : i + 1}</div>
        <div>
          <h3>${esc(s.name)}</h3>
          <div class="meta">${esc(s.en)} · ${p.mastered}/${p.total} mastered</div>
          ${bar(p)}
          <div class="chips">${s.ids.map(id => `<a class="chip" data-s="${st(id)}" href="#/t/${id}">${esc(byId[id].name)}</a>`).join('')}</div>
        </div>
        <div class="row" style="flex-direction:column">
          <a class="btn" href="#/cards?set=${s.id}">Cards</a>
          <a class="btn" href="#/quiz?set=${s.id}">Quiz</a>
        </div>
      </div>`;
    }).join('')}</div>`;
}

const browseState = { q: '', sub: 'all', gokyo: 'all', status: 'all' };
function viewBrowse() {
  const opt = (v, label, cur) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(label)}</option>`;
  return `
    <h1>The 100 techniques</h1>
    <p class="lede">Search by romaji, English or kanji. Dots show your progress: grey new · amber learning · green mastered.</p>
    <div class="filters">
      <input type="search" id="q" placeholder="Search — e.g. osoto, scarf, 内股" value="${esc(browseState.q)}" aria-label="Search techniques">
      <select id="sub" aria-label="Family">${opt('all', 'All families', browseState.sub)}${GROUPS.map(g =>
        `<optgroup label="${esc(g.name)}">${g.subs.map(s => opt(s.id, `${s.name} — ${s.en}`, browseState.sub)).join('')}</optgroup>`).join('')}</select>
      <select id="gokyo" aria-label="Gokyo set">${opt('all', 'Any Gokyo set', browseState.gokyo)}${GOKYO_SETS.map(g =>
        opt(String(g.n), `${g.name} (set ${g.n})`, browseState.gokyo)).join('')}${opt('none', 'Not in Gokyo', browseState.gokyo)}</select>
      <select id="status" aria-label="Progress">${[['all', 'Any progress'], ['new', 'New'], ['learning', 'Learning'], ['mastered', 'Mastered']]
        .map(([v, l]) => opt(v, l, browseState.status)).join('')}</select>
    </div>
    <div id="results"></div>`;
}
function renderResults() {
  const hits = filter(TECHNIQUES, browseState, state.srs);
  const tile = t => `<a class="card tile" href="#/t/${t.id}">
    <span class="status" data-s="${st(t.id)}" title="${st(t.id)}"></span>
    <span class="k">${esc(t.kanji)}</span><h3>${esc(t.name)}</h3><span class="en">${esc(t.en)}</span>
    <span class="tags">${tags(t)}</span></a>`;
  const el = document.getElementById('results');
  if (!hits.length) { el.innerHTML = '<p class="muted">No techniques match.</p>'; return; }
  el.innerHTML = browseState.q
    ? `<p class="muted">${hits.length} match${hits.length > 1 ? 'es' : ''}</p><div class="grid">${hits.map(tile).join('')}</div>`
    : SUBS.map(s => {
      const g = hits.filter(t => t.sub === s.id);
      return g.length ? `<div class="group-h"><h2 style="margin:0">${esc(s.name)}</h2><span class="jp">${s.kanji}</span>
        <span class="muted">${esc(s.en)} · ${g.length}</span></div><div class="grid">${g.map(tile).join('')}</div>` : '';
    }).join('');
}

function viewTechnique(id) {
  const t = byId[id];
  if (!t) return `<h1>Not found</h1><p><a href="#/browse">Back to all techniques</a></p>`;
  const i = TECHNIQUES.indexOf(t), prev = TECHNIQUES[i - 1], next = TECHNIQUES[i + 1];
  const group = GROUPS.find(g => g.id === t.group);
  const ls = links(t);
  const linkList = kind => ls.filter(l => l.kind === kind).map(l =>
    `<a class="link ${kind}" href="${esc(l.url)}" target="_blank" rel="noopener"><span class="play" aria-hidden="true"></span>${esc(l.label)}</a>`).join('');
  const card = state.srs[id];
  return `
    <div class="crumbs"><a href="#/browse">Techniques</a> › ${esc(group.name)} › ${esc(subName(t.sub))}</div>
    <div class="hero">
      <div>
        <h1>${esc(t.name)}</h1>
        <div class="big-kanji" lang="ja">${esc(t.kanji)}</div>
        <div style="font-size:18px">${esc(t.en)}</div>
        <div class="decode" aria-label="Name decoded">${decodeName(t.name).map(p =>
          `<span><b>${esc(p.word)}</b>${esc(p.gloss ?? '?')}</span>`).join('')}</div>
        <div class="tile" style="padding:0"><span class="tags">${tags(t)}</span></div>
        <h2>How it works</h2>
        <p>${esc(t.desc)}</p>
        <p class="cue">${esc(t.cue)}</p>
        ${t.exponents.length ? `<p><b>Famous exponents:</b> ${t.exponents.map(esc).join(', ')}</p>` : ''}
        ${mentions(t.id).length ? `<h2>From your lessons</h2>${mentions(t.id).map(m => `<div class="card mention">
          <div class="muted" style="font-size:13px">${esc(m.lesson.course.title)} · ${lessonLink(m.lesson)}</div>
          <p style="margin:6px 0 0">${esc(m.note)}${m.uncertain ? ' <span class="tag">name inferred from audio</span>' : ''}</p></div>`).join('')}` : ''}
        <h2>Your notes</h2>
        <textarea id="notes" rows="3" placeholder="Grips, setups, what your coach said…">${esc(state.notes[id] ?? '')}</textarea>
      </div>
      <aside>
        <div class="card">
          <h3>Watch &amp; learn</h3>
          <div class="links" style="margin:10px 0 18px">${linkList('learn')}</div>
          <h3>${t.banned ? 'Footage' : 'In competition'}</h3>
          <div class="links" style="margin-top:10px">${linkList('bout')}</div>
        </div>
        <div class="card" style="margin-top:12px">
          <h3>Your progress</h3>
          <p class="muted" style="margin:4px 0 10px">Status: <b>${st(id)}</b>${card ? ` · next review ${fmtDue(card.due - Date.now())}` : ''}</p>
          <div class="row">
            <button class="btn" data-grade="again">Still learning</button>
            <button class="btn primary" data-grade="good">I know this</button>
          </div>
        </div>
      </aside>
    </div>
    <div class="pager">
      ${prev ? `<a class="btn" href="#/t/${prev.id}">← ${esc(prev.name)}</a>` : '<span></span>'}
      ${next ? `<a class="btn" href="#/t/${next.id}">${esc(next.name)} →</a>` : ''}
    </div>`;
}

// Flashcards: front shows one face, Space flips, 1–4 grades.
const CARD_FACES = {
  name: { label: 'Name → recall', front: t => `<div class="big">${esc(t.name)}</div>` },
  en: { label: 'Meaning → name', front: t => `<div class="big">${esc(t.en)}</div><div class="muted">${esc(subName(t.sub))}</div>` },
  kanji: { label: 'Kanji → name', front: t => `<div class="big jp" style="font-size:56px" lang="ja">${esc(t.kanji)}</div>` },
  desc: { label: 'Description → name', front: t => `<p style="font-size:17px;max-width:52ch">${esc(t.desc.replace(new RegExp(t.name, 'gi'), '____'))}</p>` },
};
const cards = { set: null, face: 'name', deck: [], flipped: false, done: 0 };
function viewCards(setId) {
  const s = setById(setId);
  if (cards.set !== s.id) Object.assign(cards, { set: s.id, deck: buildDeck(s.ids, state.srs, Date.now()), flipped: false, done: 0 });
  const id = cards.deck[0];
  if (s.qa) return viewQaCards(s, id);
  const head = `<h1>Flashcards</h1>
    <p class="lede">Spaced repetition: cards you know come back less often (1 → 3 → 7 → 16 → 35 days). Ten new cards per session.</p>
    ${setPicker(s.id, '#/cards')}
    <div class="seg" style="margin:10px 0 20px">${Object.entries(CARD_FACES).map(([k, f]) =>
      `<button class="btn ${k === cards.face ? 'sel' : ''}" data-face="${k}">${f.label}</button>`).join('')}</div>`;
  if (!id) {
    const upcoming = s.ids.map(i => state.srs[i]?.due).filter(Boolean).sort((a, b) => a - b)[0];
    const p = progress(s.ids, state.srs);
    return `${head}<div class="card fc flash"><div class="big">Done for now ✓</div>
      <p class="muted">${cards.done} reviewed this session · ${p.mastered}/${p.total} mastered in ${esc(s.name)}
      ${upcoming ? `<br>Next card due ${fmtDue(upcoming - Date.now())}.` : ''}</p>
      <div class="row"><a class="btn primary" href="#/quiz?set=${s.id}">Quiz this set</a><a class="btn" href="#/">Back to the path</a></div></div>`;
  }
  const t = byId[id], c = state.srs[id];
  const preview = g => { const r = review(c, g, 0); return g === 'again' ? '1 min' : `${BOX_INTERVAL_DAYS[r.box]}d`; };
  return `${head}<div class="flash">
    <p class="muted">${cards.deck.length} left · ${st(id)}</p>
    <div class="card fc" id="fc">
      ${CARD_FACES[cards.face].front(t)}
      ${cards.flipped ? `<div class="answer">
        <div class="row" style="justify-content:space-between"><h3 style="font-size:22px">${esc(t.name)}</h3><span class="jp" style="font-size:24px">${esc(t.kanji)}</span></div>
        <div class="muted">${esc(t.en)} · ${esc(subName(t.sub))}</div>
        <p>${esc(t.desc)}</p><p class="cue">${esc(t.cue)}</p>
        <a href="#/t/${t.id}">Open technique & videos →</a></div>`
        : `<button class="btn primary" data-flip style="margin-top:18px">Show answer</button><span class="kbd">Space</span>`}
    </div>
    ${cards.flipped ? `<div class="grades">${['again', 'hard', 'good', 'easy'].map((g, i) =>
      `<button class="btn ${g === 'good' ? 'primary' : ''}" data-rate="${g}">${g[0].toUpperCase() + g.slice(1)}<small>${preview(g)} · ${i + 1}</small></button>`).join('')}</div>` : ''}
  </div>`;
}

function viewQaCards(s, id) {
  const head = `<h1>Flashcards</h1><p class="lede">${esc(s.course.title)} · ${esc(s.course.instructor)} — your notes as spaced-repetition cards.</p>
    ${setPicker(s.id, '#/cards')}<div style="height:20px"></div>`;
  if (!id) {
    const p = progress(s.ids, state.srs);
    return `${head}<div class="card fc flash"><div class="big">Done for now ✓</div>
      <p class="muted">${cards.done} reviewed this session · ${p.mastered}/${p.total} mastered</p>
      <div class="row"><a class="btn primary" href="#/quiz?set=${s.id}">Quiz these lessons</a><a class="btn" href="#/lessons">Back to lessons</a></div></div>`;
  }
  const c = qaCardById[id], l = lessonById[c.lesson];
  const preview = g => { const r = review(state.srs[id], g, 0); return g === 'again' ? '1 min' : `${BOX_INTERVAL_DAYS[r.box]}d`; };
  return `${head}<div class="flash">
    <p class="muted">${cards.deck.length} left · Lesson ${l.n} · ${st(id)}</p>
    <div class="card fc" id="fc">
      <div class="big" style="font-size:clamp(20px,4.5vw,26px)">${esc(c.q)}</div>
      ${cards.flipped ? `<div class="answer"><p style="font-size:17px">${esc(c.a)}</p>${lessonLink(l)}</div>`
        : `<button class="btn primary" data-flip style="margin-top:18px">Show answer</button><span class="kbd">Space</span>`}
    </div>
    ${cards.flipped ? `<div class="grades">${['again', 'hard', 'good', 'easy'].map((g, i) =>
      `<button class="btn ${g === 'good' ? 'primary' : ''}" data-rate="${g}">${g[0].toUpperCase() + g.slice(1)}<small>${preview(g)} · ${i + 1}</small></button>`).join('')}</div>` : ''}
  </div>`;
}

const quiz = { set: null, mode: 'en-name', qs: [], i: 0, score: 0, picked: null, missed: [] };
function startQuiz(setId) {
  const s = setById(setId);
  const qs = s.qa ? authoredQuiz(s.lessons, 10, Math.random)
    : makeQuiz(s.ids.map(i => byId[i]), quiz.mode, Math.min(10, s.ids.length), Math.random, TECHNIQUES);
  Object.assign(quiz, { set: s.id, qs, i: 0, score: 0, picked: null, missed: [] });
}
function viewQuiz(setId) {
  const s = setById(setId);
  if (quiz.set !== s.id) startQuiz(s.id);
  const head = `<h1>Quiz</h1>${setPicker(s.id, '#/quiz')}
    ${s.qa ? '<div style="height:20px"></div>' : `<div class="seg" style="margin:10px 0 20px">${Object.entries(QUIZ_MODES).map(([k, m]) =>
      `<button class="btn ${k === quiz.mode ? 'sel' : ''}" data-mode="${k}">${m.label}</button>`).join('')}</div>`}`;
  const reviewChip = id => s.qa ? `<a class="chip" href="#/lesson/${id}">Lesson ${lessonById[id].n}</a>`
    : `<a class="chip" href="#/t/${id}">${esc(byId[id].name)}</a>`;
  if (quiz.i >= quiz.qs.length) {
    return `${head}<div class="card flash"><h2 style="margin-top:0">${quiz.score} / ${quiz.qs.length}</h2>
      ${quiz.missed.length ? `<p>Review these:</p><div class="chips">${[...new Set(quiz.missed)].map(reviewChip).join('')}</div>`
        : '<p>Perfect round. 一本!</p>'}
      <div class="row" style="margin-top:16px"><button class="btn primary" data-restart>New round</button>
      <a class="btn" href="#/cards?set=${s.id}">Flashcards for this set</a></div></div>`;
  }
  const q = quiz.qs[quiz.i];
  const show = c => q.mode === 'name-sub' ? subName(c) : c;
  return `${head}<div class="card flash">
    <p class="muted">Question ${quiz.i + 1} of ${quiz.qs.length} · score ${quiz.score}</p>
    <div class="q-prompt">${esc(q.mode === 'desc-name' ? q.prompt.replace(new RegExp(byId[q.id].name, 'gi'), '____') : q.prompt)}</div>
    <div class="choices">${q.choices.map((c, i) => {
      const cls = quiz.picked == null ? '' : c === q.correct ? 'right' : c === quiz.picked ? 'wrong' : '';
      return `<button class="choice ${cls}" data-choice="${i}" ${quiz.picked != null ? 'disabled' : ''}>${esc(show(c))}</button>`;
    }).join('')}</div>
    ${quiz.picked != null ? `<div class="row" style="margin-top:14px;justify-content:space-between">
      ${s.qa ? lessonLink(lessonById[q.id]) : `<a href="#/t/${q.id}">${esc(byId[q.id].name)} — videos & details</a>`}
      <button class="btn primary" data-next>${quiz.i + 1 < quiz.qs.length ? 'Next' : 'Finish'} →</button></div>` : ''}
  </div>`;
}

function viewDecode() {
  return `<h1>Name decoder</h1>
    <p class="lede">Judo names are built from about 80 words. Learn the words and every name explains itself:
      <b>O-soto-gari</b> = major · outer · reap.</p>
    <input type="search" id="dq" placeholder="Type any name, e.g. harai-tsurikomi-ashi" aria-label="Decode a name">
    <div class="decode" id="dout"></div>
    <h2>Vocabulary</h2>
    <div class="vocab">${Object.entries(VOCAB).sort(([a], [b]) => a.localeCompare(b)).map(([w, g]) =>
      `<div><b>${esc(w)}</b><span class="muted">${esc(g)}</span></div>`).join('')}</div>
    <h2>Core terms</h2>
    <table class="gl">${GLOSSARY.map(([n, k, d]) => `<tr><td><b>${esc(n)}</b></td><td class="jp">${k}</td><td>${esc(d)}</td></tr>`).join('')}</table>`;
}

function viewLessons() {
  return `<h1>Lessons</h1>
    <p class="lede">Study guides built from instructionals you own: key points with timestamps (scrub your own copy),
      frameworks, links into the canon, and lesson flashcards that share your spaced-repetition schedule.</p>
    ${COURSES.map(c => {
      const p = progress(cardIds(c.lessons), state.srs);
      return `<div class="card" style="margin-bottom:16px">
        <div class="row" style="justify-content:space-between"><div><h2 style="margin:0">${esc(c.title)}</h2>
        <div class="muted">${esc(c.instructor)} · ${esc(c.publisher)} — ${esc(c.blurb)}</div></div>
        <div class="row"><a class="btn primary" href="#/cards?set=course:${c.id}">Cards</a><a class="btn" href="#/quiz?set=course:${c.id}">Quiz</a></div></div>
        <div style="margin:12px 0">${bar(p)}</div>
        <div class="path">${c.lessons.map(l => {
          const lp = progress(cardIds([l]), state.srs);
          return `<a class="step" href="#/lesson/${l.id}" style="grid-template-columns:44px 1fr auto">
            <div class="num">${lp.mastered === lp.total ? '✓' : l.n}</div>
            <div><h3>${esc(l.title)}</h3><div class="meta">${l.dur} · ${l.points.length} key points · ${l.cards.length} cards · ${lp.mastered}/${lp.total} mastered</div></div>
            <span class="muted">→</span></a>`;
        }).join('')}</div>
        ${c.missing.length ? `<p class="muted" style="font-size:13px">${c.missing.map(esc).join(' · ')}</p>` : ''}
      </div>`;
    }).join('')}
    <h2>Concepts</h2>
    <table class="gl">${CONCEPTS.map(([n, k, d]) => `<tr><td><b>${esc(n)}</b></td><td class="jp">${k}</td><td>${esc(d)}</td></tr>`).join('')}</table>`;
}

function viewLesson(id) {
  const l = lessonById[id];
  if (!l) return `<h1>Not found</h1><p><a href="#/lessons">Back to lessons</a></p>`;
  const all = l.course.lessons, i = all.indexOf(l), prev = all[i - 1], next = all[i + 1];
  return `
    <div class="crumbs"><a href="#/lessons">Lessons</a> › ${esc(l.course.title)} › Lesson ${l.n}</div>
    <h1>${esc(l.title)}</h1>
    <p class="muted">${esc(l.course.instructor)} · ${l.dur}</p>
    <p class="lede" style="color:var(--ink)">${esc(l.summary)}</p>
    <div class="row"><a class="btn primary" href="#/cards?set=lesson:${l.id}">Study ${l.cards.length} cards</a>
      <a class="btn" href="#/quiz?set=lesson:${l.id}">Quiz (${l.quiz.length})</a></div>
    <div class="hero" style="margin-top:8px">
      <div>
        <h2>Key points</h2>
        <ol class="points">${l.points.map(([t, txt]) => `<li><span class="ts">${t}</span>${esc(txt)}</li>`).join('')}</ol>
      </div>
      <aside>
        ${l.frameworks.map(f => `<div class="card" style="margin-top:12px"><h3>${esc(f.title)}</h3>
          <ol class="fw">${f.items.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>`).join('')}
        ${l.techniques.length ? `<div class="card" style="margin-top:12px"><h3>Techniques in this lesson</h3>
          <div class="links" style="margin-top:8px">${l.techniques.map(t => `<a class="link" href="#/t/${t.id}">
            <span><b>${esc(byId[t.id].name)}</b>${t.uncertain ? ' <span class="tag">inferred</span>' : ''}<br>
            <span class="muted" style="font-size:13px">${esc(t.note)}</span></span></a>`).join('')}</div></div>` : ''}
      </aside>
    </div>
    <div class="pager">
      ${prev ? `<a class="btn" href="#/lesson/${prev.id}">← Lesson ${prev.n}</a>` : '<span></span>'}
      ${next ? `<a class="btn" href="#/lesson/${next.id}">Lesson ${next.n} →</a>` : ''}
    </div>`;
}

// ── Router ───────────────────────────────────────────────────────────────────
function route() {
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs);
  const parts = path.split('/').filter(Boolean);
  const top = parts[0] ?? '';
  let html;
  if (top === 'browse') html = viewBrowse();
  else if (top === 't') html = viewTechnique(parts[1]);
  else if (top === 'cards') html = viewCards(params.get('set'));
  else if (top === 'quiz') html = viewQuiz(params.get('set'));
  else if (top === 'decode') html = viewDecode();
  else if (top === 'lessons') html = viewLessons();
  else if (top === 'lesson') html = viewLesson(parts[1]);
  else html = viewPath();
  $app.innerHTML = html;
  if (top === 'browse') renderResults();
  const navKey = top === 't' ? 'browse' : top === 'lesson' ? 'lessons' : top;
  for (const a of document.querySelectorAll('#nav a')) {
    if (a.getAttribute('href') === `#/${navKey}`) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  document.title = top === 't' && byId[parts[1]] ? `${byId[parts[1]].name} · Judo Canon` : 'Judo Canon';
}
const rerender = () => { const y = scrollY; route(); scrollTo(0, y); };

// ── Events (delegated) ─────────────────────────────────────────────────────────────
window.addEventListener('hashchange', () => { route(); scrollTo(0, 0); });
$app.addEventListener('input', e => {
  const el = e.target;
  if (['q', 'sub', 'gokyo', 'status'].includes(el.id)) { browseState[el.id] = el.value; renderResults(); }
  if (el.id === 'notes') { state.notes[location.hash.split('/')[2]] = el.value; save(); }
  if (el.id === 'dq') document.getElementById('dout').innerHTML = el.value.trim() ? decodeName(el.value.trim().replace(/\s+/g, '-'))
    .map(p => `<span><b>${esc(p.word)}</b>${esc(p.gloss ?? 'unknown')}</span>`).join('') : '';
});
$app.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.grade) { const id = location.hash.split('/')[2]; state.srs[id] = review(state.srs[id], d.grade, Date.now()); save(); rerender(); }
  if ('flip' in d) { cards.flipped = true; rerender(); }
  if (d.rate) rate(d.rate);
  if (d.face) { cards.face = d.face; cards.flipped = false; rerender(); }
  if (d.mode) { quiz.mode = d.mode; startQuiz(quiz.set); rerender(); }
  if ('restart' in d) { startQuiz(quiz.set); rerender(); }
  if (d.choice != null) {
    const q = quiz.qs[quiz.i]; quiz.picked = q.choices[+d.choice];
    if (quiz.picked === q.correct) quiz.score++; else quiz.missed.push(q.id);
    rerender();
  }
  if ('next' in d) { quiz.i++; quiz.picked = null; rerender(); }
});
function rate(g) {
  const id = cards.deck.shift();
  state.srs[id] = review(state.srs[id], g, Date.now()); save();
  if (g === 'again') cards.deck.splice(Math.min(3, cards.deck.length), 0, id); // see it again shortly
  cards.flipped = false; cards.done++; rerender();
}
document.addEventListener('keydown', e => {
  if (!location.hash.startsWith('#/cards') || e.target.matches('input, textarea, select')) return;
  if (e.code === 'Space' && !cards.flipped && cards.deck.length) { e.preventDefault(); cards.flipped = true; rerender(); }
  const g = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' }[e.key];
  if (g && cards.flipped) rate(g);
});

route();
