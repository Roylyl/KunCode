/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const extensionPath = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(extensionPath, 'extension.js'), 'utf8');
const corpus = {
	greet: '👋你好',
	generic: ['FALLBACK'],
	unknown: ['FALLBACK'],
	lexicon: [
		{ keys: ['alpha'], text: 'FIRST' },
		{ keys: ['beta'], text: 'LAST' }
	]
};

/** Load the extension without starting an extension host or scheduling real delays. */
function loadExtension(data = corpus, options = {}) {
	const timers = new Map();
	const updates = [];
	const commands = [];
	const errors = [];
	const reads = [];
	const files = {
		'corpus/manifest.json': data ? { ...data, sources: data.sources || ['topics/programming.json'], lexicon: undefined } : data,
		'corpus/topics/programming.json': data?.lexicon || [],
		...options.files
	};
	let nextTimer = 0;
	let provider;
	let handler;
	class LanguageModelTextPart {
		constructor(value) {
			this.value = value;
		}
	}
	const modelDisposable = { dispose() {} };
	const participant = { dispose() {} };
	const vscode = {
		LanguageModelTextPart,
		LanguageModelChatMessageRole: { User: 1, Assistant: 2 },
		ConfigurationTarget: { Global: 1 },
		Uri: { joinPath: (...parts) => parts.join('/') },
		lm: {
			registerLanguageModelChatProvider(_vendor, value) {
				provider = value;
				return modelDisposable;
			}
		},
		chat: {
			createChatParticipant(_id, value) {
				if (options.failParticipant) {
					throw new Error('participant failed');
				}
				handler = value;
				return participant;
			}
		},
		workspace: {
			getConfiguration(section) {
				return {
					inspect(key) {
						return options.settings?.[`${section}.${key}`] ?? { defaultValue: 'upstream-default' };
					},
					async update(key, value, target) {
						updates.push([section, key, value, target]);
						if (options.failUpdate) {
							throw new Error('configuration failed');
						}
					}
				};
			}
		},
		commands: {
			async executeCommand(command) {
				commands.push(command);
				if (options.failCommand) {
					throw new Error('command failed');
				}
			}
		}
	};
	const extensionModule = { exports: {} };
	const random = Object.create(Math);
	random.random = options.random || (() => 0.9);
	vm.runInNewContext(source, {
		module: extensionModule,
		require(id) {
			if (id === 'vscode') {
				return vscode;
			}
			if (id === 'fs') {
				return {
					readFileSync(file) {
						const name = path.relative(extensionPath, file).replace(/\\/g, '/');
						reads.push(name);
						if (options.realCorpus) {
							return fs.readFileSync(file, 'utf8');
						}
						if (!Object.prototype.hasOwnProperty.call(files, name)) {
							throw new Error(`Missing fixture: ${name}`);
						}
						return typeof files[name] === 'string' ? files[name] : JSON.stringify(files[name]);
					}
				};
			}
			return require(id);
		},
		Math: random,
		console: { error: (...args) => errors.push(args) },
		setTimeout(callback) {
			const id = ++nextTimer;
			timers.set(id, callback);
			return id;
		},
		clearTimeout: id => timers.delete(id)
	}, { filename: path.join(extensionPath, 'extension.js') });
	const context = { extensionPath, extensionUri: extensionPath, subscriptions: [] };
	return {
		vscode, context, timers, updates, commands, errors, reads, modelDisposable,
		async activate() {
			extensionModule.exports.activate(context);
			await new Promise(resolve => setImmediate(resolve));
		},
		get provider() { return provider; },
		get handler() { return handler; },
		async drain(promise) {
			while (timers.size > 0) {
				const [id, callback] = timers.entries().next().value;
				timers.delete(id);
				callback();
				await Promise.resolve();
			}
			await promise;
		}
	};
}

/** Track cancellation subscriptions so leaks are visible without global mocks. */
function cancellationToken(cancelled = false) {
	const listeners = new Set();
	return {
		isCancellationRequested: cancelled,
		onCancellationRequested(listener) {
			listeners.add(listener);
			return { dispose: () => listeners.delete(listener) };
		},
		cancel() {
			this.isCancellationRequested = true;
			for (const listener of [...listeners]) {
				listener();
			}
		},
		get listenerCount() { return listeners.size; }
	};
}

