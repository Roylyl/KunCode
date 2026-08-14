const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function streamText(text, report, createPart = value => value) {
  for (const character of Array.from(String(text || ''))) {
    report(createPart(character));
    await wait(18);
  }
}

function createEngine(data) {
  const lexicon = Array.isArray(data.lexicon) ? data.lexicon : [];
  const generic = Array.isArray(data.generic) ? data.generic : ['困困暂时没在语料库里找到对应内容，换个关键词再问问吧～'];
  const prefixes = Array.isArray(data.prefix) ? data.prefix : [];
  const suffixes = Array.isArray(data.suffix) ? data.suffix : [];
  const kunPrefixes = ['困困来啦～', '困困觉得呀：', '让困困想想哦——', '困困歪头想了想：'];
  const kunSuffixes = ['～困困说的哦', '（困困歪头）', '困困陪你一起想通它～'];

  function wrap(text) {
    const parts = [pick(kunPrefixes)];
    if (prefixes.length && Math.random() < 0.5) parts.push(pick(prefixes));
    parts.push(text);
    if (suffixes.length && Math.random() < 0.4) parts.push(pick(suffixes));
    if (Math.random() < 0.5) parts.push(pick(kunSuffixes));
    return parts.join(' ');
  }

  function answer(input, randomOnly = false) {
    const clean = String(input || '').trim().toLowerCase();
    if (!randomOnly && /^(你好|您好|hi|hello|在吗|哈喽|嗨)/i.test(clean)) {
      return { text: data.greet || '你好呀，困困在这里～', category: '问候' };
    }
    if (randomOnly) {
      const entry = pick(lexicon);
      return { text: wrap(entry.text), category: entry.cat || '随机语录' };
    }

    let best = null;
    let bestScore = 0;
    for (const entry of lexicon) {
      const keys = Array.isArray(entry.keys) ? entry.keys : [];
      let score = 0;
      for (const key of keys) if (clean.includes(String(key).toLowerCase())) score++;
      if (score > bestScore) { best = entry; bestScore = score; }
    }
    if (!best) return { text: wrap(pick(generic)), category: '通用兜底' };
    return { text: wrap(best.text), category: best.cat || '困困语录' };
  }
  return { answer, size: lexicon.length };
}

function activate(context) {
  const corpusPath = path.join(context.extensionPath, 'corpus', 'huiyuan_engine.json');
  const engine = createEngine(JSON.parse(fs.readFileSync(corpusPath, 'utf8')));
  const modelProvider = vscode.lm.registerLanguageModelChatProvider('kuncode', {
    async provideLanguageModelChatInformation() {
      return [{
        id: 'kunkun-1', name: 'Kunkun AI', family: 'kunkun', version: '1.0.0',
        maxInputTokens: 8192, maxOutputTokens: 2048, isDefault: true, isUserSelectable: true, isBYOK: true,
        capabilities: { toolCalling: false, imageInput: false }
      }];
    },
    async provideLanguageModelChatResponse(_model, messages, _options, progress) {
      const last = [...messages].reverse().find(message => message.role === vscode.LanguageModelChatMessageRole.User);
      const prompt = last ? last.content.map(part => part.value || '').join(' ') : '';
      await streamText(
        engine.answer(prompt).text,
        part => progress.report(part),
        character => new vscode.LanguageModelTextPart(character)
      );
    },
    async provideTokenCount(_model, text) {
      return Math.max(1, Math.ceil(String(text).length / 2));
    }
  });
  const participant = vscode.chat.createChatParticipant('kuncode.kunkun', async (request, _chatContext, progress) => {
    if (request.command === 'about') {
      await streamText(`**困困 AI**\n\n我是 KunCode 的智能编程与成长助手。当前知识库包含 ${engine.size} 条精选内容，很高兴陪你一起解决问题。`, part => progress.markdown(part));
      return;
    }
    const result = engine.answer(request.prompt, request.command === 'random');
    await streamText(result.text, part => progress.markdown(part));
  });
  participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'capybara.png');
  context.subscriptions.push(modelProvider, participant);
  Promise.all([
    vscode.workspace.getConfiguration('workbench').update('colorTheme', 'Dark Modern', vscode.ConfigurationTarget.Global),
    vscode.workspace.getConfiguration('chat').update('defaultModel', 'kuncode/kunkun-1', vscode.ConfigurationTarget.Global),
    vscode.workspace.getConfiguration('chat').update('newSession.defaultMode', 'ask', vscode.ConfigurationTarget.Global)
  ]).then(() => vscode.commands.executeCommand('workbench.action.chat.newLocalChat'));
}

function deactivate() {}
module.exports = { activate, deactivate };
