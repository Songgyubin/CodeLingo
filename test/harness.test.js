const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { prepareRun, outputPathFor, shouldExclude, listAgents } = require('../lib');

function testOutputPaths() {
  assert.strictEqual(
    outputPathFor('explain-file', 'test/python/job_scheduler.py'),
    path.join('.codelingo', 'job_scheduler.md')
  );
  assert.strictEqual(
    outputPathFor('change-impact', 'test/python/job_scheduler.py'),
    path.join('.codelingo', 'change-impact-job_scheduler.md')
  );
  assert.strictEqual(
    outputPathFor('handoff', 'test/python/job_scheduler.py'),
    path.join('.codelingo', 'HANDOFF-job_scheduler.md')
  );
}

function testGuard() {
  assert.strictEqual(
    shouldExclude('package-lock.json', '{"lockfileVersion": 3}'),
    'Dependency, build output, lockfile, or generated artifact.'
  );
  assert.strictEqual(
    shouldExclude('src/generated.ts', '// DO NOT EDIT\nexport const x = 1;'),
    'Auto-generated file marker detected.'
  );
  assert.strictEqual(shouldExclude('src/app.ts', 'export const x = 1;\n'), null);
}

function testPrepareRun() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codelingo-harness-'));
  const srcDir = path.join(cwd, 'src');
  fs.mkdirSync(srcDir, { recursive: true });
  fs.writeFileSync(path.join(srcDir, 'scheduler.py'), 'def run():\n    return True\n');

  const run = prepareRun({
    cwd,
    task: 'impact',
    filePath: 'src/scheduler.py',
    change: 'Add retry limit',
    language: 'ko',
    write: true,
  });

  assert.strictEqual(run.status, 'ready');
  assert.strictEqual(run.taskId, 'change-impact');
  assert.deepStrictEqual(run.agents, ['source-cartographer', 'impact-analyst', 'risk-reviewer', 'output-editor']);
  assert.strictEqual(run.file, path.join('src', 'scheduler.py'));
  assert.strictEqual(run.outputPath, path.join('.codelingo', 'change-impact-scheduler.md'));
  assert.ok(run.prompt.includes('CodeLingo change-impact harness'));
  assert.ok(run.prompt.includes('## Agent Pipeline'));
  assert.ok(run.prompt.includes('Change Impact Analyst Agent'));
  assert.ok(run.prompt.includes('Add retry limit'));
  assert.ok(fs.existsSync(path.join(cwd, run.runPath)));
}

function testAgents() {
  const agents = listAgents();
  assert.ok(agents.some((agent) => agent.id === 'source-cartographer'));
  assert.ok(agents.some((agent) => agent.id === 'risk-reviewer'));
}

testOutputPaths();
testGuard();
testPrepareRun();
testAgents();

console.log('harness tests passed');