test('provider uses the last user text and ignores tool, data, and unknown content', async () => {
	const extension = loadExtension();
	await extension.activate();
	const TextPart = extension.vscode.LanguageModelTextPart;
	const token = cancellationToken();
	const chunks = [];
	await extension.drain(extension.provider.provideLanguageModelChatResponse({}, [
		{ role: 1, content: [new TextPart('alpha')] },
		{ role: 1, content: [null, undefined, { value: 'alpha' }, new TextPart('BETA')] },
		{ role: 2, content: [new TextPart('alpha')] }
	], {}, { report: part => chunks.push(part.value) }, token));
	assert.deepStrictEqual([chunks.join(''), token.listenerCount, extension.timers.size], ['LAST', 0, 0]);
});

test('token counting measures message text rather than the object representation', async () => {
	const extension = loadExtension();
	await extension.activate();
	const TextPart = extension.vscode.LanguageModelTextPart;
	const counts = await Promise.all([
		extension.provider.provideTokenCount({}, 'abcdefghij'),
		extension.provider.provideTokenCount({}, { role: 1, content: [new TextPart('abcdefghij'), null, new TextPart('klmnopqrst')] }),
		extension.provider.provideTokenCount({}, { role: 1, content: [{ value: 'ignored' }] })
	]);
	assert.deepStrictEqual(counts, [5, 11, 1]);
});

test('cancellation stops provider and participant output and releases timers and listeners', async () => {
	const extension = loadExtension();
	await extension.activate();
	const preCancelled = cancellationToken(true);
	const initial = [];
	await extension.handler({ prompt: 'hello' }, {}, { markdown: part => initial.push(part) }, preCancelled);
	const results = [];
	for (const stream of ['provider', 'participant', 'about']) {
		const token = cancellationToken();
		const chunks = [];
		const response = stream === 'provider'
			? extension.provider.provideLanguageModelChatResponse({}, [], {}, { report: part => chunks.push(part.value) }, token)
			: extension.handler({ prompt: 'hello', command: stream === 'about' ? 'about' : undefined }, {}, { markdown: part => chunks.push(part) }, token);
		assert.strictEqual(extension.timers.size, 1);
		token.cancel();
		const result = await response;
		results.push([chunks.length, extension.timers.size, token.listenerCount, result]);
	}
	assert.deepStrictEqual([initial, preCancelled.listenerCount, results], [[], 0, [[1, 0, 0, undefined], [1, 0, 0, undefined], [1, 0, 0, undefined]]]);
});

test('streaming preserves Unicode code points and cleans up if reporting throws', async () => {
	const extension = loadExtension();
	await extension.activate();
	const token = cancellationToken();
	const chunks = [];
	await extension.drain(extension.handler({ prompt: 'hello' }, {}, { markdown: part => chunks.push(part) }, token));
	const failureToken = cancellationToken();
	await assert.rejects(extension.handler({ prompt: 'hello' }, {}, { markdown() { throw new Error('report failed'); } }, failureToken), /report failed/);
	assert.deepStrictEqual([chunks, token.listenerCount, failureToken.listenerCount, extension.timers.size], [['👋', '你', '好'], 0, 0, 0]);
});

test('empty or malformed corpus entries fall back safely for random and regular requests', async () => {
	const outputs = [];
	for (const data of [null, { generic: [], lexicon: [null, {}, { text: 42 }, { text: 'VALID', keys: ['validkey', '', null, 42] }] }]) {
		const extension = loadExtension(data);
		await extension.activate();
		for (const command of [undefined, 'random']) {
			const chunks = [];
			await extension.drain(extension.handler({ prompt: 'unknown', command }, {}, { markdown: part => chunks.push(part) }, cancellationToken()));
			outputs.push(chunks.join(''));
		}
	}
	const fallback = '具体卡在哪一步\n给一个例子';
	assert.deepStrictEqual(outputs, [fallback, fallback, fallback, 'VALID']);
});

test('activation seeds missing defaults and preserves explicit configuration values', async () => {
	const extension = loadExtension(corpus, {
		settings: {
			'workbench.colorTheme': { globalValue: 'Light Modern' },
			'chat.defaultModel': { workspaceValue: '' },
			'chat.newSession.defaultMode': { workspaceFolderValue: 'agent' }
		}
	});
	await extension.activate();
	const fresh = loadExtension();
	await fresh.activate();
	assert.deepStrictEqual([extension.updates, extension.commands, fresh.updates, fresh.context.subscriptions.length], [
		[], ['workbench.action.chat.newLocalChat'],
		[['workbench', 'colorTheme', 'Dark Modern', 1], ['chat', 'defaultModel', 'kuncode/kunkun-1', 1], ['chat', 'newSession.defaultMode', 'ask', 1]],
		2
	]);
});

