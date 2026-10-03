/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function pick(items) {
	return items[Math.floor(Math.random() * items.length)];
}

/** Stream code points and release the pending timer when a request is cancelled. */
async function streamText(text, report, token, createPart = value => value) {
	if (token?.isCancellationRequested) {
		return;
	}
	let timer;
	let completeWait;
	const cancellation = token?.onCancellationRequested(() => {
		clearTimeout(timer);
		completeWait?.();
	});
	try {
		for (const character of String(text || '')) {
			if (token?.isCancellationRequested) {
				break;
			}
			report(createPart(character));
			if (token?.isCancellationRequested) {
				break;
			}
			await new Promise(resolve => {
				completeWait = resolve;
				timer = setTimeout(resolve, 18);
			});
			completeWait = undefined;
		}
	} finally {
		clearTimeout(timer);
		cancellation?.dispose();
	}
}

/** Normalize matching input while bounding the work done for a single request. */
function normalize(text, limit = 8192) {
	return String(text || '').slice(0, limit).normalize('NFKC').trim().toLowerCase();
}

/** Load each declared topic once; a damaged topic does not disable the other topics. */
function loadCorpus(extensionPath) {
	const corpusPath = path.join(extensionPath, 'corpus');
	let manifest;
	try {
		manifest = JSON.parse(fs.readFileSync(path.join(corpusPath, 'manifest.json'), 'utf8'));
	} catch (error) {
		console.error('Failed to load Kunkun AI corpus manifest:', error);
		return { lexicon: [] };
	}
	if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
		return { lexicon: [] };
	}
	const lexicon = [];
	const sources = Array.isArray(manifest.sources) ? new Set(manifest.sources) : [];
	for (const source of sources) {
		if (typeof source !== 'string' || !/^topics\/[a-z0-9][a-z0-9-]*\.json$/i.test(source)) {
			console.error('Invalid Kunkun AI corpus source:', source);
			continue;
		}
		try {
			const entries = JSON.parse(fs.readFileSync(path.join(corpusPath, source), 'utf8'));
			if (Array.isArray(entries)) {
				lexicon.push(...entries);
			} else {
				console.error('Kunkun AI corpus topic must contain an array:', source);
			}
		} catch (error) {
			console.error('Failed to load Kunkun AI corpus topic:', source, error);
		}
	}
	return { ...manifest, lexicon };
}

