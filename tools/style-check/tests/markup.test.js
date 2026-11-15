'use strict';
/* Markup reader tests: node --test tools/style-check/tests */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { parse, mask } = require('../markup');

const read = (name) => fs.readFileSync(path.join(__dirname, 'fixtures/markup', name), 'utf8');
const kakao = (doc) => doc.elements.filter((e) => e.tag.startsWith('kakao-'));

test('mask keeps length and line breaks', () => {
  const src = 'a <?php\n echo 1; ?> b {{ x }}\n{% if y %}{# c #}';
  const { text, ranges } = mask(src);
  assert.equal(text.length, src.length);
  assert.equal(text.split('\n').length, src.split('\n').length);
  assert.equal(ranges.length, 4);
  assert.ok(!text.includes('echo'));
});

test('plain HTML: attributes, void elements, implied ends, positions', () => {
  const doc = parse(read('plain.html'));
  const [card, button, badge] = kakao(doc);
  assert.equal(card.tag, 'kakao-card');
  assert.deepEqual([card.line, card.column], [4, 3]);
  assert.equal(button.attrs.get('label').value, 'Save');
  assert.equal(button.attrs.get('variant').value, 'primary');
  assert.equal(button.attrs.get('disabled').value, '');
  assert.equal(button.parent.tag, 'p');
  assert.equal(badge.attrs.get('tone').value, 'success');
  assert.equal(badge.parent.tag, 'li');
  assert.equal(badge.parent.parent.tag, 'ul');
  assert.equal(card.children.find((c) => c.slot === 'header').tag, 'h3');
  assert.deepEqual(doc.problems, []);
});

test('Yii2 view: PHP in attributes is dynamic, PHP blocks are skipped', () => {
  const doc = parse(read('yii2-view.php'));
  const [button, select, chip] = kakao(doc);
  assert.equal(kakao(doc).length, 3);
  assert.equal(button.line, 6);
  assert.equal(button.attrs.get('label').dynamic, true);
  assert.equal(button.attrs.get('variant').dynamic, false);
  assert.equal(button.attrs.get('variant').value, 'ghost');
  assert.equal(select.dynamicAttrs, true);
  assert.equal(chip.attrs.get('tone').dynamic, true);
  assert.equal(chip.attrs.get('title').value, 'x > y');
  assert.equal(chip.parent.tag, 'div');
});

test('Twig: comments skipped, expressions dynamic', () => {
  const doc = parse(read('twig-view.twig'));
  const [badge, crumb] = kakao(doc);
  assert.equal(kakao(doc).length, 2);
  assert.equal(badge.line, 3);
  assert.equal(badge.attrs.get('tone').dynamic, true);
  assert.equal(crumb.attrs.get('list-data').dynamic, true);
  assert.equal(crumb.attrs.get('start').value, 'text');
});

test('nested footers: each footer belongs to its own parent', () => {
  const doc = parse(read('nested-footers.html'));
  const dialog = doc.elements.find((e) => e.tag === 'kakao-dialog');
  const footer = dialog.children.find((c) => c.slot === 'footer');
  assert.equal(footer.tag, 'div');
  assert.deepEqual(footer.children.map((c) => c.attrs.get('label').value), ['Cancel', 'Save']);
  const card = dialog.children.find((c) => c.tag === 'kakao-card');
  assert.equal(card.children[0].attrs.get('label').value, 'Inner');
});

test('comments, scripts, styles and textareas hide their <kakao-…> text', () => {
  const doc = parse(read('comments-scripts.html'));
  assert.deepEqual(kakao(doc).map((e) => [e.tag, e.line]), [['kakao-alert', 8]]);
});

test('unreadable markup is reported, not silently skipped', () => {
  const doc = parse(read('unreadable.html'));
  assert.equal(doc.problems.length, 1);
  assert.equal(doc.problems[0].line, 2);
  assert.match(doc.problems[0].message, /kakao-button/);
});

test('unmatched close tags are ignored', () => {
  const doc = parse('<div></span><kakao-badge>x</kakao-badge></div></div>');
  const badge = kakao(doc)[0];
  assert.equal(badge.parent.tag, 'div');
  assert.deepEqual(doc.problems, []);
});