test('configuration and chat command failures are handled without losing provider registration', async () => {
	const results = [];
	for (const options of [{ failUpdate: true }, { failCommand: true }]) {
		const extension = loadExtension(corpus, options);
		await extension.activate();
		results.push([extension.errors.length, extension.commands.length, extension.context.subscriptions.length]);
	}
	assert.deepStrictEqual(results, [[1, 0, 2], [1, 1, 2]]);
});

test('provider disposable is registered even if participant registration fails', async () => {
	const extension = loadExtension(corpus, { failParticipant: true });
	await assert.rejects(extension.activate(), /participant failed/);
	assert.deepStrictEqual(extension.context.subscriptions, [extension.modelDisposable]);
});

/** Collect one participant reply while preserving its session metadata. */
async function ask(extension, prompt, history = [], command) {
	const chunks = [];
	let result;
	await extension.drain(extension.handler({ prompt, command }, { history }, { markdown: text => chunks.push(text) }, cancellationToken()).then(value => { result = value; }));
	return { text: chunks.join(''), result };
}

test('manifest sources load once, skip broken topics and reject paths outside topics', async () => {
	const extension = loadExtension({ ...corpus, sources: ['topics/programming.json', 'topics/programming.json', '../outside.json', 'topics/broken.json', 'topics/extra.json'] }, {
		files: {
			'corpus/topics/broken.json': '{ invalid json',
			'corpus/topics/extra.json': [{ cat: '额外场景', keys: ['extra'], text: 'EXTRA', mode: 'chat', action: 'react' }]
		}
	});
	await extension.activate();
	const reply = await ask(extension, 'extra');
	await ask(extension, 'extra');
	assert.deepStrictEqual([reply.text, extension.reads, extension.errors.length], [
		'EXTRA', ['corpus/manifest.json', 'corpus/topics/programming.json', 'corpus/topics/broken.json', 'corpus/topics/extra.json'], 2
	]);
});

test('greeting must be a complete utterance and broad topics request clarification', async () => {
	const extension = loadExtension({ ...corpus, lexicon: [{ keys: ['java', '报错'], text: 'WRONG' }, { keys: ['ENOENT'], text: 'FILE' }] });
	await extension.activate();
	const replies = [];
	for (const prompt of ['你好', '你好，ENOENT报错', 'java报错', 'my_enoent_count', 'ENOENT']) {
		replies.push((await ask(extension, prompt)).text);
	}
	assert.deepStrictEqual(replies, ['👋你好', 'FILE', 'FALLBACK', 'FALLBACK', 'FILE']);
});

test('empty latest user content does not reuse an earlier user prompt', async () => {
	const extension = loadExtension();
	await extension.activate();
	const TextPart = extension.vscode.LanguageModelTextPart;
	const chunks = [];
	await extension.drain(extension.provider.provideLanguageModelChatResponse({}, [
		{ role: 1, content: [new TextPart('alpha')] },
		{ role: 1, content: [null, { value: 'beta' }] }
	], {}, { report: part => chunks.push(part.value) }, cancellationToken()));
	assert.strictEqual(chunks.join(''), 'FALLBACK');
});

test('equal scene candidates vary within a session and unique repeats ask for the missing detail', async () => {
	const extension = loadExtension({ ...corpus, lexicon: [{ keys: ['alpha'], text: 'ONE' }, { keys: ['alpha'], text: 'TWO' }] });
	await extension.activate();
	const first = await ask(extension, 'alpha');
	const second = await ask(extension, 'alpha', [{ result: first.result }]);
	const third = await ask(extension, 'alpha', [{ result: first.result }, { result: second.result }]);
	const separateSession = await ask(extension, 'alpha');
	assert.deepStrictEqual([first.text, second.text, third.text, separateSession.text], ['TWO', 'ONE', '刚才那一步具体卡在哪里', 'TWO']);
});