/** Prepare scene triggers once; broad topic names alone are insufficient evidence. */
function createEngine(data) {
	data = data && typeof data === 'object' ? data : {};
	const strings = values => Array.isArray(values) ? values.filter(value => typeof value === 'string' && value.trim().length > 0) : [];
	const broadKeys = new Set(['node', 'node.js', 'nodejs', 'python', 'java', 'c', 'c++', 'cpp', 'javascript', 'typescript', 'git', 'npm', 'pip', 'esp-idf', 'ide', 'ai', '代码', '编程', '调试', '测试', '性能', '报错', '错误', '学习', '安装', '项目', '计划', '工作', '生活', '复习', '考试', '课程', '作业', '老师', '同学', '宿舍']);
	const lexicon = (Array.isArray(data.lexicon) ? data.lexicon : [])
		.filter(entry => entry && typeof entry.text === 'string' && entry.text.trim() && strings(entry.keys).length)
		.map((entry, id) => ({
			...entry, id,
			keys: [...new Set(strings(entry.keys).map(key => normalize(key, 128)))].map(key => {
				const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const start = /^[a-z0-9_]/i.test(key) ? '(?<![a-z0-9_])' : '';
				const end = /[a-z0-9_]$/i.test(key) ? '(?![a-z0-9_])' : '';
				const segments = [];
				if (/^[\u4e00-\u9fff]{4,24}$/u.test(key)) {
					for (let index = 0; index < key.length; index += 2) {
						if (key.length - index === 3) {
							segments.push(key.slice(index));
							break;
						}
						segments.push(key.slice(index, index + 2));
					}
				}
				return {
					value: key,
					pattern: /[a-z0-9]/i.test(key) ? new RegExp(`${start}${escaped}${end}`, 'u') : undefined,
					nearbyPattern: segments.length >= 2 ? new RegExp(segments.join('[^\\n\\r。.!！?？;；]{0,8}?'), 'u') : undefined,
					specific: !broadKeys.has(key) && key.length >= 2,
					weight: broadKeys.has(key) ? 1 : Math.min(8, 2 + key.length / 3)
				};
			})
		}));
	const questions = [...new Set([...strings(data.unknown), ...strings(data.generic)])];
	if (!questions.length) {
		questions.push('具体卡在哪一步\n给一个例子');
	}
	const greeting = typeof data.greet === 'string' && data.greet ? data.greet : '在\n我是困困AI\n具体想问什么';

	function answer(input, options = {}) {
		const clean = normalize(input);
		const riskText = clean.replace(/(?:不|没有|没|并非|不是)(?:想|要|准备|打算)(?:自杀|轻生|结束生命|伤害自己|自伤)/gu, '');
		if (/(?:不想活(?:了|下去)?(?![动跃])|想(?:自杀|轻生|结束生命|伤害自己)|准备自伤|要自杀)/u.test(riskText)) {
			return {
				text: /(?:朋友|同学|室友|他说|她说|有人).{0,12}(?:不想活|想自杀|想轻生|想伤害自己)/u.test(clean)
					? '先确认对方现在的位置\n联系能到场的人陪着，别只靠聊天处理\n有眼前危险就联系当地应急帮助'
					: '你现在的安全最重要\n先让身边可信的人陪着，远离可能伤害你的物品\n如果已经受伤或可能马上行动，立刻联系当地急救\n你现在身边有人吗',
				category: '安全支持'
			};
		}
		if (!options.randomOnly && /^(?:你好|您好|hi|hello|在吗|哈喽|嗨|早上好|晚上好|早安)[\s,，.!！。?？~～]*(?:困困(?:ai)?)?[\s,，.!！。?？~～]*$/iu.test(clean)) {
			return { text: greeting, category: '问候' };
		}
		const coach = /困教练|教练(?:模式|口吻)|安排战术|队员|指挥部/u.test(clean)
			&& !/(?:不要|不用|别|不想|不需要|拒绝).{0,12}(?:教练|战术|指挥部)|正常说话|普通说法|正常口吻|普通口吻|别玩梗/u.test(clean);
		const lore = /鹿群|高认知|共🦌主义|困困大王|指挥部|对齐颗粒度|逐帧学习/u.test(clean);
		const followUp = /^(?:那(?:怎么办|怎么做|怎么修|然后呢|我先看哪一步)|这个(?:怎么办|怎么做|什么意思|呢)|它(?:怎么办|怎么处理|呢)|然后呢|接着呢|还有呢|怎么做|继续(?:讲|说)?|为什么|什么意思|没懂|怎么办)[\s?？]*$/u.test(clean);
		const previous = followUp ? (options.previous || []).slice(-2).map(text => normalize(text, 512)) : [];
		let bestScore = 0;
		let candidates = [];
		for (const entry of lexicon) {
			if ((entry.mode === 'coach' || /困教练/u.test(entry.text)) && !coach) {
				continue;
			}
			if (/61|共🦌主义|高认知|困困大王|鹿群|指挥部|对齐颗粒度|逐帧学习/u.test(entry.text) && !lore) {
				continue;
			}
			if (options.randomOnly) {
				candidates.push(entry);
				continue;
			}
			let score = 0;
			let specific = false;
			for (const key of entry.keys) {
				const matches = text => key.pattern ? key.pattern.test(text) : text.includes(key.value);
				const exact = matches(clean);
				const nearby = !exact ? key.nearbyPattern?.exec(clean)?.[0] : undefined;
				if (exact) {
					score += key.weight;
					specific ||= key.specific;
				} else if (nearby && !/(?<!是)(?:不是|并非|不算|没有|不太)/u.test(nearby)) {
					score += key.weight * 0.65;
					specific ||= key.specific;
				} else if (previous.some(matches)) {
					score += key.weight / 4;
					specific ||= key.specific;
				}
			}
			if (!specific) {
				continue;
			}
			if (coach && entry.mode === 'coach') {
				score += 1;
			}
			if (score > bestScore) {
				bestScore = score;
				candidates = [entry];
			} else if (score === bestScore) {
				candidates.push(entry);
			}
		}
		if (!candidates.length) {
			return { text: pick(questions), category: '补充信息' };
		}
		const recentIds = (options.recentIds || []).slice(-6);
		const recentTexts = (options.recentTexts || []).slice(-6);
		const fresh = candidates.filter(entry => !recentIds.includes(entry.id) && !recentTexts.includes(entry.text));
		if (!fresh.length && !options.randomOnly) {
			return { text: '刚才那一步具体卡在哪里', category: '补充信息' };
		}
		const selected = pick(fresh.length ? fresh : candidates);
		return { text: selected.text, category: selected.cat || '场景回应', id: selected.id };
	}
	return { answer, size: lexicon.length };
}

