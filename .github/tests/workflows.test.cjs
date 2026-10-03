/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

// Execute the actual inline workflow policy without GitHub credentials or network calls.
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
function loadScript(filename) {
	const lines = fs.readFileSync(path.join(__dirname, '../workflows', filename), 'utf8').split(/\r?\n/);
	const start = lines.findIndex(line => line.trim() === 'script: |');
	assert.notEqual(start, -1);
	const script = [];
	for (const line of lines.slice(start + 1)) {
		if (!line.trim()) {
			script.push('');
		} else if (line.startsWith('            ')) {
			script.push(line.slice(12));
		} else {
			break;
		}
	}
	return new AsyncFunction('github', 'context', 'core', 'require', script.join('\n'));
}

function createCore() {
	const result = { failures: [], outputs: {}, notices: [], summaries: [] };
	return {
		result,
		info() {},
		setFailed(message) { result.failures.push(message); },
		setOutput(name, value) { result.outputs[name] = value; },
		notice(message) { result.notices.push(message); },
		summary: {
			addRaw(message) { result.summaries.push(message); return this; },
			async write() {}
		}
	};
}

const engineeringPolicy = loadScript('no-engineering-system-changes.yml');
async function checkEngineering({ files, login = 'contributor', permission = 'read', changedFiles = files.length, error }) {
	const core = createCore();
	const calls = [];
	const context = {
		repo: { owner: 'Roylyl', repo: 'KunCode' },
		payload: { pull_request: { number: 24, changed_files: changedFiles, user: { login } } }
	};
	const github = {
		rest: {
			pulls: { listFiles() {} },
			repos: {
				async getCollaboratorPermissionLevel(parameters) {
					calls.push(parameters);
					if (error) { throw error; }
					return { data: { permission } };
				}
			}
		},
		async paginate(method, parameters) {
			assert.equal(method, this.rest.pulls.listFiles);
			assert.deepEqual(parameters, { owner: 'Roylyl', repo: 'KunCode', pull_number: 24, per_page: 100 });
			return files;
		}
	};
	await engineeringPolicy(github, context, core, require);
	return { ...core.result, calls };
}

test('ordinary source changes do not request collaborator permissions', async () => {
	const result = await checkEngineering({ files: [{ filename: 'src/vs/base/common/async.ts' }] });
	assert.deepEqual({ failures: result.failures, calls: result.calls }, { failures: [], calls: [] });
});

for (const permission of ['admin', 'maintain', 'write']) {
	test(`${permission} contributors are checked against the KunCode repository`, async () => {
		const result = await checkEngineering({ files: [{ filename: 'build/gulpfile.extensions.ts' }], permission });
		assert.deepEqual({ failures: result.failures, calls: result.calls }, {
			failures: [], calls: [{ owner: 'Roylyl', repo: 'KunCode', username: 'contributor' }]
		});
	});
}

test('read-only contributors cannot change manifests, locks, scripts or workflow policy', async () => {
	for (const filename of ['package.json', 'extensions/git/package-lock.json', 'scripts/test.sh', '.github/tests/workflows.test.cjs']) {
		const result = await checkEngineering({ files: [{ filename }] });
		assert.match(result.failures[0], /require write access/);
	}
});

test('renaming a protected file cannot bypass the engineering policy', async () => {
	const result = await checkEngineering({ files: [{ filename: 'docs/old-workflow.yml', previous_filename: '.github/workflows/pr.yml' }] });
	assert.equal(result.failures.length, 1);
});

test('Dependabot can update pinned actions without collaborator access', async () => {
	const result = await checkEngineering({ files: [{ filename: '.github/workflows/chat-lib-package.yml' }], login: 'dependabot[bot]' });
	assert.deepEqual({ failures: result.failures, calls: result.calls }, { failures: [], calls: [] });
});

test('Copilot identities cannot change engineering policy even with write access', async () => {
	for (const login of ['Copilot', 'copilot-swe-agent[bot]']) {
		const result = await checkEngineering({ files: [{ filename: 'package.json' }], login, permission: 'write' });
		assert.match(result.failures[0], /Copilot cannot modify/);
		assert.deepEqual(result.calls, []);
	}
});

test('an incomplete diff is rejected before calling the files API', async () => {
	const result = await checkEngineering({ files: [], changedFiles: 3001 });
	assert.match(result.failures[0], /exceeds the files API limit/);
});

test('permission API errors propagate instead of approving the PR', async () => {
	await assert.rejects(checkEngineering({ files: [{ filename: 'package.json' }], error: new Error('permission API unavailable') }), /permission API unavailable/);
});

const chatLibDetection = loadScript('chat-lib-package.yml');
async function detectChatLib(names, manifest = { scripts: { 'extract-chat-lib': 'node extract.js' } }) {
	const core = createCore();
	const mockRequire = name => {
		assert.equal(name, 'node:fs');
		return {
			existsSync: filename => names.includes(filename),
			readFileSync: () => JSON.stringify(manifest)
		};
	};
	await chatLibDetection({}, {}, core, mockRequire);
	return core.result;
}

test('absent optional Copilot sources skip chat-lib with a visible reason', async () => {
	const result = await detectChatLib([]);
	assert.deepEqual(result.outputs, { available: 'false' });
	assert.deepEqual(result.failures, []);
	assert.match(result.summaries[0], /does not include extensions\/copilot/);
});

test('present but incomplete Copilot sources fail instead of skipping tests', async () => {
	const result = await detectChatLib(['extensions/copilot']);
	assert.match(result.failures[0], /missing extensions\/copilot\/package.json/);
	assert.deepEqual(result.outputs, {});
});

const completeSources = ['extensions/copilot', 'extensions/copilot/package.json', 'extensions/copilot/package-lock.json', 'extensions/copilot/.nvmrc'];
test('Copilot sources without an extraction command fail', async () => {
	const result = await detectChatLib(completeSources, { scripts: {} });
	assert.match(result.failures[0], /must define extract-chat-lib/);
});

test('complete Copilot sources enable the platform test matrix', async () => {
	const result = await detectChatLib(completeSources);
	assert.deepEqual({ failures: result.failures, outputs: result.outputs }, { failures: [], outputs: { available: 'true' } });
});
