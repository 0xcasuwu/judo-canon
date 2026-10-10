// ui.puppeteer.mjs — drives the real site in headless Chrome: every route renders, search
// filters, a technique page shows its video links, flashcard grading persists to storage,
// a full quiz round completes, and no console errors fire. Phone width is checked for
// horizontal overflow. Run: npm run test:ui
import puppeteer from 'puppeteer';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const p = normalize(join(root, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : req.url.split('?')[0]));
  try { res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
const go = async h => { await page.goto(base + h, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('#app > *'); };
const text = sel => page.$eval(sel, e => e.textContent);
let n = 0; const ok = msg => console.log(`ok ${++n} - ${msg}`);

try {
  await go('#/');
  assert.match(await text('h1'), /full canon/);
  assert.equal((await page.$$('.step')).length, 12);
  ok('path renders 12 study steps');

  await go('#/browse');
  assert.equal((await page.$$('.tile')).length, 100);
  await page.type('#q', 'osotogari');
  assert.equal(await page.$eval('.tile h3', e => e.textContent), 'O-soto-gari');
  await page.$eval('#q', e => { e.value = '内股'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal((await page.$$('.tile')).length, 4);
  ok('browse shows 100, romaji + kanji search filter');

  await go('#/t/uchi-mata');
  assert.equal(await text('h1'), 'Uchi-mata');
  const hrefs = await page.$$eval('.link', as => as.map(a => a.href));
  assert.ok(hrefs.length >= 6 && hrefs.every(h => h.startsWith('https://www.youtube.com/results?search_query=')));
  assert.ok((await page.$$eval('.link', as => as.map(a => a.textContent))).some(t => t.includes('Shohei Ono')));
  await page.click('[data-grade="good"]');
  await page.waitForFunction(() => document.querySelector('aside').textContent.includes('learning'));
  ok('technique page: YouTube links, exponents, mark-known updates status');

  await go('#/cards?set=gokyo-1');
  await page.keyboard.press('Space');
  await page.waitForSelector('[data-rate]');
  await page.keyboard.press('3');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('judo-canon:v1')));
  assert.equal(stored.srs['de-ashi-harai'].box, 1);
  ok('flashcards: flip with Space, grade with key 3, persisted to localStorage');

  await go('#/quiz?set=gokyo-2');
  for (let i = 0; i < 8; i++) {
    await page.click('[data-choice="0"]');
    await page.click('[data-next]');
  }
  assert.match(await text('.flash h2'), /^\d+ \/ 8$/);
  ok('quiz: full 8-question round completes with a score');

  await go('#/decode');
  await page.type('#dq', 'o soto gari');
  assert.match(await text('#dout'), /major.*outer.*reap/);
  ok('decoder glosses a typed name');

  await go('#/lessons');
  assert.equal((await page.$$('a.step')).length, 5);
  await go('#/lesson/ftf1-03');
  assert.match(await text('h1'), /Takedown Selection/);
  assert.ok((await page.$$('.points li')).length >= 10);
  await page.click('a[href="#/t/kibisu-gaeshi"]');
  await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Kibisu-gaeshi');
  assert.match(await text('main'), /From your lessons/);
  ok('lessons: list, lesson page, canon cross-link and back-reference');

  await go('#/cards?set=lesson:ftf1-06');
  await page.keyboard.press('Space');
  await page.waitForSelector('[data-rate]');
  await page.keyboard.press('3');
  const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem('judo-canon:v1')));
  assert.equal(st2.srs['ftf1-06:c0'].box, 1);
  await go('#/quiz?set=lesson:ftf1-03');
  for (let i = 0; i < 5; i++) { await page.click('[data-choice="0"]'); await page.click('[data-next]'); }
  assert.match(await text('.flash h2'), /^\d+ \/ 5$/);
  ok('lesson flashcards persist; authored lesson quiz completes');

  await page.setViewport({ width: 375, height: 800 });
  for (const h of ['#/', '#/browse', '#/t/ude-hishigi-juji-gatame', '#/cards', '#/quiz', '#/decode', '#/lessons', '#/lesson/ftf1-04', '#/cards?set=course:ftf1']) {
    await go(h);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(over <= 0, `${h} overflows by ${over}px`);
  }
  ok('no horizontal overflow at 375px on any route');

  assert.deepEqual(errors, []);
  ok('no console errors');
  console.log(`# pass ${n}`);
} finally {
  await browser.close(); server.close();
}