/** Extract only supported text content; tool and data parts are not prompts. */
function messageText(message) {
	return message.content.filter(part => part instanceof vscode.LanguageModelTextPart).map(part => part.value).join(' ');
}

/** Seed an extension default without replacing explicit user or workspace choices. */
async function updateDefaultSetting(section, key, value) {
	const configuration = vscode.workspace.getConfiguration(section);
	const inspected = configuration.inspect(key);
	if (inspected && [inspected.globalValue, inspected.workspaceValue, inspected.workspaceFolderValue].every(setting => setting === undefined)) {
		await configuration.update(key, value, vscode.ConfigurationTarget.Global);
	}
}

/** Open the default chat after registration without delaying extension activation. */
async function initializeChat() {
	try {
		await Promise.all([
			updateDefaultSetting('workbench', 'colorTheme', 'Dark Modern'),
			updateDefaultSetting('chat', 'defaultModel', 'kuncode/kunkun-1'),
			updateDefaultSetting('chat', 'newSession.defaultMode', 'ask')
		]);
		await vscode.commands.executeCommand('workbench.action.chat.newLocalChat');
	} catch (error) {
		console.error('Failed to initialize Kunkun AI chat defaults:', error);
	}
}

function activate(context) {
	const engine = createEngine(loadCorpus(context.extensionPath));
	const modelProvider = vscode.lm.registerLanguageModelChatProvider('kuncode', {
		async provideLanguageModelChatInformation() {
			return [{
				id: 'kunkun-1', name: 'Kunkun AI', family: 'kunkun', version: '2.0.0',
				maxInputTokens: 8192, maxOutputTokens: 2048, isDefault: true, isUserSelectable: true, isBYOK: true,
				capabilities: { toolCalling: false, imageInput: false }
			}];
		},
		async provideLanguageModelChatResponse(_model, messages, _options, progress, token) {
			if (token?.isCancellationRequested) {
				return;
			}
			let prompt = '';
			let hasPrompt = false;
			const previous = [];
			const recentTexts = [];
			for (let index = messages.length - 1, minimum = Math.max(0, messages.length - 32); index >= minimum; index--) {
				if (messages[index].role === vscode.LanguageModelChatMessageRole.User) {
					if (!hasPrompt) {
						prompt = messageText(messages[index]);
						hasPrompt = true;
					} else if (previous.length < 2) {
						previous.unshift(messageText(messages[index]).slice(0, 512));
					}
				} else if (recentTexts.length < 6 && messages[index].role === vscode.LanguageModelChatMessageRole.Assistant) {
					recentTexts.unshift(messageText(messages[index]).slice(0, 2048));
				}
				if (previous.length === 2 && recentTexts.length === 6) {
					break;
				}
			}
			await streamText(
				engine.answer(prompt, { previous, recentTexts }).text,
				part => progress.report(part),
				token,
				character => new vscode.LanguageModelTextPart(character)
			);
		},
		async provideTokenCount(_model, text) {
			const content = typeof text === 'string' ? text : messageText(text);
			return Math.max(1, Math.ceil(content.length / 2));
		}
	});
	context.subscriptions.push(modelProvider);
	const participant = vscode.chat.createChatParticipant('kuncode.kunkun', async (request, chatContext, progress, token) => {
		if (token?.isCancellationRequested) {
			return;
		}
		if (request.command === 'about') {
			await streamText(`困困AI\nKunCode内置的风格模拟助手，不代表真人\n当前收录${engine.size}条本地场景语料，按关键词相关性匹配\n没有联网检索和大模型推理，没接上时会请你补信息`, part => progress.markdown(part), token);
			return;
		}
		const history = Array.isArray(chatContext?.history) ? chatContext.history.slice(-16) : [];
		const previous = history.filter(turn => typeof turn.prompt === 'string').slice(-2).map(turn => turn.prompt.slice(0, 512));
		const recentIds = history.filter(turn => Number.isInteger(turn.result?.metadata?.entryId)).slice(-6).map(turn => turn.result.metadata.entryId);
		const result = engine.answer(request.prompt, { randomOnly: request.command === 'random', previous, recentIds });
		await streamText(result.text, part => progress.markdown(part), token);
		if (token?.isCancellationRequested) {
			return;
		}
		return { metadata: { entryId: result.id } };
	});
	context.subscriptions.push(participant);
	participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'capybara.png');
	void initializeChat();
}

function deactivate() {}
module.exports = { activate, deactivate };
