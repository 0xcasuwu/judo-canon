// lib.js — pure, stateless study logic. No DOM, no storage, no clock reads: callers pass
// `now` and `rng` in, so every function here is unit-tested in test/lib.test.mjs.
//
// CONTENTS
//   links        — YouTube search URLs (instructional / Kodokan / competition / per-exponent)
//   decodeName   — split a romaji name into glossed parts ("o-soto-gari" → major·outer·reap)
//   filter       — search + facet filtering for the browse view
//   SRS          — Leitner spaced repetition (boxes 0–5) for flashcards
//   quiz         — multiple-choice question generation, 4 modes
//   progress     — mastery roll-ups for the study path

import { TECHNIQUES, VOCAB } from './data.js';

// ── Links ──────────────────────────────────────────────────────────────────
// Search URLs, never hard-coded video IDs: they cannot rot or point at a wrong video.
const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);

export function links(t) {
  const n = t.name;
  const out = [
    { kind: 'learn', label: 'Kodokan demonstration', url: yt(`Kodokan ${n}`) },
    { kind: 'learn', label: 'Step-by-step instructional', url: yt(`${n} judo instructional how to`) },
    { kind: 'learn', label: 'Slow motion / kuzushi breakdown', url: yt(`${n} judo slow motion breakdown`) },
  ];
  if (t.banned) {
    out.push({ kind: 'bout', label: 'Historical & kata footage', url: yt(`${n} judo kata`) });
  } else {
    out.push(
      { kind: 'bout', label: 'Ippon highlights', url: yt(`${n} ippon judo`) },
      { kind: 'bout', label: 'Olympics & World Championships', url: yt(`${n} judo olympics world championships ippon`) },
      { kind: 'bout', label: 'IJF World Tour', url: yt(`IJF ${n} ippon`) },
    );
  }
  for (const e of t.exponents) out.push({ kind: 'bout', label: `${e} — ${n}`, url: yt(`${e} ${n} judo`) });
  return out;
}

// ── Name decoding ────────────────────────────────────────────────────────────
export function decodeName(name, vocab = VOCAB) {
  return name.toLowerCase().split('-').map(w => ({ word: w, gloss: vocab[w] ?? null }));
}

// ── Filtering ────────────────────────────────────────────────────────────────
const norm = s => s.toLowerCase().replace(/[\s-]+/g, '');

export function filter(list, { q = '', group = 'all', sub = 'all', gokyo = 'all', status = 'all' } = {}, srs = {}) {
  const nq = norm(q);
  const hits = list.filter(t =>
    (!nq || norm(t.name).includes(nq) || norm(t.en).includes(nq) || t.kanji.includes(q.trim())) &&
    (group === 'all' || t.group === group) &&
    (sub === 'all' || t.sub === sub) &&
    (gokyo === 'all' || (gokyo === 'none' ? t.gokyo === 0 : t.gokyo === Number(gokyo))) &&
    (status === 'all' || statusOf(srs[t.id]) === status));
  // Prefix matches rank first, so "osotogari" lists O-soto-gari before Ko-soto-gari.
  if (!nq) return hits;
  const rank = t => (norm(t.name).startsWith(nq) ? 0 : 1);
  return hits.map((t, i) => [t, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([t]) => t);
}

// ── Spaced repetition (Leitner) ─────────────────────────────────────────────────
// A card is { box: 0..5, due: epoch ms, reps }. Absent = never studied ("new").
export const DAY = 86_400_000;
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35];
export const MAX_BOX = BOX_INTERVAL_DAYS.length - 1;
export const MASTERED_BOX = 4;
const RELEARN_MS = 60_000; // "again" resurfaces within the same session

export function review(card, grade, now) {
  const box0 = card ? card.box : 0;
  const reps = (card ? card.reps : 0) + 1;
  let box;
  switch (grade) {
    case 'again': return { box: 0, due: now + RELEARN_MS, reps };
    case 'hard': box = Math.max(box0, 1); break;
    case 'good': box = Math.min(box0 + 1, MAX_BOX); break;
    case 'easy': box = Math.min(box0 + 2, MAX_BOX); break;
    default: throw new Error(`unknown grade: ${grade}`);
  }
  return { box, due: now + BOX_INTERVAL_DAYS[box] * DAY, reps };
}

export function statusOf(card) {
  if (!card) return 'new';
  return card.box >= MASTERED_BOX ? 'mastered' : 'learning';
}

// Due cards first (most overdue first), then up to `newLimit` unseen ones in canon order.
export function buildDeck(ids, srs, now, newLimit = 10) {
  const due = ids.filter(id => srs[id] && srs[id].due <= now).sort((a, b) => srs[a].due - srs[b].due);
  const fresh = ids.filter(id => !srs[id]).slice(0, newLimit);
  return [...due, ...fresh];
}

// ── Quiz ───────────────────────────────────────────────────────────────────────
export const QUIZ_MODES = {
  'name-en': { label: 'Name → meaning', prompt: t => t.name, answer: t => t.en },
  'en-name': { label: 'Meaning → name', prompt: t => t.en, answer: t => t.name },
  'desc-name': { label: 'Description → name', prompt: t => t.desc, answer: t => t.name },
  'name-sub': { label: 'Name → family', prompt: t => t.name, answer: t => t.sub },
};

export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Distractors come from the same family when possible, so the quiz tests discrimination
// between look-alikes (ko-soto-gari vs ko-soto-gake), not elimination of the obvious.
export function makeQuestion(target, mode, pool, rng, nChoices = 4) {
  const m = QUIZ_MODES[mode];
  const correct = m.answer(target);
  let choices;
  if (mode === 'name-sub') {
    const subs = [...new Set(pool.map(t => t.sub))].filter(s => s !== correct);
    choices = shuffle([correct, ...shuffle(subs, rng).slice(0, nChoices - 1)], rng);
  } else {
    const others = pool.filter(t => t.id !== target.id && m.answer(t) !== correct);
    const near = shuffle(others.filter(t => t.sub === target.sub), rng);
    const far = shuffle(others.filter(t => t.sub !== target.sub), rng);
    const picks = [...new Set([...near, ...far].map(m.answer))].slice(0, nChoices - 1);
    choices = shuffle([correct, ...picks], rng);
  }
  return { id: target.id, mode, prompt: m.prompt(target), choices, correct };
}

// `distractors` defaults to the pool; pass the whole canon so small sets still get 4 choices.
export function makeQuiz(pool, mode, n, rng, distractors = pool) {
  return shuffle(pool, rng).slice(0, n).map(t => makeQuestion(t, mode, distractors, rng));
}

// Deterministic PRNG for tests (mulberry32).
export function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Progress ──────────────────────────────────────────────────────────────────
export function progress(ids, srs) {
  const r = { total: ids.length, new: 0, learning: 0, mastered: 0 };
  for (const id of ids) r[statusOf(srs[id])]++;
  r.pct = r.total ? Math.round((r.mastered / r.total) * 100) : 0;
  return r;
}

export const byId = Object.fromEntries(TECHNIQUES.map(t => [t.id, t]));
