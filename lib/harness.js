const fs = require('fs');
const path = require('path');
const { readConfig, mergeConfig } = require('./config');
const { shouldExclude } = require('./fileGuard');
const { TASKS, normalizeTaskId, outputPathFor, buildPrompt } = require('./tasks');
const { listAgents } = require('./agents');

const MAX_CHARS = 80000;

function createHarness({ cwd = process.cwd() } = {}) {
  return {
    tasks: TASKS,
    agents: listAgents(),
    prepareRun(options) {
      return prepareRun({ cwd, ...options });
    },
  };
}

function prepareRun({
  cwd,
  task,
  filePath,
  change,
  language,
  skillLevel,
  audience,
  write = true,
}) {
  const taskId = normalizeTaskId(task);
  if (!taskId) {
    throw new Error(`Unknown task: ${task}`);
  }
  if (!filePath) {
    throw new Error('Missing file path.');
  }

  const absolutePath = path.resolve(cwd, filePath);
  const relativePath = path.relative(cwd, absolutePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  const exclusionReason = shouldExclude(relativePath, content);
  const configUpdates = {};
  if (language) configUpdates.language = language;
  if (skillLevel) configUpdates.skillLevel = skillLevel;

  const config = Object.keys(configUpdates).length > 0
    ? mergeConfig(cwd, configUpdates)
    : readConfig(cwd);

  if (exclusionReason) {
    return {
      status: 'excluded',
      taskId,
      file: relativePath,
      reason: exclusionReason,
    };
  }

  const truncated = content.length > MAX_CHARS;
  const promptContent = truncated ? content.slice(0, MAX_CHARS) : content;
  const outputPath = outputPathFor(taskId, relativePath);
  const prompt = buildPrompt({
    taskId,
    relativePath,
    content: promptContent,
    config,
    options: {
      change,
      skillLevel,
      audience,
      truncated,
    },
  });

  const run = {
    status: 'ready',
    taskId,
    agents: TASKS[taskId].agents,
    file: relativePath,
    outputPath,
    prompt,
  };

  if (write) {
    run.runPath = writeRunFile(cwd, run);
  }

  return run;
}

function writeRunFile(cwd, run) {
  const dir = path.join(cwd, '.codelingo', 'runs');
  fs.mkdirSync(dir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-${run.taskId}-${path.basename(run.file)}.md`;
  const target = path.join(dir, filename);

  fs.writeFileSync(target, [
    `# CodeLingo Harness Run: ${run.taskId}`,
    '',
    `> Source: ${run.file}`,
    `> Expected output: ${run.outputPath}`,
    `> Agents: ${run.agents.join(' -> ')}`,
    '',
    '## Provider Prompt',
    '',
    run.prompt,
    '',
  ].join('\n'));

  return path.relative(cwd, target);
}

module.exports = {
  createHarness,
  prepareRun,
};
