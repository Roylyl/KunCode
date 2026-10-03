/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const extensionPath = path.resolve(__dirname, '..');
const corpusPath = path.join(extensionPath, 'corpus');
const manifest = JSON.parse(fs.readFileSync(path.join(corpusPath, 'manifest.json'), 'utf8'));
const extensionManifest = JSON.parse(fs.readFileSync(path.join(extensionPath, 'package.json'), 'utf8'));
const topics = manifest.sources.map(source => {
	assert.match(source, /^topics\/[a-z0-9][a-z0-9-]*\.json$/i);
	return JSON.parse(fs.readFileSync(path.join(corpusPath, source), 'utf8'));
});
const entries = topics.flat();

test('all declared corpus topics are complete and use the extension version', () => {
	assert.strictEqual(manifest.version, extensionManifest.version);
	assert.strictEqual(new Set(manifest.sources).size, manifest.sources.length);
	assert.ok(topics.every(topic => Array.isArray(topic) && topic.length > 0));
	assert.ok(entries.length >= 1500, `Expected the 2.0 corpus to contain at least 1500 scenes, got ${entries.length}`);
});

test('scene entries have valid triggers, actions and distinct response text', () => {
	const modes = new Set(['chat', 'explain', 'coach']);
	const actions = new Set(['question', 'support', 'judge', 'plan', 'explain', 'react']);
	const texts = new Set();
	for (const entry of entries) {
		assert.ok(typeof entry.cat === 'string' && entry.cat.trim());
		assert.ok(Array.isArray(entry.keys) && entry.keys.length >= 2 && entry.keys.length <= 8, entry.cat);
		assert.ok(entry.keys.every(key => typeof key === 'string' && key.trim() && key.length <= 128), entry.cat);
		assert.strictEqual(new Set(entry.keys).size, entry.keys.length, entry.cat);
		assert.ok(modes.has(entry.mode), entry.cat);
		assert.ok(actions.has(entry.action), entry.cat);
		assert.ok(typeof entry.text === 'string' && entry.text.trim(), entry.cat);
		assert.ok(!texts.has(entry.text), `Duplicate response: ${entry.text}`);
		texts.add(entry.text);
	}
});

test('corpus uses readable short lines and keeps role play out of ordinary scenes', () => {
	for (const entry of entries) {
		assert.ok(!entry.text.includes('\\n'), `Unexpanded line breaks in ${entry.cat}`);
		assert.ok(!/！|[\u4e00-\u9fff][ \t]+[a-z0-9]|[a-z0-9][ \t]+[\u4e00-\u9fff]/i.test(entry.text), entry.text);
		assert.ok(entry.text.split('\n').every(line => line.trim().length > 0), entry.text);
		assert.ok(entry.text.split('\n').length <= 6, entry.text);
		if (entry.mode !== 'coach') {
			assert.ok(!/困教练|困困大王|共🦌主义|鹿群|指挥部/.test(entry.text), entry.text);
		}
	}
});