test('coach replies require explicit role cues and respect requests for ordinary speech', async () => {
	const extension = loadExtension({ ...corpus, lexicon: [
		{ keys: ['刷题'], text: '先复盘一题', mode: 'explain' },
		{ keys: ['刷题'], text: '困教练先定一题', mode: 'coach' },
		{ keys: ['学习计划'], text: '高认知指挥部开始', mode: 'coach' }
	] });
	await extension.activate();
	const replies = [];
	for (const prompt of ['刷题', '困教练刷题', '我一点也不想听困教练刷题那套，换成正常说话', '困教练学习计划']) {
		replies.push((await ask(extension, prompt)).text);
	}
	assert.deepStrictEqual(replies, ['先复盘一题', '困教练先定一题', '先复盘一题', 'FALLBACK']);
});

test('nearby Chinese phrases match inserted words and old topics only inform explicit follow-ups', async () => {
	const extension = loadExtension({ ...corpus, lexicon: [
		{ keys: ['论文题目太大'], text: '缩小范围' },
		{ keys: ['室友半夜外放'], text: '约定安静时间' }
	] });
	await extension.activate();
	const first = await ask(extension, '我论文的题目是不是定得太大了，想缩一下范围');
	const roommate = await ask(extension, '我的室友每天到半夜还在外放视频，我明天有早八怎么办');
	const followUp = await ask(extension, '那我先看哪一步？', [{ prompt: '论文题目太大' }, { result: first.result }]);
	const unrelated = await ask(extension, '那今晚吃什么', [{ prompt: '论文题目太大' }]);
	assert.deepStrictEqual([first.text, roommate.text, followUp.text, unrelated.text], ['缩小范围', '约定安静时间', '刚才那一步具体卡在哪里', 'FALLBACK']);
});

test('immediate safety cues take priority over routine study advice and clarify who needs help', async () => {
	const extension = loadExtension();
	await extension.activate();
	const first = await ask(extension, '我不想活了，作业太多压得我喘不过气');
	const friend = await ask(extension, '朋友说不想活了');
	assert.ok(first.text.includes('当地急救') && first.text.includes('你现在身边有人吗') && friend.text.includes('对方现在的位置'));
});

test('negated self-harm intent and activity words do not become immediate danger signals', async () => {
	const extension = loadExtension();
	await extension.activate();
	const replies = [];
	for (const prompt of ['我不想自杀，我只是焦虑', '我不想伤害自己', '我没有想轻生', '我不是想结束生命', '累了今晚不想活动，就想躺着休息', '我今天不想活跃，只想安静']) {
		replies.push((await ask(extension, prompt)).text);
	}
	const danger = await ask(extension, '我不想自杀，但现在想伤害自己');
	const hopeless = await ask(extension, '我不想活了');
	assert.deepStrictEqual([replies, danger.text.includes('当地急救'), hopeless.text.includes('当地急救')], [Array(6).fill('FALLBACK'), true, true]);
});

test('nearby phrases do not cross sentence boundaries or negate the requested scene', async () => {
	const extension = loadExtension({ ...corpus, lexicon: [
		{ keys: ['论文题目太大'], text: '缩小范围' },
		{ keys: ['室友半夜外放'], text: '约定安静时间' }
	] });
	await extension.activate();
	const replies = [];
	for (const prompt of ['论文题目不是太大了，是太小了', '室友早就睡了。半夜是隔壁在外放视频', '室友早就睡了；半夜是隔壁在外放视频', '室友早就睡了\n半夜是隔壁在外放视频', '论文题目是不是定得太大了']) {
		replies.push((await ask(extension, prompt)).text);
	}
	assert.deepStrictEqual(replies, ['FALLBACK', 'FALLBACK', 'FALLBACK', 'FALLBACK', '缩小范围']);
});

test('about reports loaded scene count and local simulation limits', async () => {
	const extension = loadExtension();
	await extension.activate();
	const reply = await ask(extension, '', [], 'about');
	assert.ok(reply.text.includes('2条本地场景语料') && reply.text.includes('不代表真人') && reply.text.includes('没有联网检索和大模型推理'));
});

test('real corpus answers representative coding and campus questions through the new manifest', async () => {
	const extension = loadExtension(corpus, { realCorpus: true });
	await extension.activate();
	const replies = [];
	for (const prompt of ['npm install一直报错，应该先看什么？', '我的室友每天到半夜还在外放视频，我明天有早八怎么办', '我论文的题目是不是定得太大了，想缩一下范围']) {
		replies.push((await ask(extension, prompt)).text);
	}
	assert.ok(replies[0].includes('第一条真正的错误') && replies[1].includes('安静时间') && replies[2].includes('一个场景'));
});
