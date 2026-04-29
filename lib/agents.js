const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', 'agents');

function parseAgentMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const metadata = {};
  let body = raw;

  if (match) {
    body = match[2].trim();
    for (const line of match[1].split('\n')) {
      const separator = line.indexOf(':');
      if (separator === -1) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      metadata[key] = value;
    }
  }

  const id = metadata.id || path.basename(filePath, '.md');
  return {
    id,
    name: metadata.name || id,
    description: metadata.description || '',
    body,
    path: path.relative(path.join(__dirname, '..'), filePath),
  };
}

function listAgents() {
  return fs.readdirSync(AGENTS_DIR)
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .sort()
    .map((file) => parseAgentMarkdown(path.join(AGENTS_DIR, file)));
}

function loadAgent(agentId) {
  const agent = listAgents().find((candidate) => candidate.id === agentId);
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }
  return agent;
}

function loadAgents(agentIds) {
  return agentIds.map(loadAgent);
}

function renderAgentInstructions(agents) {
  return [
    '## Agent Pipeline',
    '',
    'Use these specialist prompts in order. If your provider supports true subagents, dispatch each section to the named agent. Otherwise, run them as ordered roles inside one response.',
    '',
    ...agents.flatMap((agent, index) => [
      `### ${index + 1}. ${agent.name} (${agent.id})`,
      '',
      agent.body,
      '',
    ]),
  ].join('\n');
}

module.exports = {
  listAgents,
  loadAgent,
  loadAgents,
  renderAgentInstructions,
};
