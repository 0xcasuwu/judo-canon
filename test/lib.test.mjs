// lib.test.mjs — fast, in-memory checks of the canon data and the pure study logic.
// Run: npm test  (node --test, no dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TECHNIQUES, GROUPS, KATA, VOCAB, GOKYO_SETS } from '../js/data.js';
import { links, decodeName, filter, review, statusOf, buildDeck, makeQuestion, makeQuiz, seeded,
  progress, DAY, MASTERED_BOX, QUIZ_MODES } from '../js/lib.js';

const count = pred => TECHNIQUES.filter(pred).length;

test('canon is the Kodokan 100 with correct subgroup counts', () => {
  assert.equal(TECHNIQUES.length, 100);
  assert.equal(count(t => t.group === 'nage'), 68);
  assert.equal(count(t => t.group === 'katame'), 32);
  const expect = { te: 16, koshi: 10, ashi: 21, 'ma-sutemi': 5, 'yoko-sutemi': 16, osaekomi: 10, shime: 12, kansetsu: 10 };
  for (const [sub, n] of Object.entries(expect)) assert.equal(count(t => t.sub === sub), n, sub);
  assert.equal(new Set(TECHNIQUES.map(t => t.id)).size, 100, 'ids unique');
  assert.ok(TECHNIQUES.every(t => t.group), 'every sub maps to a group');
});

test('gokyo is 5 sets of 8 throws', () => {
  for (let n = 1; n <= 5; n++) assert.equal(count(t => t.gokyo === n), 8, `set ${n}`);
  // The ordered member lists must agree with each technique's gokyo field.
  for (const g of GOKYO_SETS) {
    assert.deepEqual([...g.members].sort(), TECHNIQUES.filter(t => t.gokyo === g.n).map(t => t.id).sort(), g.name);
  }
  assert.ok(TECHNIQUES.filter(t => t.gokyo).every(t => t.group === 'nage'));
});

test('kata members exist and each kata has 15', () => {
  for (const k of KATA) {
    assert.equal(k.members.length, 15, k.id);
    for (const id of k.members) assert.ok(TECHNIQUES.some(t => t.id === id), `${k.id}: ${id}`);
  }
});

test('every word of every name is in the vocabulary', () => {
  const missing = TECHNIQUES.flatMap(t => decodeName(t.name).filter(p => !p.gloss).map(p => `${t.name}:${p.word}`));
  assert.deepEqual(missing, []);
  assert.deepEqual(decodeName('O-soto-gari').map(p => p.gloss), [VOCAB.o, VOCAB.soto, VOCAB.gari]);
});

test('every technique has full content', () => {
  for (const t of TECHNIQUES) {
    assert.ok(t.kanji.length >= 2, `${t.id}.kanji`);
    for (const f of ['name', 'en', 'desc', 'cue']) assert.ok(t[f]?.length > 2, `${t.id}.${f}`);
  }
});

test('links are YouTube searches; banned techniques get no competition links', () => {
  for (const t of TECHNIQUES) {
    const ls = links(t);
    assert.ok(ls.every(l => l.url.startsWith('https://www.youtube.com/results?search_query=')));
    assert.ok(ls.some(l => l.kind === 'learn'));
    assert.ok(ls.some(l => l.kind === 'bout'));
    assert.equal(ls.some(l => /olympics/.test(l.label.toLowerCase())), !t.banned, t.id);
  }
  const uchi = links(TECHNIQUES.find(t => t.id === 'uchi-mata'));
  assert.ok(uchi.some(l => l.label.startsWith('Shohei Ono')));
});

