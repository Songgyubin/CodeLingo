const path = require('path');
const { loadAgents, renderAgentInstructions } = require('./agents');

const LANGUAGE_LABELS = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
  zh: 'Chinese',
};

const TASK_ALIASES = {
  explain: 'explain-file',
  'explain-file': 'explain-file',
  impact: 'change-impact',
  'change-impact': 'change-impact',
  handoff: 'handoff',
};

function normalizeTaskId(taskId) {
  return TASK_ALIASES[taskId] || null;
}

function outputPathFor(taskId, relativePath) {
  const parsed = path.parse(relativePath);
  const filename = parsed.name || parsed.base;
  if (taskId === 'change-impact') {
    return path.join('.codelingo', `change-impact-${filename}.md`);
  }
  if (taskId === 'handoff') {
    return path.join('.codelingo', `HANDOFF-${filename}.md`);
  }
  return path.join('.codelingo', `${filename}.md`);
}

function buildPrompt({ taskId, relativePath, content, config, options }) {
  const agents = loadAgents(TASKS[taskId].agents);
  const agentInstructions = renderAgentInstructions(agents);

  if (taskId === 'change-impact') {
    return buildChangeImpactPrompt({ relativePath, content, config, options, agentInstructions });
  }
  if (taskId === 'handoff') {
    return buildHandoffPrompt({ relativePath, content, config, options, agentInstructions });
  }
  return buildExplainPrompt({ relativePath, content, config, options, agentInstructions });
}

function languageName(config) {
  return LANGUAGE_LABELS[config.language] || config.language || 'English';
}

function fencedSource(relativePath, content, truncated) {
  return [
    `File: ${relativePath}${truncated ? ' (truncated: first 80,000 characters)' : ''}`,
    '',
    '```',
    content,
    '```',
  ].join('\n');
}

function buildExplainPrompt({ relativePath, content, config, options, agentInstructions }) {
  const skillLevel = options.skillLevel || config.skillLevel || 'familiar';
  const outputPath = outputPathFor('explain-file', relativePath);

  return [
    'You are running the CodeLingo explain-file harness.',
    '',
    `Language: ${languageName(config)}`,
    `Skill level: ${skillLevel}`,
    `Write the final Markdown output to: ${outputPath}`,
    '',
    agentInstructions,
    '',
    fencedSource(relativePath, content, options.truncated),
    '',
    'Task:',
    '- Explain this unfamiliar source file quickly and safely.',
    '- Calibrate depth to the skill level: beginner explains concepts, familiar balances patterns and codebase specifics, expert focuses on architecture and gotchas.',
    '- Reject the file if it appears generated, minified, binary-like, a lockfile, or build output.',
    '- Cite line numbers for concrete claims.',
    '',
    'Output structure:',
    '## TL;DR',
    '- Purpose',
    '- Entry points',
    '- Watch out',
    '',
    '## Role',
    '## Inputs / Outputs',
    '## Control Flow',
    '## Dependencies',
    '## Gotchas',
    '## What to read next',
    '',
    'End with:',
    '- Confidence: High / Medium / Low',
    '- Why: one short reason',
  ].join('\n');
}

function buildChangeImpactPrompt({ relativePath, content, config, options, agentInstructions }) {
  const proposedChange = options.change || '(ask the user for the proposed change before analyzing)';
  const outputPath = outputPathFor('change-impact', relativePath);

  return [
    'You are running the CodeLingo change-impact harness.',
    '',
    `Language: ${languageName(config)}`,
    `Proposed change: ${proposedChange}`,
    `Write the final Markdown output to: ${outputPath}`,
    '',
    agentInstructions,
    '',
    fencedSource(relativePath, content, options.truncated),
    '',
    'Task:',
    '- Explain the blast radius before the user changes this file.',
    '- Name affected functions, classes, constants, signatures, return values, and behavior.',
    '- Infer likely callers from visible exports, naming, location, and conventions.',
    '- Mark caller confidence explicitly as probably, possibly, or unknown.',
    '- Flag dynamic patterns such as event buses, dependency injection, dynamic imports, string routing, decorators, or annotations.',
    '- Cite line numbers for concrete claims.',
    '',
    'Output structure:',
    '## Change summary',
    '## What this file does',
    '## Direct impact',
    '## Likely callers',
    '## Risk',
    '## Before you change',
    '## After you change',
    '',
    'End with:',
    '- Confidence: High / Medium / Low',
    '- Why: one short reason',
  ].join('\n');
}

function buildHandoffPrompt({ relativePath, content, config, options, agentInstructions }) {
  const audience = options.audience || 'same-team developer';
  const outputPath = outputPathFor('handoff', relativePath);

  return [
    'You are running the CodeLingo handoff harness.',
    '',
    `Language: ${languageName(config)}`,
    `Audience: ${audience}`,
    `Write the final Markdown output to: ${outputPath}`,
    '',
    agentInstructions,
    '',
    fencedSource(relativePath, content, options.truncated),
    '',
    'Task:',
    '- Generate a structured handoff document for this source file.',
    '- Explain what the code does, why it is shaped this way, and how to work with it safely.',
    '- For same-team developers, use technical terms and focus on module decisions and gotchas.',
    '- For external developers, explain conventions and enough context to work independently.',
    '- For non-developers, avoid implementation detail and describe purpose, value, and business risk plainly.',
    '- Cite line numbers for concrete claims when the audience is technical.',
    '',
    'Output structure:',
    '## Module purpose',
    '## Architecture glossary',
    '## Key decisions',
    '## Dependency map',
    '## How to make common changes',
    '## Known gotchas',
    '',
    'Skip technical sections when the audience is non-developer.',
    '',
    'End with:',
    '- Confidence: High / Medium / Low',
    '- Why: one short reason',
  ].join('\n');
}

const TASKS = {
  'explain-file': {
    id: 'explain-file',
    aliases: ['explain'],
    description: 'Explain an unfamiliar source file.',
    agents: ['source-cartographer', 'explainer', 'risk-reviewer', 'output-editor'],
  },
  'change-impact': {
    id: 'change-impact',
    aliases: ['impact'],
    description: 'Estimate blast radius before a proposed change.',
    agents: ['source-cartographer', 'impact-analyst', 'risk-reviewer', 'output-editor'],
  },
  handoff: {
    id: 'handoff',
    aliases: [],
    description: 'Generate a structured handoff document.',
    agents: ['source-cartographer', 'handoff-writer', 'risk-reviewer', 'output-editor'],
  },
};

module.exports = {
  TASKS,
  normalizeTaskId,
  outputPathFor,
  buildPrompt,
};