test('filter: search by romaji (hyphen-insensitive), English, kanji, and facets', () => {
  assert.deepEqual(filter(TECHNIQUES, { q: 'osotogari' }).map(t => t.id), ['o-soto-gari', 'ko-soto-gari']);
  assert.equal(filter(TECHNIQUES, { q: 'O-soto' })[0].id, 'o-soto-gari');
  assert.ok(filter(TECHNIQUES, { q: 'scarf' }).some(t => t.id === 'kesa-gatame'));
  assert.deepEqual(filter(TECHNIQUES, { q: '内股' }).map(t => t.id).sort(),
    ['uchi-mata', 'uchi-mata-gaeshi', 'uchi-mata-makikomi', 'uchi-mata-sukashi']);
  assert.equal(filter(TECHNIQUES, { gokyo: '1' }).length, 8);
  assert.equal(filter(TECHNIQUES, { gokyo: 'none' }).length, 60);
  assert.equal(filter(TECHNIQUES, { sub: 'shime' }).length, 12);
  const srs = { 'seoi-nage': { box: 5, due: 0, reps: 3 } };
  assert.deepEqual(filter(TECHNIQUES, { status: 'mastered' }, srs).map(t => t.id), ['seoi-nage']);
});

test('srs: grades move boxes and schedule the right interval', () => {
  const now = 1_000_000;
  const a = review(undefined, 'good', now);
  assert.deepEqual(a, { box: 1, due: now + DAY, reps: 1 });
  const b = review(a, 'easy', now);
  assert.equal(b.box, 3);
  assert.equal(b.due, now + 7 * DAY);
  const c = review(b, 'again', now);
  assert.equal(c.box, 0);
  assert.ok(c.due > now && c.due < now + DAY);
  assert.equal(review({ box: 5, due: 0, reps: 9 }, 'easy', now).box, 5, 'capped');
  assert.equal(review(undefined, 'hard', now).box, 1);
  assert.throws(() => review(a, 'bogus', now));
});

test('srs: status and deck ordering', () => {
  assert.equal(statusOf(undefined), 'new');
  assert.equal(statusOf({ box: MASTERED_BOX - 1 }), 'learning');
  assert.equal(statusOf({ box: MASTERED_BOX }), 'mastered');
  const srs = { a: { box: 1, due: 50 }, b: { box: 1, due: 10 }, c: { box: 2, due: 999 } };
  assert.deepEqual(buildDeck(['a', 'b', 'c', 'd', 'e', 'f'], srs, 100, 2), ['b', 'a', 'd', 'e']);
});

test('quiz: one correct answer among unique choices, for every mode and technique', () => {
  const rng = seeded(42);
  for (const mode of Object.keys(QUIZ_MODES)) {
    for (const t of TECHNIQUES) {
      const q = makeQuestion(t, mode, TECHNIQUES, rng);
      assert.equal(q.choices.length, 4, `${mode}/${t.id}`);
      assert.equal(new Set(q.choices).size, 4, `${mode}/${t.id} unique`);
      assert.equal(q.choices.filter(c => c === q.correct).length, 1);
    }
  }
});

test('quiz: seeded generation is deterministic and samples without repeats', () => {
  const a = makeQuiz(TECHNIQUES, 'en-name', 10, seeded(7));
  const b = makeQuiz(TECHNIQUES, 'en-name', 10, seeded(7));
  assert.deepEqual(a, b);
  assert.equal(new Set(a.map(q => q.id)).size, 10);
});

test('quiz: a tiny set still gets 4 choices when distractors come from the canon', () => {
  const pool = TECHNIQUES.filter(t => t.sub === 'ma-sutemi').slice(0, 2);
  const qs = makeQuiz(pool, 'en-name', 2, seeded(3), TECHNIQUES);
  assert.ok(qs.every(q => q.choices.length === 4 && q.choices.includes(q.correct)));
});

test('quiz: distractors prefer the same family', () => {
  const t = TECHNIQUES.find(x => x.id === 'ko-soto-gari');
  const q = makeQuestion(t, 'en-name', TECHNIQUES, seeded(1));
  const ashi = new Set(TECHNIQUES.filter(x => x.sub === 'ashi').map(x => x.name));
  assert.ok(q.choices.every(c => ashi.has(c)));
});

test('progress roll-up', () => {
  const srs = { a: { box: 5 }, b: { box: 1 } };
  assert.deepEqual(progress(['a', 'b', 'c', 'd'], srs), { total: 4, new: 2, learning: 1, mastered: 1, pct: 25 });
  assert.equal(GROUPS.flatMap(g => g.subs).length, 8);
});
